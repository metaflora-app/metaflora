import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveTiltCard } from '../../components/InteractiveTiltCard';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { FigmaStudyButton } from '../../components/FigmaPills';
import { getAcademyCourses, getAcademyLessons } from '../../utils/contentApi';
import { getTelegramUserId } from '../../utils/labaApi';
import { getUserProgress } from '../../utils/userProgress';

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
    description: 'начнем с маленьких\nшагов: введение\nв автоматизацию,\nсоздание LLM-агента\nи настройка аватара\nв HeyGen',
  },
  {
    key: 'промптинг',
    route: '/academy-course-prompting',
    bg: promptingBg,
    top: 705,
    height: 250,
    bgInset: '0.4% 49.78% 0 0',
    textInset: '0.4% 0 0 50.22%',
    buttonTop: 86,
    buttonLeft: 96,
    progressTop: 21,
    progressLeft: 25,
    description: 'самый подробный\nкурс по промптингу\nв СНГ: zero- / one- /\nfew-shot техники,\nработа с markdown\nи JSON-форматами',
  },
  {
    key: 'искусство',
    route: '/academy-course-art',
    bg: artBg,
    top: 985,
    height: 249,
    bgInset: '0 49.66% 0 0.11%',
    textInset: '0 0 0 50.32%',
    buttonTop: 85,
    buttonLeft: 96,
    progressTop: 20,
    progressLeft: 25,
    description: 'ИИ-креатор за 10+\nуроков: разбор ИИ-\nмоделей, создание\n360 character sheet,\nподготовка синематик\nи продуктовых шотов',
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
    description: 'все возможности ИИ-\nавтоматизации: работа\nс n8n, воркфлоу\nпод бизнес-задачи,\nвайбкодинг от идеи\nдо готового MVP',
  },
];

const progressRed = 'https://www.figma.com/api/mcp/asset/174eb4d5-0ccc-4e86-901b-b9885bbf829a';
const progressYellow = 'https://www.figma.com/api/mcp/asset/91645877-df51-48d6-bc07-73a302b5c533';
const progressGreenPassive = 'https://www.figma.com/api/mcp/asset/be7bd6bd-bd40-461d-b164-cbee10db2cf4';
const progressGreenFull = 'https://www.figma.com/api/mcp/asset/a0c21148-1b6e-4852-9ed1-66a7d93155c1';
const ACADEMY_PROGRESS_CACHE_KEY = 'academy_courses_progress_summary_v1';

function getAcademyProgressStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

const readAcademyProgressCache = (): {
  courseProgress: Record<string, number>;
  totalLessons: number;
  completedLessons: number;
} => {
  try {
    const cached = getAcademyProgressStorage()?.getItem(ACADEMY_PROGRESS_CACHE_KEY);
    if (!cached) {
      return {
        courseProgress: {},
        totalLessons: 0,
        completedLessons: 0,
      };
    }

    const parsed = JSON.parse(cached);
    return {
      courseProgress: parsed.courseProgress || {},
      totalLessons: parsed.totalLessons || 0,
      completedLessons: parsed.completedLessons || 0,
    };
  } catch {
    return {
      courseProgress: {},
      totalLessons: 0,
      completedLessons: 0,
    };
  }
};

const getProgressAsset = (value: number): string | null => {
  if (value <= 0) {
    return null;
  }

  if (value >= 100) {
    return progressGreenFull;
  }

  if (value >= 80) {
    return progressGreenPassive;
  }

  if (value >= 30) {
    return progressYellow;
  }

  return progressRed;
};

const ProgressBar: React.FC<{ value: number; left: number; top: number }> = ({ value, left, top }) => {
  const normalized = Math.max(0, Math.min(100, value));
  const progressAsset = getProgressAsset(normalized);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: '57px',
        height: '20px',
        background: '#141a25',
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      {progressAsset ? (
        <img
          src={progressAsset}
          alt="прогресс"
          aria-label="прогресс"
          style={{
            width: '57px',
            height: '20px',
            objectFit: 'fill',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  );
};

export const AcademyCoursesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [totalLessons, setTotalLessons] = React.useState(() => readAcademyProgressCache().totalLessons);
  const [completedLessons, setCompletedLessons] = React.useState(() => readAcademyProgressCache().completedLessons);
  const [courseProgress, setCourseProgress] = React.useState<Record<string, number>>(() => readAcademyProgressCache().courseProgress);

  const calculateProgress = React.useCallback(async () => {
    try {
      const userId = getTelegramUserId();
      if (!userId) return;

      const progressMap = await getUserProgress(userId);
      const completedIds = new Set(
        Object.entries(progressMap)
          .filter(([, progress]) => progress.completed || (progress.videoWatched && progress.materialsRead))
          .map(([lessonId]) => lessonId)
      );

      const results = await Promise.all(
        ['искусство', 'промптинг', 'система', 'автоматизация'].map(async (courseType) => {
          const courseResult = await getAcademyCourses({ courseType, isActive: true });
          const courseId = courseResult.data?.[0]?.id;
          if (!courseId) {
            return { courseType, lessonsCount: 0, completedInCourse: 0, percentage: 0 };
          }

          const lessonsResult = await getAcademyLessons(courseId, { isActive: true });
          const lessons = lessonsResult.data || [];
          const completedInCourse = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
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
      getAcademyProgressStorage()?.setItem(ACADEMY_PROGRESS_CACHE_KEY, JSON.stringify({
        courseProgress: nextProgress,
        totalLessons: nextTotal,
        completedLessons: nextCompleted,
      }));
    } catch (error) {
      console.error('Error calculating academy progress:', error);
    }
  }, []);

  React.useEffect(() => {
    void calculateProgress();
  }, [calculateProgress]);

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

        {courseCards.map((card) => {
          const progressValue = courseProgress[card.key] ?? 0;
          return (
            <InteractiveTiltCard
              key={card.key}
              className="pricing-card-shell"
              maxRotateX={3}
              maxRotateY={4}
              maxScale={1.01}
              style={{ position: 'absolute', left: '141px', top: `${card.top}px`, width: '894px', height: `${card.height}px` }}
            >
              <div className="pricing-card-sheen-zone">
                <div className="pricing-card-sheen" />
                <div className="pricing-card-sheen pricing-card-sheen-soft" />
              </div>
              <div style={{ position: 'absolute', inset: card.bgInset, borderRadius: '26px', overflow: 'hidden' }}>
                <img src={card.bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
              </div>

              <div style={{ position: 'absolute', inset: card.textInset, backdropFilter: 'blur(50px)', background: 'black', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: '18px', right: '18px', top: '22px', bottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap', transform: 'translateY(-6px)' }}>
                  {card.description}
                </div>
              </div>

              <ProgressBar value={progressValue} left={card.progressLeft} top={card.progressTop} />

              <FigmaStudyButton
                onClick={() => navigate(card.route)}
                className="button-inner-glow"
                style={{
                  position: 'absolute',
                  left: `${card.buttonLeft}px`,
                  top: `${card.buttonTop}px`,
                }}
              />
            </InteractiveTiltCard>
          );
        })}

        <Footer />
      </div>
    </div>
  );
};
