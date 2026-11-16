/* MediVault ? Step 2 ? Image preprocessing. */
'use strict';

// ════════════════════════════════════════
//  PREPROCESSING (canvas-based)
// ════════════════════════════════════════
function applyGrayscale(data) {
  for (let i = 0; i < data.data.length; i += 4) {
    const g = 0.299 * data.data[i] + 0.587 * data.data[i+1] + 0.114 * data.data[i+2];
    data.data[i] = data.data[i+1] = data.data[i+2] = g;
  }
}

function applyNoiseRemoval(data, w, h) {
  const src = new Uint8ClampedArray(data.data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            sum += src[((y + dy) * w + (x + dx)) * 4 + c];
        data.data[(y * w + x) * 4 + c] = sum / 9;
      }
    }
  }
}

function applyContrastEnhancement(data) {
  let min = 255, max = 0;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data.data[i + c];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const range = max - min || 1;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data.data[i + c] = Math.round((data.data[i + c] - min) / range * 255);
    }
  }
}

function applyNormalize(data) {
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data.data[i + c] = Math.round(Math.pow(data.data[i + c] / 255, 0.9) * 255);
    }
  }
}

// preprocessImage — works on a canvas element by ID
// opts: { noiseRemoval, contrastEnhancement, normalize, resize, resizeSize, grayscale, workCanvasId, originalSrc }
// returns processed dataURL
async function preprocessImage(opts) {
  const {
    noiseRemoval = true,
    contrastEnhancement = true,
    normalize = true,
    resize = false,
    resizeSize = 512,
    grayscale = false,
    workCanvasId = 'work-canvas',
    originalSrc = null,
  } = opts || {};

  const wc  = document.getElementById(workCanvasId);
  const ctx = wc.getContext('2d');

  // If originalSrc provided, reload it
  if (originalSrc) {
    await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        wc.width = img.naturalWidth;
        wc.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        res();
      };
      img.onerror = rej;
      img.src = originalSrc;
    });
  }

  if (resize) {
    const size = parseInt(resizeSize);
    const tmp = document.createElement('canvas');
    tmp.width = size; tmp.height = size;
    tmp.getContext('2d').drawImage(wc, 0, 0, size, size);
    wc.width = size; wc.height = size;
    ctx.drawImage(tmp, 0, 0);
  }

  const imageData = ctx.getImageData(0, 0, wc.width, wc.height);
  if (grayscale)          applyGrayscale(imageData);
  if (noiseRemoval)       applyNoiseRemoval(imageData, wc.width, wc.height);
  if (contrastEnhancement) applyContrastEnhancement(imageData);
  if (normalize)          applyNormalize(imageData);
  ctx.putImageData(imageData, 0, 0);

  return wc.toDataURL('image/png');
}
