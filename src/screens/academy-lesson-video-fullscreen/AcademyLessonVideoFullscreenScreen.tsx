import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAcademyVideos, getDemoVideos } from '../../utils/contentApi';
import type { AcademyVideo } from '../../types/content';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';
import { getTelegramUserId } from '../../utils/labaApi';
import { markLessonVideoWatched, markVideoViewed } from '../../utils/userProgress';
import lessonPoster from '../../assets/shared-redesign/обложка урока.png';

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
  const [video, setVideo] = React.useState<AcademyVideo | null>(() => {
    const cached = lessonId ? sessionStorage.getItem(`${lessonType}_video_${lessonId}`) : null;
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = React.useState(true);

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
    if (!lessonId) {
      setLoading(false);
      return;
    }

    const loadVideo = async () => {
      setLoading(true);
      try {
        const result = lessonType === 'demo'
          ? await getDemoVideos(lessonId)
          : await getAcademyVideos(lessonId);

        if (!result.error && result.data?.length) {
          setVideo(result.data[0]);
          sessionStorage.setItem(`${lessonType}_video_${lessonId}`, JSON.stringify(result.data[0]));
        } else {
          setVideo(null);
        }
      } catch (error) {
        console.error('Error loading fullscreen video:', error);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };

    void loadVideo();
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
        height: '100dvh',
        minHeight: '100dvh',
        background: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          zIndex: 5,
          borderRadius: '62px',
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(0,0,0,0.45)',
          color: 'white',
          fontFamily: 'Cygre',
          fontSize: '18px',
          padding: '10px 18px',
          cursor: 'pointer',
        }}
      >
        назад
      </button>

      <div
        style={{
          width: '100vw',
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {loading ? null : video?.video_url ? (
          <AboutAcademyVidstackPlayer
            src={video.video_url as string}
            title={video.title || title}
            posterSrc={video.poster_url || poster || lessonPoster}
            controlsVariant="full"
            initialTime={restorePosition}
            onPlaybackStart={handlePlaybackStart}
            onWatchThreshold={handleWatchThreshold}
            onTimeChange={persistPosition}
            style={{
              position: 'relative',
              left: 0,
              top: 0,
              width: 'min(100vw, calc(100dvh * 894 / 1457))',
              height: 'min(100dvh, calc(100vw * 1457 / 894))',
              maxWidth: '100vw',
              maxHeight: '100dvh',
              borderRadius: 0,
            }}
          />
        ) : loading ? null : (
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
