import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_CONFIG } from '../config/cloudinary';

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name
 * @param {Function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
export const uploadToCloudinary = async (file, options = {}) => {
    const {
        folder = 'nada-birthday',
        onProgress = () => { }
    } = options;

    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

        // Generate timestamp
        const timestamp = Math.round(new Date().getTime() / 1000);
        formData.append('timestamp', timestamp);

        // For now, use unsigned upload (will work if unsigned uploads are enabled)
        // Note: You need to enable unsigned uploads in Cloudinary settings
        formData.append('upload_preset', 'nada_unsigned'); // You'll need to create this

        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve({
                    url: response.secure_url,
                    publicId: response.public_id,
                    width: response.width,
                    height: response.height,
                    format: response.format
                });
            } else {
                const errorMsg = xhr.responseText || xhr.statusText;
                console.error('Cloudinary upload error:', errorMsg);
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.open('POST', CLOUDINARY_UPLOAD_URL);
        xhr.send(formData);
    });
};

/**
 * Delete image from Cloudinary (requires backend or signed delete)
 * Note: For security, actual deletion should be done from backend
 */
export const deleteFromCloudinary = async (publicId) => {
    // This would typically be done from backend for security
    console.warn('Delete operation should be implemented on backend');
    return { success: false, message: 'Delete from backend' };
};

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file, maxSizeMB = 2) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                const maxDimension = 1920;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with quality adjustment
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    0.85 // 85% quality
                );
            };
        };
    });
};
