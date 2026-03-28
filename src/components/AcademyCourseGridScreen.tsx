import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveTiltCard } from './InteractiveTiltCard';
import { Footer, Header, ThreeBg } from './ScreenLayout';
import { FigmaReadButton } from './FigmaPills';
import {
  getAcademyCourses,
  getAcademyLessons,
  getDemoCourses,
  getDemoLessons,
} from '../utils/contentApi';
import type { AcademyLesson } from '../types/content';

type CourseSource = 'academy' | 'demo';

interface CourseCardPosition {
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  badgeLeft: number;
  badgeTop: number;
  badgeThinBorder?: boolean;
}

interface AcademyCourseGridScreenProps {
  source: CourseSource;
  courseType: string;
  homeRoute: string;
  title: string;
  subtitleLines: string[];
  subtitleWidth?: number;
  placeholderCount: number;
  placeholderText: string;
  cardDescriptionOverride?: string;
  cardTextFontSize?: number;
}

const DEMO_LAYOUT: CourseCardPosition[] = [
  { cardLeft: 353.5, cardTop: 430, cardWidth: 425, badgeLeft: 141, badgeTop: 402 },
  { cardLeft: 822.5, cardTop: 535, cardWidth: 425, badgeLeft: 610, badgeTop: 507 },
  { cardLeft: 353.5, cardTop: 778, cardWidth: 425, badgeLeft: 141, badgeTop: 750 },
  { cardLeft: 822.5, cardTop: 884, cardWidth: 425, badgeLeft: 610, badgeTop: 856, badgeThinBorder: true },
];

const FULL_LAYOUT: CourseCardPosition[] = [
  { cardLeft: 353.5, cardTop: 430, cardWidth: 425, badgeLeft: 141, badgeTop: 402 },
  { cardLeft: 822.5, cardTop: 535, cardWidth: 425, badgeLeft: 610, badgeTop: 507 },
  { cardLeft: 353.5, cardTop: 779, cardWidth: 425, badgeLeft: 141, badgeTop: 751 },
  { cardLeft: 822.5, cardTop: 884, cardWidth: 425, badgeLeft: 610, badgeTop: 856, badgeThinBorder: true },
  { cardLeft: 353.5, cardTop: 1128, cardWidth: 425, badgeLeft: 141, badgeTop: 1100 },
  { cardLeft: 822.5, cardTop: 1233, cardWidth: 425, badgeLeft: 610, badgeTop: 1205 },
  { cardLeft: 354.5, cardTop: 1477, cardWidth: 427, badgeLeft: 141, badgeTop: 1449 },
  { cardLeft: 822.5, cardTop: 1582, cardWidth: 425, badgeLeft: 610, badgeTop: 1554 },
];

async function loadCourseLessons(source: CourseSource, courseType: string): Promise<AcademyLesson[]> {
  if (source === 'demo') {
    const courseResult = await getDemoCourses({ courseType, isActive: true });
    const courseId = courseResult.data?.[0]?.id;
    if (!courseId) return [];
    const lessonsResult = await getDemoLessons(courseId, { isActive: true });
    return (lessonsResult.data || []).slice().sort((a, b) => (a.lesson_number || a.order_index) - (b.lesson_number || b.order_index));
  }

  const courseResult = await getAcademyCourses({ courseType, isActive: true });
  const courseId = courseResult.data?.[0]?.id;
  if (!courseId) return [];
  const lessonsResult = await getAcademyLessons(courseId, { isActive: true });
  return (lessonsResult.data || []).slice().sort((a, b) => (a.lesson_number || a.order_index) - (b.lesson_number || b.order_index));
}

