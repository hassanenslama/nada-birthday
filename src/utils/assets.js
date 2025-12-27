/**
 * Resolves the absolute path for an asset, respecting the Vite base URL.
 * Useful for deployments to subdirectories (e.g., GitHub Pages).
 * 
 * @param {string} path - The path to the asset (e.g., "/images/logo.png")
 * @returns {string} - The resolved path (e.g., "/nada-birthday/images/logo.png")
 */
export const getAssetPath = (path) => {
    const baseUrl = import.meta.env.BASE_URL;
    // Remove leading slash from path if it exists to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}${cleanPath}`;
};
