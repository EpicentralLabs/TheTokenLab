import React, { useState, useRef, useEffect } from 'react';
import './Photo-input.css';
import fetch from 'node-fetch';

// Define the props type for the component
interface PhotoInputProps {
    onFileUpload: (file: string | null) => void; // Accept string for the uploaded file URL
    onImageURIChange?: (uri: string) => void;
    pathToFileURL?: string; // Optional prop
}

const PhotoInput: React.FC<PhotoInputProps> = ({
                                                   onFileUpload,
                                                   onImageURIChange,
                                                   pathToFileURL,
                                               }) => {
    const [photo, setPhoto] = useState<string>(''); // Store the name of the photo file
    const [previewUrl, setPreviewUrl] = useState<string>(''); // Store the preview URL of the image
    const [error, setError] = useState<string>(''); // Store any error messages
    const [imagePath, setImagePath] = useState<string>(''); // Store the uploaded image path
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // Clean up the preview URL when the component unmounts or when previewUrl changes
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const validateImage = (file: File) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError(`Unsupported file type: ${file.type}. Only JPEG, PNG, and WebP are supported.`);
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('File size should not exceed 2MB');
            return false;
        }
        return true;
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        let url: string;
        if (process.env.REACT_APP_APP_ENV === 'development') {
            url = `${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_BACKEND_PORT}/api/upload`;
        } else {
            url = `${process.env.REACT_APP_PUBLIC_URL}/api/upload`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                // @ts-ignore

                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('File uploaded successfully:', data);
            return data; // Return the result for the caller function to use
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Error uploading file');
            throw error; // Re-throw error to be caught in the caller function
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log('File selected:', file ? file.name : 'No file selected');

        if (!file) {
            setError('No file selected');
            console.error('No file selected');
            return; // Exit early if no file is selected
        }

        setError(''); // Clear previous errors

        // Validate the image
        if (!validateImage(file)) {
            console.error('Validation failed');
            return; // Stop further processing if validation fails
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onerror = () => {
            setError('Invalid image file');
            console.error('Invalid image file');
            URL.revokeObjectURL(img.src); // Clean up object URL
        };

        img.onload = async () => {
            console.log(`Image dimensions: ${img.width}x${img.height}`);

            // Check image dimensions
            if (img.width < 100 || img.height < 100) {
                setError('Image should be minimum 100 x 100 pixels');
                console.error('Image dimensions too small.');
            } else if (img.width > 1000 || img.height > 1000) {
                setError('Image maximum 1000 x 1000 pixels');
                console.error('Image dimensions too large.');
            } else {
                setPhoto(file.name);
                const fileURL = URL.createObjectURL(file);
                setPreviewUrl(fileURL);
                console.log('Image passed validation and preview URL set');

                try {
                    const result = await uploadFile(file);
                    console.log('File uploaded successfully:', result);

                    if (onFileUpload && result.publicUrl) {
                        onFileUpload(result.publicUrl); // Pass the public URL to the parent component
                        console.log('Image path:', result.publicUrl);
                        if (onImageURIChange) {
                            onImageURIChange(result.publicUrl);
                        }
                        setImagePath(result.publicUrl);
                    }
                } catch (err) {
                    setError('Failed to upload file');
                    console.error('File upload error:', err);
                } finally {
                    URL.revokeObjectURL(fileURL); // Cleanup URL after usage
                }
            }
        };
    };

    const handleClick = () => {
        fileInputRef.current?.click();
        console.log('File input clicked');
    };

    const handleRemove = () => {
        setPhoto('');
        setPreviewUrl('');
        setError('');
        setImagePath('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onFileUpload) {
            onFileUpload(null); // Clear photo in parent component
            console.log('Cleared photo in parent component');
        }
    };

    return (
        <div className="container">
            <div className="photo-input-box">
                <label htmlFor="token-image" className="photo-input-label">Token Image:</label>
                <div className="photo-input-container">
                    <div className="custom-file-input" onClick={handleClick}>
                        {previewUrl ? (
                            <div className="preview-container">
                                <img src={previewUrl} alt="Preview" className="preview" />
                                <button className="remove-button" onClick={(e) => {
                                    e.stopPropagation(); // Prevent click from triggering file input
                                    handleRemove();
                                }}>
                                    ✖
                                </button>
                            </div>
                        ) : (
                            <div className="upload-content">
                                <span className="upload-icon">📁</span>
                                <span className="upload-text">{photo || 'Choose a file'}</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        name="photo"
                        type="file"
                        id="token-image"
                        className="hidden-input"
                        onChange={handlePhotoChange}
                        accept="image/jpeg,image/png,image/webp"
                    />
                    {error && <div className="error">{error}</div>}
                    <div className="tooltip">Maximum size: 2MB, Dimensions: 100x100 to 1000x1000</div>
                </div>
            </div>
        </div>
    );
}

export default PhotoInput;
