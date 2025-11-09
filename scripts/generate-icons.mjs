import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const srcPath = path.join(root, 'public', 'assets', 'logo-tucan.jpg');
const outDir = path.join(root, 'public', 'assets', 'icons');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function generate() {
  if (!(await fileExists(srcPath))) {
    console.error(`No se encontró la imagen de origen: ${srcPath}`);
    process.exit(1);
  }
  await ensureDir(outDir);

  const sizes = [16, 32, 48, 64, 180, 192, 256, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const png = await sharp(srcPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();
    pngBuffers[size] = png;
    const outPngPath = path.join(outDir, `logo-${size}.png`);
    await fs.writeFile(outPngPath, png);
  }

  // favicon multi-tamaño
  const icoMulti = await pngToIco([pngBuffers[16], pngBuffers[32], pngBuffers[48]]);
  await fs.writeFile(path.join(outDir, 'favicon.ico'), icoMulti);

  // variantes por tamaño (opcionales, por compatibilidad)
  const makeIco = async (size) => {
    const ico = await pngToIco([pngBuffers[size]]);
    await fs.writeFile(path.join(outDir, `favicon-${size}x${size}.ico`), ico);
  };
  await makeIco(16);
  await makeIco(32);
  await makeIco(48);

  console.log('Íconos generados en', outDir);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

