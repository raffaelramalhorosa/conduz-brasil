import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChatByConversation } from '@/hooks/useChatByConversation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
}

interface ConversationChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  otherParticipant: ChatParticipant | null;
  /** Optional context shown as header (e.g., "Agendamento de 23/01") */
  contextLabel?: string;
  /** Optional booking ID for context linking */
  bookingContext?: string;
}

export function ConversationChatModal({
  open,
  onOpenChange,
  conversationId,
  otherParticipant,
  contextLabel,
  bookingContext,
}: ConversationChatModalProps) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAsRead } = useChatByConversation(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when modal opens
  useEffect(() => {
    if (open && conversationId) {
      markAsRead();
    }
  }, [open, conversationId, markAsRead]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    const success = await sendMessage(newMessage, bookingContext);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupMessagesByDate = () => {
    const groups: { [date: string]: typeof messages } = {};
    
    messages.forEach((msg) => {
      const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoje';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ontem';
    }
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const messageGroups = groupMessagesByDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {otherParticipant?.name ? getInitials(otherParticipant.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold truncate">
                {otherParticipant?.name || 'Chat'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">Histórico completo da conversa</p>
            </div>
          </div>
        </DialogHeader>

        {/* Context Header (optional) */}
        {contextLabel && (
          <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Falando sobre:</span>
              <Badge variant="secondary" className="font-normal">
                {contextLabel}
              </Badge>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="text-muted-foreground text-sm">Carregando mensagens...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhuma mensagem ainda
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Envie a primeira mensagem para iniciar a conversa
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateHeader(date)}
                    </span>
                  </div>
                  
                  {/* Messages for this date */}
                  <div className="space-y-2">
                    {msgs.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            isMine ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2',
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                            <p
                              className={cn(
                                'text-[10px] mt-1',
                                isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}
                            >
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="px-4 py-3 border-t shrink-0">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
              style={{ caretColor: 'hsl(var(--primary))' }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
