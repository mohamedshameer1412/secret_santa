import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ 
    messages,
    selectedMessageId,
    imageUrls,
    showMessageMenu,
    messageMenuPosition,
    quickReactions,
    typingUsers,
    chatEndRef,
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
        <div className="chat-scroll overflow-auto px-3 py-2" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
            {messages.map((msg, index) => {
                const isUser = msg.isCurrentUser;
                const isSelected = selectedMessageId === msg._id;
                
                return (
                    <MessageBubble
                        key={index}
                        msg={msg}
                        isUser={isUser}
                        isSelected={isSelected}
                        imageUrls={imageUrls}
                        showMessageMenu={showMessageMenu}
                        messageMenuPosition={messageMenuPosition}
                        quickReactions={quickReactions}
                        handleMessageLongPress={handleMessageLongPress}
                        handleMessageTouchStart={handleMessageTouchStart}
                        handleMessageTouchEnd={handleMessageTouchEnd}
                        handleMessageClick={handleMessageClick}
                        handleMessageDoubleClick={handleMessageDoubleClick}
                        handleMenuInfo={handleMenuInfo}
                        handleMenuEdit={handleMenuEdit}
                        handleMenuDelete={handleMenuDelete}
                        handleReaction={handleReaction}
                        setShowMessageMenu={setShowMessageMenu}
                        setSelectedMessageId={setSelectedMessageId}
                        handleMenuReact={handleMenuReact}
                        handleFileDownload={handleFileDownload}
                    />
                );
            })}

            {typingUsers.length > 0 && (
                <div className="ps-3 pe-3 py-2 mt-2 mb-2 mx-3 rounded-3 bg-light d-inline-block shadow-sm border border-danger-subtle text-secondary small typing-indicator">
                    <span className="fw-semibold text-danger">
                        {typingUsers.join(', ')}
                    </span>{' '}
                    {typingUsers.includes('You') ? 'are' : (typingUsers.length === 1 ? 'is' : 'are')}{' '}
                    <span className="typing-bounce">
                        {'typing...'.split('').map((char, i) => (
                            <span
                                key={i}
                                className="bounce-letter"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                {char}
                            </span>
                        ))}
                    </span>
                    <span className="typing-dot me-1"></span>
                </div>
            )}

            <div ref={chatEndRef}></div>
        </div>
    );
};

export default MessageList;
