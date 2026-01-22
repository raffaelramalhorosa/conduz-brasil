import { useState, useEffect, useRef } from 'react';
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
  ChatHeaderSkeleton 
} from '@/components/chat/ChatSkeleton';

interface ConversationWithDetails {
  id: string;
  student_id: string;
  instructor_id: string;
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
  last_message?: {
    message: string;
    created_at: string;
    sender_id: string;
  };
}

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useChatByConversation(
    selectedConversation?.id || null
  );
  const { unreadCounts } = useAllUnreadCounts();

  // Fetch instructor's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        // First get the instructor profile
        const { data: instructorProfile } = await supabase
          .from('instructor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!instructorProfile) {
          setLoading(false);
          return;
        }

        // Fetch conversations for this instructor
        const { data: convos, error } = await supabase
          .from('conversations')
          .select(`
            id,
            student_id,
            instructor_id,
            created_at,
            updated_at
          `)
          .eq('instructor_id', instructorProfile.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // For each conversation, get student details and last message
        const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
          (convos || []).map(async (conv) => {
            // Get student profile
            const { data: studentProfile } = await supabase
              .from('student_profiles')
              .select('id, user_id')
              .eq('id', conv.student_id)
              .single();

            // Get student user details
            let studentUser = null;
            if (studentProfile) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', studentProfile.user_id)
                .single();
              studentUser = userData;
            }

            // Get last message
            const { data: lastMsgData } = await supabase
              .from('chat_messages')
              .select('message, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              student_profile: studentProfile || undefined,
              student_user: studentUser || undefined,
              last_message: lastMsgData || undefined,
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

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  const handleSelectConversation = (conv: ConversationWithDetails) => {
    if (conv.id === selectedConversation?.id) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedConversation(conv);
      setIsTransitioning(false);
    }, 150);
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
      <div className="h-[calc(100vh-120px)] flex">
        <div className="w-full md:w-[350px] border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse mb-4" />
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <ConversationListSkeleton variant="dark" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Conversations List */}
      <div
        className={cn(
          'w-full md:w-[350px] border-r border-white/10 flex flex-col',
          selectedConversation && 'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Mensagens
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredConversations.map((conv) => {
                const unreadCount = unreadCounts[conv.id] || 0;
                const isSelected = selectedConversation?.id === conv.id;
                
                return (
                  <motion.button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 transition-colors text-left',
                      isSelected && 'bg-white/10'
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
                        <span className="font-medium text-white truncate">
                          {conv.student_user?.full_name || 'Aluno'}
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

      {/* Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col',
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
              className="flex-1 flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-lg"
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
                  <h2 className="font-medium text-white">
                    {selectedConversation.student_user?.full_name || 'Aluno'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Aluno</p>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4"
              >
                {messagesLoading || isTransitioning ? (
                  <ChatMessagesSkeleton variant="dark" />
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                            'flex',
                            isOwn ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] px-4 py-2 rounded-2xl',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-white/10 text-white rounded-bl-md'
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
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 bg-white/5 border-white/10"
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
