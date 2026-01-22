import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, MessageCircle, Search, ArrowLeft, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatByConversation } from '@/hooks/useChatByConversation';
import { useAllUnreadCounts } from '@/hooks/useAllUnreadCounts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

export default function StudentMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sending, sendMessage, markAsRead } = useChatByConversation(
    selectedConversation?.id || null
  );
  const { unreadCounts } = useAllUnreadCounts();

  // Load conversations for the student
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.id) return;

      try {
        // Get student profile first
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!studentProfile) {
          setLoading(false);
          return;
        }

        // Get all conversations for this student
        const { data: convos, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('student_id', studentProfile.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // For each conversation, get instructor details and last message
        const conversationsWithDetails = await Promise.all(
          (convos || []).map(async (conv) => {
            // Get instructor profile
            const { data: instructorProfile } = await supabase
              .from('instructor_profiles')
              .select('id, user_id, is_online')
              .eq('id', conv.instructor_id)
              .single();

            // Get instructor user info
            let instructorUser = null;
            if (instructorProfile) {
              const { data: userInfo } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', instructorProfile.user_id)
                .single();
              instructorUser = userInfo;
            }

            // Get last message
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setSelectedConversation(conv);
    setMobileShowChat(true);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Chat area skeleton */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations List - Hidden on mobile when chat is open */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col',
          mobileShowChat && 'hidden md:flex'
        )}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-border">
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

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-muted/50',
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
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-muted/30',
          !mobileShowChat && 'hidden md:flex'
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card flex items-center gap-3">
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma mensagem ainda
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Envie a primeira mensagem!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
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
                                    isMine
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {formatFullTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={sending}
                  className="flex-1 bg-muted/50 border-border"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Selecione uma conversa
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Escolha um instrutor na lista ao lado para ver o histórico de mensagens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
