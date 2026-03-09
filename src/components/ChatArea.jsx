import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Phone, User, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import MessageBubble from "./MessageBubble";

const ChatArea = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const { messages, selectedConversation, selectedUserPhone, typingUsers, users, participants, sendMessage, sendTyping } = useChatStore();
  const [messageInput, setMessageInput] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput("");
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    sendTyping();
  };

  // Find the typing user label
  const typingLabel = (() => {
    const typingId = Object.keys(typingUsers).find(
      (id) => id !== authUser?._id && id !== authUser?.id
    );
    if (!typingId) return null;
    const typingUser = users.find(
      (u) => String(u._id) === String(typingId) || String(u.id) === String(typingId)
    );
    return typingUser?.name || typingUser?.fullName || typingUser?.phone || "Someone";
  })();

  // Check if this is a group conversation
  const activeConv = useChatStore((state) =>
    state.conversations?.find((c) => c._id === selectedConversation)
  );
  const isGroup = activeConv ? activeConv.isGroup : participants.length > 2;

  // Resolve the other participant's info for the chat header (1-on-1)
  const otherParticipant = (() => {
    if (isGroup) return null;
    if (selectedUserPhone) {
      return users.find((u) => String(u.phone) === String(selectedUserPhone));
    }
    const otherId = participants.find(
      (id) => String(id) !== String(authUser?._id)
    );
    if (!otherId) return null;
    return users.find((u) => String(u._id) === String(otherId));
  })();

  // Resolve group member names for display
  const groupMemberNames = isGroup
    ? participants
      .map((id) => {
        if (String(id) === String(authUser?._id)) return "You";
        const u = users.find((u) => String(u._id) === String(id));
        return u?.fullName || u?.name || u?.phone || "Unknown";
      })
      .join(", ")
    : "";

  const chatName = isGroup
    ? `Group (${participants.length} members)`
    : otherParticipant?.fullName || otherParticipant?.name || otherParticipant?.phone || selectedUserPhone || "Chat";

  const isOtherOnline = otherParticipant
    ? onlineUsers.includes(otherParticipant._id?.toString())
    : false;

  if (!selectedConversation) {
    return (
      <div className="flex-1 card bg-base-100 shadow-sm flex items-center justify-center text-base-content/40 flex-col gap-3">
        <MessageSquare className="w-14 h-14 opacity-20" />
        <p className="text-sm">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 card bg-base-100 shadow-sm flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-base-200/60 border-b border-base-300 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${isGroup ? "bg-secondary/10" : "bg-primary/10"} flex items-center justify-center flex-shrink-0`}>
          {isGroup ? (
            <Users className="w-4 h-4 text-secondary" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-sm truncate">{chatName}</span>
          {isGroup ? (
            <span className="text-xs opacity-40 truncate">{groupMemberNames}</span>
          ) : (
            <span className={`text-xs ${isOtherOnline ? "text-success" : "opacity-40"}`}>
              {isOtherOnline ? "Online" : "Offline"}
            </span>
          )}
        </div>
        {!isGroup && otherParticipant?.phone && (
          <div className="ml-auto flex items-center gap-1 text-xs opacity-50">
            <Phone className="w-3 h-3" />
            <span>{otherParticipant.phone}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-base-content/40 text-sm">
            No messages yet. Say hi!
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.sender === authUser?._id || msg.sender === authUser?.id;
          return <MessageBubble key={msg._id || idx} msg={msg} isMe={isMe} />;
        })}

        {/* Typing indicator inline at bottom */}
        {typingLabel && (
          <div className="chat chat-start">
            <div className="chat-bubble chat-bubble-ghost text-xs opacity-60 animate-pulse py-2 px-3">
              {typingLabel} is typing...
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-base-200 flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1 input-sm"
          placeholder="Type a message..."
          value={messageInput}
          onChange={handleTyping}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm btn-square"
          disabled={!messageInput.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatArea;
