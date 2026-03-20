import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkshopPromptById } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { FigmaMainBackdrop } from '../../components/FigmaMainBackdrop';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import likeButton from '../../assets/prompt-redesign/кнопка лайк актив.png';
import articleBadge from '../../assets/prompt-redesign/плашка новое в статье.png';
import promptBadge from '../../assets/shared-redesign/плашка промпт.png';
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
  const isNew = useMemo(() => prompt?.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые') ?? true, [prompt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      window.Telegram?.WebApp?.showPopup?.({ message: 'Скопировано в буфер обмена' });
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

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '916px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            достаточно одного клика, чтобы скопировать весь промпт
          </p>
        </div>

        <FigmaMainBackdrop style={{ left: '31px', top: '399px' }} />

        <div style={{ position: 'absolute', left: '175px', top: '437px', width: '826px', height: '1569px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '34px', top: '37px', width: '758px', height: '744px', borderRadius: '62px', overflow: 'hidden', zIndex: 1 }}>
            <img src={skeletonPrompt} alt="скелет промпт" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <img src={likeButton} alt="лайк" style={{ position: 'absolute', left: '73px', top: '59px', width: '72px', height: '72px', objectFit: 'contain', zIndex: 2 }} />
          {isNew ? <img src={articleBadge} alt="новое" style={{ position: 'absolute', left: '642px', top: '73px', width: '121px', height: '43px', objectFit: 'fill', zIndex: 2 }} /> : null}

          <div style={{ position: 'absolute', left: '50%', top: '784px', width: '666.8268px', height: '78.9156px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>{title}</p>
          </div>

          <div style={{ position: 'absolute', left: '50%', top: '885px', width: '225px', height: '43px', transform: 'translateX(-50%)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '61px', height: '43px' }}>
              <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ position: 'absolute', left: '85px', top: '7px', width: '140px', height: '29px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>Редакция</p>
            </div>
          </div>

          <img
            src={promptBadge}
            alt="плашка промпт"
            className="button-inner-glow"
            onClick={handleCopy}
            style={{ position: 'absolute', left: '50%', top: '953px', width: '246.9305px', height: '80.9526px', objectFit: 'contain', cursor: 'pointer', transform: 'translateX(-50%)' }}
          />

          <div style={{ position: 'absolute', left: '50%', top: '1057px', width: '729px', transform: 'translateX(-50%)' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{promptText}</p>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
