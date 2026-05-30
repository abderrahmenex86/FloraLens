const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '../assets/images/plants');
const outputFile = path.join(__dirname, '../lib/plantImages.ts');

console.log('Scanning plant image directories...');

try {
    const items = fs.readdirSync(imageDir);

    let output = `// AUTO-GENERATED FILE.\n\n`;
    output += `export const PLANT_IMAGES: Record<number, any[]> = {\n`;

    let totalFolders = 0;
    let totalImages = 0;

    items.forEach((item) => {
        const itemPath = path.join(imageDir, item);

        if (fs.statSync(itemPath).isDirectory()) {
            const match = item.match(/^(\d+)_/);
            if (match) {
                const id = match[1];

                const files = fs
                    .readdirSync(itemPath)
                    .filter(
                        (file) =>
                            file.endsWith('.jpg') ||
                            file.endsWith('.jpeg') ||
                            file.endsWith('.png')
                    );

                if (files.length > 0) {
                    output += `    ${id}: [\n`;
                    files.forEach((file) => {
                        output += `        require('../assets/images/plants/${item}/${file}'),\n`;
                        totalImages++;
                    });
                    output += `    ],\n`;
                    totalFolders++;
                }
            }
        }
    });

    output += `};\n`;

    fs.writeFileSync(outputFile, output);
    console.log('success: generated plantImages.ts');
} catch (error) {
    console.error('error: error generating image index:', error.message);
}
