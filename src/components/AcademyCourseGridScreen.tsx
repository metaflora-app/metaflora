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

const CARD_HEIGHT = 317;
const SCROLL_THRESHOLD = 9;
const SCROLLABLE_CARD_LEFT = 353.5;
const SCROLLABLE_CARD_RIGHT = 822.5;
const SCROLLABLE_BADGE_LEFT = 141;
const SCROLLABLE_BADGE_RIGHT = 610;
const SCROLLABLE_LEFT_TOP_START = 430;
const SCROLLABLE_RIGHT_TOP_START = 535;
const SCROLLABLE_LEFT_BADGE_TOP_START = 402;
const SCROLLABLE_RIGHT_BADGE_TOP_START = 507;
const SCROLLABLE_ROW_GAP = 349;

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

function getCourseLessonsCacheKey(source: CourseSource, courseType: string): string {
  return `metaflora_course_lessons_v2_${source}_${courseType}`;
}

function getScrollableCourseCardPosition(index: number): CourseCardPosition {
  const row = Math.floor(index / 2);
  const isRight = index % 2 === 1;

  return {
    cardLeft: isRight ? SCROLLABLE_CARD_RIGHT : SCROLLABLE_CARD_LEFT,
    cardTop: (isRight ? SCROLLABLE_RIGHT_TOP_START : SCROLLABLE_LEFT_TOP_START) + row * SCROLLABLE_ROW_GAP,
    cardWidth: 425,
    badgeLeft: isRight ? SCROLLABLE_BADGE_RIGHT : SCROLLABLE_BADGE_LEFT,
    badgeTop: (isRight ? SCROLLABLE_RIGHT_BADGE_TOP_START : SCROLLABLE_LEFT_BADGE_TOP_START) + row * SCROLLABLE_ROW_GAP,
    badgeThinBorder: index === 3,
  };
}

function readCachedCourseLessons(source: CourseSource, courseType: string): AcademyLesson[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getCourseLessonsCacheKey(source, courseType));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedCourseLessons(source: CourseSource, courseType: string, lessons: AcademyLesson[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getCourseLessonsCacheKey(source, courseType), JSON.stringify(lessons));
  } catch {
    // Ignore storage quota errors.
  }
}

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
  const [lessons, setLessons] = React.useState<AcademyLesson[]>(() => readCachedCourseLessons(source, courseType));
  const [loadingLessons, setLoadingLessons] = React.useState(() => readCachedCourseLessons(source, courseType).length === 0);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const layout = placeholderCount === 4 ? DEMO_LAYOUT : FULL_LAYOUT;
  const shouldEnableCourseScroll = lessons.length >= SCROLL_THRESHOLD;

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        if (readCachedCourseLessons(source, courseType).length === 0) {
          setLoadingLessons(true);
        }
        const data = await loadCourseLessons(source, courseType);
        if (mounted) {
          setLessons(data);
          writeCachedCourseLessons(source, courseType, data);
        }
      } catch (error) {
        console.error('Error loading academy course lessons:', error);
      } finally {
        if (mounted) {
          setLoadingLessons(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [source, courseType]);

  const visibleLessons = shouldEnableCourseScroll ? lessons : lessons.slice(0, layout.length);
  const footerTop = shouldEnableCourseScroll
    ? Math.max(2071, (Math.floor((Math.max(visibleLessons.length, 1) - 1) / 2) * SCROLLABLE_ROW_GAP) + SCROLLABLE_RIGHT_TOP_START + CARD_HEIGHT + 180)
    : 2071;
  const sceneHeight = Math.max(2550, footerTop + 220);

  const openLesson = (lessonId: string) => {
    const search = source === 'demo' ? `?lesson=${lessonId}&type=demo` : `?lesson=${lessonId}`;
    navigate(`/academy-lesson-video${search}`);
  };

  return (
    <div
      className={shouldEnableCourseScroll ? 'academy-course-scroll' : undefined}
      style={{
        position: 'relative',
        width: '100vw',
        height: shouldEnableCourseScroll ? '100dvh' : '100vh',
        minHeight: shouldEnableCourseScroll ? '100dvh' : '100vh',
        background: '#020101',
        overflowX: 'hidden',
        overflowY: shouldEnableCourseScroll ? 'auto' : 'hidden',
        scrollbarWidth: shouldEnableCourseScroll ? 'none' : undefined,
        msOverflowStyle: shouldEnableCourseScroll ? 'none' : undefined,
        WebkitOverflowScrolling: shouldEnableCourseScroll ? 'touch' : undefined,
        touchAction: shouldEnableCourseScroll ? 'pan-y' : undefined,
        overscrollBehaviorY: shouldEnableCourseScroll ? 'contain' : undefined,
      }}
    >
      {shouldEnableCourseScroll ? (
        <style>{`.academy-course-scroll::-webkit-scrollbar{display:none;width:0;height:0;}`}</style>
      ) : null}
      <div style={{ position: 'relative', width: '1180px', minHeight: `${sceneHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
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

        {!loadingLessons ? visibleLessons.map((lesson, index) => {
          const position = shouldEnableCourseScroll ? getScrollableCourseCardPosition(index) : layout[index];
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
        }) : null}

        <Footer top={footerTop} />
      </div>
    </div>
  );
};
