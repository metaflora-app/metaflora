import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { getWorkshopPromptsWithCache } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import {
  getPromptFavoriteIds,
  getRecentPromptIds,
  togglePromptFavorite,
} from '../../utils/promptInteractions';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
import { HaloLayer } from '../../components/animation/HaloLayer';
import returnButton from '../../assets/prompt-redesign/кнопка вернуть.png';
import sortButtonInactive from '../../assets/prompt-redesign/кнопка сортировка промпта неактив.png';
import newButtonInactive from '../../assets/prompt-redesign/кнопка новое неактив.png';
import recentButtonInactive from '../../assets/prompt-redesign/кнопка недавние неактив.png';
import favoriteButtonInactive from '../../assets/prompt-redesign/кнопка избранное неактив.png';
import activeFilterTemplate from '../../assets/prompt-redesign/кнопка активная шаблон.png';
import workshopGif from '../../assets/prompt-redesign/мастерская в окошке флоры.gif';
import promptScrollWindowDesktopPng from '../../assets/prompt-redesign/prompt-scroll-window-desktop.png';
import promptCardBlackBgPng from '../../assets/prompt-redesign/prompt-card-black-bg.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';
const CARD_HEIGHT = 1064;
const CARD_GAP = 31;
const SORT_OPTIONS = ['LLM', 'фото', 'видео', 'другое'] as const;

