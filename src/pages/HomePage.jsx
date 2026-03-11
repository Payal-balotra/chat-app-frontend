import { useEffect, useState } from "react";
import { DoorOpen, MessageSquare, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupInfoPanel from "../components/GroupInfoPanel";
import EditProfileModal from "../components/EditProfileModal";

const HomePage = () => {
  const { authUser, onlineUsers, socket, logout } = useAuthStore();
  const {
    subscribeToEvents,
    unsubscribeFromEvents,
    getContacts,
    clearChatData,
    users,
    selectedConversation,
    participants,
  } = useChatStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (!socket) return;

    console.log("[DEBUG] Socket ready, subscribing to events...");
    subscribeToEvents();
    getContacts();

    return () => unsubscribeFromEvents();
  }, [socket, subscribeToEvents, unsubscribeFromEvents, getContacts]);


  const activeConv = useChatStore((state) =>
    state.conversations.find((c) => c._id === selectedConversation)
  );
  const isGroup = activeConv ? activeConv.isGroup : participants.length > 2;

  const handleLeaveRoom = () => {
    clearChatData();
    setShowGroupInfo(false);
  };

  const displayName = authUser?.name || authUser?.phone || "User";

  return (
    <div className="h-screen bg-base-200 flex flex-col font-sans">
      {/* Premium Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-base-300 bg-base-100/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageSquare className="w-5 h-5 text-primary-content" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Minimal Chat
              </span>
            </div>

            <div className="divider divider-horizontal mx-0 opacity-20"></div>

            {/* User Profile Summary */}
            <div className="flex items-center gap-3 group cursor-default">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-9 flex items-center justify-center shadow-inner ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <span className="text-xs uppercase font-bold">
                    {(displayName[0] || "U")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none mb-1 group-hover:text-primary transition-colors">
                  {displayName}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-40 font-semibold">
                  Active Now
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditProfile(true)}
              className="btn btn-ghost btn-sm gap-2 rounded-xl hover:bg-primary/5 text-base-content/70 hover:text-primary transition-all normal-case font-medium"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            {selectedConversation && isGroup && (
              <button
                onClick={() => setShowGroupInfo(!showGroupInfo)}
                className={`btn btn-sm gap-2 rounded-xl normal-case font-medium border-0 transition-all ${showGroupInfo
                    ? "bg-secondary text-secondary-content shadow-lg shadow-secondary/20"
                    : "btn-ghost text-base-content/70 hover:bg-secondary/10 hover:text-secondary"
                  }`}
                title="Group info"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            <div className="divider divider-horizontal mx-1 opacity-20"></div>

            <button
              onClick={logout}
              className="btn btn-ghost btn-sm btn-square rounded-xl hover:bg-error/10 hover:text-error transition-all"
              title="Logout"
            >
              <DoorOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4 max-w-7xl mx-auto w-full">
        <Sidebar onCreateGroup={() => setShowCreateGroup(true)} />
        <ChatArea />
        {showGroupInfo && (
          <GroupInfoPanel
            isOpen={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
          />
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </div>
  );
};

export default HomePage;