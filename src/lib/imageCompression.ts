/**
 * Compresses an image file to reduce size before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 1024px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ~${(compressedBase64.length * 0.75 / 1024).toFixed(1)}KB`);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses a base64 image string
 * @param base64 - The base64 image string to compress
 * @param maxWidth - Maximum width (default 1024px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export const compressBase64Image = (
  base64: string,
  maxWidth: number = 1024,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      const originalSize = (base64.length * 0.75 / 1024).toFixed(1);
      const newSize = (compressedBase64.length * 0.75 / 1024).toFixed(1);
      console.log(`Image compressed: ${originalSize}KB -> ${newSize}KB`);
      
      resolve(compressedBase64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
};
