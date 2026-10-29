# Inalgora Card Generator

A browser tool for composing a membership card from a PDF template, text fields, and a cropped portrait.

## Workflow

1. Enter a name, CNE identifier, and speciality.
2. Choose a portrait and adjust its square crop.
3. Generate the card and inspect the Canvas preview.
4. Download `Membership_Card.pdf`.

## Stack

JavaScript · PDF.js · pdf-lib · fontkit · Cropper.js · Canvas

## Run locally

```bash
git clone https://github.com/hamzaxbella/inalgora-card-generator.git
cd inalgora-card-generator
python3 -m http.server 8000
```

Open <http://localhost:8000> in a modern browser. There is no package installation or build step.

## Customize the card

| File | Purpose |
| --- | --- |
| `template.pdf` | Base card design |
| `font.otf` | Embedded font |
| `script.js` | Image crop, PDF composition, preview, and download |
| `index.html`, `style.css` | Form and interface |

Adjust text placement, sizes, and portrait coordinates in `script.js` when replacing the template. Some asset paths expect hosting at the site root.

The current application code handles entered fields and the selected image in the browser; it has no submission or storage backend. Its libraries are loaded from external CDNs, so an internet connection is needed unless you host those dependencies yourself. Use fictional details when trying the demo locally.
