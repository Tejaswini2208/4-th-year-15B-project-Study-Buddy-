
/**
 * Compresses an image to a base64 string that is under a certain size limit.
 * @param base64Str The original base64 string of the image.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @param quality The quality of the JPEG compression (0 to 1).
 * @returns A promise that resolves to the compressed base64 string.
 */
export const compressImage = (
  base64Str: string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with specified quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (error) => reject(error);
  });
};
