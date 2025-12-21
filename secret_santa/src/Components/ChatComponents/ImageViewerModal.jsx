import React, { useEffect } from 'react';
import './ImageViewerModal.css';

const ImageViewerModal = ({ imageUrl, fileName, onClose }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="image-viewer-backdrop" onClick={onClose}>
            <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button 
                    className="image-viewer-close" 
                    onClick={onClose}
                    title="Close (Esc)"
                >
                    <i className="fa-solid fa-times"></i>
                </button>

                {/* Download button */}
                <button 
                    className="image-viewer-download" 
                    onClick={handleDownload}
                    title="Download"
                >
                    <i className="fa-solid fa-download"></i>
                </button>

                {/* Image */}
                <div className="image-viewer-content">
                    <img 
                        src={imageUrl} 
                        alt={fileName || 'Image'} 
                        className="image-viewer-img"
                    />
                </div>

                {/* File name */}
                {fileName && (
                    <div className="image-viewer-filename">
                        {fileName}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageViewerModal;
