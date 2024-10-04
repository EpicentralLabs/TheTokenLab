/**
 * Extracts the file path from a Firebase Storage URL.
 *
 * This function takes a Firebase URL and returns the file path by
 * parsing the URL and extracting the pathname. The leading slash
 * is removed from the pathname to return just the file path.
 *
 * @param {string} firebaseUrl - The Firebase Storage URL from which to extract the file path.
 * @returns {Promise<string>} A promise that resolves to the extracted file path.
 * @throws {Error} Throws an error if the provided URL is invalid.
 */
export async function extractFilePathFromFirebaseUrl(firebaseUrl: string): Promise<string> {
    const url = new URL(firebaseUrl);
    return url.pathname.substring(1);
}