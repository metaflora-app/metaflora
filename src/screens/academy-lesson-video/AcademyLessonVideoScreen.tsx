import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { getAcademyLessonById, getAcademyVideos, getDemoLessonById, getDemoVideos } from '../../utils/contentApi';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { AboutVideoPlayer } from '../../components/AboutVideoPlayer';
import { AboutAcademyVidstackPlayer } from '../../components/AboutAcademyVidstackPlayer';
import type { AcademyLesson, AcademyVideo } from '../../types/content';
import { getTelegramUserId } from '../../utils/labaApi';
import { markLessonVideoWatched, markVideoViewed } from '../../utils/userProgress';

import materialsButton from '../../assets/about-screens/большая кнопка получить материалы.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';

function getVideoPositionKey(lessonType: string, lessonId: string) {
  return `${lessonType}_video_position_${lessonId}`;
}

export const AcademyLessonVideoScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lessonType = searchParams.get('type') || 'academy';
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const homeRoute = lessonType === 'demo' ? '/main-dashboard-free' : '/main-dashboard-premium';
  const userId = React.useMemo(() => (
    lessonType === 'academy' ? getTelegramUserId() : null
  ), [lessonType]);

  // Кэшируем данные урока и видео (отдельно для academy и demo)
  const [lesson, setLesson] = useState<AcademyLesson | null>(() => {
    const cached = lessonId ? sessionStorage.getItem(`${lessonType}_lesson_${lessonId}`) : null;
    return cached ? JSON.parse(cached) : null;
  });
  const [video, setVideo] = useState<AcademyVideo | null>(() => {
    const cached = lessonId ? sessionStorage.getItem(`${lessonType}_video_${lessonId}`) : null;
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  const [playerActivated, setPlayerActivated] = useState(false);
  const canUseCustomPlayer = Boolean(video?.video_url);
  const canRenderAnyPlayer = Boolean(video?.video_url || video?.video_id);


  useEffect(() => {
    if (lessonId) {
      const cachedLesson = sessionStorage.getItem(`${lessonType}_lesson_${lessonId}`);
      const cachedVideo = sessionStorage.getItem(`${lessonType}_video_${lessonId}`);
      setLesson(cachedLesson ? JSON.parse(cachedLesson) : null);
      setVideo(cachedVideo ? JSON.parse(cachedVideo) : null);
      setPlayerActivated(false);
      loadLesson(lessonId);
    } else {
      setLoading(false);
    }
  }, [lessonId, lessonType]);

  const loadLesson = async (id: string) => {
    setLoading(true);
    try {
      const result = lessonType === 'demo' 
        ? await getDemoLessonById(id)
        : await getAcademyLessonById(id);
      if (!result.error && result.data) {
        setLesson(result.data);
        // Сохраняем в кэш (отдельно для academy и demo)
        sessionStorage.setItem(`${lessonType}_lesson_${id}`, JSON.stringify(result.data));
      }
      
      // Загрузить видео
      const videoResult = lessonType === 'demo'
        ? await getDemoVideos(id)
        : await getAcademyVideos(id);
      
      console.log('📹 Video API response:', videoResult);
      
      if (!videoResult.error && videoResult.data && videoResult.data.length > 0) {
        console.log('📹 First video:', videoResult.data[0]);
        console.log('📹 video_id:', videoResult.data[0].video_id);
        setVideo(videoResult.data[0]);
        // Сохраняем в кэш (отдельно для academy и demo)
        sessionStorage.setItem(`${lessonType}_video_${id}`, JSON.stringify(videoResult.data[0]));
      } else {
        console.log('❌ No video found for lesson:', id);
        setVideo(null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setVideo(null);
    } finally {
      setLoading(false);
    }
  };

  const persistVideoPosition = React.useCallback((seconds: number) => {
    if (!lessonId) return;
    sessionStorage.setItem(getVideoPositionKey(lessonType, lessonId), String(seconds));
  }, [lessonId, lessonType]);

  const initialTime = React.useMemo(() => {
    if (!lessonId) return 0;
    return Number(sessionStorage.getItem(getVideoPositionKey(lessonType, lessonId)) || '0');
  }, [lessonId, lessonType]);

  const handlePlaybackStart = React.useCallback(() => {
    if (!userId || !lessonId) return;
    void markVideoViewed(userId, lessonId);
  }, [lessonId, userId]);

  const handleWatchThreshold = React.useCallback(() => {
    if (!userId || !lessonId) return;
    void markLessonVideoWatched(userId, lessonId).then((result) => {
      if (result.justCompleted) {
        showPopupMessage('урок завершен на 100%');
      }
    });
  }, [lessonId, userId]);

  const handleExpand = React.useCallback(() => {
    if (!lessonId) return;

    const fullscreenParams = new URLSearchParams({
      lesson: lessonId,
      type: lessonType,
      title: lesson?.video_title || lesson?.title || '',
      poster: video?.poster_url || lesson?.cover_image_url || '',
    });

    navigate(`/academy-lesson-video-fullscreen?${fullscreenParams.toString()}`);
  }, [lesson?.cover_image_url, lesson?.title, lesson?.video_title, lessonId, lessonType, navigate, video?.poster_url]);

  const handleActivatePlayer = React.useCallback(() => {
    if (!canRenderAnyPlayer) return;
    setPlayerActivated(true);
  }, [canRenderAnyPlayer]);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate(homeRoute)} />

        <div style={{ position: 'absolute', left: '94px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            {lesson?.video_title || lesson?.title || ''}
          </p>
        </div>

        {loading ? null : canUseCustomPlayer && video ? (
          <AboutAcademyVidstackPlayer
            src={video.video_url as string}
            title={lesson?.video_title || lesson?.title || video.title}
            initialTime={initialTime}
            onExpand={handleExpand}
            onPlaybackStart={handlePlaybackStart}
            onWatchThreshold={handleWatchThreshold}
            onTimeChange={persistVideoPosition}
          />
        ) : (
          <div style={{ position: 'absolute', left: '142px', top: '401px', width: '894px', height: '1457px' }}>
            {video?.video_id ? (
            <AboutVideoPlayer
              videoId={video.video_id}
              autoPlay={playerActivated}
              hidePlayButton={playerActivated}
              onPlaybackStart={handlePlaybackStart}
              onWatchThreshold={handleWatchThreshold}
              style={{ left: '0px', top: '0px', width: '894px', height: '1457px', borderRadius: '40px' }}
            />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '40px',
                  overflow: 'hidden',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    color: 'white',
                    fontSize: '32px',
                    fontFamily: 'Cygre',
                    textAlign: 'center',
                  }}
                >
                  Видео не найдено
                </div>
              </div>
            )}

            {!playerActivated && canRenderAnyPlayer ? (
              <button
                type="button"
                onClick={handleActivatePlayer}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backdropFilter: 'blur(50px)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '4px solid rgba(255,255,255,0.3)',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              />
            ) : null}

            <button
              type="button"
              onClick={handleExpand}
              style={{
                position: 'absolute',
                left: '31.43%',
                right: '31.43%',
                top: '91.15%',
                bottom: '3.43%',
                width: '37.14%',
                height: '5.42%',
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                pointerEvents: canRenderAnyPlayer ? 'auto' : 'none',
                opacity: canRenderAnyPlayer ? 1 : 0.5,
                zIndex: 5,
              }}
            >
              <img
                src={expandPlashka}
                alt="развернуть видео"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            </button>
          </div>
        )}

        <button
          onClick={() => navigate(`/academy-lesson-materials?lesson=${lessonId}&type=${lessonType}`)}
          className="motion-press-grow"
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1902px',
            transform: 'translateX(-50%)',
            width: '894px',
            height: '139px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <img
            src={materialsButton}
            alt="получить материалы"
            className="button-inner-glow"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />
        </button>
        <Footer />
      </div>
    </div>
  );
};
