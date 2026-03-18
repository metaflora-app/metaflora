import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { getAcademyCourses, getAcademyLessons } from '../../utils/contentApi';
import { getCompletedLessons } from '../../utils/userProgress';
import { getTelegramUserId } from '../../utils/labaApi';

import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import studyButton from '../../assets/about-screens/кнопка изучить.png';
import systemBg from '../../assets/academy-redesign/фон система.png';
import promptingBg from '../../assets/academy-redesign/фон промптинг.png';
import artBg from '../../assets/academy-redesign/фон искусство.png';
import automationBg from '../../assets/academy-redesign/фон автоматизация.png';
import progressActive from '../../assets/academy-redesign/прогресс-бар.png';
import progressPassive from '../../assets/academy-redesign/прогресс-бар пассив.png';

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

export const AcademyCoursesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [totalLessons, setTotalLessons] = React.useState(0);
  const [completedLessons, setCompletedLessons] = React.useState(0);
  const [courseStatuses, setCourseStatuses] = React.useState<Record<string, 'not_started' | 'in_progress' | 'completed'>>({});

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
            if (!courseId) return null;
            const lessonsResult = await getAcademyLessons(courseId, { isActive: true });
            const lessons = lessonsResult.data || [];
            const completedInCourse = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
            const status: 'not_started' | 'in_progress' | 'completed' = completedInCourse === 0
              ? 'not_started'
              : completedInCourse === lessons.length
                ? 'completed'
                : 'in_progress';
            return { courseType, lessonsCount: lessons.length, status };
          })
        );

        const nextStatuses: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
        let nextTotal = 0;
        for (const result of results) {
          if (!result) continue;
          nextStatuses[result.courseType] = result.status;
          nextTotal += result.lessonsCount;
        }

        setCourseStatuses(nextStatuses);
        setTotalLessons(nextTotal);
        setCompletedLessons(completedIds.length);
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
          const progressSrc = courseStatuses[card.key] === 'not_started' ? progressPassive : progressActive;
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

              <img src={progressSrc} alt="прогресс" style={{ position: 'absolute', left: `${card.progressLeft}px`, top: `${card.progressTop}px`, width: '38px', height: '20px', objectFit: 'contain' }} />

              <img
                src={studyButton}
                alt="изучить"
                onClick={() => navigate(card.route)}
                className="button-inner-glow"
                style={{ position: 'absolute', left: `${card.buttonLeft}px`, top: `${card.buttonTop}px`, width: '247px', height: '79px', cursor: 'pointer' }}
              />
            </div>
          );
        })}

        <Footer />
      </div>
    </div>
  );
};
