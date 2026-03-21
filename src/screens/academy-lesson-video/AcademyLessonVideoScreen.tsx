import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAcademyLessonById, getAcademyVideos, getDemoLessonById, getDemoVideos } from '../../utils/contentApi';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { AboutVideoPlayer } from '../../components/AboutVideoPlayer';
import type { AcademyLesson, AcademyVideo } from '../../types/content';

import materialsButton from '../../assets/about-screens/кнопка получить материалы.png';
import expandPlashka from '../../assets/tour-video/плашка развернуть видео.png';

export const AcademyLessonVideoScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lessonType = searchParams.get('type') || 'academy';
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const homeRoute = lessonType === 'demo' ? '/main-dashboard-free' : '/main-dashboard-premium';

  // Кэшируем данные урока и видео (отдельно для academy и demo)
  const [lesson, setLesson] = useState<AcademyLesson | null>(() => {
    const cached = sessionStorage.getItem(`${lessonType}_lesson_${lessonId}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [video, setVideo] = useState<AcademyVideo | null>(() => {
    const cached = sessionStorage.getItem(`${lessonType}_video_${lessonId}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [, setLoading] = useState(true);


  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
    } else {
      setLoading(false);
    }
  }, [lessonId]);

  const checkLessonCompletion = (id: string) => {
    const progressData = JSON.parse(localStorage.getItem('academy-lessons-progress') || '{}');
    const lessonProgress = progressData[id];
    
    if (lessonProgress?.videoWatched && lessonProgress?.materialsRead) {
      const completed = JSON.parse(localStorage.getItem('academy-lessons-completed') || '[]');
      if (!completed.includes(id)) {
        completed.push(id);
        localStorage.setItem('academy-lessons-completed', JSON.stringify(completed));
      }
    }
  };

  // Отмечаем видео как просмотренное при загрузке Kinescope
  useEffect(() => {
    if (video?.video_id && lessonId && lessonType === 'academy') {
      // Даем время на просмотр (5 секунд), потом отмечаем
      const timer = setTimeout(() => {
        const progressData = JSON.parse(localStorage.getItem('academy-lessons-progress') || '{}');
        if (!progressData[lessonId]) progressData[lessonId] = {};
        progressData[lessonId].videoWatched = true;
        localStorage.setItem('academy-lessons-progress', JSON.stringify(progressData));
        checkLessonCompletion(lessonId);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [video, lessonId, lessonType]);


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
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

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

        <div style={{ position: 'absolute', left: '142px', top: '401px', width: '894px', height: '1457px' }}>
          {video?.video_id ? (
            <AboutVideoPlayer
              videoId={video.video_id}
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

          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(50px)',
              background: 'rgba(255,255,255,0.1)',
              border: '4px solid rgba(255,255,255,0.3)',
              borderRadius: '30px',
              pointerEvents: 'none',
            }}
          />

          <img
            src={expandPlashka}
            alt="развернуть видео"
            style={{
              position: 'absolute',
              left: '31.43%',
              right: '31.43%',
              top: '91.15%',
              bottom: '3.43%',
              width: '37.14%',
              height: '5.42%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        </div>

        <button
          onClick={() => navigate(`/academy-lesson-materials?lesson=${lessonId}&type=${lessonType}`)}
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
            alt=""
            className="button-inner-glow"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />

          <div style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'Cygre',
            fontWeight: 700,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
            transform: 'translateY(-4px)',
          }}>
            получить материалы
          </div>
        </button>
        <Footer />
      </div>
    </div>
  );
};
