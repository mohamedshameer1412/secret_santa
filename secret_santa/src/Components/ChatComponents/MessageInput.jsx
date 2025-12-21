import React from 'react';
import Picker from 'emoji-picker-react';

const MessageInput = ({
    message,
    editingMessageId,
    showEmojiPicker,
    showGifPicker,
    gifQuery,
    gifs,
    uploadingFile,
    sendingMessage,
    fileInputRef,
    inputRef,
    setMessage,
    setShowEmojiPicker,
    setShowGifPicker,
    setGifQuery,
    setEditingMessageId,
    handleInputChange,
    handleKeyDown,
    handleSend,
    handleFileUpload,
    handleEmojiClick,
    handleGifSelect
}) => {
    return (
        <div className="d-flex align-items-end justify-content-between gap-3 p-3 bg-white shadow-sm flex-wrap border-top border-4 border-danger-subtle" style={{ flexShrink: 0, zIndex: 10 }}>
            {/* Edit mode indicator */}
            {editingMessageId && (
                <div className="w-100 d-flex justify-content-between align-items-center bg-info bg-opacity-10 p-2 rounded mb-2">
                    <span className="text-muted">
                        <i className="fa-solid fa-edit me-2"></i>
                        Editing message...
                    </span>
                    <button
                        className="btn btn-sm btn-close"
                        onClick={() => {
                            setEditingMessageId(null);
                            setMessage('');
                        }}
                    ></button>
                </div>
            )}

            <div className="d-flex align-items-center gap-2 position-relative">
                {/* File upload button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <button
                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    aria-label="Upload File"
                    title="Upload file or image"
                >
                    {uploadingFile ? (
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                    ) : (
                        <i className="fa-solid fa-paperclip fs-5 text-secondary"></i>
                    )}
                </button>

                <button
                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Emoji Picker"
                >
                    <i className="fa-solid fa-face-smile fs-5 text-secondary"></i>
                </button>

                {showEmojiPicker && (
                    <div className="position-absolute bottom-100 start-0 mb-2 z-3">
                        <Picker
                            onEmojiClick={handleEmojiClick}
                            theme="light"
                            height={320}
                            width={320}
                        />
                    </div>
                )}

                <button
                    className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    aria-label="GIF Picker"
                >
                    <i className="fa-solid fa-image fs-5 text-secondary"></i>
                </button>

                {showGifPicker && (
                    <div className="position-absolute bottom-100 start-0 mb-2 p-3 rounded shadow bg-white z-3" style={{ width: '300px', maxHeight: '320px', overflowY: 'auto' }}>
                        <input
                            className="form-control mb-2"
                            type="text"
                            placeholder="Search GIFs..."
                            value={gifQuery}
                            onChange={(e) => setGifQuery(e.target.value)}
                        />
                        <div className="d-flex flex-wrap gap-2">
                            {gifs.map((gif) => {
                                const mp4Url = gif.media_formats?.mp4?.url;
                                return mp4Url && (
                                    <video
                                        key={gif.id}
                                        src={mp4Url}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                                        onClick={() => handleGifSelect(mp4Url)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="d-flex flex-grow-1 align-items-end gap-2 ">
                <textarea
                    ref={inputRef}
                    rows={1}
                    className="form-control flex-grow-1 px-3 py-2 rounded-4 shadow-sm"
                    placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                    style={{ minHeight: '44px', maxHeight: '120px', resize: 'none' }}
                ></textarea>
                <button
                    className="btn send-btn icon-btn1"
                    onClick={handleSend}
                    disabled={sendingMessage || !message.trim()}
                    aria-label={editingMessageId ? "Update Message" : "Send Message"}
                >
                    {sendingMessage ? (
                        <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                    ) : editingMessageId ? (
                        <i className="fa-solid fa-check"></i>
                    ) : (
                        <i className="fa-solid fa-paper-plane"></i>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
