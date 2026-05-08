import { useState, useEffect } from 'react'
import { useAuthStore, api } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { Search, MoreVertical, MessageSquarePlus, LogOut, Check, CheckCheck, Users, X } from 'lucide-react'
import { format } from 'date-fns'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { chats, activeChat, setActiveChat, createOrGetChat, createGroup } = useChatStore()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Group creation state
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users?search=${search}`)
        setSearchResults(res.data.users.filter(u => u._id !== user._id))
      } catch (err) {
        console.error(err)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, user._id])

  const handleStartChat = async (participantId) => {
    await createOrGetChat(participantId)
    setSearch('')
    setIsSearching(false)
  }

  const handleSelectForGroup = (u) => {
    if (!selectedUsers.find(su => su._id === u._id)) {
      setSelectedUsers([...selectedUsers, u])
    }
    setSearch('')
  }

  const handleRemoveFromGroup = (id) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== id))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return
    await createGroup(groupName, selectedUsers.map(u => u._id))
    setShowGroupModal(false)
    setGroupName('')
    setSelectedUsers([])
  }

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user._id) || chat.participants[0]
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="bg-gray-100 h-16 px-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-800">{user.name}</span>
        </div>
        <div className="flex gap-2 text-gray-600">
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" onClick={() => setShowGroupModal(true)} title="Create Group">
            <Users size={20} />
          </button>
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" onClick={() => setIsSearching(!isSearching)} title="New Chat">
            <MessageSquarePlus size={20} />
          </button>
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" onClick={logout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Group Modal Overlay */}
      {showGroupModal && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col h-full">
          <div className="bg-primary text-white h-24 px-4 flex items-end pb-4 font-semibold text-lg gap-4">
            <button onClick={() => { setShowGroupModal(false); setSelectedUsers([]); setGroupName(''); }} className="hover:bg-primary-dark p-1 rounded-full">
              <X size={24} />
            </button>
            Create New Group
          </div>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <input 
              type="text" 
              placeholder="Group Subject" 
              className="border-b-2 border-primary w-full py-2 mb-4 focus:outline-none"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedUsers.map(u => (
                  <div key={u._id} className="bg-gray-200 rounded-full px-3 py-1 flex items-center gap-2 text-sm">
                    {u.name}
                    <button onClick={() => handleRemoveFromGroup(u._id)}><X size={14} className="text-gray-500" /></button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Search participants..."
              className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none mb-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto">
              {search.trim() && searchResults.map(u => (
                <div key={u._id} onClick={() => handleSelectForGroup(u)} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold mr-3">{u.name.charAt(0).toUpperCase()}</div>
                  <span>{u.name}</span>
                </div>
              ))}
            </div>
            {selectedUsers.length > 0 && groupName.trim() && (
              <button onClick={handleCreateGroup} className="bg-secondary text-white py-3 rounded-lg mt-2 shadow-md hover:bg-green-600 transition-colors font-semibold">
                Create Group
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-2 bg-white border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-custom bg-white">
        {search.trim() && !showGroupModal ? (
          <div>
            <div className="px-4 py-2 text-primary text-sm font-medium">Search Results</div>
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No users found.</div>
            ) : (
              searchResults.map(u => (
                <div 
                  key={u._id} 
                  onClick={() => handleStartChat(u._id)}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3 flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium truncate">{u.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4 text-center">
              <MessageSquarePlus size={48} className="mb-4 text-gray-300" />
              <p>No chats yet. Search for a user to start chatting!</p>
            </div>
          ) : (
            chats.map(chat => {
              const isActive = activeChat?.chatId === chat.chatId
              const unreadCount = chat.unreadCount?.[user._id] || 0
              
              const displayName = chat.isGroup ? chat.groupName : getOtherParticipant(chat).name
              const initial = displayName.charAt(0).toUpperCase()
              
              return (
                <div 
                  key={chat.chatId} 
                  onClick={() => setActiveChat(chat)}
                  className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 shadow-sm ${chat.isGroup ? 'bg-gray-500' : 'bg-gradient-to-br from-primary to-primary-dark'}`}>
                      {chat.isGroup ? <Users size={20} /> : initial}
                    </div>
                    {/* Online indicator */}
                    {!chat.isGroup && <div className="absolute bottom-0 right-3 w-3 h-3 bg-secondary rounded-full border-2 border-white"></div>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-gray-900 font-medium truncate pr-2">{displayName}</h3>
                      {chat.lastMessageAt && (
                        <span className={`text-xs whitespace-nowrap ${unreadCount > 0 ? 'text-secondary font-medium' : 'text-gray-500'}`}>
                          {format(new Date(chat.lastMessageAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate pr-2 flex items-center gap-1 ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage?.content?.fileUrl && <span className="italic text-gray-400">📎 File attached</span>}
                        {chat.lastMessage?.content?.text || (chat.lastMessage?.content?.fileUrl ? '' : 'Start chatting...')}
                      </p>
                      {unreadCount > 0 && (
                        <div className="bg-secondary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}
