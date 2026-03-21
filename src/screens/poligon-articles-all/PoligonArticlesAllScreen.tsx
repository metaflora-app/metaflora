import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolygonArticles } from '../../utils/contentApi';
import type { PolygonArticle } from '../../types/content';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import readButton from '../../assets/poligon-redesign/кнопка читать.png';
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
  const [activeFilter, setActiveFilter] = useState<ArticleFilter | null>(null);
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
          tags: activeFilter ? [activeFilter] : undefined,
          isActive: true,
          limit: 20,
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
  }, [activeFilter]);

  const visibleArticles = useMemo(() => articles.slice(0, 20), [articles]);

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
          const isActive = button.key !== 'return' && activeFilter === button.key;
          const src = isActive ? button.activeSrc || button.inactiveSrc : button.inactiveSrc;

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

        <div style={{ position: 'absolute', left: '0', top: '547px', width: '1180px', height: '1450px', overflowY: visibleArticles.length > 4 ? 'auto' : 'visible', overflowX: 'hidden' }}>
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
                  <div key={article.id} style={{ position: 'absolute', left: '141px', top: `${top}px`, width: '894px', height: '249px' }}>
                    <img src={background} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '449px', height: '249px', borderRadius: '26px', objectFit: 'cover' }} />

                    <div style={{ position: 'absolute', left: '449px', top: 0, width: '445px', height: '249px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box' }}>
                      <div style={{ position: 'absolute', left: '27px', top: '30px', width: '390px', height: '189px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                          {article.annotation || article.title}
                        </p>
                      </div>
                    </div>

                    <img
                      src={readButton}
                      alt="читать"
                      onClick={() => navigate(`/article/${article.id}`)}
                      className="button-inner-glow"
                      style={{ position: 'absolute', left: '101px', top: '85px', width: '247px', height: '80px', objectFit: 'contain', cursor: 'pointer' }}
                    />
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

export default PoligonArticlesAllScreen;
