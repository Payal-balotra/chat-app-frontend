import { Users, Plus, MessageCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "Offline";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  return `Last seen ${diffDays}d ago`;
};

const Sidebar = ({ onCreateGroup }) => {
  const { authUser, onlineUsers } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    users,
    conversations,
    isUsersLoading,
    joinConversation,
    getContacts,
    addContact,
    knownUsers,
  } = useChatStore();

  const [contactPhone, setContactPhone] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);


  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactPhone.trim()) return;
    setIsAddingContact(true);
    const success = await addContact(contactPhone);
    if (success) {
      setContactPhone("");
    }
    setIsAddingContact(false);
  };
  const otherUsers = users.filter((u) => {
    const isMe = String(u._id) === String(authUser?._id);
    if (isMe) return false;

    if (!searchQuery) return true;

    const nameMatch = String(u.fullName || u.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = String(u.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || phoneMatch;
  });

  const activeChats = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.isGroup ? c.name : c.participants?.find(p => String(p._id) !== String(authUser?._id))?.name || c.participants?.find(p => String(p._id) !== String(authUser?._id))?.fullName;
    return (name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to get group display name from participant IDs or objects
  const getChatName = (conv) => {
    if (conv.isGroup) return conv.name || "Group";
    
    // For 1-on-1, try to find the other participant
    const otherParticipant = conv.participants?.find(p => 
      String(p._id || p) !== String(authUser?._id)
    );

    if (typeof otherParticipant === 'object') {
      return otherParticipant.name || otherParticipant.fullName || otherParticipant.phone || "Unknown User";
    }

    // Fallback if we only have IDs: check contacts list first
    const contact = users.find(u => String(u._id) === String(otherParticipant));
    if (contact) return contact.name || contact.fullName || contact.phone;

    // Check known users cache (all users we've seen in any chat)
    const known = knownUsers[String(otherParticipant)];
    if (known) return known.name || known.fullName || known.phone;

    return "New Chat"; 
  };

  return (
    <div className="w-72 flex flex-col card bg-base-100 shadow-sm overflow-hidden flex-shrink-0">
      <div className="border-b border-base-300 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4" /> Chats
          </h2>
          <button
            className="btn btn-primary btn-xs gap-1"
            onClick={onCreateGroup}
            title="Create Group"
          >
            <Plus className="w-3 h-3" />
            Group
          </button>
        </div>
        <div className="text-xs text-base-content/50 mt-0.5">Click to start chatting</div>
        
        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Add phone..."
            className="input input-bordered input-xs flex-1 bg-base-200"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-xs"
            disabled={isAddingContact}
          >
            {isAddingContact ? "..." : <Plus className="w-3 h-3" />}
          </button>
        </form>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search contact..."
            className="input input-bordered input-sm w-full pl-9 bg-base-200/50 focus:bg-base-100 transition-all rounded-xl border-none ring-1 ring-base-300 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Active Chats */}
        <div>
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-base-content/40 uppercase tracking-wider">
            Active Chats
          </div>
          {activeChats.length === 0 ? (
            <div className="p-4 text-center text-xs opacity-50">No active chats</div>
          ) : (
            <ul className="menu w-full px-2 gap-0.5">
              {activeChats.map((conv) => {
                const isActive = selectedConversation === conv._id;
                const chatName = getChatName(conv);
                const isOnline = !conv.isGroup && onlineUsers.includes(
                  conv.participants?.find(p => String(p._id || p) !== String(authUser?._id))?._id?.toString() || 
                  conv.participants?.find(p => String(p._id || p) !== String(authUser?._id))
                );

                const otherParticipant = conv.participants?.find(p => String(p._id || p) !== String(authUser?._id));
                const otherParticipantId = String(otherParticipant?._id || otherParticipant);
                const isContact = conv.isGroup || users.some(u => String(u._id) === otherParticipantId);
                
                // Try to get profile from knownUsers cache if not in contacts
                const knownProfile = !isContact ? knownUsers[otherParticipantId] : null;

                // Priority for name: 1. Official Contact, 2. Known Profile (from backend), 3. Generic Label
                const resolvedChatName = isContact ? chatName : (knownProfile?.name || knownProfile?.fullName || knownProfile?.phone || chatName);

                return (
                  <li key={conv._id}>
                    <div className={`flex items-center gap-2 px-1 group ${isActive ? "bg-primary/5" : ""}`}>
                      <button
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg flex-1 transition-all ${isActive
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-base-200 border border-transparent"
                          }`}
                        onClick={() => joinConversation(conv._id)}
                      >
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${conv.isGroup ? 'bg-secondary/10' : 'bg-primary/10'}`}>
                            {conv.isGroup ? (
                              <Users className="w-5 h-5 text-secondary" />
                            ) : (
                              <MessageCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-100 rounded-full" />
                          )}
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="font-medium text-sm truncate">
                            {resolvedChatName}
                          </span>
                          {!isContact && !conv.isGroup && (
                            <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">Not in contacts</span>
                          )}
                          <span className="text-xs opacity-40 truncate">
                            {conv.isGroup ? "Group Chat" : isOnline ? "Online" : "Active Conversation"}
                          </span>
                        </div>
                      </button>

                      {!isContact && !conv.isGroup && (otherParticipant?.phone || knownProfile?.phone) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addContact(otherParticipant?.phone || knownProfile?.phone);
                          }}
                          className="btn btn-circle btn-xs btn-primary mr-2 shadow-sm"
                          title="Add to contacts"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Users */}
        <div className="px-4 pt-3 pb-1 text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Contacts
        </div>
        {isUsersLoading ? (
          <div className="p-4 text-center text-sm opacity-50">Loading...</div>
        ) : otherUsers.length === 0 ? (
          <div className="p-4 text-center text-sm opacity-50">No users found</div>
        ) : (
          <ul className="menu w-full px-2 gap-0.5">
            {otherUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id?.toString());
              return (
                <li key={user._id}>
                  <button
                    className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-base-200 w-full"
                    onClick={() => startConversation(user.phone)}
                  >
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-medium text-sm truncate">
                        {user.fullName || user.name || user.phone}
                      </span>
                      {isOnline ? (
                        <span className="text-xs text-success">Online</span>
                      ) : (
                        <span className="text-xs opacity-40">{formatLastSeen(user.lastSeen)}</span>
                      )}
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2 ${isOnline ? "bg-success" : "bg-base-300"
                        }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedConversation && (
        <div className="bg-success/10 text-success p-3 text-xs font-medium border-t border-success/20">
          Active Room:
          <span className="opacity-60 font-mono block truncate mt-0.5">
            {selectedConversation}
          </span>
        </div>
      )}

      {/* Current user footer */}
      <div className="border-t border-base-300 p-3 flex items-center gap-2 bg-base-200/50">
        <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">
            {authUser?.name || authUser?.fullName || authUser?.phone || "You"}
          </div>
          <div className="text-xs opacity-40">You</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
