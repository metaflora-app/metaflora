import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { copyToClipboard } from '../../utils/clipboard';
import { getCachedData, getWorkshopPromptByIdWithCache, trackWorkshopPromptCopy, trackWorkshopPromptView } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { FigmaLikeButton } from '../../components/FigmaLikeButton';
import { FigmaMainBackdrop } from '../../components/FigmaMainBackdrop';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import promptBadge from '../../assets/shared-redesign/плашка промпт.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';
import { getTelegramUserId } from '../../utils/labaApi';
import { isPromptFavorite, markPromptViewed, togglePromptFavorite } from '../../utils/promptInteractions';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<WorkshopPrompt | null>(() => {
    if (!id) return null;

    const cachedPrompt = getCachedData<{ data: WorkshopPrompt }>(`workshop_prompt_${id}`);
    if (cachedPrompt?.data) {
      return cachedPrompt.data;
    }

    const cachedList = getCachedData<{ data: WorkshopPrompt[] }>('workshop_prompts_{"isActive":true,"limit":50,"offset":0}');
    return cachedList?.data?.find((item) => item.id === id) ?? null;
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const promptTextRef = useRef<HTMLDivElement | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [promptTextHeight, setPromptTextHeight] = useState(0);

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) return;
      try {
        const result = await getWorkshopPromptByIdWithCache(id);
        if (!result.error && result.data) {
          setPrompt(result.data);
        }
      } catch (error) {
        console.error('Error loading prompt:', error);
      }
    };

    loadPrompt();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    setIsFavorite(isPromptFavorite(id));
    markPromptViewed(id);
    void trackWorkshopPromptView(id, getTelegramUserId());
  }, [id]);

  const title = useMemo(() => prompt?.title || '', [prompt]);
  const promptText = useMemo(() => prompt?.prompt_text || '', [prompt]);
  const isNew = useMemo(() => prompt?.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые') ?? false, [prompt]);
  const mediaType = useMemo(() => (prompt?.media_type === 'video' && prompt?.cover_video_url ? 'video' : 'image'), [prompt]);
  const contentHeight = useMemo(() => {
    const promptTextTop = 1057;
    const bottomGap = 64;
    return Math.max(1569, promptTextTop + promptTextHeight + bottomGap);
  }, [promptTextHeight]);

  React.useLayoutEffect(() => {
    const node = promptTextRef.current;
    if (!node) return;

    const updateHeight = () => {
      setPromptTextHeight(node.getBoundingClientRect().height);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [promptText]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;

    video.muted = false;
    video.volume = 1;
    const playPromise = video.play();
    if (!playPromise) return;

    playPromise.catch(() => {
      console.error('Prompt video autoplay with sound failed');
    });
  }, [mediaType, prompt?.cover_video_url]);

  const handleCopy = async () => {
    try {
      const copied = await copyToClipboard(promptText);
      if (!copied) return;
      if (id) {
        void trackWorkshopPromptCopy(id);
      }
      showPopupMessage('промпт скопирован в буфер обмена');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleToggleFavorite = () => {
    if (!id) return;
    const nextIsFavorite = togglePromptFavorite(id);
    setIsFavorite(nextIsFavorite);
    showPopupMessage(nextIsFavorite ? 'промпт добавлен в избранное' : 'промпт удален из избранного');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>карточка промпта</p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '916px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            достаточно одного клика, чтобы скопировать весь промпт
          </p>
        </div>

        <FigmaMainBackdrop style={{ left: '31px', top: '399px' }} />

      <div style={{ position: 'absolute', left: '175px', top: '437px', width: '826px', height: '1569px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'visible' }}>
          <div
            className="laba-feed-scroll"
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 70px), transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 70px), transparent 100%)',
            }}
          >
            <div style={{ position: 'relative', width: '826px', height: `${contentHeight}px` }}>
              <div style={{ position: 'absolute', left: '31px', top: '31px', width: '764px', height: '764px', borderRadius: '30px', overflow: 'hidden', zIndex: 1 }}>
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={prompt?.cover_video_url || undefined}
                    poster={prompt?.poster_image_url || prompt?.cover_image_url || undefined}
                    autoPlay
                    loop
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                  />
                ) : prompt?.cover_image_url || prompt?.poster_image_url ? (
                  <img
                    src={prompt?.cover_image_url || prompt?.poster_image_url || ''}
                    alt={title}
                    loading="eager"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
              </div>

              <FigmaLikeButton
                active={isFavorite}
                disabled={!id}
                effectVariant="tiktok"
                onClick={handleToggleFavorite}
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

              <div style={{ position: 'absolute', left: '50%', top: '804px', width: '666.8268px', height: '78.9156px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)' }}>
                <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>{title}</p>
              </div>

              <div style={{ position: 'absolute', left: '50%', top: '885px', width: '197px', height: '43px', transform: 'translateX(-50%)' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: '61px', height: '43px' }}>
                  <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ position: 'absolute', left: '57px', top: '7px', width: '140px', height: '29px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>Редакция</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="motion-press-grow"
                style={{ position: 'absolute', left: '50%', top: '953px', width: '246.9305px', height: '80.9526px', cursor: 'pointer', transform: 'translateX(-50%)', border: 'none', background: 'transparent', padding: 0, borderRadius: '62px', overflow: 'visible' }}
              >
                <img
                  src={promptBadge}
                  alt="плашка промпт"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />
              </button>

              <div ref={promptTextRef} onClick={handleCopy} style={{ position: 'absolute', left: '50%', top: '1057px', width: '729px', transform: 'translateX(-50%)', cursor: 'pointer', paddingBottom: '20px' }}>
                <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{promptText}</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
