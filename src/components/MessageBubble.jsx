const StatusTick = ({ status }) => {
  if (status === "sent")
    return (
      <span title="Sent" className="text-gray-400">
        <svg className="w-3 h-3 inline" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
        </svg>
      </span>
    );

  if (status === "delivered")
    return (
      <span title="Delivered" className="text-gray-400">✓✓</span>
    );

  if (status === "read")
    return (
      <span title="Read" className="text-blue-400">✓✓</span>
    );

  return null;
};

const MessageBubble = ({ msg, isMe }) => {
  return (
    <div className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
      <div className="chat-header text-xs opacity-50 mb-1">
        {isMe ? "You" : "Them"}
      </div>
      <div className={`chat-bubble ${isMe ? "chat-bubble-primary" : ""}`}>
        {msg.content}
      </div>
      {isMe && (
        <div className="chat-footer text-xs mt-0.5 opacity-80">
          <StatusTick status={msg.status} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
