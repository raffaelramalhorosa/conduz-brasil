import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Search, ArrowLeft, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChatByConversation } from '@/hooks/useChatByConversation';
import { useAllUnreadCounts } from '@/hooks/useAllUnreadCounts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConversationListSkeleton, 
  ChatMessagesSkeleton,
  ChatHeaderSkeleton,
  ChatInputSkeleton
} from '@/components/chat/ChatSkeleton';

interface ConversationWithDetails {
  id: string;
  student_id: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  instructor_profile?: {
    id: string;
    user_id: string;
    is_online?: boolean;
  };
  instructor_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    message: string;
    created_at: string;
    sender_id: string;
  };
}

// Fixed height for chat container to prevent layout shift
const CHAT_CONTAINER_HEIGHT = 'h-[calc(100dvh-4rem)]';
const MESSAGES_AREA_MIN_HEIGHT = 'min-h-[300px]';

export default function StudentMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  const { messages, loading: messagesLoading, sending, sendMessage, markAsRead } = useChatByConversation(
    selectedConversation?.id || null
  );
  const { unreadCounts } = useAllUnreadCounts();

  // Load conversations for the student
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.id) return;

      try {
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!studentProfile) {
          setLoading(false);
          return;
        }

        const { data: convos, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('student_id', studentProfile.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const conversationsWithDetails = await Promise.all(
          (convos || []).map(async (conv) => {
            const { data: instructorProfile } = await supabase
              .from('instructor_profiles')
              .select('id, user_id, is_online')
              .eq('id', conv.instructor_id)
              .single();

            let instructorUser = null;
            if (instructorProfile) {
              const { data: userInfo } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', instructorProfile.user_id)
                .single();
              instructorUser = userInfo;
            }

            const { data: lastMsg } = await supabase
              .from('chat_messages')
              .select('message, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              instructor_profile: instructorProfile || undefined,
              instructor_user: instructorUser || undefined,
              last_message: lastMsg || undefined,
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id]);

  // Smooth scroll to bottom only when new messages arrive (not on initial load)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      // Instant scroll on initial load, smooth on new messages
      const isNewMessage = messages.length > prevMessagesLength;
      scrollToBottom(isNewMessage && prevMessagesLength > 0 ? 'smooth' : 'instant');
      setPrevMessagesLength(messages.length);
    }
  }, [messages, messagesLoading, prevMessagesLength, scrollToBottom]);

  // Reset prev messages length when conversation changes
  useEffect(() => {
    setPrevMessagesLength(0);
  }, [selectedConversation?.id]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conv: ConversationWithDetails) => {
    if (conv.id === selectedConversation?.id) return;
    setIsTransitioning(true);
    // Small delay to show skeleton before switching
    requestAnimationFrame(() => {
      setSelectedConversation(conv);
      setMobileShowChat(true);
      setTimeout(() => setIsTransitioning(false), 200);
    });
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
    setSelectedConversation(null);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return format(date, 'HH:mm');
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ontem';
    }
    return format(date, 'dd/MM');
  };

  const formatFullTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.instructor_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Loading state - maintains fixed layout
  if (loading) {
    return (
      <div className={cn('flex bg-background overflow-hidden', CHAT_CONTAINER_HEIGHT)}>
        <div className="w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border shrink-0">
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationListSkeleton variant="light" />
          </div>
        </div>
        <div className="hidden md:flex flex-1 flex-col bg-muted/30">
          <ChatHeaderSkeleton variant="light" />
          <div className="flex-1 p-4">
            <ChatMessagesSkeleton variant="light" />
          </div>
          <ChatInputSkeleton variant="light" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex bg-background overflow-hidden', CHAT_CONTAINER_HEIGHT)}>
      {/* Conversations List */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col',
          mobileShowChat && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar instrutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[400px]">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Você ainda não tem conversas
              </h3>
              <p className="text-sm text-muted-foreground">
                Encontre um instrutor para tirar suas dúvidas!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => {
                const unread = unreadCounts[conv.id] || 0;
                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 text-left transition-colors duration-100 hover:bg-muted/50 active:bg-muted',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage
                          src={conv.instructor_user?.avatar_url || ''}
                          alt={conv.instructor_user?.full_name || 'Instrutor'}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.instructor_user?.full_name
                            ? getInitials(conv.instructor_user.full_name)
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.instructor_profile?.is_online && (
                        <Circle className="absolute bottom-0 right-0 h-3.5 w-3.5 fill-green-500 text-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">
                          {conv.instructor_user?.full_name || 'Instrutor'}
                        </span>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatMessageTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.message || 'Nenhuma mensagem'}
                        </p>
                        {unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center text-xs shrink-0">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Fixed height container */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-muted/30 overflow-hidden',
          !mobileShowChat && 'hidden md:flex'
        )}
      >
        <AnimatePresence mode="wait">
          {selectedConversation ? (
            <motion.div
              key={selectedConversation.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Chat Header - Fixed */}
              <div className="p-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage
                      src={selectedConversation.instructor_user?.avatar_url || ''}
                      alt={selectedConversation.instructor_user?.full_name || 'Instrutor'}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedConversation.instructor_user?.full_name
                        ? getInitials(selectedConversation.instructor_user.full_name)
                        : '?'}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.instructor_profile?.is_online && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {selectedConversation.instructor_user?.full_name || 'Instrutor'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.instructor_profile?.is_online
                      ? 'Online'
                      : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Messages Area - Scrollable with fixed height */}
              <div 
                ref={messagesContainerRef}
                className={cn(
                  'flex-1 overflow-y-auto p-4',
                  MESSAGES_AREA_MIN_HEIGHT
                )}
              >
                <AnimatePresence mode="wait">
                  {messagesLoading || isTransitioning ? (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <ChatMessagesSkeleton variant="light" />
                    </motion.div>
                  ) : messages.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Nenhuma mensagem ainda
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Envie a primeira mensagem!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="messages"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {Object.entries(messageGroups).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center justify-center my-4">
                            <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                              {formatDateHeader(date)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {msgs.map((msg, index) => {
                              const isMine = msg.sender_id === user?.id;
                              const isLast = index === msgs.length - 1 && date === Object.keys(messageGroups).pop();
                              
                              return (
                                <motion.div
                                  key={msg.id}
                                  initial={isLast ? { opacity: 0, scale: 0.95, y: 10 } : false}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  className={cn(
                                    'flex items-end gap-2',
                                    isMine ? 'justify-end' : 'justify-start'
                                  )}
                                >
                                  {!isMine && (
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={selectedConversation?.instructor_user?.avatar_url || ''} />
                                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                        {selectedConversation?.instructor_user?.full_name
                                          ? getInitials(selectedConversation.instructor_user.full_name)
                                          : '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div
                                    className={cn(
                                      'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm',
                                      isMine
                                        ? 'bg-primary text-primary-foreground rounded-br-md'
                                        : 'bg-card text-foreground rounded-bl-md border border-border'
                                    )}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {msg.message}
                                    </p>
                                    <p
                                      className={cn(
                                        'text-[10px] mt-1',
                                        isMine
                                          ? 'text-primary-foreground/70'
                                          : 'text-muted-foreground'
                                      )}
                                    >
                                      {formatFullTime(msg.created_at)}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="p-4 border-t border-border bg-card shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={sending}
                    className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                    style={{ caretColor: 'hsl(var(--primary))' }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary hover:bg-primary/90 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escolha um instrutor na lista ao lado para ver o histórico de mensagens
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
