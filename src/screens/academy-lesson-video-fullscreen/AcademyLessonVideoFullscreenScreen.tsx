import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAcademyVideos, getDemoVideos } from '../../utils/contentApi';
import type { AcademyVideo } from '../../types/content';
import { TelegramAcademyPlayer } from '../../components/TelegramAcademyPlayer';
import { getTelegramUserId } from '../../utils/labaApi';
import { markLessonVideoWatched, markVideoViewed } from '../../utils/userProgress';

function getVideoPositionKey(lessonType: string, lessonId: string) {
  return `${lessonType}_video_position_${lessonId}`;
}

export const AcademyLessonVideoFullscreenScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lessonType = searchParams.get('type') || 'academy';
  const title = searchParams.get('title') || '';
  const poster = searchParams.get('poster') || '';
  const [video, setVideo] = React.useState<AcademyVideo | null>(null);

  const userId = React.useMemo(() => (
    lessonType === 'academy' ? getTelegramUserId() : null
  ), [lessonType]);

  const persistPosition = React.useCallback((seconds: number) => {
    if (!lessonId) return;
    sessionStorage.setItem(getVideoPositionKey(lessonType, lessonId), String(seconds));
  }, [lessonId, lessonType]);

  const restorePosition = React.useMemo(() => {
    if (!lessonId) return 0;
    return Number(sessionStorage.getItem(getVideoPositionKey(lessonType, lessonId)) || '0');
  }, [lessonId, lessonType]);

  React.useEffect(() => {
    if (!lessonId) return;

    const loadVideo = async () => {
      try {
        const result = lessonType === 'demo'
          ? await getDemoVideos(lessonId)
          : await getAcademyVideos(lessonId);

        if (!result.error && result.data?.length) {
          setVideo(result.data[0]);
        }
      } catch (error) {
        console.error('Error loading fullscreen video:', error);
      }
    };

    loadVideo();
  }, [lessonId, lessonType]);

  const handlePlaybackStart = React.useCallback(() => {
    if (!userId || !lessonId) return;
    void markVideoViewed(userId, lessonId);
  }, [lessonId, userId]);

  const handleWatchThreshold = React.useCallback(() => {
    if (!userId || !lessonId) return;
    void markLessonVideoWatched(userId, lessonId);
  }, [lessonId, userId]);

  if (!lessonId) {
    return null;
  }

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#020101',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 5,
          borderRadius: '62px',
          border: '2px solid rgba(255,255,255,0.35)',
          background: 'rgba(255,255,255,0.1)',
          color: 'white',
          fontFamily: 'Cygre',
          fontSize: '22px',
          padding: '14px 24px',
          cursor: 'pointer',
        }}
      >
        назад
      </button>

      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '90px 24px 24px',
        }}
      >
        {video?.video_url ? (
          <TelegramAcademyPlayer
            src={video.video_url}
            posterSrc={video.poster_url || poster || undefined}
            title={video.title || title}
            initialTime={restorePosition}
            autoPlay
            borderRadius={24}
            onPlaybackStart={handlePlaybackStart}
            onWatchThreshold={handleWatchThreshold}
            onTimeChange={persistPosition}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        ) : (
          <div
            style={{
              color: 'white',
              fontFamily: 'Cygre',
              fontSize: '28px',
            }}
          >
            Видео не найдено
          </div>
        )}
      </div>
    </div>
  );
};