const getPromptCardMotionStyle = (index: number, scrollTop: number): React.CSSProperties => {
  const cardSpan = CARD_HEIGHT + CARD_GAP;
  const relative = (index * cardSpan - scrollTop) / cardSpan;
  const clamped = Math.max(-1.3, Math.min(relative, 1.3));
  const depth = Math.min(Math.abs(clamped), 1.2);
  const translateY = clamped < 0 ? clamped * 170 : clamped * 78;
  const scale = clamped < 0 ? 1 - depth * 0.045 : 1 - depth * 0.1;
  const rotateX = clamped < 0 ? depth * 11 : -depth * 7;
  const rotateZ = clamped < 0 ? depth * -4.5 : depth * 2.2;
  const opacity = 1 - Math.max(0, depth - 0.08) * 0.24;
  const blur = depth > 0.35 ? (depth - 0.35) * 3 : 0;

  return {
    transform: `translate3d(0, ${translateY}px, 0) scale(${scale}) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
    opacity,
    filter: blur ? `blur(${blur}px)` : undefined,
    transformOrigin: '50% 12%',
    transition:
      'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, filter 220ms ease',
    willChange: 'transform, opacity, filter',
  };
};

type PromptFilter = 'new' | 'recent' | 'favorites' | null;
type PromptSortFilter = typeof SORT_OPTIONS[number] | null;

const FILTER_BUTTONS: Array<{
  key: 'return' | 'sort' | Exclude<PromptFilter, null>;
  left: number;
  top: number;
  inactiveSrc: string;
  label?: string;
}> = [
  { key: 'return', left: 220, top: 732, inactiveSrc: returnButton, label: 'вернуть' },
  { key: 'sort', left: 467, top: 732, inactiveSrc: sortButtonInactive, label: 'сортировка' },
  { key: 'new', left: 714, top: 732, inactiveSrc: newButtonInactive, label: 'новое' },
  { key: 'recent', left: 343, top: 811, inactiveSrc: recentButtonInactive, label: 'недавние' },
  { key: 'favorites', left: 590, top: 811, inactiveSrc: favoriteButtonInactive, label: 'избранное' },
];

const getPromptSortLabel = (prompt: WorkshopPrompt): PromptSortFilter => {
  const combinedText = [prompt.title, prompt.description, prompt.prompt_text]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const tags = (prompt.filter_tags || []).map((tag) => tag.toLowerCase());

  if (tags.some((tag) => tag.includes('llm')) || combinedText.includes('llm') || combinedText.includes('gpt')) {
    return 'LLM';
  }

  if (prompt.media_type === 'video' || Boolean(prompt.cover_video_url)) {
    return 'видео';
  }

  if (
    prompt.media_type === 'image' ||
    Boolean(prompt.cover_image_url) ||
    tags.some((tag) => tag.includes('фото') || tag.includes('image'))
  ) {
    return 'фото';
  }

  return 'другое';
};

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [prompts, setPrompts] = React.useState<WorkshopPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<PromptFilter>(null);
  const [activeSortFilter, setActiveSortFilter] = React.useState<PromptSortFilter>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    setFavoriteIds(getPromptFavoriteIds());
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const loadPrompts = async () => {
      setLoading(true);
      try {
        const result = await getWorkshopPromptsWithCache({ isActive: true, limit: 50, offset: 0 });
        if (mounted && !result.error) {
          setPrompts(result.data);
        }
      } catch (error) {
        console.error('Error loading workshop prompts:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPrompts();

    return () => {
      mounted = false;
    };
  }, []);

  const visiblePrompts = React.useMemo(() => {
    const items = [...prompts];
    const recentIds = getRecentPromptIds();

    if (activeFilter === 'favorites') {
      return items.filter((prompt) => favoriteIds.includes(prompt.id));
    }

    if (activeFilter === 'recent') {
      const recentOrder = new Map(recentIds.map((id, index) => [id, index]));
      return items
        .filter((prompt) => recentOrder.has(prompt.id))
        .sort((a, b) => (recentOrder.get(a.id) ?? 999) - (recentOrder.get(b.id) ?? 999));
    }

    const newPrompts = items.filter((prompt) =>
      prompt.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые')
    );
    const baseItems = activeFilter === 'new'
      ? (newPrompts.length ? newPrompts : items)
      : items;

    if (!activeSortFilter) {
      return baseItems;
    }

    return baseItems.filter((prompt) => getPromptSortLabel(prompt) === activeSortFilter);
  }, [activeFilter, activeSortFilter, favoriteIds, prompts]);

  const promptsToRender = React.useMemo(() => {
    if (loading) {
      return Array.from({ length: 2 }, (_, index) => ({
        id: `loading-${index}`,
        title: 'ИИ-копирайтер для блога',
        description: 'подготавливаем реальные промпты из бэкенда',
        prompt_text: '',
        media_type: 'image' as const,
        cover_image_url: null,
        cover_video_url: null,
        poster_image_url: null,
        filter_tags: ['новое'],
        search_keywords: [],
        views_count: 0,
        copies_count: 0,
        likes_count: 0,
        is_active: true,
        order_index: index,
        created_at: '',
        updated_at: '',
      } satisfies WorkshopPrompt));
    }

    return visiblePrompts;
  }, [loading, visiblePrompts]);

  const handleToggleFavorite = (promptId: string) => {
    const nextIsFavorite = togglePromptFavorite(promptId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nextIsFavorite) next.add(promptId);
      else next.delete(promptId);
      return Array.from(next);
    });
    showPopupMessage(nextIsFavorite ? 'промпт добавлен в избранное' : 'промпт удален из избранного');
  };

  const handleOpenPromptCard = (promptId: string) => navigate(`/prompt-card/${promptId}`);
  const showSortFilterPopup = () => {
    showPopupMessage(`сортировка\n\n${SORT_OPTIONS.join('\n')}`);
  };
  const contentHeight = Math.max(promptsToRender.length * CARD_HEIGHT + Math.max(promptsToRender.length - 1, 0) * CARD_GAP, CARD_HEIGHT);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div className="motion-reveal-up" style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            МЕТАФЛОРА* цех
          </p>
        </div>

        <div className="motion-reveal-up motion-delay-1" style={{ position: 'absolute', left: '85px', top: '273px', width: '980px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            создавайте ИИ-ассистентов или повторяйте горячие тренды - промпты на любой вкус
          </p>
        </div>

        <div className="motion-conic-border motion-reveal-up motion-delay-1" style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '302px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <HaloLayer className="motion-halo-soft" style={{ inset: '18% 14%' }} />
          <img
            src={workshopGif}
            alt="мастерская в окошке флоры"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              width: '100%',
              height: 'auto',
              transform: 'translateY(-50%)',
              display: 'block',
            }}
          />
        </div>

        {FILTER_BUTTONS.map((button) => {
          const isActive = button.key === 'sort'
            ? Boolean(activeSortFilter)
            : button.key !== 'return' && activeFilter === button.key;
          const buttonLabel = button.key === 'sort' ? (activeSortFilter || button.label) : button.label;

          return (
            <button
              key={button.key || 'return'}
              type="button"
              className={`motion-conic-border motion-slide-fill motion-pressable motion-reveal-up motion-delay-2 ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                if (button.key === 'return') {
                  setActiveFilter(null);
                  setActiveSortFilter(null);
                  setScrollTop(0);
                  return;
                }

                if (button.key === 'sort') {
                  setActiveSortFilter((current) => {
                    if (!current) {
                      showSortFilterPopup();
                      return SORT_OPTIONS[0];
                    }

                    const nextIndex = (SORT_OPTIONS.indexOf(current) + 1) % SORT_OPTIONS.length;
                    return SORT_OPTIONS[nextIndex];
                  });
                  return;
                }

                const nextFilter = button.key;
                setActiveFilter((current) => (current === nextFilter ? null : nextFilter));
              }}
              style={{
                position: 'absolute',
                left: `${button.left}px`,
                top: `${button.top}px`,
                width: '247px',
                height: '80px',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                padding: 0,
                borderRadius: '40px',
              }}
            >
              <HaloLayer className="motion-halo-tight" style={{ inset: '22% 15%' }} />
              <img
                src={isActive ? activeFilterTemplate : button.inactiveSrc}
                alt=""
                className={`motion-surface-content ${button.key === 'return' ? '' : 'button-inner-glow'}`.trim()}
                style={{ position: 'absolute', inset: 0, width: '247px', height: '80px', objectFit: 'contain', pointerEvents: 'none' }}
              />
              {isActive ? (
                <span
                  className="motion-surface-content"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Cygre',
                    fontWeight: 700,
                    fontSize: '27px',
                    lineHeight: '1',
                    color: '#fff',
                    transform: 'translateY(-4px)',
                    pointerEvents: 'none',
                  }}
                >
                  {buttonLabel}
                </span>
              ) : null}
            </button>
          );
        })}

        <div style={{ position: 'absolute', left: '108px', top: '836px', width: '997px', height: '1335px', pointerEvents: 'none', zIndex: 1 }}>
          <img src={promptScrollWindowDesktopPng} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>

        <div
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          style={{ position: 'absolute', left: '177px', top: '948px', width: '831px', height: '1064px', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', zIndex: 2, perspective: '1800px' }}
        >
          <div style={{ position: 'relative', width: '831px', height: `${contentHeight}px` }}>
            {promptsToRender.map((prompt, index) => {
              const isNew = prompt.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые');
              const isFavorite = favoriteIds.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  className={index === 0 ? 'motion-reveal-up motion-delay-3' : undefined}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${index * (CARD_HEIGHT + CARD_GAP)}px`,
                    width: '831px',
                    height: '1064px',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    ...getPromptCardMotionStyle(index, scrollTop),
                  }}
                >
                  <HaloLayer className="motion-halo-soft" style={{ inset: '24% 16% 42%' }} />
                  <img
                    src={promptCardBlackBgPng}
                    alt=""
                    style={{ position: 'absolute', left: '-4px', top: 0, width: '831px', height: '1064px', objectFit: 'fill', pointerEvents: 'none' }}
                  />

                  <div style={{ position: 'absolute', left: '31px', top: '31px', width: '769px', height: '769px', borderRadius: '30px', overflow: 'hidden', zIndex: 1 }}>
                    {prompt.media_type === 'video' && prompt.cover_video_url ? (
                      <video
                        src={prompt.cover_video_url}
                        poster={prompt.poster_image_url || prompt.cover_image_url || undefined}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={prompt.cover_image_url || prompt.poster_image_url || workshopGif}
                        alt={prompt.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  <FigmaLikeButton
                    active={isFavorite}
                    disabled={prompt.id.startsWith('loading-')}
                    onClick={() => !prompt.id.startsWith('loading-') && handleToggleFavorite(prompt.id)}
                    style={{ position: 'absolute', left: '73px', top: '59px', zIndex: 2 }}
                  />
                  {isNew ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: '642px',
                        top: '73px',
                        width: '121px',
                        height: '43px',
                        backdropFilter: 'blur(50px)',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderRadius: '62px',
                        boxSizing: 'border-box',
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, calc(-50% - 4.5px))',
                          fontFamily: 'Cygre',
                          fontWeight: 700,
                          fontSize: '20px',
                          lineHeight: '1',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        новое
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => !prompt.id.startsWith('loading-') && handleOpenPromptCard(prompt.id)}
                    className="button-inner-glow motion-conic-border motion-slide-fill motion-pressable"
                    style={{
                      position: 'absolute',
                      left: '293px',
                      top: '366px',
                      width: '246.9305px',
                      height: '79.25px',
                      borderRadius: '62px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.9)',
                      padding: 0,
                      cursor: prompt.id.startsWith('loading-') ? 'default' : 'pointer',
                      zIndex: 999,
                    }}
                  >
                    <HaloLayer className="motion-halo-tight" style={{ inset: '24% 14%' }} />
                    <div
                      className="motion-surface-content"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, calc(-50% - 6px))',
                        width: '210px',
                        height: '29.3116px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Cygre',
                        fontWeight: 700,
                        fontSize: '27px',
                        lineHeight: '1',
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      скопировать
                    </div>
                  </button>

                  <div style={{ position: 'absolute', left: '81px', top: '812px', width: '666.8268px', height: '78.9156px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      {prompt.title}
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '47px', top: '891px', width: '738px', minHeight: '69px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      {prompt.description || 'откройте карточку, чтобы скопировать полный промпт'}
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '294px', top: '988px', width: '61px', height: '43px' }}>
                    <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>

                  <div style={{ position: 'absolute', left: '367px', top: '997px' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
                      Редакция
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
