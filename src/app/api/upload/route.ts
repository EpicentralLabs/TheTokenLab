import { NextResponse } from 'next/server';
import { uploadToFirebase } from "@/app/api/services/libs/Firebase/uploadToFirebase";

/**
 * Handles POST requests to upload a file.
 *
 * @param {Request} req - The request object containing form data.
 * @returns {Promise<NextResponse>} - A promise that resolves to a NextResponse object.
 * @throws {Error} - Throws an error if the file upload fails.
 */
export async function POST(req: Request): Promise<NextResponse> {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ message: 'No file uploaded!' }, { status: 400 });
    }

    try {
        const uploadResult = await uploadToFirebase(file);
        return NextResponse.json({ message: 'File uploaded successfully!', url: uploadResult.publicUrl }, { status: 200 });
    } catch (error) {
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        console.error('Error uploading file:', error);
        return NextResponse.json({ message: 'Failed to upload file.', error: errorMessage }, { status: 500 });
    }
}
