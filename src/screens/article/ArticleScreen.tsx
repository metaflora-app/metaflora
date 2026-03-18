import React from 'react';
import { useParams } from 'react-router-dom';
import { getPolygonArticleById } from '../../utils/contentApi';
import type { PolygonArticle } from '../../types/content';
import { MaterialsContentScreen } from '../../components/MaterialsContentScreen';

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

export const ArticleScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = React.useState<PolygonArticle | null>(null);

  React.useEffect(() => {
    if (!id) return;

    const run = async () => {
      try {
        const result = await getPolygonArticleById(id);
        if (!result.error && result.data) {
          setArticle(result.data);
        }
      } catch (error) {
        console.error('Error loading article:', error);
      }
    };

    run();
  }, [id]);

  const contentBlocks = article?.content_blocks?.length
    ? article.content_blocks
    : [
        article?.content_text
          ? { id: 'legacy-text', type: 'text', content: article.content_text }
          : null,
        article?.prompt_text
          ? { id: 'legacy-prompt', type: 'prompt', content: article.prompt_text }
          : null,
      ].filter(Boolean) as Array<{ id: string; type: string; content: any }>;

  const materialsBlock = article?.content_blocks?.find((block: any) => block.type === 'materials');
  const materials = parseMaterials(materialsBlock?.content);

  const handleSendMaterials = async () => {
    try {
      if (!materials.length) {
        alert('В этой статье нет материалов');
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
          lessonTitle: article?.title || 'Статья',
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
      console.error('Error sending article materials:', error);
      alert(`Критическая ошибка: ${error.message || error}`);
    }
  };

  return (
    <MaterialsContentScreen
      homeRoute="/main-dashboard-premium"
      heading="материалы статьи"
      subtitleLines={['помимо текста, из статьи всегда можно получить промпты и файлы']}
      contentTitle={article?.title || ''}
      contentBlocks={contentBlocks}
      downloadCount={materials.length}
      onSendMaterials={handleSendMaterials}
    />
  );
};
