import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkshopPromptsWithCache } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import likeIcon from '../../assets/лайк.png';
import likeEmptyIcon from '../../assets/лайк не поставлен.png';
import fallbackCover from '../../assets/prompt-card/фото для карточки промпта.png';
import scrollFrame from '../../assets/prompt-redesign/окошко скролла промптов.png';
import returnButton from '../../assets/prompt-redesign/кнопка вернуть.png';
import sortButtonInactive from '../../assets/prompt-redesign/кнопка сортировка промпта неактив.png';
import sortButtonActive from '../../assets/prompt-redesign/кнопка сортировка промпта актив.png';
import newButtonInactive from '../../assets/prompt-redesign/кнопка новое неактив.png';
import newButtonActive from '../../assets/prompt-redesign/кнопка новое актив.png';
import recentButtonInactive from '../../assets/prompt-redesign/кнопка недавние неактив.png';
import recentButtonActive from '../../assets/prompt-redesign/кнопка недавние актив.png';
import favoriteButtonInactive from '../../assets/prompt-redesign/кнопка избранное неактив.png';
import favoriteButtonActive from '../../assets/prompt-redesign/кнопка избранное актив.png';
import articleBadge from '../../assets/prompt-redesign/плашка новое в статье.png';
import workshopGif from '../../assets/prompt-redesign/мастерская в окошке флоры.gif';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';

type PromptFilter = 'sort' | 'new' | 'recent' | 'favorites';

const FILTER_BUTTONS: Array<{
  key: PromptFilter | 'return';
  left: number;
  top: number;
  activeSrc?: string;
  inactiveSrc: string;
}> = [
  { key: 'return', left: 220, top: 732, inactiveSrc: returnButton },
  { key: 'sort', left: 467, top: 732, activeSrc: sortButtonActive, inactiveSrc: sortButtonInactive },
  { key: 'new', left: 714, top: 732, activeSrc: newButtonActive, inactiveSrc: newButtonInactive },
  { key: 'recent', left: 343, top: 811, activeSrc: recentButtonActive, inactiveSrc: recentButtonInactive },
  { key: 'favorites', left: 590, top: 811, activeSrc: favoriteButtonActive, inactiveSrc: favoriteButtonInactive },
];

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<PromptFilter | null>(null);
  const [likedCards, setLikedCards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('metaflora_liked_prompts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [prompts, setPrompts] = useState<WorkshopPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    localStorage.setItem('metaflora_liked_prompts', JSON.stringify(likedCards));
  }, [likedCards]);

  useEffect(() => {
    const loadPrompts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getWorkshopPromptsWithCache({
          isActive: true,
          limit: 100,
          offset: 0,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setPrompts(result.data);
      } catch (err) {
        console.error('Error loading prompts:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, []);

  const filteredPrompts = useMemo(() => {
    let next = [...prompts];

    if (activeFilter === 'favorites') {
      next = next.filter((prompt) => likedCards.includes(prompt.id));
    }

    if (activeFilter === 'recent') {
      try {
        const recentIds: string[] = JSON.parse(localStorage.getItem('metaflora_recent_prompts') || '[]');
        next = recentIds
          .map((id) => next.find((prompt) => prompt.id === id))
          .filter(Boolean) as WorkshopPrompt[];
      } catch {
        next = [];
      }
    }

    if (activeFilter === 'new') {
      next = next.filter((prompt) => prompt.filter_tags?.some((tag) => tag == 'новое' || tag == 'новые'));
    }

    if (activeFilter === 'sort') {
      next.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    }

    return next;
  }, [activeFilter, likedCards, prompts]);

  const toggleLike = (event: React.MouseEvent<HTMLImageElement>, cardId: string) => {
    event.stopPropagation();
    setLikedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]));
  };

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

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '840px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            создавайте ИИ-ассистентов или повторяйте горячие тренды - промпты на любой вкус
          </p>
        </div>

        <div style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '302px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
          <img src={workshopGif} alt="мастерская в окошке флоры" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {FILTER_BUTTONS.map((button) => {
          const isActive = button.key !== 'return' && activeFilter === button.key
          const src = isActive ? (button.activeSrc || button.inactiveSrc) : button.inactiveSrc

          return (
            <img
              key={button.key}
              src={src}
              alt={button.key}
              className={button.key === 'return' ? undefined : 'button-inner-glow'}
              onClick={() => {
                if (button.key === 'return') {
                  setActiveFilter(null);
                  return;
                }

                const nextFilter = button.key;
                setActiveFilter((prev) => (prev === nextFilter ? null : nextFilter));
              }}
              style={{
                position: 'absolute',
                left: `${button.left}px`,
                top: `${button.top}px`,
                width: '247px',
                height: '80px',
                objectFit: 'contain',
                cursor: 'pointer',
              }}
            />
          );
        })}

        <div style={{ position: 'absolute', left: '145px', top: '921px', width: '884px', height: '1121px' }}>
          <img src={scrollFrame} alt="окошко скролла промптов" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />

          <div
            style={{
              position: 'absolute',
              left: '22px',
              top: '24px',
              width: '840px',
              height: '1068px',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '10px',
            }}
          >
            {error ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontSize: '28px', color: '#ff7b7b', textAlign: 'center' }}>
                ошибка загрузки: {error}
              </div>
            ) : loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontSize: '28px', color: 'rgba(255,255,255,0.7)' }}>
                загружаем промпты
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cygre', fontSize: '28px', color: 'rgba(255,255,255,0.7)' }}>
                промпты не найдены
              </div>
            ) : (
              filteredPrompts.map((prompt, index) => {
                const isNew = prompt.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые');

                return (
                  <div
                    key={prompt.id}
                    onClick={() => navigate(`/prompt-card/${prompt.id}`)}
                    style={{
                      position: 'relative',
                      width: '831px',
                      height: '1064px',
                      marginBottom: index === filteredPrompts.length - 1 ? 0 : '47px',
                      borderRadius: '30px',
                      background: '#000',
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ position: 'absolute', left: '35px', top: '37px', width: '758px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
                      <img
                        src={prompt.cover_image_url || fallbackCover}
                        alt={prompt.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== fallbackCover) {
                            target.src = fallbackCover;
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <img
                      src={likedCards.includes(prompt.id) ? likeIcon : likeEmptyIcon}
                      alt="лайк"
                      onClick={(event) => toggleLike(event, prompt.id)}
                      style={{ position: 'absolute', left: '45px', top: '39px', width: '32px', height: '32px', cursor: 'pointer' }}
                    />

                    {isNew ? <img src={articleBadge} alt="новое" style={{ position: 'absolute', right: '41px', top: '43px', width: '102px', height: '36px', objectFit: 'contain' }} /> : null}

                    <div style={{ position: 'absolute', left: '83px', top: '786px', width: '665px' }}>
                      <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                        {prompt.title}
                      </p>
                    </div>

                    <div style={{ position: 'absolute', left: '47px', top: '865px', width: '737px' }}>
                      <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                        {prompt.description || ''}
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
              })
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
