import { create } from 'zustand'
import { api } from './authStore'
import { useSocketStore } from './socketStore'

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isLoadingChats: false,
  isLoadingMessages: false,
  typingUsers: {}, // { chatId: Set(userIds) }

  fetchChats: async () => {
    set({ isLoadingChats: true })
    try {
      const res = await api.get('/chats')
      const fetchedChats = res.data.chats
      set((state) => {
        let newActiveChat = state.activeChat
        if (state.activeChat) {
          const updatedActiveChat = fetchedChats.find(c => c.chatId === state.activeChat.chatId)
          if (updatedActiveChat) {
            newActiveChat = updatedActiveChat
          }
        }
        return { chats: fetchedChats, isLoadingChats: false, activeChat: newActiveChat }
      })
    } catch (err) {
      console.error(err)
      set({ isLoadingChats: false })
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat })
    get().fetchMessages(chat.chatId)
    // Send read receipt if we have unread messages
    const { socket } = useSocketStore.getState()
    if (socket) {
      socket.emit('message:read', { chatId: chat.chatId })
    }
  },

  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true })
    try {
      const res = await api.get(`/chats/${chatId}/messages`)
      set({ messages: res.data.messages, isLoadingMessages: false })
    } catch (err) {
      console.error(err)
      set({ isLoadingMessages: false })
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }))
  },

  sendMessage: (chatId, text, fileUrl = null, fileType = null) => {
    const { socket } = useSocketStore.getState()
    if (socket) {
      socket.emit('message:send', {
        chatId,
        content: { text, fileUrl, fileType }
      })
    }
  },

  createOrGetChat: async (participantId) => {
    try {
      const res = await api.post('/chats', { participantId })
      await get().fetchChats()
      get().setActiveChat(res.data.chat)
    } catch (err) {
      console.error(err)
    }
  },

  createGroup: async (groupName, participants) => {
    try {
      const res = await api.post('/chats/group', { groupName, participants })
      await get().fetchChats()
      get().setActiveChat(res.data.chat)
    } catch (err) {
      console.error(err)
    }
  },

  uploadFile: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data // { fileUrl, fileType }
    } catch (err) {
      console.error(err)
      return null
    }
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map(m => m._id === messageId ? { ...m, status } : m)
    }))
  },
  
  markAllAsRead: (chatId) => {
    set((state) => ({
      messages: state.messages.map(m => m.chatId === chatId ? { ...m, status: 'read' } : m),
      chats: state.chats.map(c => {
        if(c.chatId === chatId) {
           // reset unread count logic can be updated here
           return c
        }
        return c
      })
    }))
  },

  setTyping: (chatId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[chatId] || new Set()
      const newSet = new Set(current)
      if (isTyping) newSet.add(userId)
      else newSet.delete(userId)
      
      return {
        typingUsers: { ...state.typingUsers, [chatId]: newSet }
      }
    })
  }
}))
