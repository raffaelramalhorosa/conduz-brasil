import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Search, Send, ArrowLeft, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useChatByConversation } from '@/hooks/useChatByConversation';
import { useAllUnreadCounts } from '@/hooks/useAllUnreadCounts';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  driving_school_id?: string | null;
  created_at: string;
  updated_at: string;
  student_profile?: {
    id: string;
    user_id: string;
  };
  student_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  instructor_name?: string;
  last_message?: {
    message: string;
    created_at: string;
    sender_id: string;
  };
}

// Fixed height for chat container to prevent layout shift
const CHAT_CONTAINER_HEIGHT = 'h-[calc(100vh-120px)]';
const MESSAGES_AREA_MIN_HEIGHT = 'min-h-[300px]';

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useChatByConversation(
    selectedConversation?.id || null
  );
  const { unreadCounts } = useAllUnreadCounts();

  // Fetch instructor's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        const { data: instructorProfile } = await supabase
          .from('instructor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!instructorProfile) {
          setLoading(false);
          return;
        }

        // Check if this is a driving school
        const { data: profileData } = await supabase
          .from('instructor_profiles')
          .select('is_driving_school')
          .eq('id', instructorProfile.id)
          .single();

        const isDrivingSchool = profileData?.is_driving_school === true;

        let convosQuery;
        if (isDrivingSchool) {
          convosQuery = supabase
            .from('conversations')
            .select('id, student_id, instructor_id, created_at, updated_at')
            .or(`instructor_id.eq.${instructorProfile.id},driving_school_id.eq.${instructorProfile.id}`)
            .order('updated_at', { ascending: false });
        } else {
          convosQuery = supabase
            .from('conversations')
            .select('id, student_id, instructor_id, created_at, updated_at')
            .eq('instructor_id', instructorProfile.id)
            .order('updated_at', { ascending: false });
        }

        const { data: convos, error } = await convosQuery;

        if (error) throw error;

        const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
          (convos || []).map(async (conv) => {
            const { data: studentProfile } = await supabase
              .from('student_profiles')
              .select('id, user_id')
              .eq('id', conv.student_id)
              .single();

            let studentUser = null;
            if (studentProfile) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', studentProfile.user_id)
                .single();
              studentUser = userData;
            }

            const { data: lastMsgData } = await supabase
              .from('chat_messages')
              .select('message, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Resolve instructor name for affiliated conversations
            let instructorName: string | undefined;
            if (isDrivingSchool && conv.instructor_id !== instructorProfile.id) {
              try {
                const { data: instrProf } = await supabase
                  .from('instructor_profiles')
                  .select('user_id')
                  .eq('id', conv.instructor_id)
                  .maybeSingle();
                if (instrProf?.user_id) {
                  const { data: instrUser } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', instrProf.user_id)
                    .single();
                  instructorName = instrUser?.full_name || undefined;
                }
              } catch (e) {
                console.error('Error resolving instructor name:', e);
              }
            }

            return {
              ...conv,
              student_profile: studentProfile || undefined,
              student_user: studentUser || undefined,
              last_message: lastMsgData || undefined,
              instructor_name: instructorName,
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Smooth scroll to bottom only when new messages arrive
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
      const isNewMessage = messages.length > prevMessagesLength;
      scrollToBottom(isNewMessage && prevMessagesLength > 0 ? 'smooth' : 'instant');
      setPrevMessagesLength(messages.length);
    }
  }, [messages, messagesLoading, prevMessagesLength, scrollToBottom]);

  // Reset prev messages length when conversation changes
  useEffect(() => {
    setPrevMessagesLength(0);
  }, [selectedConversation?.id]);

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  const handleSelectConversation = (conv: ConversationWithDetails) => {
    if (conv.id === selectedConversation?.id) return;
    setIsTransitioning(true);
    requestAnimationFrame(() => {
      setSelectedConversation(conv);
      setTimeout(() => setIsTransitioning(false), 200);
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const formatFullTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
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
    conv.student_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={cn('flex overflow-hidden', CHAT_CONTAINER_HEIGHT)}>
        <div className="w-full md:w-[350px] border-r border-border flex flex-col">
          <div className="p-4 border-b border-border shrink-0">
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationListSkeleton variant="dark" />
          </div>
        </div>
        <div className="hidden md:flex flex-1 flex-col">
          <ChatHeaderSkeleton variant="dark" />
          <div className="flex-1 p-4">
            <ChatMessagesSkeleton variant="dark" />
          </div>
          <ChatInputSkeleton variant="dark" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex overflow-hidden', CHAT_CONTAINER_HEIGHT)}>
      {/* Conversations List */}
      <div
        className={cn(
        'w-full md:w-[350px] border-r border-border flex flex-col',
          selectedConversation && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-border shrink-0">
          <h1 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Mensagens
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground min-h-[400px] flex flex-col items-center justify-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => {
                const unreadCount = unreadCounts[conv.id] || 0;
                const isSelected = selectedConversation?.id === conv.id;
                
                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 transition-colors duration-100 text-left hover:bg-accent/10 active:bg-accent',
                      isSelected && 'bg-accent'
                    )}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={conv.student_user?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {conv.student_user?.full_name
                          ? getInitials(conv.student_user.full_name)
                          : <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">
                          {conv.student_user?.full_name || 'Aluno'}
                        </span>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatMessageTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.instructor_name && (
                        <div className="mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            via {conv.instructor_name}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.message || 'Nenhuma mensagem'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground shrink-0">
                            {unreadCount}
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
          'flex-1 flex flex-col overflow-hidden',
          !selectedConversation && 'hidden md:flex'
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
              <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-accent/10 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.student_user?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedConversation.student_user?.full_name
                      ? getInitials(selectedConversation.student_user.full_name)
                      : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-medium text-foreground">
                    {selectedConversation.student_user?.full_name || 'Aluno'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Aluno</p>
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
                      <ChatMessagesSkeleton variant="dark" />
                    </motion.div>
                  ) : messages.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex items-center justify-center text-muted-foreground"
                    >
                      <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="messages"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        const isNew = index === messages.length - 1;
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={isNew ? { opacity: 0, scale: 0.95, y: 10 } : false}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={cn(
                              'flex items-end gap-2',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {!isOwn && (
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={selectedConversation?.student_user?.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {selectedConversation?.student_user?.full_name
                                    ? getInitials(selectedConversation.student_user.full_name)
                                    : '?'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                'max-w-[70%] px-4 py-2 rounded-2xl shadow-sm',
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              )}
                            >
                              <p className="text-sm break-words">{msg.message}</p>
                              <p
                                className={cn(
                                  'text-[10px] mt-1',
                                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}
                              >
                                {formatFullTime(msg.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input - Fixed at bottom */}
              <div className="p-4 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                    style={{ caretColor: 'var(--school-accent, #FF8C00)' }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
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
              className="h-full flex items-center justify-center text-muted-foreground"
            >
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Selecione uma conversa</p>
                <p className="text-sm mt-1">Escolha um aluno para iniciar o chat</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
