import React from 'react';

const reactionEmojis = [
    // Smileys & Emotion
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
    '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒',
    '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕',
    '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
    '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
    '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
    
    // Hand gestures
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏',
    
    // Popular symbols & hearts
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
    '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    
    // Common reactions
    '🔥', '⭐', '✨', '💫', '💥', '💯', '✔️', '✅', '❌', '❗', '❓', '💢',
    '💤', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🌟'
];

const ReactionPickerModal = ({ 
    showReactionPicker, 
    setShowReactionPicker, 
    setSelectedMessageId,
    handleReaction 
}) => {
    if (!showReactionPicker) return null;

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ 
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000
            }}
            onClick={() => setShowReactionPicker(null)}
        >
            <div 
                className="bg-white rounded-4 p-4 shadow-lg"
                style={{ 
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-face-smile text-warning me-2"></i>
                        Choose a Reaction
                    </h5>
                    <button 
                        className="btn-close"
                        onClick={() => setShowReactionPicker(null)}
                    ></button>
                </div>
                
                <div 
                    className="p-2"
                    style={{ 
                        overflowY: 'auto',
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                        gap: '8px',
                        justifyItems: 'center'
                    }}
                >
                    {reactionEmojis.map(emoji => (
                        <button
                            key={emoji}
                            className="btn border-0"
                            onClick={() => {
                                handleReaction(showReactionPicker, emoji);
                                setShowReactionPicker(null);
                                setSelectedMessageId(null);
                            }}
                            style={{ 
                                fontSize: '2rem',
                                padding: '12px',
                                width: '60px',
                                height: '60px',
                                transition: 'all 0.2s',
                                backgroundColor: 'transparent',
                                borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.3)';
                                e.target.style.backgroundColor = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.backgroundColor = 'transparent';
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                
                <div className="pt-3 border-top mt-3">
                    <small className="text-muted">
                        <i className="fa-solid fa-info-circle me-1"></i>
                        {reactionEmojis.length} emojis available
                    </small>
                </div>
            </div>
        </div>
    );
};

export default ReactionPickerModal;
