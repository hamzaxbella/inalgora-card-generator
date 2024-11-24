import fontkit from 'https://cdn.skypack.dev/@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'https://cdn.skypack.dev/pdf-lib';

const form = document.getElementById('cardForm');
const canvas = document.getElementById('cardCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const profileImageInput = document.getElementById('profileImage');
const cropperImage = document.getElementById('cropperImage');
const cropperModal = document.getElementById('cropperModal');
const closeModalBtn = document.getElementById('closeModal');
const cropButton = document.getElementById('cropButton');

let cropper;
let croppedImageDataUrl = '';

// Function to crop the image into a circle using a canvas
const createCircularImage = (imageDataUrl) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const size = Math.min(img.width, img.height); // Use the smaller dimension to create a square
            canvas.width = size;
            canvas.height = size;

            // Draw a circular clip and the image inside
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);

            resolve(canvas.toDataURL('image/png'));
        };

        img.src = imageDataUrl;
    });
};

// Handle image upload via drag and drop or file picker
profileImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            cropperImage.src = reader.result;
            cropperModal.style.display = 'flex'; // Show modal
            if (cropper) cropper.destroy(); // Destroy previous cropper instance
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                zoomable: true,
                scalable: true,
                movable: true,
            });
        };
        reader.readAsDataURL(file);
    }
});

// Close the cropper modal
closeModalBtn.addEventListener('click', () => {
    cropperModal.style.display = 'none';
});

// Apply the crop and get the cropped image data URL
cropButton.addEventListener('click', () => {
  croppedImageDataUrl = cropper.getCroppedCanvas().toDataURL('image/png');
  cropperModal.style.display = 'none'; // Close the modal

  // Display live preview in the canvas
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous preview
      ctx.drawImage(img, 0, 0); // Draw the cropped image
  };
  img.src = croppedImageDataUrl; // Set the cropped image as the source
});

// PDF generation and handling the form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const cne = document.getElementById('cne').value;
    const speciality = document.getElementById('speciality').value;

    // Create a circular version of the cropped image
    const circularImageUrl = await createCircularImage(croppedImageDataUrl);

    // Load PDF template
    const pdfBytes = await fetch('template.pdf').then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);

    // Load custom font
    const fontBytes = await fetch('font.otf').then((res) => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const [frontPage] = pdfDoc.getPages();
    const { width, height } = frontPage.getSize();

    const leftMargin = width / 2;
    const fontSize = 13;
    const lineHeight = 16;
    const spacing = 8;

    // Create text lines and draw text on the PDF
    const drawTextLines = (text) => {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            if (customFont.widthOfTextAtSize(`${line} ${word}`, fontSize) > width / 2) {
                lines.push(line.trim());
                line = word;
            } else {
                line += ` ${word}`;
            }
        }
        if (line) lines.push(line.trim());
        return lines;
    };

    const nameLines = drawTextLines(name);
    const totalTextHeight = nameLines.length * lineHeight + lineHeight * 2 + spacing * 2;
    const boxTopY = height / 2 + totalTextHeight / 2;
    let currentY = boxTopY - lineHeight;

    nameLines.forEach((line) => {
        frontPage.drawText(line, { x: leftMargin, y: currentY, size: fontSize, font: customFont, color: rgb(1, 1, 1) });
        currentY -= lineHeight;
    });
    currentY -= spacing;

    frontPage.drawText(cne, { x: leftMargin, y: currentY, size: fontSize - 3, font: customFont, color: rgb(1, 1, 1) });
    currentY -= lineHeight + spacing;

    frontPage.drawText(speciality, { x: leftMargin, y: currentY, size: fontSize - 3, font: customFont, color: rgb(1, 1, 1) });

    // Add the circular image to the PDF
    const circularImage = await pdfDoc.embedPng(circularImageUrl.split(',')[1]);
    frontPage.drawImage(circularImage, {
        x: 24,
        y: height / 2 - 33,
        width: 68,
        height: 68,
    });

    const updatedPdfBytes = await pdfDoc.save();
    const blob = new Blob([updatedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;

    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Membership_Card.pdf';
        link.click();
    };
});
