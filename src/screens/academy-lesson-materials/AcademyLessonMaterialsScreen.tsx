import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAcademyLessonById, getDemoLessonById } from '../../utils/contentApi';
import type { AcademyLesson } from '../../types/content';
import { MaterialsContentScreen } from '../../components/MaterialsContentScreen';
import { getTelegramUserId } from '../../utils/labaApi';
import { markLessonMaterialsRead } from '../../utils/userProgress';

const parseMaterials = (content: any): Array<{ name: string; url: string }> => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const AcademyLessonMaterialsScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lessonType = searchParams.get('type') || 'academy';
  const [lesson, setLesson] = React.useState<AcademyLesson | null>(null);
  const hasMarkedMaterialsReadRef = React.useRef(false);

  React.useEffect(() => {
    if (!lessonId) return;

    const run = async () => {
      try {
        const result = lessonType === 'demo'
          ? await getDemoLessonById(lessonId)
          : await getAcademyLessonById(lessonId);
        if (!result.error && result.data) {
          setLesson(result.data);
        }
      } catch (error) {
        console.error('Error loading lesson materials:', error);
      }
    };

    run();
  }, [lessonId, lessonType]);

  const contentBlocks = lesson?.content_blocks?.length
    ? lesson.content_blocks
    : [
        lesson?.annotation
          ? { id: 'legacy-text', type: 'text', content: lesson.annotation }
          : null,
        lesson?.prompt_text
          ? { id: 'legacy-prompt', type: 'prompt', content: lesson.prompt_text }
          : null,
      ].filter(Boolean) as Array<{ id: string; type: string; content: any }>;

  const materialsBlock = lesson?.content_blocks?.find((block: any) => block.type === 'materials');
  const materials = parseMaterials(materialsBlock?.content);

  const handleContentScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!lessonId || lessonType !== 'academy') return;

    const element = event.currentTarget;
    const hasScroll = element.scrollHeight > element.clientHeight;
    const scrollPercent = ((element.scrollTop + element.clientHeight) / element.scrollHeight) * 100;

    if ((!hasScroll || scrollPercent >= 95) && !hasMarkedMaterialsReadRef.current) {
      const userId = getTelegramUserId();
      if (!userId) return;

      hasMarkedMaterialsReadRef.current = true;
      void markLessonMaterialsRead(userId, lessonId);
    }
  }, [lessonId, lessonType]);

  const handleSendMaterials = async () => {
    try {
      if (!materials.length) {
        alert('В этом уроке нет материалов');
        return;
      }

      const userId = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user?.id;
      if (!userId) {
        alert('Откройте мини-апп через Telegram');
        return;
      }

      const response = await fetch('https://metaflora-service.ru/api/bot/send-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials,
          lessonTitle: lesson?.title || 'Урок',
          userId,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert('материалы отправлены в чат с ботом');
      } else {
        alert(`Ошибка отправки: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error: any) {
      console.error('Error sending lesson materials:', error);
      alert(`Критическая ошибка: ${error.message || error}`);
    }
  };

  return (
    <MaterialsContentScreen
      homeRoute={lessonType === 'demo' ? '/main-dashboard-free' : '/main-dashboard-premium'}
      heading="материалы урока"
      subtitleLines={['уроки можно не только смотреть, но и читать', 'в удобном формате']}
      contentTitle={lesson?.title || ''}
      contentBlocks={contentBlocks}
      downloadCount={materials.length}
      onSendMaterials={handleSendMaterials}
      badgeTheme="academy"
      onContentScroll={handleContentScroll}
    />
  );
};
