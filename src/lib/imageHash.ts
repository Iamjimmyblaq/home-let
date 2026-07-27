// Perceptual (average) hash used to detect re-used property photos.
// Produces a 64-bit hash rendered as 16 hex characters.
export const computeImageHash = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const size = 8;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const grays: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          grays.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }
        const avg = grays.reduce((a, b) => a + b, 0) / grays.length;

        let hex = '';
        for (let i = 0; i < grays.length; i += 4) {
          let nibble = 0;
          for (let j = 0; j < 4; j++) nibble = (nibble << 1) | (grays[i + j] > avg ? 1 : 0);
          hex += nibble.toString(16);
        }
        resolve(hex);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
