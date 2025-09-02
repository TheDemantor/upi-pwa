const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
function createSVGIcon(size, text = 'UPI') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold">${text}</text>
</svg>`;
}

// Create a simple HTML page to display the icons
function createIconPreview() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>PWA Icons Preview</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .icon-item { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .icon-item img { border: 1px solid #ccc; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>PWA Icons Preview</h1>
  <p>These are placeholder icons. Replace them with your actual app icons.</p>
  <div class="icon-grid">
`;

  sizes.forEach(size => {
    html += `
    <div class="icon-item">
      <h3>${size}x${size}</h3>
      <img src="icon-${size}x${size}.svg" alt="${size}x${size} icon" />
      <p>icon-${size}x${size}.svg</p>
    </div>`;
  });

  html += `
  </div>
</body>
</html>`;

  return html;
}

// Generate icons
const publicDir = path.join(__dirname, '../public');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG icons
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Generate icon preview page
const previewHtml = createIconPreview();
fs.writeFileSync(path.join(publicDir, 'icon-preview.html'), previewHtml);
console.log('Generated icon-preview.html');

console.log('\nPWA icons generated successfully!');
console.log('Open public/icon-preview.html to see all icons.');
console.log('Replace these placeholder icons with your actual app icons before production.');
