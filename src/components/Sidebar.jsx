import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const Sidebar = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const { users, isUsersLoading, selectedConversation, startConversation } = useChatStore();

  const otherUsers = users.filter(
    (u) => u._id !== authUser?._id && u.id !== authUser?.id
  );

  return (
    <div className="w-72 flex flex-col card bg-base-100 shadow-sm overflow-hidden flex-shrink-0">
      <div className="border-b border-base-300 p-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Users className="w-4 h-4" /> Users
        </h2>
        <div className="text-xs text-base-content/50 mt-0.5">Click to start chatting</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isUsersLoading ? (
          <div className="p-4 text-center text-sm opacity-50">Loading...</div>
        ) : otherUsers.length === 0 ? (
          <div className="p-4 text-center text-sm opacity-50">No users found</div>
        ) : (
          <ul className="menu w-full p-2 gap-0.5">
            {otherUsers.map((user) => {
              const isOnline =
                onlineUsers.includes(user._id?.toString()) ||
                onlineUsers.includes(user.id?.toString());
              return (
                <li key={user._id || user.id}>
                  <button
                    className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-base-200 w-full"
                    onClick={() => startConversation(user.phone)}
                  >
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-medium text-sm truncate">
                        {user.fullName || user.name || user.phone}
                      </span>
                      <span className="text-xs opacity-50 truncate">{user.phone}</span>
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2 ${
                        isOnline ? "bg-success" : "bg-base-300"
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
    </div>
  );
};

export default Sidebar;
