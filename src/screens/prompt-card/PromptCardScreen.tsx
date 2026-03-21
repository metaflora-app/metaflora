import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkshopPromptById } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import promptBadge from '../../assets/prompt-redesign/плашка промпт.png';
import mainCardUnderlay from '../../assets/prompt-redesign/большая главная подложка.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';
import skeletonPrompt from '../../assets/prompt-redesign/скелет промпт.png';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        showPopup: (params: { message: string }) => void;
      };
    };
  }
}

const FALLBACK_TEXT = `A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.

А второй клип начинается с солнца, которое тоже заполняет кадр:

A bright orange sun rising over the ocean horizon, starting as a small glowing orb that.`;
const figmaLikeInactive = 'https://www.figma.com/api/mcp/asset/c914514e-0b54-4b1b-8ce2-5473d0d1671f';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<WorkshopPrompt | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) return;
      try {
        const result = await getWorkshopPromptById(id);
        if (!result.error && result.data) {
          setPrompt(result.data);
        }
      } catch (error) {
        console.error('Error loading prompt:', error);
      }
    };

    loadPrompt();
  }, [id]);

  const title = useMemo(() => prompt?.title || 'ИИ-копирайтер для блога', [prompt]);
  const promptText = useMemo(() => prompt?.prompt_text || FALLBACK_TEXT, [prompt]);
  const coverImage = useMemo(() => prompt?.cover_image_url || skeletonPrompt, [prompt]);
  const isNew = useMemo(() => prompt?.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые') ?? true, [prompt]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = promptText;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      window.Telegram?.WebApp?.showPopup?.({ message: 'промпт скопирован в буфер обмена' });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>карточка промпта</p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '760px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            достаточно одного клика, чтобы скопировать весь промпт
          </p>
        </div>

        <img src={mainCardUnderlay} alt="главная подложка" style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '1643px', objectFit: 'fill', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: '176px', top: '456px', width: '860px', height: '1536px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '42px', top: '37px', width: '774px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
            <img src={coverImage} alt="обложка промпта" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <img src={figmaLikeInactive} alt="лайк" style={{ position: 'absolute', left: '49px', top: '40px', width: '37px', height: '33px', objectFit: 'contain' }} />
          {isNew ? (
            <div
              className="blur-wave"
              style={{
                position: 'absolute',
                right: '45px',
                top: '43px',
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
                fontFamily: 'Cygre',
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '1',
                color: '#fff',
              }}
            >
              новое
            </div>
          ) : null}

          <div style={{ position: 'absolute', left: '83px', top: '866px', width: '694px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>{title}</p>
          </div>

          <div style={{ position: 'absolute', left: '349px', top: '962px', width: '61px', height: '43px' }}>
            <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ position: 'absolute', left: '425px', top: '970px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>Редакция</p>
          </div>

          <img src={promptBadge} alt="промпт" className="button-inner-glow" onClick={handleCopy} style={{ position: 'absolute', left: '306px', top: '1026px', width: '248px', height: '80px', objectFit: 'contain', cursor: 'pointer' }} />

          <div style={{ position: 'absolute', left: '71px', top: '1144px', width: '718px', height: '334px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '14px' }}>
            <div onClick={handleCopy} style={{ cursor: 'pointer', paddingBottom: '20px' }}>
              <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1.05', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{promptText}</p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
