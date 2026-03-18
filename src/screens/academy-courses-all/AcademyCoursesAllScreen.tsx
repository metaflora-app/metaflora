import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { getAcademyCourses, getAcademyLessons } from '../../utils/contentApi';
import { getTelegramUserId } from '../../utils/labaApi';
import { getCompletedLessons } from '../../utils/userProgress';

import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import systemBg from '../../assets/academy-redesign/фон система.png';
import promptingBg from '../../assets/academy-redesign/фон промптинг.png';
import artBg from '../../assets/academy-redesign/фон искусство.png';
import automationBg from '../../assets/academy-redesign/фон автоматизация.png';

interface CourseCardConfig {
  key: string;
  route: string;
  bg: string;
  top: number;
  height: number;
  bgInset: string;
  textInset: string;
  buttonTop: number;
  buttonLeft: number;
  progressTop: number;
  progressLeft: number;
  description: string;
}

const courseCards: CourseCardConfig[] = [
  {
    key: 'система',
    route: '/academy-course-system',
    bg: systemBg,
    top: 426,
    height: 249,
    bgInset: '0 49.78% 0 0',
    textInset: '0 0 0 50.22%',
    buttonTop: 91,
    buttonLeft: 96,
    progressTop: 20,
    progressLeft: 25,
    description: 'введение в простейшую автоматизацию, создание LLM-агента с нуля и тонкая настройка реалистичного ИИ-аватара в HeyGen',
  },
  {
    key: 'промптинг',
    route: '/academy-course-prompting',
    bg: promptingBg,
    top: 704,
    height: 250,
    bgInset: '0.4% 49.78% 0 0',
    textInset: '0.4% 0 0 50.22%',
    buttonTop: 86,
    buttonLeft: 96,
    progressTop: 21,
    progressLeft: 25,
    description: 'самый подробный курс по промпт-инжинирингу: zero-shot, one-shot и few-shot техники, работа с markdown и JSON-форматами, структурирование ответов моделей',
  },
  {
    key: 'искусство',
    route: '/academy-course-art',
    bg: artBg,
    top: 984,
    height: 249,
    bgInset: '0 49.66% 0 0.11%',
    textInset: '0 0 0 50.32%',
    buttonTop: 85,
    buttonLeft: 96,
    progressTop: 20,
    progressLeft: 25,
    description: 'разбор лучших ИИ-моделей для генерации изображений и видео, создание 360 character sheet step-by-step и приёмы создания cinematic / продуктовых шотов',
  },
  {
    key: 'автоматизация',
    route: '/academy-course-automation',
    bg: automationBg,
    top: 1264,
    height: 249,
    bgInset: '0 49.89% 0 -0.11%',
    textInset: '0 0 0 49.97%',
    buttonTop: 85,
    buttonLeft: 98,
    progressTop: 20,
    progressLeft: 25,
    description: 'все возможности ИИ-автоматизации на текущий момент: работа с n8n, воркфлоу под бизнес-задачи и вайбкодинг от идеи до готового MVP',
  },
];

const getCourseProgressColor = (value: number): string => {
  if (value > 80) {
    return '#47D16C';
  }

  if (value >= 40) {
    return '#F3D04F';
  }

  return '#FF5B5B';
};

export const AcademyCoursesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [totalLessons, setTotalLessons] = React.useState(0);
  const [completedLessons, setCompletedLessons] = React.useState(0);
  const [courseProgress, setCourseProgress] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const calculateProgress = async () => {
      try {
        const userId = getTelegramUserId();
        if (!userId) return;

        const completedIds = await getCompletedLessons(userId);
        const results = await Promise.all(
          ['искусство', 'промптинг', 'система', 'автоматизация'].map(async (courseType) => {
            const courseResult = await getAcademyCourses({ courseType, isActive: true });
            const courseId = courseResult.data?.[0]?.id;
            if (!courseId) {
              return { courseType, lessonsCount: 0, completedInCourse: 0, percentage: 0 };
            }

            const lessonsResult = await getAcademyLessons(courseId, { isActive: true });
            const lessons = lessonsResult.data || [];
            const completedInCourse = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
            const percentage = lessons.length > 0 ? Math.round((completedInCourse / lessons.length) * 100) : 0;

            return { courseType, lessonsCount: lessons.length, completedInCourse, percentage };
          })
        );

        const nextProgress: Record<string, number> = {};
        let nextTotal = 0;
        let nextCompleted = 0;
        for (const result of results) {
          nextProgress[result.courseType] = result.percentage;
          nextTotal += result.lessonsCount;
          nextCompleted += result.completedInCourse;
        }

        setCourseProgress(nextProgress);
        setTotalLessons(nextTotal);
        setCompletedLessons(nextCompleted);
      } catch (error) {
        console.error('Error calculating academy progress:', error);
      }
    };

    calculateProgress();
  }, []);

  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            библиотека курсов
          </p>
        </div>

        <div style={{ position: 'absolute', left: '94px', top: '291px', width: '792px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            пройдено {percentage}% курсов академии. Сongratulations!
          </p>
        </div>

        <img src={peopleLogo} alt="" style={{ position: 'absolute', left: '141px', top: '741px', width: '895px', height: '967px', objectFit: 'contain', pointerEvents: 'none' }} />

        {courseCards.map((card) => {
          const progressValue = courseProgress[card.key] ?? 0;
          const progressColor = getCourseProgressColor(progressValue);
          return (
            <div key={card.key} style={{ position: 'absolute', left: '141px', top: `${card.top}px`, width: '894px', height: `${card.height}px` }}>
              <div style={{ position: 'absolute', inset: card.bgInset, borderRadius: '26px', overflow: 'hidden' }}>
                <img src={card.bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
              </div>

              <div style={{ position: 'absolute', inset: card.textInset, backdropFilter: 'blur(50px)', background: 'black', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: '28px', right: '28px', top: '32px', bottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
                  {card.description}
                </div>
              </div>

              <div style={{ position: 'absolute', left: `${card.progressLeft}px`, top: `${card.progressTop}px`, width: '38px', height: '20px', padding: '2px', background: '#111723', borderRadius: '999px', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '999px', background: progressColor }} />
              </div>

              <button
                type="button"
                onClick={() => navigate(card.route)}
                className="button-inner-glow"
                style={{
                  position: 'absolute',
                  left: `${card.buttonLeft}px`,
                  top: `${card.buttonTop}px`,
                  width: '247px',
                  height: '79px',
                  border: '4px solid rgba(255,255,255,0.3)',
                  borderRadius: '62px',
                  background: 'rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(50px)',
                  color: 'white',
                  fontFamily: 'Cygre',
                  fontWeight: 700,
                  fontSize: '27px',
                  lineHeight: '1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                изучить
              </button>
            </div>
          );
        })}

        <Footer />
      </div>
    </div>
  );
};
