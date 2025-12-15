// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
    cloudName: 'dghoojksm',
    apiKey: '351357879945585',
    apiSecret: '6nkvASJBTrduwKMbZb6CgO5nSrY',
    uploadPreset: 'nada_birthday' // Will create this in Cloudinary
};

// Upload URL for unsigned uploads (frontend safe)
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Helper to get optimized image URL
export const getCloudinaryUrl = (publicId, options = {}) => {
    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill'
    } = options;

    let transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    if (width || height) transformations.push(`c_${crop}`);

    const transformString = transformations.join(',');
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformString}/${publicId}`;
};

// Preset configurations for different use cases
export const CLOUDINARY_PRESETS = {
    // Chat images - optimized for fast loading
    chat: {
        width: 800,
        quality: 80,
        format: 'auto'
    },

    // Profile pictures - medium quality
    profile: {
        width: 400,
        height: 400,
        quality: 85,
        crop: 'fill'
    },

    // Gallery - original quality
    gallery: {
        quality: 100,
        format: 'auto'
    },

    // Thumbnail
    thumbnail: {
        width: 200,
        height: 200,
        quality: 70,
        crop: 'fill'
    }
};
