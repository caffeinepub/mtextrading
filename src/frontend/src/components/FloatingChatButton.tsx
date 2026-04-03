import { ArrowLeft, Image, MessageCircle, Mic, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "../backend.d";

interface Props {
  actor: any;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uint8ToUrl(data: Uint8Array, mime: string): string {
  return URL.createObjectURL(new Blob([data as BlobPart], { type: mime }));
}

function fileToUint8(file: File): Promise<Uint8Array> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });
}

function blobToUint8(blob: Blob): Promise<Uint8Array> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = rej;
    reader.readAsArrayBuffer(blob);
  });
}

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        for (const track of stream.getTracks()) track.stop();
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      // microphone permission denied
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const clearAudio = useCallback(() => setAudioBlob(null), []);

  return { recording, audioBlob, startRecording, stopRecording, clearAudio };
}

function ImageThumbnail({
  src,
  onRemove,
}: {
  src: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative">
      <img
        src={src}
        alt="preview"
        className="h-16 w-16 object-cover rounded-lg border"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center"
      >
        <X size={10} />
      </button>
    </div>
  );
}

const CHAT_BTN_POS_KEY = "mtex_chat_btn_pos";

function useDraggablePosition() {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(CHAT_BTN_POS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: -1, y: -1 }; // sentinel = use default
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  // Clamp to viewport
  const clamp = useCallback((x: number, y: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.max(8, Math.min(w - 64, x)),
      y: Math.max(8, Math.min(h - 64, y)),
    };
  }, []);

  const getDefaultPos = useCallback(
    () => clamp(window.innerWidth - 72, window.innerHeight - 120),
    [clamp],
  );

  const resolvedPos = pos.x === -1 ? getDefaultPos() : clamp(pos.x, pos.y);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    didDrag.current = false;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    didDrag.current = false;
    setDragging(true);
    dragOffset.current = {
      x: t.clientX - posRef.current.x,
      y: t.clientY - posRef.current.y,
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      didDrag.current = true;
      const np = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      };
      setPos(np);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      didDrag.current = true;
      const t = e.touches[0];
      const np = {
        x: t.clientX - dragOffset.current.x,
        y: t.clientY - dragOffset.current.y,
      };
      setPos(np);
    };
    const onUp = () => {
      setDragging(false);
      const clamped = {
        x: Math.max(8, Math.min(window.innerWidth - 64, posRef.current.x)),
        y: Math.max(8, Math.min(window.innerHeight - 64, posRef.current.y)),
      };
      localStorage.setItem(CHAT_BTN_POS_KEY, JSON.stringify(clamped));
      setPos(clamped);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  return { pos: resolvedPos, dragging, didDrag, onMouseDown, onTouchStart };
}

