import { useEffect, useState } from "react";
import { DoorOpen, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupInfoPanel from "../components/GroupInfoPanel";

const HomePage = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const {
    subscribeToEvents,
    unsubscribeFromEvents,
    getUsers,
    clearChatData,
    users,
    selectedConversation,
    participants,
  } = useChatStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    subscribeToEvents();
    getUsers();
    return () => unsubscribeFromEvents();
  }, [subscribeToEvents, unsubscribeFromEvents, getUsers]);

  // Auto-refetch users if a new user comes online that we don't have yet
  useEffect(() => {
    if (!users || users.length === 0) return;
    const hasNew = onlineUsers.some(
      (id) =>
        String(id) !== String(authUser?._id) &&
        !users.some((u) => String(u._id) === String(id))
    );
    if (hasNew) getUsers();
  }, [onlineUsers, users, getUsers, authUser]);

  const activeConv = useChatStore((state) =>
    state.conversations.find((c) => c._id === selectedConversation)
  );
  const isGroup = activeConv ? activeConv.isGroup : participants.length > 2;

  const handleLeaveRoom = () => {
    clearChatData();
    setShowGroupInfo(false);
  };

  return (
    <div className="h-screen bg-base-200 flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm px-4">
        <div className="flex-1">
          <span className="text-xl font-bold">Minimal Chat</span>
          <span className="ml-3 badge badge-primary badge-sm">{authUser?.phone}</span>
        </div>
        <div className="flex items-center gap-1">
          {selectedConversation && isGroup && (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className={`btn btn-ghost btn-circle btn-sm ${showGroupInfo ? "btn-active" : ""}`}
              title="Group Info"
            >
              <Info className="w-4 h-4 text-info" />
            </button>
          )}
          <button onClick={handleLeaveRoom} className="btn btn-ghost btn-circle" title="Leave Room">
            <DoorOpen className="w-5 h-5 text-warning" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden p-4 flex gap-4 max-w-7xl mx-auto w-full">
        <Sidebar onCreateGroup={() => setShowCreateGroup(true)} />
        <ChatArea />
        {showGroupInfo && (
          <GroupInfoPanel
            isOpen={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
          />
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  );
};

export default HomePage;