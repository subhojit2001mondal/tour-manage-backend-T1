import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  PhoneCall,
  UserCheck,
  Send,
  Clock,
  CheckCircle2,
  Bot,
  User,
  Shield,
  Filter,
  Check,
  AlertCircle,
  Phone,
  CheckCircle,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { formatIST, formatRelativeTime } from '../lib/formatters.ts';
import { Chat, ChatMessage, CallbackRequest, CallbackStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const SupportInboxScreen: React.FC = () => {
  const { currentUser, staffProfile, isSupport } = useAuth();
  const [activeTab, setActiveTab] = useState<'chats' | 'callbacks'>('chats');

  // Chats state
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waitingOnlyFilter, setWaitingOnlyFilter] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Callbacks state
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [callbackFilter, setCallbackFilter] = useState<string>('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to chats
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'chats'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
        list.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
        setChats(list);

        // Auto select first chat if none selected
        if (!selectedChatId && list.length > 0) {
          setSelectedChatId(list[0].id);
        }
      },
      (err) => console.warn('Chats listener notice:', err.message)
    );
    return () => unsub();
  }, [selectedChatId]);

  // Subscribe to callback requests
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'callbackRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallbackRequest));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCallbacks(list);
      },
      (err) => console.warn('Callbacks listener notice:', err.message)
    );
    return () => unsub();
  }, []);

  // Subscribe to messages in active chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        setMessages(list);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => console.warn('Messages listener notice:', err.message)
    );

    return () => unsub();
  }, [selectedChatId]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // Filtered chats
  const filteredChats = chats.filter((c) => {
    if (waitingOnlyFilter) {
      return c.status === 'waiting_for_staff';
    }
    return true;
  });

  // Filtered callbacks
  const filteredCallbacks = callbacks.filter((cb) => {
    if (callbackFilter === 'All') return true;
    return cb.status === callbackFilter;
  });

  // Assign to myself
  const handleAssignToMyself = async () => {
    if (!selectedChat || !currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        assignedStaffId: currentUser.uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${selectedChat.id}`);
    }
  };

  // Close chat
  const handleCloseChat = async () => {
    if (!selectedChat) return;
    try {
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        status: 'closed',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${selectedChat.id}`);
    }
  };

  // Send staff reply in real-time
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat || !currentUser) return;

    setSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const nowIso = new Date().toISOString();

      // Write directly to chats/{id}/messages
      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
        sender: 'staff',
        text: textToSend,
        createdAt: nowIso,
      });

      // Update chat document
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: textToSend,
        lastMessageAt: nowIso,
        mode: 'human',
        status: 'open', // Active conversation
        assignedStaffId: selectedChat.assignedStaffId || currentUser.uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${selectedChat.id}`);
    } finally {
      setSending(false);
    }
  };

  // Update callback status
  const handleUpdateCallbackStatus = async (id: string, status: CallbackStatus) => {
    try {
      await updateDoc(doc(db, 'callbackRequests', id), {
        status,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `callbackRequests/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Inbox</h1>
          <p className="text-sm text-slate-500">
            Real-time customer chat desk and phone callback requests.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'chats' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chats ({chats.filter((c) => c.status === 'waiting_for_staff').length} waiting)</span>
          </button>
          <button
            onClick={() => setActiveTab('callbacks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'callbacks' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Callbacks ({callbacks.filter((cb) => cb.status === 'new').length} new)</span>
          </button>
        </div>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chats' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* Chat List (Sidebar) */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversations</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={waitingOnlyFilter}
                    onChange={(e) => setWaitingOnlyFilter(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  Waiting for staff only
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No conversations match your filter.
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = chat.id === selectedChatId;
                  const isWaiting = chat.status === 'waiting_for_staff';

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-l-4 border-l-indigo-600 shadow-xs'
                          : 'hover:bg-slate-100/70 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {chat.customerId.replace('demo-cust-', '')}
                          </span>
                          {chat.mode === 'bot' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5" /> Bot
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(chat.lastMessageAt)}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {chat.lastMessage}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        {isWaiting ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                            Waiting for Staff
                          </span>
                        ) : chat.status === 'closed' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Closed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}

                        {chat.assignedStaffId && (
                          <span className="text-[10px] text-slate-400 font-medium">Assigned</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation Panel */}
          <div className="lg:col-span-8 flex flex-col bg-white">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Chat with {selectedChat.customerId}
                      </h3>
                      {selectedChat.status === 'waiting_for_staff' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Waiting for your response
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Mode: <strong className="capitalize">{selectedChat.mode}</strong> • Status:{' '}
                      <strong className="capitalize">{selectedChat.status}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAssignToMyself}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Assign to Me
                    </button>

                    {selectedChat.status !== 'closed' && (
                      <button
                        onClick={handleCloseChat}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Close Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-12">No messages in this chat yet.</div>
                  ) : (
                    messages.map((m) => {
                      const isCustomer = m.sender === 'customer';
                      const isBot = m.sender === 'bot';
                      const isStaffMember = m.sender === 'staff';

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            {isCustomer && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" /> Customer
                              </span>
                            )}
                            {isBot && (
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> AI Assistant (Gemini Flash)
                              </span>
                            )}
                            {isStaffMember && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Staff Representative
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-mono">
                              {formatIST(m.createdAt, true)}
                            </span>
                          </div>

                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isCustomer
                                ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                                : isBot
                                ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-tr-xs'
                                : 'bg-indigo-600 text-white rounded-tr-xs'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the customer in real time..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Select a conversation to reply</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALLBACKS TAB */}
      {activeTab === 'callbacks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Callback Queue
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              {['All', 'new', 'called', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setCallbackFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    callbackFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCallbacks.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <PhoneCall className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No callback requests match this filter.</p>
              </div>
            ) : (
              filteredCallbacks.map((cb) => (
                <div
                  key={cb.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{cb.name}</h3>
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{cb.phone}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          cb.status === 'new'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : cb.status === 'called'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cb.status}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                        Topic / Inquiry
                      </span>
                      {cb.topic}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400">
                      Requested: {formatIST(cb.createdAt, true)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {cb.status === 'new' && (
                      <button
                        onClick={() => handleUpdateCallbackStatus(cb.id, 'called')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark as Called
                      </button>
                    )}

                    {cb.status !== 'closed' && (
                      <button
                        onClick={() => handleUpdateCallbackStatus(cb.id, 'closed')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Close Request
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
