import {getStorage} from "firebase-admin/storage";
import {extractFilePathFromFirebaseUrl} from "@/app/api/services/libs/Firebase/extractFilePathFromFirebaseUrl";
/**
 * Deletes a file from Firebase Storage given its URL.
 *
 * This function extracts the file path from the provided Firebase URL,
 * then deletes the corresponding file from Firebase Storage.
 *
 * @param {string} firebaseUrl - The Firebase Storage URL of the file to be deleted.
 * @param {string} filePath - The file path to delete (not used, extracted from firebaseUrl).
 * @returns {Promise<void>} A promise that resolves when the file is successfully deleted.
 * @throws {Error} Throws an error if the deletion fails.
 */
export async function deleteFileFromFirebase(firebaseUrl: string, filePath: string) {
    try {
        const bucket = getStorage().bucket();
        const filePath = extractFilePathFromFirebaseUrl(firebaseUrl);
        const file = bucket.file(await filePath);
        await file.delete();

        console.log(`🗑️ File deleted successfully from Firebase Storage: ${firebaseUrl}`);
    } catch (error) {
        const deleteErrorMessage = (error as Error).message || String(error);
        console.error('❌ Error deleting file from Firebase Storage:', deleteErrorMessage);
    }
}