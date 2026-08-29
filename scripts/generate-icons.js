import fs from 'fs';
import path from 'path';

// Generate a valid minimal PNG or SVG copy
const svgContent = fs.readFileSync(path.resolve('public/favicon.svg'), 'utf-8');

// Copy favicon.svg to public/icon-192.svg and icon-512.svg
fs.writeFileSync(path.resolve('public/icon-192.svg'), svgContent);
fs.writeFileSync(path.resolve('public/icon-512.svg'), svgContent);

console.log('Icons generated successfully.');
