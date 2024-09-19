import React, { useState, useRef } from 'react';
import "./Photo-input.css";

function PhotoInput() {
    // State variables for photo, preview URL, and error message
    const [photo, setPhoto] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');
    // Reference to the file input element
    const fileInputRef = useRef(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                setError('Only JPEG, PNG, and WebP images are supported')
                return
            }

            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError('File size should not exceed 2MB');
                return;
            }

            const img = new Image();
            img.onload = () => {
                // Check image dimensions
                if (img.width < 100 || img.height < 100) {
                    setError('Image should be minimum 100 x 100 pixels');
                } else if (img.width > 1000 || img.height > 1000) {
                    setError('Image maximum 1000 x 1000 pixels');
                } else {
                    // If all checks pass, update state
                    setError('');
                    setPhoto(file.name);
                    setPreviewUrl(img.src);
                }
            };
            img.onerror = () => {
                setError('Invalid image file');
            };

            // Read the file as a data URL
            const reader = new FileReader();
            reader.onloadend = () => {
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler for clicking the custom file input area
    const handleClick = () => {
        fileInputRef.current.click();
    };

    // Handler for removing the selected image
    const handleRemove = () => {
        setPhoto('');
        setPreviewUrl('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="container">
            <div className="photo-input-box">
                <label htmlFor="token-image" className="photo-input-label">Token Image:</label>
                <div className="photo-input-container">
                    <div className="custom-file-input" onClick={handleClick}>
                        {previewUrl ? (
                            // Display image preview if available
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
                            // Display upload prompt if no image is selected
                            <div className="upload-content">
                                <span className="upload-icon">📁</span>
                                <span className="upload-text">{photo || 'Choose a file'}</span>
                            </div>
                        )}
                    </div>
                    {/* Hidden file input element */}
                    <input
                        ref={fileInputRef}
                        name="photo"
                        type="file"
                        id="token-image"
                        className="hidden-input"
                        onChange={handlePhotoChange}
                        accept="image/jpeg,image/png,image/webp"
                    />
                    {/* Info bubble with tooltip */}
                    <div className="info-bubble">
                        <div className="tooltip">Provide an image for your token. (Min: 100 x 100 px | Max: 1000 x 1000 px | Max: 2MB size)</div>
                    </div>
                </div>
                {/* Display error message if any */}
                {error && <div className="photo-input-error">{error}</div>}
            </div>
        </div>
    );
}

export default PhotoInput;