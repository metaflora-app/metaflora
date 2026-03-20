import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkshopPromptById } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import { FigmaPromptBadge } from '../../components/FigmaPills';
import likeButton from '../../assets/prompt-redesign/кнопка лайк актив.png';
import articleBadge from '../../assets/prompt-redesign/плашка новое в статье.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';
import skeletonPrompt from '../../assets/prompt-redesign/скелет промпт.png';
import mainBackdrop from '../../assets/shared-redesign/главная подложка новая.png';

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

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '760px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            достаточно одного клика, чтобы скопировать весь промпт
          </p>
        </div>

        <img src={mainBackdrop} alt="главная подложка" style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '1643px', objectFit: 'fill', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: '176px', top: '456px', width: '860px', height: '1536px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '35px', top: '37px', width: '758px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
            <img src={skeletonPrompt} alt="скелет промпт" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <img src={likeButton} alt="лайк" style={{ position: 'absolute', left: '42px', top: '34px', width: '72px', height: '72px', objectFit: 'contain' }} />
          {isNew ? <img src={articleBadge} alt="новое" style={{ position: 'absolute', right: '41px', top: '43px', width: '101px', height: '36px', objectFit: 'contain' }} /> : null}

          <div style={{ position: 'absolute', left: '98px', top: '786px', width: '665px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>{title}</p>
          </div>

          <div style={{ position: 'absolute', left: '286px', top: '885px', width: '61px', height: '43px' }}>
            <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ position: 'absolute', left: '377px', top: '893px', width: '140px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>Редакция</p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            style={{ position: 'absolute', left: '305px', top: '953px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <FigmaPromptBadge className="button-inner-glow" textOffsetY={7} style={{ width: '249px', height: '81px', display: 'block' }} />
          </button>

          <div style={{ position: 'absolute', left: '83px', top: '1057px', width: '694px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1.05', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{promptText}</p>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
