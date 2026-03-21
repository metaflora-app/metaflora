import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { useUIState } from '../../contexts/UIStateContext';
import { getWorkshopPromptsWithCache } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import scrollFrame from '../../assets/prompt-redesign/окошко скролла промптов.png';
import workshopGif from '../../assets/prompt-redesign/мастерская в окошке флоры.gif';
import skeletonPrompt from '../../assets/prompt-redesign/скелет промпт.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';

const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c914514e-0b54-4b1b-8ce2-5473d0d1671f';
const textFont = 'Cygre, sans-serif';

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const { promptFilter, setPromptFilter } = useUIState();
  const [prompts, setPrompts] = React.useState<WorkshopPrompt[]>([]);

  React.useEffect(() => {
    const loadPrompts = async () => {
      const result = await getWorkshopPromptsWithCache({ isActive: true, limit: 20 });
      if (!result.error) {
        setPrompts(result.data);
      }
    };

    void loadPrompts();
  }, []);

  const visiblePrompts = React.useMemo(() => {
    const list = [...prompts];

    if (promptFilter === 'new') {
      return list.filter((item) => item.filter_tags?.some((tag) => ['новое', 'новые'].includes(tag.toLowerCase())));
    }

    if (promptFilter === 'recent') {
      return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    if (promptFilter === 'popular') {
      return list.sort((a, b) => (b.views_count + b.copies_count) - (a.views_count + a.copies_count));
    }

    return list;
  }, [promptFilter, prompts]);

  const activePrompt = visiblePrompts[0] || prompts[0] || null;
  const isNew = activePrompt?.filter_tags?.some((tag) => ['новое', 'новые'].includes(tag.toLowerCase())) ?? true;

  const handleOpenPromptCard = () => {
    navigate(activePrompt ? `/prompt-card/${activePrompt.id}` : '/prompt-card');
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

        <PromptFilterButton label="вернуть" left={220} top={732} onClick={() => setPromptFilter(null)} />
        <PromptFilterButton label="сортировка" left={467} top={732} active={promptFilter === 'popular'} onClick={() => setPromptFilter(promptFilter === 'popular' ? null : 'popular')} />
        <PromptFilterButton label="новое" left={714} top={732} active={promptFilter === 'new'} onClick={() => setPromptFilter(promptFilter === 'new' ? null : 'new')} />
        <PromptFilterButton label="недавние" left={343} top={811} active={promptFilter === 'recent'} onClick={() => setPromptFilter(promptFilter === 'recent' ? null : 'recent')} />
        <PromptFilterButton label="избранное" left={590} top={811} active={promptFilter === 'favorites'} onClick={() => setPromptFilter(promptFilter === 'favorites' ? null : 'favorites')} />

        <div style={{ position: 'absolute', left: '145px', top: '921px', width: '884px', height: '1121px' }}>
          <img src={scrollFrame} alt="окошко скролла промптов" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />

          <div style={{ position: 'absolute', left: '22px', top: '24px', width: '831px', height: '1064px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '35px', top: '37px', width: '758px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
              <img src={activePrompt?.cover_image_url || skeletonPrompt} alt="скелет промпт" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <img src={figmaLikeInactive} alt="лайк" style={{ position: 'absolute', left: '63px', top: '56px', width: '37px', height: '33px', objectFit: 'contain' }} />
            {isNew ? (
              <div
                className="blur-wave"
                style={{
                  position: 'absolute',
                  right: '58px',
                  top: '63px',
                  minWidth: '121px',
                  height: '44px',
                  padding: '0 20px',
                  borderRadius: '62px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(50px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: textFont,
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '1',
                  color: '#fff',
                }}
              >
                новое
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleOpenPromptCard}
              className="button-inner-glow"
              style={{
                position: 'absolute',
                left: '293px',
                top: '366px',
                width: '247px',
                height: '79px',
                borderRadius: '62px',
                border: '4px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.9)',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(calc(-50% + 1px), calc(-50% - 4px))',
                  width: '223px',
                  height: '29px',
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

            <div style={{ position: 'absolute', left: '69px', top: '804px', width: '694px' }}>
              <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                {activePrompt?.title || 'ИИ-копирайтер для блога'}
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
        </div>

        <Footer />
      </div>
    </div>
  );
};

const PromptFilterButton: React.FC<{
  label: string;
  left: number;
  top: number;
  active?: boolean;
  onClick: () => void;
}> = ({ label, left, top, active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={active ? 'button-inner-glow' : 'blur-wave'}
    style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: '247px',
      height: '80px',
      borderRadius: '62px',
      border: '4px solid rgba(255,255,255,0.3)',
      background: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(50px)',
      color: '#fff',
      fontFamily: textFont,
      fontWeight: 700,
      fontSize: '27px',
      lineHeight: '1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}
  >
    <span style={{ transform: 'translateY(-4px)' }}>{label}</span>
  </button>
);
