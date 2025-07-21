# Background Images

This folder contains the background images for the BigDayTimer extension.

## Free Backgrounds
The following 8 backgrounds are included in the free version:

1. **wedding.jpg** - Wedding theme background
2. **beach.jpg** - Beach/vacation theme
3. **mountains.jpg** - Mountain landscape
4. **city.jpg** - Urban skyline
5. **sunset.jpg** - Sunset/romantic theme
6. **flowers.jpg** - Floral theme
7. **space.jpg** - Space/galaxy theme
8. **forest.jpg** - Forest/nature theme

## Premium Backgrounds
Premium users get access to additional backgrounds and can upload custom images.

## Image Requirements
- Format: JPG, PNG, or WebP
- Recommended size: 400x250px (16:10 aspect ratio)
- Max file size: 1MB each
- Quality: High-resolution for crisp display

## Usage
Background images are referenced by their ID in the extension's JavaScript files. The content script uses Unsplash URLs as placeholders, but for production, local images should be used to avoid external dependencies.

To add new backgrounds:
1. Add the image file to this folder
2. Update the backgrounds array in both popup.js and content.js
3. Add the new background to the selection grid in the popup

## Licensing
All background images should be properly licensed for commercial use or created specifically for this project.