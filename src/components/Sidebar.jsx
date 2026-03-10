import { Users, Plus, MessageCircle } from "lucide-react";
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
  const {
    users,
    conversations,
    isUsersLoading,
    selectedConversation,
    startConversation,
    openGroupConversation,
  } = useChatStore();

  const otherUsers = users.filter(
    (u) => String(u._id) !== String(authUser?._id)
  );

  const groupConversations = conversations.filter((c) => c.isGroup);

  // Helper to get group display name from participant IDs
  const getGroupName = (conv) => {
    const memberNames = conv.participants
      .filter((id) => String(id) !== String(authUser?._id))
      .map((id) => {
        const u = users.find((u) => String(u._id) === String(id));
        return u?.fullName || u?.name || u?.phone || "Unknown";
      })
      .slice(0, 3);
    return memberNames.join(", ");
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group Conversations */}
        {groupConversations.length > 0 && (
          <div>
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-base-content/40 uppercase tracking-wider">
              Groups
            </div>
            <ul className="menu w-full px-2 gap-0.5">
              {groupConversations.map((conv) => {
                const isActive = selectedConversation === conv._id;
                return (
                  <li key={conv._id}>
                    <button
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all ${isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-base-200 border border-transparent"
                        }`}
                      onClick={() => openGroupConversation(conv._id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="font-medium text-sm truncate">
                          {conv.name || `Group (${conv.participants.length})`}
                        </span>
                        <span className="text-xs opacity-40 truncate">
                          {getGroupName(conv)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Users */}
        <div className="px-4 pt-3 pb-1 text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Users
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
            {authUser?.name || authUser?.fullName || users.find(u => String(u._id) === String(authUser?._id))?.name || authUser?.phone || "You"}
          </div>
          <div className="text-xs opacity-40">You</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
