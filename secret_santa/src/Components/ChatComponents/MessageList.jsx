import React from 'react';
import MessageBubble from './MessageBubble';

// Helper function to format dates in a festive way
const formatDateSeparator = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time parts for date comparison
    const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const messageDateOnly = resetTime(messageDate);
    const todayOnly = resetTime(today);
    const yesterdayOnly = resetTime(yesterday);
    
    // Check if it's today
    if (messageDateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
    }
    
    // Check if it's yesterday
    if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
    }
    
    // Check if within last 7 days - show day name
    const daysDiff = Math.floor((todayOnly - messageDateOnly) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[messageDate.getDay()];
    }
    
    // For older messages, use festive date format
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const day = messageDate.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' 
                  : day === 2 || day === 22 ? 'nd'
                  : day === 3 || day === 23 ? 'rd'
                  : 'th';
    
    return `${months[messageDate.getMonth()]} ${day}${suffix}, ${messageDate.getFullYear()}`;
};

// Group messages by date
const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;
    
    messages.forEach((msg, index) => {
        const msgDate = new Date(msg.createdAt);
        const msgDateStr = msgDate.toDateString();
        
        // Add date separator if date changed
        if (msgDateStr !== currentDate) {
            grouped.push({
                type: 'date-separator',
                date: msg.createdAt,
                key: `date-${msgDateStr}`
            });
            currentDate = msgDateStr;
        }
        
        // Add the message
        grouped.push({
            type: 'message',
            data: msg,
            key: `msg-${index}`
        });
    });
    
    return grouped;
};

const MessageList = ({ 
    messages,
    selectedMessageId,
    imageUrls,
    showMessageMenu,
    messageMenuPosition,
    quickReactions,
    typingUsers,
    chatEndRef,
    chatContainerRef,
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
    handleFileDownload,
    handleImageClick
}) => {
    const groupedItems = groupMessagesByDate(messages);
    
    return (
        <div ref={chatContainerRef} className="chat-scroll overflow-auto px-3 py-2" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
            {groupedItems.map((item) => {
                if (item.type === 'date-separator') {
                    return (
                        <div 
                            key={item.key}
                            className="d-flex justify-content-center my-3"
                        >
                            <div 
                                className="badge px-3 py-2 shadow-sm"
                                style={{
                                    backgroundColor: '#cc0000',
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    borderRadius: '12px',
                                    letterSpacing: '0.3px'
                                }}
                            >
                                <i className="fa-solid fa-calendar-days me-2"></i>
                                {formatDateSeparator(item.date)}
                            </div>
                        </div>
                    );
                }
                
                // Regular message
                const msg = item.data;
                const isUser = msg.isCurrentUser;
                const isSelected = selectedMessageId === msg._id;
                
                return (
                    <MessageBubble
                        key={item.key}
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
                        handleImageClick={handleImageClick}
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
