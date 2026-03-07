import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";

const HomePage = () => {
  const { authUser, onlineUsers, logout } = useAuthStore();
  const { subscribeToEvents, unsubscribeFromEvents, getUsers, clearChatData, users } = useChatStore();

  useEffect(() => {
    subscribeToEvents();
    getUsers();
    return () => unsubscribeFromEvents();
  }, [subscribeToEvents, unsubscribeFromEvents, getUsers]);

  // Auto-refetch users if a new user comes online that we don't have yet
  const { authUser: au } = useAuthStore();
  useEffect(() => {
    if (!users || users.length === 0) return;
    const hasNew = onlineUsers.some(
      (id) =>
        String(id) !== String(au?._id) &&
        String(id) !== String(au?.id) &&
        !users.some((u) => String(u._id) === String(id) || String(u.id) === String(id))
    );
    if (hasNew) getUsers();
  }, [onlineUsers, users, getUsers, au]);

  const handleLogout = () => {
    unsubscribeFromEvents();
    clearChatData();
    logout();
  };

  return (
    <div className="h-screen bg-base-200 flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm px-4">
        <div className="flex-1">
          <span className="text-xl font-bold">Minimal Chat</span>
          <span className="ml-3 badge badge-primary badge-sm">{authUser?.phone}</span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-circle" title="Logout">
          <LogOut className="w-5 h-5 text-error" />
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden p-4 flex gap-4 max-w-6xl mx-auto w-full">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  );
};

export default HomePage;