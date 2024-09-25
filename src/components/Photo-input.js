import React, { useState, useRef, useEffect } from 'react';
import "./Photo-input.css";
import 'dotenv/config';

function PhotoInput({ onFileUpload, onImageURIChange, setImageFile: setParentImageFile }) {
    const [photo, setPhoto] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [localImageFile, setLocalImageFile] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const validateImage = (file) => {
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

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file); // Append the actual file to the form data

        try {
            const response = await fetch(`http://${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_BACKEND_PORT}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('File uploaded successfully:', data);
            return data.path;
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Error uploading file');
            throw error;
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            setError('No file selected');
            return;
        }

        setError('');

        if (!validateImage(file)) {
            return; // Exit if validation fails
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onerror = () => {
            setError('Invalid image file');
            URL.revokeObjectURL(img.src);
        };

        img.onload = async () => {
            // Validate image dimensions
            if (img.width < 100 || img.height < 100) {
                setError('Image should be minimum 100 x 100 pixels');
                return;
            } else if (img.width > 1000 || img.height > 1000) {
                setError('Image maximum 1000 x 1000 pixels');
                return;
            }

            setPhoto(file.name);
            setLocalImageFile(file);
            const fileURL = URL.createObjectURL(file);
            setPreviewUrl(fileURL);

            try {
                const uploadedPath = await uploadFile(file);
                console.log('Uploaded path received:', uploadedPath);
                setParentImageFile(uploadedPath); // Call the parent function to set the image path
                onFileUpload(uploadedPath); // Call parent function with uploaded file path
                onImageURIChange(fileURL); // Update the image URI
            } catch (err) {
                console.error('Failed to upload file:', err);
                setError('Failed to upload file');
            } finally {
                URL.revokeObjectURL(fileURL);
            }
        };

        img.src = URL.createObjectURL(file); // Trigger the loading of the image
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleRemove = () => {
        setPhoto('');
        setPreviewUrl('');
        setError('');
        setLocalImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        onFileUpload(null); // Clear the file upload in parent component
        setParentImageFile(null); // Clear the parent image file state
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
                                    e.stopPropagation();
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
