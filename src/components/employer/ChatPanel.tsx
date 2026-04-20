import { useState } from "react";
import { Send, MessageSquare, Loader2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "./EmptyState";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import type { ApplicationStatus } from "@/domain/models";

export interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void> | void;
  candidateName: string;
  isUnlocked: boolean;
  onUnlock: () => void;
  currentUserId?: string;
  /** Application status — chat is only available after shortlist */
  applicationStatus?: ApplicationStatus;
}

// Chat is only unlocked once the candidate has been shortlisted
const CHAT_ALLOWED_STATUSES: ApplicationStatus[] = ["shortlisted", "interview", "hired"];

const ChatPanel = ({ messages, onSend, candidateName, isUnlocked, onUnlock, currentUserId, applicationStatus }: Props) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  const chatAllowed = applicationStatus === undefined || CHAT_ALLOWED_STATUSES.includes(applicationStatus);

  const handleSend = async (content?: string) => {
    const msg = (content ?? text).trim();
    if (!msg || sending) return;
    setSending(true);
    setSendError(null);
    setLastFailedText(null);
    try {
      await onSend(msg);
      setText("");
      toast.success("Wiadomość wysłana");
    } catch {
      setSendError("Nie udało się wysłać wiadomości");
      setLastFailedText(msg);
    } finally {
      setSending(false);
    }
  };

  if (!chatAllowed) {
    return (
      <div className="p-3 border-t border-border">
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/60">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-0.5">Kontakt po shortliście</p>
            <p>Napiszesz do kandydata dopiero po dodaniu go do shortlisty.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="p-3 border-t border-border">
        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform"
        >
          <MessageSquare className="w-4 h-4" /> Napisz do {candidateName}
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Wyślij wiadomość, aby rozpocząć rozmowę
        </p>
      </div>
    );
  }

  return (
    <LocalErrorBoundary label="Chat" compact>
    <div className="border-t border-border">
      <div className="max-h-40 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-5 h-5 text-muted-foreground" />}
            title="Brak wiadomości"
            description="Rozpocznij rozmowę, wysyłając pierwszą wiadomość poniżej."
          />
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${(currentUserId && msg.senderId === currentUserId) ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[80%] text-xs ${
                    (currentUserId && msg.senderId === currentUserId)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.senderName}</p>
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 ${
                    (currentUserId && msg.senderId === currentUserId) ? "opacity-50" : "text-muted-foreground/50"
                  }`}>{timeAgo(msg.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Error with retry */}
      {sendError && (
        <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{sendError}</span>
          {lastFailedText && (
            <button
              onClick={() => handleSend(lastFailedText)}
              className="text-primary text-[10px] font-semibold hover:underline"
            >
              Ponów
            </button>
          )}
        </div>
      )}

      <div className="p-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Napisz wiadomość…"
          disabled={sending}
          className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!text.trim() || sending}
          className="p-2 rounded-xl btn-gradient text-primary-foreground disabled:opacity-40 flex items-center justify-center"
          data-testid="chat-send"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
    </LocalErrorBoundary>
  );
};

export default ChatPanel;
