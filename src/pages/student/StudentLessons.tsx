import { useState } from 'react';
import { Calendar, Clock, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LessonCard } from '@/components/student/LessonCard';
import { mockStudentLessons } from '@/data/mockStudentData';
import { toast } from 'sonner';

export default function StudentLessons() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingLessons = mockStudentLessons.filter((l) => l.status === 'confirmed');
  const pendingLessons = mockStudentLessons.filter((l) => l.status === 'pending');
  const historyLessons = mockStudentLessons.filter((l) => l.status === 'completed');

  const handleCancel = () => {
    toast.error('Aula cancelada com sucesso');
  };

  const handleChat = () => {
    toast.info('Abrindo chat com o instrutor...');
  };

  const handleDetails = () => {
    toast.info('Abrindo detalhes da aula...');
  };

  const handleReview = () => {
    toast.info('Abrindo formulário de avaliação...');
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Minhas Aulas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas aulas agendadas e veja seu histórico
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Próximas</span>
            {upcomingLessons.length > 0 && (
              <Badge className="ml-1 bg-green-500 text-white hover:bg-green-500">
                {upcomingLessons.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Aguardando</span>
            {pendingLessons.length > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white hover:bg-orange-500">
                {pendingLessons.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma aula agendada</h3>
              <p className="text-muted-foreground mt-1">
                Busque um instrutor e agende sua primeira aula!
              </p>
            </div>
          ) : (
            upcomingLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onCancel={handleCancel}
                onChat={handleChat}
                onDetails={handleDetails}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma solicitação pendente</h3>
              <p className="text-muted-foreground mt-1">
                Todas as suas solicitações foram respondidas!
              </p>
            </div>
          ) : (
            pendingLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onCancel={handleCancel}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma aula realizada</h3>
              <p className="text-muted-foreground mt-1">
                Seu histórico de aulas aparecerá aqui
              </p>
            </div>
          ) : (
            historyLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onReview={handleReview}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
