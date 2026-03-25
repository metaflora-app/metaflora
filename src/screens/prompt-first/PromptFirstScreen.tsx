import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { getWorkshopPromptsWithCache } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import {
  getPromptFavoriteIds,
  getRecentPromptIds,
  togglePromptFavorite,
} from '../../utils/promptInteractions';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
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

type PromptFilter = 'popular' | 'new' | 'recent' | 'favorites' | null;

const FILTER_BUTTONS: Array<{
  key: 'return' | PromptFilter;
  left: number;
  top: number;
  inactiveSrc: string;
  label?: string;
}> = [
  { key: 'return', left: 220, top: 732, inactiveSrc: returnButton, label: 'вернуть' },
  { key: 'popular', left: 467, top: 732, inactiveSrc: sortButtonInactive, label: 'сортировка' },
  { key: 'new', left: 714, top: 732, inactiveSrc: newButtonInactive, label: 'новое' },
  { key: 'recent', left: 343, top: 811, inactiveSrc: recentButtonInactive, label: 'недавние' },
  { key: 'favorites', left: 590, top: 811, inactiveSrc: favoriteButtonInactive, label: 'избранное' },
];

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [prompts, setPrompts] = React.useState<WorkshopPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<PromptFilter>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);

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

    if (activeFilter === 'popular') {
      return items.sort((a, b) => {
        const scoreA = (a.likes_count || 0) * 3 + (a.copies_count || 0) * 2 + (a.views_count || 0);
        const scoreB = (b.likes_count || 0) * 3 + (b.copies_count || 0) * 2 + (b.views_count || 0);
        return scoreB - scoreA;
      });
    }

    const newPrompts = items.filter((prompt) =>
      prompt.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые')
    );
    return newPrompts.length ? newPrompts : items;
  }, [activeFilter, favoriteIds, prompts]);

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
  };

  const handleOpenPromptCard = (promptId: string) => navigate(`/prompt-card/${promptId}`);
  const showSortPopup = () => {
    const telegramWebApp = (window as typeof window & {
      Telegram?: { WebApp?: { showPopup?: (params: { message: string }) => void } };
    }).Telegram?.WebApp;

    telegramWebApp?.showPopup?.({
      message: 'сортировка\n\nLLM\nфото\nвидео',
    });
  };
  const contentHeight = Math.max(promptsToRender.length * CARD_HEIGHT + Math.max(promptsToRender.length - 1, 0) * CARD_GAP, CARD_HEIGHT);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            МЕТАФЛОРА* цех
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '980px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            создавайте ИИ-ассистентов или повторяйте горячие тренды - промпты на любой вкус
          </p>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '302px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
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
          const isActive = button.key !== 'return' && activeFilter === button.key;

          return (
            <button
              key={button.key || 'return'}
              type="button"
              onClick={() => {
                if (button.key === 'return') {
                  setActiveFilter(null);
                  return;
                }

                const nextFilter = button.key;
                if (button.key === 'popular') {
                  showSortPopup();
                }
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
              }}
            >
              <img
                src={isActive ? activeFilterTemplate : button.inactiveSrc}
                alt=""
                className={button.key === 'return' ? undefined : 'button-inner-glow'}
                style={{ position: 'absolute', inset: 0, width: '247px', height: '80px', objectFit: 'contain', pointerEvents: 'none' }}
              />
              {isActive ? (
                <span
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
                  {button.label}
                </span>
              ) : null}
            </button>
          );
        })}

        <div style={{ position: 'absolute', left: '108px', top: '836px', width: '997px', height: '1335px', pointerEvents: 'none', zIndex: 1 }}>
          <img src={promptScrollWindowDesktopPng} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        </div>

        <div style={{ position: 'absolute', left: '177px', top: '948px', width: '831px', height: '1064px', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', zIndex: 2 }}>
          <div style={{ position: 'relative', width: '831px', height: `${contentHeight}px` }}>
            {promptsToRender.map((prompt, index) => {
              const isNew = prompt.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые');
              const isFavorite = favoriteIds.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${index * (CARD_HEIGHT + CARD_GAP)}px`,
                    width: '831px',
                    height: '1064px',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <img
                    src={promptCardBlackBgPng}
                    alt=""
                    style={{ position: 'absolute', left: '-4px', top: 0, width: '831px', height: '1064px', objectFit: 'fill', pointerEvents: 'none' }}
                  />

                  <div style={{ position: 'absolute', left: '34px', top: '37px', width: '758px', height: '744px', borderRadius: '30px', overflow: 'hidden', zIndex: 1 }}>
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
                    className="button-inner-glow"
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
                    <div
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

                  <div style={{ position: 'absolute', left: '81px', top: '786px', width: '666.8268px', height: '78.9156px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      {prompt.title}
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '47px', top: '865px', width: '738px', minHeight: '69px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      {prompt.description || 'откройте карточку, чтобы скопировать полный промпт'}
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '294px', top: '962px', width: '61px', height: '43px' }}>
                    <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>

                  <div style={{ position: 'absolute', left: '367px', top: '971px' }}>
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
