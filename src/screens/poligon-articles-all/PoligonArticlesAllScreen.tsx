import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showPopupMessage } from '../../app/telegram/telegramHelpers';
import { getPolygonArticles } from '../../utils/contentApi';
import type { PolygonArticle } from '../../types/content';
import { InteractiveTiltCard } from '../../components/InteractiveTiltCard';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { FigmaReadButton } from '../../components/FigmaPills';
import returnButton from '../../assets/poligon-redesign/кнопка вернуть.png';
import systemActive from '../../assets/poligon-redesign/кнопка система актив.png';
import systemInactive from '../../assets/poligon-redesign/кнопка система неактив.png';
import artActive from '../../assets/poligon-redesign/кнопка искусство актив.png';
import artInactive from '../../assets/poligon-redesign/кнопка искусство неактив.png';
import promptingActive from '../../assets/poligon-redesign/кнопка промптинг актив.png';
import promptingInactive from '../../assets/poligon-redesign/кнопка промптинг неактив.png';
import automationActive from '../../assets/poligon-redesign/кнопка автоматизация актив.png';
import automationInactive from '../../assets/poligon-redesign/кнопка автоматизация неактив.png';
import bgAcademy from '../../assets/poligon-redesign/фон академия.png';
import bgLaba from '../../assets/poligon-redesign/фон лаба.png';
import bgWorkshop from '../../assets/poligon-redesign/фон цех.png';
import bgPoligon from '../../assets/poligon-redesign/фон полигон.png';

type ArticleFilter = 'система' | 'искусство' | 'промптинг' | 'автоматизация';

const FILTER_BUTTONS: Array<{
  key: ArticleFilter | 'return';
  left: number;
  top: number;
  activeSrc?: string;
  inactiveSrc: string;
}> = [
  { key: 'return', left: 220, top: 394, inactiveSrc: returnButton },
  { key: 'система', left: 467, top: 394, activeSrc: systemActive, inactiveSrc: systemInactive },
  { key: 'искусство', left: 714, top: 394, activeSrc: artActive, inactiveSrc: artInactive },
  { key: 'промптинг', left: 343, top: 473, activeSrc: promptingActive, inactiveSrc: promptingInactive },
  { key: 'автоматизация', left: 590, top: 473, activeSrc: automationActive, inactiveSrc: automationInactive },
];

const FALLBACK_BACKGROUNDS = [bgAcademy, bgLaba, bgWorkshop, bgPoligon];

const PoligonArticlesAllScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<ArticleFilter[]>([]);
  const [articles, setArticles] = useState<PolygonArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPolygonArticles({
          isActive: true,
          limit: 100,
          offset: 0,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setArticles(result.data);
      } catch (err) {
        console.error('Error loading articles:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const visibleArticles = useMemo(() => {
    const filtered = activeFilters.length
      ? articles.filter((article) => article.filter_tags?.some((tag) => activeFilters.includes(tag as ArticleFilter)))
      : articles;

    return filtered.slice(0, 20);
  }, [activeFilters, articles]);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            все статьи в полигоне
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '880px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            каждая статья относится к своей категории - например, «система» или «искусство»
          </p>
        </div>

        {FILTER_BUTTONS.map((button) => {
          const isActive = button.key !== 'return' && activeFilters.includes(button.key);
          const src = isActive ? button.activeSrc || button.inactiveSrc : button.inactiveSrc;

          return (
            <button
              key={button.key}
              type="button"
              className="motion-press-grow"
              onClick={() => {
                if (button.key === 'return') {
                  setActiveFilters([]);
                  return;
                }

                const nextFilter = button.key;
                setActiveFilters((prev) => {
                  if (prev.includes(nextFilter)) {
                    return prev.filter((filter) => filter !== nextFilter);
                  }

                  if (prev.length >= 3) {
                    showPopupMessage('можно выбрать до 3 фильтров');
                    return prev;
                  }

                  return [...prev, nextFilter];
                });
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
                src={src}
                alt={button.key}
                style={{ position: 'absolute', inset: 0, width: '247px', height: '80px', objectFit: 'contain', pointerEvents: 'none' }}
              />
            </button>
          );
        })}

        <div className="laba-feed-scroll" style={{ position: 'absolute', left: '0', top: '547px', width: '1180px', height: '1450px', overflowY: visibleArticles.length > 4 ? 'auto' : 'visible', overflowX: 'hidden' }}>
          <div style={{ position: 'relative', width: '1180px', minHeight: `${Math.max(visibleArticles.length, 1) * 279}px` }}>
            {error ? (
              <div style={{ position: 'absolute', left: '50%', top: '160px', transform: 'translateX(-50%)', fontFamily: 'Cygre', fontSize: '28px', color: '#ff7b7b', textAlign: 'center' }}>
                ошибка загрузки: {error}
              </div>
            ) : loading ? null : visibleArticles.length === 0 ? (
              <div style={{ position: 'absolute', left: '50%', top: '160px', transform: 'translateX(-50%)', fontFamily: 'Cygre', fontSize: '28px', color: 'rgba(255,255,255,0.7)' }}>
                статьи не найдены
              </div>
            ) : (
              visibleArticles.map((article, index) => {
                const background = article.cover_image_url || FALLBACK_BACKGROUNDS[index % FALLBACK_BACKGROUNDS.length];
                const top = 30 + index * 279;

                return (
                  <InteractiveTiltCard key={article.id} className="pricing-card-shell" maxRotateX={3} maxRotateY={4} maxScale={1.01} style={{ position: 'absolute', left: '141px', top: `${top}px`, width: '894px', height: '249px' }}>
                    <div className="pricing-card-sheen-zone">
                      <div className="pricing-card-sheen" />
                      <div className="pricing-card-sheen pricing-card-sheen-soft" />
                    </div>
                    <img src={background} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '449px', height: '249px', borderRadius: '26px', objectFit: 'cover' }} />

                    <div style={{ position: 'absolute', left: '449px', top: 0, width: '445px', height: '249px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box' }}>
                      <div style={{ position: 'absolute', left: '27px', top: '22px', width: '390px', height: '170px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8px' }}>
                        <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                          {article.annotation || article.title}
                        </p>
                      </div>
                    </div>

                    <FigmaReadButton
                      label="читать"
                      labelWidth={150}
                      onClick={() => navigate(`/article/${article.id}`)}
                      className="button-inner-glow"
                      style={{
                        position: 'absolute',
                        left: '101px',
                        top: '85px',
                      }}
                    />
                  </InteractiveTiltCard>
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

export default PoligonArticlesAllScreen;