export default function FloatingChatButton({ actor }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { pos, dragging, didDrag, onMouseDown, onTouchStart } =
    useDraggablePosition();
  const { recording, audioBlob, startRecording, stopRecording, clearAudio } =
    useRecorder();

  const loadMessages = useCallback(async () => {
    if (!actor) return;
    try {
      const msgs = await actor.getOwnChatMessages();
      setMessages(msgs);
    } catch {
      // silent
    }
  }, [actor]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30_000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setUnreadCount(0);
      loadMessages().finally(() => setLoading(false));
      pollRef.current = setInterval(loadMessages, 10_000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, loadMessages]);

  useEffect(() => {
    if (!open) {
      const adminCount = messages.filter((m) => m.isFromAdmin).length;
      setUnreadCount(adminCount);
    }
  }, [open, messages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setImageFile(null);
    setImagePreview(null);
    clearAudio();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!actor || sending) return;
    if (!text.trim() && !imageFile && !audioBlob) return;
    setSending(true);
    try {
      const imgData = imageFile ? await fileToUint8(imageFile) : null;
      const audData = audioBlob ? await blobToUint8(audioBlob) : null;
      await actor.sendChatMessage(text.trim(), imgData, audData);
      setText("");
      setImageFile(null);
      setImagePreview(null);
      clearAudio();
      await loadMessages();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Unauthorized") || msg.includes("Only users")) {
        toast.error("Please log in to send messages.");
      } else {
        toast.error("Message failed to send. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Button - draggable */}
      <button
        type="button"
        data-ocid="chat.open_modal_button"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={(e) => {
          if (didDrag.current) {
            e.preventDefault();
            return;
          }
          setOpen(true);
        }}
        className="fixed z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-shadow hover:shadow-xl select-none"
        style={{
          background: "#1a56db",
          left: pos.x,
          top: pos.y,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <MessageCircle size={24} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          data-ocid="chat.dialog"
          className="fixed z-50 bottom-0 left-0 right-0 top-0 bg-black/40 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div
            className="w-full bg-white rounded-t-2xl flex flex-col shadow-2xl"
            style={{ maxHeight: "85vh" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 rounded-t-2xl"
              style={{ background: "#1a56db" }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-white" />
                <span className="font-semibold text-white text-sm">
                  Support Chat
                </span>
              </div>
              <button
                type="button"
                data-ocid="chat.close_button"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{ minHeight: 200 }}
            >
              {loading ? (
                <div
                  data-ocid="chat.loading_state"
                  className="flex justify-center py-10 text-gray-400 text-sm"
                >
                  Loading...
                </div>
              ) : messages.length === 0 ? (
                <div
                  data-ocid="chat.empty_state"
                  className="flex flex-col items-center justify-center py-10 text-gray-400"
                >
                  <MessageCircle size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">
                    Send us a message — we&apos;re here to help
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={String(msg.id)} msg={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Media Preview */}
            {(imagePreview || audioBlob) && (
              <div className="px-4 pb-2 flex items-center gap-2">
                {imagePreview && (
                  <ImageThumbnail src={imagePreview} onRemove={clearMedia} />
                )}
                {audioBlob && !imagePreview && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                    <Mic size={14} className="text-blue-600" />
                    <span className="text-xs text-blue-600">
                      Voice note ready
                    </span>
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                data-ocid="chat.upload_button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <Image size={18} />
              </button>
              <button
                type="button"
                data-ocid="chat.drag_handle"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  recording
                    ? "bg-red-100 text-red-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                aria-label={
                  recording
                    ? "Recording... release to send"
                    : "Hold to record voice note"
                }
              >
                <Mic size={18} />
              </button>
              <input
                data-ocid="chat.input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                placeholder={recording ? "Recording..." : "Type a message..."}
                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-blue-400"
                disabled={recording}
              />
              <button
                type="button"
                data-ocid="chat.submit_button"
                onClick={handleSend}
                disabled={
                  sending ||
                  recording ||
                  (!text.trim() && !imageFile && !audioBlob)
                }
                className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#1a56db" }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.isFromAdmin;
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [audUrl, setAudUrl] = useState<string | null>(null);

  useEffect(() => {
    if (msg.imageData && msg.imageData.length > 0) {
      const url = uint8ToUrl(msg.imageData, "image/jpeg");
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [msg.imageData]);

  useEffect(() => {
    if (msg.audioData && msg.audioData.length > 0) {
      const url = uint8ToUrl(msg.audioData, "audio/webm");
      setAudUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [msg.audioData]);

  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isAdmin
            ? "bg-gray-100 text-gray-800 rounded-tl-sm"
            : "text-white rounded-tr-sm"
        }`}
        style={!isAdmin ? { background: "#1a56db" } : undefined}
      >
        {isAdmin && (
          <p className="text-xs font-semibold text-blue-700 mb-1">Support</p>
        )}
        {msg.content && <p className="text-sm">{msg.content}</p>}
        {imgUrl && (
          <a href={imgUrl} target="_blank" rel="noreferrer">
            <img
              src={imgUrl}
              alt="attachment"
              className="mt-1 rounded-lg max-h-48 object-cover cursor-pointer"
            />
          </a>
        )}
        {audUrl && (
          // biome-ignore lint/a11y/useMediaCaption: voice message from user
          <audio controls src={audUrl} className="mt-1 max-w-full h-8" />
        )}
        <p
          className={`text-xs mt-1 ${
            isAdmin ? "text-gray-400" : "text-blue-200"
          }`}
        >
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

// Admin Chat Panel (used inside AdminPage)
export function AdminChatPanel({
  actor,
}: {
  actor: any;
}) {
  type Conversation = {
    userId: any;
    userEmail: string;
    lastMessage: string;
    lastMessageTime: bigint;
    unreadCount: bigint;
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recording, audioBlob, startRecording, stopRecording, clearAudio } =
    useRecorder();

  const loadConversations = useCallback(async () => {
    if (!actor) return;
    try {
      const convs = await actor.getAllChatConversations();
      setConversations(convs);
    } catch {
      // silent
    }
  }, [actor]);

  const loadThread = useCallback(
    async (userId: any) => {
      if (!actor) return;
      try {
        const msgs = await actor.getUserChatMessages(userId);
        setMessages(msgs);
        await actor.markConversationRead(userId);
        await loadConversations();
      } catch {
        // silent
      }
    },
    [actor, loadConversations],
  );

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15_000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedUser) return;
    loadThread(selectedUser.userId);
    const interval = setInterval(() => loadThread(selectedUser.userId), 10_000);
    return () => clearInterval(interval);
  }, [selectedUser, loadThread]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearMedia = () => {
    setImageFile(null);
    setImagePreview(null);
    clearAudio();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!actor || !selectedUser || sending) return;
    if (!text.trim() && !imageFile && !audioBlob) return;
    setSending(true);
    try {
      const imgData = imageFile ? await fileToUint8(imageFile) : null;
      const audData = audioBlob ? await blobToUint8(audioBlob) : null;
      await actor.sendAdminReply(
        selectedUser.userId,
        text.trim(),
        imgData,
        audData,
      );
      setText("");
      setImageFile(null);
      setImagePreview(null);
      clearAudio();
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadThread(selectedUser.userId);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (selectedUser) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 flex flex-col"
        style={{ height: 600 }}
      >
        {/* Thread header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            data-ocid="admin.chat.back_button"
            onClick={() => setSelectedUser(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {selectedUser.userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {selectedUser.userEmail}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div
              data-ocid="admin.chat.empty_state"
              className="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <MessageCircle size={36} className="mb-2 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <AdminThreadBubble key={String(msg.id)} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Preview */}
        {(imagePreview || audioBlob) && (
          <div className="px-4 pb-2 flex items-center gap-2">
            {imagePreview && (
              <ImageThumbnail src={imagePreview} onRemove={clearMedia} />
            )}
            {audioBlob && !imagePreview && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Mic size={14} className="text-blue-600" />
                <span className="text-xs text-blue-600">Voice note ready</span>
                <button
                  type="button"
                  onClick={clearMedia}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            data-ocid="admin.chat.upload_button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <Image size={18} />
          </button>
          <button
            type="button"
            data-ocid="admin.chat.drag_handle"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            aria-label={
              recording
                ? "Recording... release to send"
                : "Hold to record voice note"
            }
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              recording
                ? "bg-red-100 text-red-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Mic size={18} />
          </button>
          <input
            data-ocid="admin.chat.input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={recording ? "Recording..." : "Reply to user..."}
            className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-blue-400"
            disabled={recording}
          />
          <button
            type="button"
            data-ocid="admin.chat.submit_button"
            onClick={handleSend}
            disabled={
              sending || recording || (!text.trim() && !imageFile && !audioBlob)
            }
            className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: "#1a56db" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Support Conversations</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {conversations.length} conversation
          {conversations.length !== 1 ? "s" : ""}
        </p>
      </div>
      {conversations.length === 0 ? (
        <div
          data-ocid="admin.chat.empty_state"
          className="flex flex-col items-center justify-center py-16 text-gray-400"
        >
          <MessageCircle size={48} className="mb-3 opacity-25" />
          <p className="text-sm">No conversations yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map((conv, i) => (
            <button
              key={String(conv.userId)}
              type="button"
              data-ocid={`admin.chat.item.${i + 1}`}
              onClick={() => setSelectedUser(conv)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {conv.userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {conv.userEmail}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.lastMessage || "No messages"}
                </p>
              </div>
              {Number(conv.unreadCount) > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {Number(conv.unreadCount) > 9
                    ? "9+"
                    : Number(conv.unreadCount)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminThreadBubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.isFromAdmin;
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [audUrl, setAudUrl] = useState<string | null>(null);

  useEffect(() => {
    if (msg.imageData && msg.imageData.length > 0) {
      const url = uint8ToUrl(msg.imageData, "image/jpeg");
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [msg.imageData]);

  useEffect(() => {
    if (msg.audioData && msg.audioData.length > 0) {
      const url = uint8ToUrl(msg.audioData, "audio/webm");
      setAudUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [msg.audioData]);

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isAdmin
            ? "text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        }`}
        style={isAdmin ? { background: "#1a56db" } : undefined}
      >
        {!isAdmin && (
          <p className="text-xs font-semibold text-gray-500 mb-1">User</p>
        )}
        {msg.content && <p className="text-sm">{msg.content}</p>}
        {imgUrl && (
          <a href={imgUrl} target="_blank" rel="noreferrer">
            <img
              src={imgUrl}
              alt="attachment"
              className="mt-1 rounded-lg max-h-48 object-cover cursor-pointer"
            />
          </a>
        )}
        {audUrl && (
          // biome-ignore lint/a11y/useMediaCaption: voice message playback
          <audio controls src={audUrl} className="mt-1 max-w-full h-8" />
        )}
        <p
          className={`text-xs mt-1 ${isAdmin ? "text-blue-200" : "text-gray-400"}`}
        >
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}
