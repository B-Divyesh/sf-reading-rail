import sharp from 'sharp';

const source = 'assets/src/hero-reading-rail.png';
const output = 'site/public/assets/hero-reading-rail';

await Promise.all([
  sharp(source).resize(768, 512, { fit: 'cover' }).webp({ quality: 78 }).toFile(`${output}-768.webp`),
  sharp(source).resize(1280, 853, { fit: 'cover' }).webp({ quality: 80 }).toFile(`${output}-1280.webp`),
  sharp(source).resize(768, 512, { fit: 'cover' }).avif({ quality: 48 }).toFile(`${output}-768.avif`),
  sharp(source).resize(1280, 853, { fit: 'cover' }).avif({ quality: 50 }).toFile(`${output}-1280.avif`),
  sharp(source).resize(1280, 853, { fit: 'cover' }).jpeg({ quality: 76, progressive: true }).toFile(`${output}-1280.jpg`),
]);

console.log('Optimized responsive hero assets.');
