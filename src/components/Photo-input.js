import React, { useState, useRef } from 'react';
import "./Photo-input.css";


const logMessage = (level, message) => {
    const currentLogLevel = process.env.REACT_APP_LOG_LEVEL || 'none';

    const logLevels = {
        none: 0,
        error: 1,
        info: 2,
        verbose: 3
    };

    if (logLevels[level] <= logLevels[currentLogLevel]) {
        if (level === 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    }
};


function PhotoInput({ onFileUpload })
{
    // State variables for photo, preview URL, and error message
    const [photo, setPhoto] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');
    // Reference to the file input element
    const fileInputRef = useRef(null);
    // State variable for temporary path
    const [tempPath, setTempPath] = useState('');

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        logMessage('info', 'File selected: ' + (file ? file.name : 'No file selected'));

        if (file) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                logMessage('error', 'Unsupported file type: ' + file.type);
                setError('Only JPEG, PNG, and WebP images are supported')
                return
            }

            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                logMessage('error', 'File too large: ' + file.size + ' bytes');
                setError('File size should not exceed 2MB');
                return;
            }

            const img = new Image();
            img.onload = () => {
                logMessage('verbose', `Image dimensions: ${img.width}x${img.height}`);
                // Check image dimensions
                if (img.width < 100 || img.height < 100) {
                    setError('Image should be minimum 100 x 100 pixels');
                    logMessage('error', 'Image dimensions too small.');

                } else if (img.width > 1000 || img.height > 1000) {
                    setError('Image maximum 1000 x 1000 pixels');
                    logMessage('error', 'Image dimensions too large.');

                } else {
                    // If all checks pass, update state
                    setError('');
                    setPhoto(file.name);
                    setPreviewUrl(URL.createObjectURL(file));
                    setTempPath(URL.createObjectURL(file));
                    logMessage('info', 'Image passed validation and preview URL set');

                    if (onFileUpload) {
                        onFileUpload(URL.createObjectURL(file));
                    }
                }
            };
            img.onerror = () => {
                setError('Invalid image file');
                logMessage('error', 'Invalid image file');

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
        logMessage('verbose', 'File input clicked');
    };

    // Handler for removing the selected image
    const handleRemove = () => {
        setPhoto('');
        setPreviewUrl('');
        setError('');
        setTempPath(''); // Clear temporary path
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onFileUpload) {
            onFileUpload(''); // Notify parent component
            logMessage('verbose', 'Cleared photo in parent component');
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