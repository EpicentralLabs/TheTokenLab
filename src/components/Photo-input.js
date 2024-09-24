import React, { useState, useRef } from 'react';
import "./Photo-input.css";


function PhotoInput({ onFileUpload, onImageURIChange }) {
    // State variables for photo, preview URL, error message, and image file
    const [photo, setPhoto] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null); // State variable for the image file
    const [imageURI, setImageURI] = useState(''); // State variable for the image URI
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Cleanup URL object to prevent memory leaks
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const validateImage = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPEG, PNG, and WebP images are supported');
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('File size should not exceed 2MB');
            return false;
        }
        return true;
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file ? file.name : 'No file selected');

        if (!file) {
            setError('No file selected');
            console.error('No file selected');
            return; // Exit early if no file is selected
        }

        // Validate the image
        if (!validateImage(file)) {
            console.error('Validation failed');
            return; // Stop further processing if validation fails
        }

        const img = new Image();
        img.onerror = () => {
            setError('Invalid image file');
            console.error('Invalid image file');
        };

        img.onload = () => {
            console.log(`Image dimensions: ${img.width}x${img.height}`);
            // Check image dimensions
            if (img.width < 100 || img.height < 100) {
                setError('Image should be minimum 100 x 100 pixels');
                console.error('Image dimensions too small.');
            } else if (img.width > 1000 || img.height > 1000) {
                setError('Image maximum 1000 x 1000 pixels');
                console.error('Image dimensions too large.');
            } else {
                // If all checks pass, update state
                setError('');
                setPhoto(file.name);
                setImageFile(file); // Update the file state here

                const fileURL = URL.createObjectURL(file);
                setPreviewUrl(fileURL);
                setImageURI(fileURL); // Update the URI state
                console.log('Image passed validation and preview URL set');

                if (onFileUpload) {
                    onFileUpload(file); // Notify parent with file object
                }
                if (onImageURIChange) {
                    onImageURIChange(fileURL); // Notify parent with image URI
                }
            }
        };

        // Set the image source
        const fileURL = URL.createObjectURL(file);
        img.src = fileURL; // Set the src for the image to trigger onload
    };

    // Handler for clicking the custom file input area
    const handleClick = () => {
        fileInputRef.current.click();
        console.log('File input clicked');
    };

    // Handler for removing the selected image
    const handleRemove = () => {
        setPhoto('');
        setPreviewUrl('');
        setError('');
        setImageFile(null); // Clear the image file state
        setImageURI(''); // Clear the image URI state
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
        if (onFileUpload) {
            onFileUpload(null); // Notify parent component of removal
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
                    <div className="info-bubble">
                        <div className="tooltip">Provide an image for your token. (Min: 100 x 100 px | Max: 1000 x 1000 px | Max: 2MB size)</div>
                    </div>
                </div>
                {error && <div className="photo-input-error">{error}</div>}
            </div>
        </div>
    );
}

export default PhotoInput;