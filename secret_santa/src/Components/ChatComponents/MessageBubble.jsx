import React from 'react';

const MessageBubble = ({ 
    msg, 
    isUser, 
    isSelected,
    imageUrls,
    showMessageMenu,
    messageMenuPosition,
    quickReactions,
    handleMessageLongPress,
    handleMessageTouchStart,
    handleMessageTouchEnd,
    handleMessageClick,
    handleMessageDoubleClick,
    handleMenuInfo,
    handleMenuEdit,
    handleMenuDelete,
    handleReaction,
    setShowMessageMenu,
    setSelectedMessageId,
    handleMenuReact,
    handleFileDownload
}) => {
    return (
        <div
            className={`d-flex mb-4 align-items-end ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
        >
            {!isUser && (
                <img
                    src={msg.img}
                    alt={msg.from}
                    className="rounded-circle me-3 align-self-end shadow"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
            )}
            <div className="position-relative" style={{ maxWidth: '70%' }}>
                {/* User name above message bubble (WhatsApp style) */}
                {!isUser && (
                    <small className="fw-bold text-muted ms-2 mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                        {msg.from}
                    </small>
                )}
                
                <div
                    className={`message-bubble px-3 py-2 rounded-3 shadow-sm animate__animated animate__fadeInUp ${isSelected ? 'selected-message' : ''}`}
                    style={{
                        backgroundColor: isSelected 
                            ? (isUser ? '#b30000' : '#f0f0f0')
                            : (isUser ? '#cc0000' : '#ffffff'),
                        color: isUser ? '#fff' : '#000',
                        border: isUser ? 'none' : '1px solid #dee2e6',
                        opacity: msg.isDeleted ? 0.6 : 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        wordBreak: 'break-word'
                    }}
                    onMouseDown={(e) => handleMessageLongPress(msg._id, e)}
                    onMouseUp={handleMessageTouchEnd}
                    onTouchStart={(e) => handleMessageTouchStart(msg._id, e)}
                    onTouchEnd={handleMessageTouchEnd}
                    onClick={(e) => handleMessageClick(msg._id, e)}
                    onDoubleClick={(e) => handleMessageDoubleClick(msg._id, e)}
                >
                    {/* File attachment */}
                    {msg.attachment && !msg.isDeleted && (
                        <div className="mb-2">
                            {(() => {
                                const isImage = msg.attachment.fileType === 'image' || 
                                    msg.attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                                    msg.attachment.originalName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
                                
                                if (isImage) {
                                    const blobUrl = imageUrls[msg._id];
                                    
                                    return blobUrl ? (
                                        <img 
                                            src={blobUrl}
                                            alt="attachment"
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxWidth: '250px', maxHeight: '250px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Open in new tab with blob URL
                                                window.open(blobUrl, '_blank');
                                            }}
                                        />
                                    ) : (
                                        <div 
                                            className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded"
                                            style={{ width: '250px', height: '250px' }}
                                        >
                                            <div className="spinner-border text-danger" role="status">
                                                <span className="visually-hidden">Loading image...</span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Non-image file
                                    return (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileDownload(
                                                    msg._id,
                                                    msg.attachment.url,
                                                    msg.attachment.fileName || msg.attachment.originalName || 'file'
                                                );
                                            }}
                                            className={`btn btn-sm ${isUser ? 'btn-light' : 'btn-danger'} d-flex align-items-center gap-2`}
                                            style={{ width: 'fit-content' }}
                                        >
                                            <i className="fa-solid fa-file"></i>
                                            <span className="text-truncate" style={{ maxWidth: '150px' }}>
                                                {msg.attachment.fileName || msg.attachment.originalName || 'File'}
                                            </span>
                                            <i className="fa-solid fa-download ms-1"></i>
                                        </button>
                                    );
                                }
                            })()}
                        </div>
                    )}

                    {/* Message content with time inline (WhatsApp horizontal style) */}
                    <div className="d-flex align-items-end gap-2">
                        <div style={{ whiteSpace: 'pre-line', flex: 1 }}>
                            {msg.content.startsWith('[GIF:') && msg.content.endsWith(']') ? (
                                <video
                                    src={msg.content.slice(6, -1)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="rounded"
                                    style={{ maxWidth: '250px', maxHeight: '250px', cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(msg.content.slice(6, -1), '_blank');
                                    }}
                                />
                            ) : (
                                msg.content
                            )}
                        </div>
                        
                        {/* Time and status inline at bottom-right */}
                        <div className="d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.7rem', alignSelf: 'flex-end' }}>
                            {msg.isEdited && !msg.isDeleted && (
                                <small style={{ opacity: 0.7, fontSize: '0.65rem' }}>edited</small>
                            )}
                            <small style={{ color: isUser ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                                {msg.time}
                            </small>
                            {msg.status === 'sending' && (
                                <div className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}>
                                    <span className="visually-hidden">Sending...</span>
                                </div>
                            )}
                            {msg.status === 'sent' && isUser && (
                                <i className="fa-solid fa-check" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}></i>
                            )}
                            {msg.status === 'delivered' && isUser && (
                                <i className="fa-solid fa-check-double" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}></i>
                            )}
                        </div>
                    </div>

                    {/* WhatsApp-style dropdown arrow for selected message */}
                    {isSelected && (
                        <div className="position-absolute top-0 end-0 mt-1 me-1">
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8rem', color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}></i>
                        </div>
                    )}
                </div>

                {/* WhatsApp-style context menu */}
                {showMessageMenu === msg._id && (
                    <div 
                        className="message-menu position-fixed bg-white rounded-3 shadow-lg py-2 z-3"
                        style={{
                            left: `${messageMenuPosition.x}px`,
                            top: `${messageMenuPosition.y}px`,
                            minWidth: '220px',
                            zIndex: 1050,
                            border: '1px solid #dee2e6'
                        }}
                    >
                        {!msg.isDeleted && (
                            <>
                                <button
                                    className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                    onClick={() => handleMenuInfo(msg._id)}
                                >
                                    <i className="fa-solid fa-info-circle text-primary"></i>
                                    <span>Message Info</span>
                                </button>
                                
                                {/* Quick Reactions Section */}
                                <div className="px-3 py-2 border-top border-bottom">
                                    <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>Quick Reactions</small>
                                    <div className="d-flex gap-2 justify-content-around align-items-center">
                                        {quickReactions.map(emoji => (
                                            <button
                                                key={emoji}
                                                className="btn btn-sm btn-light border"
                                                onClick={() => {
                                                    handleReaction(msg._id, emoji);
                                                    setShowMessageMenu(null);
                                                    setSelectedMessageId(null);
                                                }}
                                                style={{ 
                                                    fontSize: '1.3rem',
                                                    padding: '6px 10px',
                                                    transition: 'transform 0.2s',
                                                    backgroundColor: 'transparent'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                        
                                        {/* Plus icon for more reactions */}
                                        <button
                                            className="btn btn-sm btn-light border"
                                            onClick={() => handleMenuReact(msg._id)}
                                            style={{ 
                                                fontSize: '1.3rem',
                                                padding: '6px 10px',
                                                transition: 'transform 0.2s',
                                                backgroundColor: 'transparent'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                            title="More reactions"
                                        >
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                {isUser && (
                                    <>
                                        <div className="dropdown-divider"></div>
                                        <button
                                            className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                            onClick={() => handleMenuEdit(msg)}
                                        >
                                            <i className="fa-solid fa-edit text-success"></i>
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                            onClick={() => handleMenuDelete(msg._id)}
                                        >
                                            <i className="fa-solid fa-trash text-danger"></i>
                                            <span>Delete</span>
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Reactions Display (existing reactions only) */}
                {!msg.isDeleted && msg.reactions && msg.reactions.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                        {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                            }, {})
                        ).map(([emoji, count]) => (
                            <span
                                key={emoji}
                                className="badge bg-light text-dark d-flex align-items-center gap-1"
                                style={{ fontSize: '0.85rem', cursor: 'pointer', padding: '4px 8px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(msg._id, emoji);
                                }}
                                title={msg.reactions
                                    .filter(r => r.emoji === emoji)
                                    .map(r => r.anonymousName)
                                    .join(', ')}
                            >
                                {emoji} <span className="fw-bold">{count}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {isUser && (
                <img
                    src={msg.img}
                    alt={msg.from}
                    className="rounded-circle ms-3 align-self-end shadow"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
            )}
        </div>
    );
};

export default MessageBubble;