export const AcademyCourseGridScreen: React.FC<AcademyCourseGridScreenProps> = ({
  source,
  courseType,
  homeRoute,
  title,
  subtitleLines,
  subtitleWidth = 882,
  placeholderCount,
  placeholderText,
  cardDescriptionOverride,
  cardTextFontSize = 27,
}) => {
  const navigate = useNavigate();
  const [lessons, setLessons] = React.useState<AcademyLesson[] | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const layout = placeholderCount === 4 ? DEMO_LAYOUT : FULL_LAYOUT;

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const data = await loadCourseLessons(source, courseType);
        if (mounted) {
          setLessons(data);
        }
      } catch (error) {
        console.error('Error loading academy course lessons:', error);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [source, courseType]);

  const visibleLessons = (lessons || []).slice(0, layout.length);

  const openLesson = (lessonId: string) => {
    const search = source === 'demo' ? `?lesson=${lessonId}&type=demo` : `?lesson=${lessonId}`;
    navigate(`/academy-lesson-video${search}`);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate(homeRoute)} />

        <div style={{ position: 'absolute', left: '85px', top: '207px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            {title}
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '291px', width: `${subtitleWidth}px` }}>
          {subtitleLines.map((line, index) => (
            <p
              key={`${title}-${index}`}
              style={{
                margin: 0,
                fontFamily: 'Cygre',
                fontWeight: 400,
                fontSize: '40px',
                lineHeight: '1',
                color: 'white',
                whiteSpace: 'pre-wrap',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {lessons === null ? (
          <div style={{ position: 'absolute', left: '50%', top: '760px', transform: 'translateX(-50%)', fontFamily: 'Cygre', fontWeight: 400, fontSize: '32px', lineHeight: '1', color: 'rgba(255,255,255,0.75)' }}>
            загружаем уроки...
          </div>
        ) : visibleLessons.map((lesson, index) => {
          const position = layout[index];
          const label = lesson.lesson_number || index + 1;
          const description = cardDescriptionOverride || lesson.description || lesson.annotation || placeholderText;

          return (
            <React.Fragment key={lesson.id}>
              <InteractiveTiltCard
                className="pricing-card-shell"
                baseTransform="translateX(-50%)"
                maxRotateX={4}
                maxRotateY={5}
                maxScale={1.012}
                style={{
                  position: 'absolute',
                  left: `${position.cardLeft}px`,
                  top: `${position.cardTop}px`,
                  width: `${position.cardWidth}px`,
                  height: '317px',
                }}
              >
                <div className="pricing-card-sheen-zone">
                  <div className="pricing-card-sheen" />
                  <div className="pricing-card-sheen pricing-card-sheen-soft" />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backdropFilter: 'blur(50px)',
                    background: 'black',
                    border: '4px solid rgba(255,255,255,0.3)',
                    borderRadius: '30px',
                    overflow: 'hidden',
                  }}
                >
                <div
                  style={{
                    position: 'absolute',
                    left: '18px',
                    right: '18px',
                    top: '8px',
                    bottom: '106px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontFamily: 'Cygre',
                    fontWeight: 400,
                    fontSize: `${cardTextFontSize}px`,
                    lineHeight: '1',
                    color: 'white',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {description}
                </div>

                <FigmaReadButton
                  label="перейти"
                  onClick={() => openLesson(lesson.id)}
                  className="button-inner-glow"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '19px',
                    transform: 'translateX(-50%)',
                  }}
                />
                </div>
              </InteractiveTiltCard>

              <div
                style={{
                  position: 'absolute',
                  left: `${position.badgeLeft}px`,
                  top: `${position.badgeTop}px`,
                  transform: 'translateX(-50%)',
                  width: '56px',
                  height: '56px',
                  border: position.badgeThinBorder ? '1px solid rgba(255,255,255,0.3)' : '4px solid rgba(255,255,255,0.3)',
                  borderRadius: '30px',
                  backdropFilter: 'blur(50px)',
                  background: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontFamily: 'Cygre',
                  fontWeight: 700,
                  fontSize: '32px',
                  lineHeight: '1',
                }}
              >
                <span style={{ transform: 'translateY(-5px)' }}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}

        <Footer />
      </div>
    </div>
  );
};
