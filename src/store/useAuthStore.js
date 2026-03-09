import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";

const BASE_URL = "http://localhost:5000";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      get().disconnectSocket();
      return;
    }

    // Decode the token to get minimal user info (just for routing)
    // Socket "me" event will update with full user data from DB
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      const phone = localStorage.getItem("userPhone") || "";
      set({ authUser: { _id: decoded.userId || decoded.id, phone }, isCheckingAuth: false });
    } catch (e) {
      console.error("Token decode failed:", e);
      localStorage.removeItem("token");
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    // Connect socket for real-time features + full user data via "me" event
    get().connectSocket();
  },

  register: async (phone) => {
    try {
      const res = await axiosInstance.post("/auth/register", { phone });

      const data = res.data.data || {};
      const token = data.token || res.data.token;
      const user = data.user || data.existingUser || { phone };

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("userPhone", phone); // always use the typed phone
        set({ authUser: { ...user, phone } });    // override with the real phone
        get().connectSocket();
        toast.success("Logged in successfully");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  },

  verifyOtp: async () => {
    // Left empty since we skip OTP
    return false;
  },

  logout: () => {
    try {
      localStorage.removeItem("token");
      set({ authUser: null, onlineUsers: [] });
      get().disconnectSocket();
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
      toast.error("Logout failed");
    }
  },

  connectSocket: () => {
    const { socket } = get();
    if (socket) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(BASE_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    // Backend middleware authenticates and emits user data
    newSocket.on("me", (userData) => {
      console.log("[AUTH] Received user data from socket:", userData);
      if (userData) {
        set({ authUser: userData, isCheckingAuth: false });
      } else {
        console.warn("[AUTH] Received null user data from socket 'me' event");
      }
    });

    // Fallback: if "me" never fires within 5s, stop showing loading
    setTimeout(() => {
      const { authUser } = get();
      if (!authUser) {
        console.warn("[AUTH] Socket 'me' event not received within 5s");
        set({ isCheckingAuth: false });
      }
    }, 5000);

    newSocket.on("getOnlineUsers", (userIds) => {
      set((state) => {
        // Find users who were online but just went offline
        const wentOffline = state.onlineUsers.filter((id) => !userIds.includes(id));
        if (wentOffline.length > 0) {
          useChatStore.getState().updateLastSeen(wentOffline);
        }
        return { onlineUsers: userIds };
      });
    });

    // If token is invalid, the socket connection will fail
    newSocket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      // Only clear token if it's an auth error, not a transient network issue
      if (err.message?.includes("401") || err.message?.includes("Access denied") ||
        err.message?.includes("Invalid token") || err.message?.includes("user not found")) {
        localStorage.removeItem("token");
        set({ authUser: null, isCheckingAuth: false });
        newSocket.disconnect();
      }
    });

    // Explicitly disconnect when the user closes/refreshes the tab
    const handleBeforeUnload = () => {
      newSocket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    set({ socket: newSocket, _beforeUnloadHandler: handleBeforeUnload });
  },

  disconnectSocket: () => {
    const { socket, _beforeUnloadHandler } = get();
    if (_beforeUnloadHandler) {
      window.removeEventListener("beforeunload", _beforeUnloadHandler);
    }
    if (socket) {
      socket.disconnect();
      set({ socket: null, _beforeUnloadHandler: null });
    }
  },
}));
