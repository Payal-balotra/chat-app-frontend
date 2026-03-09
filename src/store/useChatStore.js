import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedConversation: null,
  typingUsers: {},
  participants: [],
  users: [],
  conversations: [],
  isUsersLoading: false,

  // --- ACTIONS ---

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/user/all-users");
      const raw = res.data.data;
      const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
      console.log("[DEBUG] users from API:", data?.[0]); // inspect first user fields
      set({ users: data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  updateLastSeen: (userIds) => {
    const now = new Date().toISOString();
    set((state) => ({
      users: state.users.map((u) =>
        userIds.includes(u._id) || userIds.includes(u.id) ? { ...u, lastSeen: now } : u
      ),
    }));
  },

  startConversation: (phoneNumber) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    // Leave current room before joining a new one
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
    socket.emit("startConversation", { phoneNumber });
  },

  groupConversation: (phoneNumbers) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    console.log("[GROUP] Creating group with phones:", phoneNumbers);
    socket.emit("groupConversation", phoneNumbers);
  },

  openGroupConversation: (conversationId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    // Clear chat data while it loads
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
    console.log("[GROUP] Opening existing group:", conversationId);
    socket.emit("openGroupConversation", { conversationId });
  },

  sendMessage: (content, type = "text", attachments = []) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;

    socket.emit("sendMessage", {
      conversationId: selectedConversation,
      type,
      content,
      attachments,
    });
  },

  sendTyping: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("typing", { conversationId: selectedConversation });
  },

  readMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("readMessages", { conversationId: selectedConversation });
  },

  addGroupMember: (phoneNumber) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("addGroupMember", { conversationId: selectedConversation, phoneNumber });
  },

  removeGroupMember: (userId) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("removeGroupMember", { conversationId: selectedConversation, userId });
  },

  changeAdmin: (newAdminId) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("changeAdmin", { conversationId: selectedConversation, newAdminId });
  },

  // --- LISTENERS SETUP ---

  subscribeToEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listeners for successful creation/subscription
    socket.on("existingConversations", (conversations) => {
      set({ conversations: conversations || [] });
    });

    socket.on("conversationStarted", ({ conversationId, participants, messages = [] }) => {
      set({ selectedConversation: conversationId, messages, participants });
      toast.success("Joined Conversation");
    });

    socket.on("groupConversationStarted", ({ conversationId, participants, messages = [] }) => {
      const newConv = { _id: conversationId, participants, isGroup: true };
      set((state) => ({
        selectedConversation: conversationId,
        messages,
        participants,
        conversations: [
          ...state.conversations.filter((c) => c._id !== conversationId),
          newConv,
        ],
      }));
      toast.success("Group Created/Joined");
    });

    // Listeners for messaging
    socket.on("newMessage", (data) => {
      const msg = data.message || data;
      const convId = data.conversationId || msg.conversationId;

      const { selectedConversation, messages } = get();
      if (selectedConversation === convId) {
        set({ messages: [...messages, msg] });
      }
    });

    // Interaction Events
    socket.on("typing", ({ userId }) => {
      set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: true } }));
      setTimeout(() => {
        set((state) => {
          const updated = { ...state.typingUsers };
          delete updated[userId];
          return { typingUsers: updated };
        });
      }, 2000);
    });

    // Group Management Events
    socket.on("memberAdded", ({ userId }) => {
      set((state) => ({ participants: [...state.participants, userId] }));
      toast.success("Member added");
    });

    socket.on("memberRemoved", ({ userId }) => {
      set((state) => ({ participants: state.participants.filter(id => id !== userId) }));
      toast.success("Member removed");
    });

    socket.on("adminChanged", () => {
      toast.success("Admin changed");
    });

    // Error handling
    socket.on("error", (err) => {
      console.error("Socket error mapping:", err);
      toast.error(err.messag  e || "Socket Error occurred");
    });
  },

  unsubscribeFromEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("existingConversations");
    socket.off("conversationStarted");
    socket.off("groupConversationStarted");
    socket.off("newMessage");
    socket.off("typing");
    socket.off("memberAdded");
    socket.off("memberRemoved");
    socket.off("adminChanged");
    socket.off("error");
  },

  setSelectedConversation: (conversationId) => {
    set({ selectedConversation: conversationId, messages: [] });
  },

  clearChatData: () => {
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
  }
}));