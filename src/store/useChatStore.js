import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedConversation: null,
  typingUsers: {},
  participants: [],
  users: [], // Official contacts
  knownUsers: {}, // Cache for all users encountered in chats
  conversations: [],
  isUsersLoading: false,
  isJoining: false,

  // --- ACTIONS ---

  getContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/user/getContacts");
      const raw = res.data.data;
      // If backend returns the user object, extract contacts; otherwise fallback to array check
      const data = Array.isArray(raw) ? raw : (raw?.contacts || []);
      console.log("[DEBUG] contacts from API:", data?.[0]);
      set({ users: data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addContact: async (phone) => {
    try {
      const res = await axiosInstance.post("/user/add", { phone });
      toast.success(res.data.message || "Contact added successfully!");
      get().getContacts(); // Refresh list
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contact");
      return false;
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
    console.log("[DEBUG] startConversation called. Phone:", phoneNumber, "Socket Connected:", socket?.connected);
    if (!socket) return toast.error("Socket not connected");
    // Leave current room before joining a new one
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {}, isJoining: true });
    console.log("[DEBUG] Emitting 'conversationStarted' (MULTI-KEY format) with phone:", phoneNumber);
    // Send both variants to satisfy different backend validation patterns
    socket.emit("conversationStarted", { phoneNumber, phone: phoneNumber });
  },

  groupConversation: (phoneNumbers, name) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    set({ isJoining: true });
    console.log("[GROUP] Creating group with phones:", phoneNumbers, "Name:", name);
    socket.emit("groupConversation", phoneNumbers, name);
  },

  openGroupConversation: (conversationId, phoneNumber = null) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    // Clear chat data while it loads
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {}, isJoining: true });
    
    const payload = { conversationId, id: conversationId };
    if (phoneNumber) {
      payload.phoneNumber = phoneNumber;
      payload.phone = phoneNumber;
    }

    console.log("[DEBUG] Emitting 'conversationStarted' (OBJECT format) with:", payload);
    socket.emit("conversationStarted", payload);
  },

  joinConversation: (conversationId, phoneNumber = null) => {
    get().openGroupConversation(conversationId, phoneNumber);
  },

  sendMessage: (content, type = "text", attachments = []) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    console.log("[DEBUG] sendMessage called. Socket:", socket?.id, "Connected:", socket?.connected, "Conv:", selectedConversation);
    if (!socket || !selectedConversation) {
      console.warn("[DEBUG] Cannot send message: socket or conversation missing");
      return;
    }

    console.log("[DEBUG] Emitting 'sendMessage' event with payload:", { conversationId: selectedConversation, type, content });
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

  subscribeToEvents: (socketInstance) => {
    const socket = socketInstance || useAuthStore.getState().socket;
    console.log("[DEBUG] subscribeToEvents called. Using Socket ID:", socket?.id);
    if (!socket) {
      console.warn("[DEBUG] subscribeToEvents: No socket available");
      return;
    }

    // Log ALL incoming events for debugging
    socket.onAny((eventName, ...args) => {
      console.log(`[DEBUG] Incoming signal from server -> Event: ${eventName}`, args);
    });

    // Request initial list of conversations
    console.log("[DEBUG] Requesting initial conversations list. Socket connected:", socket.connected);
    socket.emit("getConversations");

    // Also fetch on every (re)connect
    socket.on("connect", () => {
      console.log("[DEBUG] Socket (re)connected, fetching conversations...");
      socket.emit("getConversations");
    });

    socket.on("existingConversations", (data) => {
      console.log("[DEBUG] Received existingConversations event. RAW DATA:", data);
      const rawConvs = Array.isArray(data) ? data : (data?.conversations || []);
      console.log("[DEBUG] Extracted raw conversations list:", rawConvs.length, "items");

      const processedConversations = rawConvs.map(conv => {
        // Cache any full participant objects found to ensure they resolve even if not in contacts
        if (Array.isArray(conv.participants)) {
          conv.participants.forEach(p => {
            if (typeof p === 'object' && p._id) {
              set(state => ({
                knownUsers: { ...state.knownUsers, [p._id]: p }
              }));
            }
          });
        }
        return {
          ...conv,
          isGroup: conv.isGroup || (conv.participants && conv.participants.length > 2)
        };
      });
      console.log("[DEBUG] Processed conversations:", processedConversations);
      set({ conversations: processedConversations });
    });

    socket.on("conversationStarted", ({ conversationId, participants, messages = [] }) => {
      console.log("[DEBUG] Event 'conversationStarted':", { conversationId, participants, msgCount: messages.length });
      const { isJoining } = get();
      if (isJoining) {
        console.log("[DEBUG] Auto-selecting room:", conversationId);
        set({ selectedConversation: conversationId, messages, participants, isJoining: false });
        toast.success("Joined Conversation");
      }
      console.log("[DEBUG] Refreshing conversations after conversationStarted");
      socket.emit("getConversations");
    });

    socket.on("groupConversationStarted", ({ conversationId, participants, messages = [] }) => {
      console.log("[DEBUG] Joined group conversation:", conversationId);
      const { isJoining } = get();
      const newConv = { _id: conversationId, participants, isGroup: true };

      if (isJoining) {
        set((state) => ({
          selectedConversation: conversationId,
          messages,
          participants,
          isJoining: false,
          conversations: [
            ...state.conversations.filter((c) => c._id !== conversationId),
            newConv,
          ],
        }));
        toast.success("Group Created/Joined");
      } else {
        set((state) => ({
          conversations: [
            ...state.conversations.filter((c) => c._id !== conversationId),
            newConv,
          ],
        }));
      }
      socket.emit("getConversations");
    });

    socket.on("addedToGroup", ({ groupName, conversationId }) => {
      console.log("[DEBUG] Added to group:", groupName, conversationId);
      toast.success(`You were added to group: ${groupName || "New Group"}`);
      // Refresh the list to show the new group in sidebar
      socket.emit("getConversations");
    });

    socket.on("removedFromGroup", ({ groupName, conversationId }) => {
      console.log("[DEBUG] Removed from group:", groupName, conversationId);
      toast.error(`You were removed from group: ${groupName || "Group"}`);

      const { selectedConversation } = get();
      if (selectedConversation === conversationId) {
        set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
      }
      // Refresh the list to remove the group from sidebar
      socket.emit("getConversations");
    });

    // Listeners for messaging
    // Local tracker for deduplication
    let lastMsgId = null;

    socket.on("newMessage", (data) => {
      const msg = data.message || data;
      const msgId = msg._id || msg.id;

      console.log("[DEBUG] Received newMessage event. Data:", data, "MsgID:", msgId);

      // Prevent processing the same message twice (happens if backend emits to room & user ID)
      if (lastMsgId === msgId) {
        console.log("[DEBUG] Skipping duplicate message:", msgId);
        return;
      }
      lastMsgId = msgId;

      const convId = data.conversationId || msg.conversationId;
      const { authUser } = useAuthStore.getState();
      const { selectedConversation, messages, users, conversations } = get();

      console.log("[DEBUG] Processing message. convId:", convId, "selectedConversation:", selectedConversation);

      // 1. If we're in the chat, just add it to messages
      if (String(selectedConversation) === String(convId)) {
        console.log("[DEBUG] Adding message to current chat state");
        set({ messages: [...messages, msg] });
      }
      // 2. If we're NOT in the chat AND it's not our own message, show a toast
      else if (String(msg.sender) !== String(authUser?._id)) {
        console.log("[DEBUG] Showing notification for message in other chat");
        const sender = users.find(u => String(u._id) === String(msg.sender));
        const conv = conversations.find(c => String(c._id) === String(convId));

        const senderName = sender?.name || sender?.fullName || sender?.phone || "Someone";
        const prefix = conv?.isGroup ? `[${conv.name}] ${senderName}` : senderName;

        toast.success(`${prefix}: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? "..." : ""}`, {
          duration: 4000,
          icon: "💬"
        });
      }

      // Always reload conversations to update snippets/unread counts in sidebar
      console.log("[DEBUG] Refreshing conversations list");
      socket.emit("getConversations");
    });

    // Interaction Events
    socket.on("typing", ({ conversationId, userId }) => {
      if (!conversationId) return;

      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: {
            ...(state.typingUsers[conversationId] || {}),
            [userId]: true
          }
        }
      }));

      // Automatically remove typing status after 3 seconds of inactivity
      setTimeout(() => {
        set((state) => {
          const roomTyping = { ...(state.typingUsers[conversationId] || {}) };
          delete roomTyping[userId];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: roomTyping
            }
          };
        });
      }, 3000);
    });

    // Group Management Events
    socket.on("memberAdded", ({ conversationId, userId }) => {
      console.log("[DEBUG] Member added to room:", conversationId, userId);
      const { selectedConversation, participants } = get();
      if (typeof conversationId === 'string' && selectedConversation === conversationId) {
        if (!participants.includes(userId)) {
          set({ participants: [...participants, userId] });
        }
      } else if (typeof conversationId === 'undefined') {
        // Fallback for older backend versions
        set((state) => ({ participants: [...state.participants, userId] }));
      }
      toast.success("Member added to group");
    });

    socket.on("memberRemoved", ({ conversationId, userId }) => {
      console.log("[DEBUG] Member removed from room:", conversationId, userId);
      const { selectedConversation, participants } = get();
      if (typeof conversationId === 'string' && selectedConversation === conversationId) {
        set({ participants: participants.filter(id => String(id) !== String(userId)) });
      } else if (typeof conversationId === 'undefined') {
        // Fallback for older backend versions
        set((state) => ({ participants: state.participants.filter(id => id !== userId) }));
      }
      toast.success("Member removed from group");
    });

    socket.on("adminChanged", () => {
      toast.success("Admin changed");
    });

    socket.on("messagesRead", ({ conversationId }) => {
      console.log("[DEBUG] Received messagesRead event for room:", conversationId);
      // Logic for updating UI (e.g. checkmarks) can go here
    });

    // Error handling
    socket.on("error", (err) => {
      console.error("Socket error mapping:", err);
      toast.error(err.message || "Socket Error occurred");
    });
  },

  unsubscribeFromEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("existingConversations");
    socket.off("conversationStarted");
    socket.off("groupConversationStarted");
    socket.off("addedToGroup");
    socket.off("removedFromGroup");
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