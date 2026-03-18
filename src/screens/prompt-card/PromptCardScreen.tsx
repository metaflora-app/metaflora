import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkshopPromptById } from '../../utils/contentApi';
import type { WorkshopPrompt } from '../../types/content';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import likeIcon from '../../assets/лайк.png';
import fallbackCover from '../../assets/prompt-card/фото для карточки промпта.png';
import articleBadge from '../../assets/prompt-redesign/плашка новое в статье.png';
import promptBadge from '../../assets/prompt-redesign/плашка промпт.png';
import mainCardUnderlay from '../../assets/prompt-redesign/большая главная подложка.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        showPopup: (params: { message: string }) => void;
      };
    };
  }
}

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<WorkshopPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  useEffect(() => {
    const saveToRecent = (promptId: string) => {
      try {
        const recent = JSON.parse(localStorage.getItem('metaflora_recent_prompts') || '[]');
        const updated = [promptId, ...recent.filter((itemId: string) => itemId !== promptId)].slice(0, 20);
        localStorage.setItem('metaflora_recent_prompts', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving to recent:', err);
      }
    };

    const loadPrompt = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getWorkshopPromptById(id);

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.data) {
          throw new Error('Промпт не найден');
        }

        setPrompt(result.data);
        saveToRecent(id);
      } catch (err) {
        console.error('Error loading prompt:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id]);

  const isNew = useMemo(() => prompt?.filter_tags?.some((tag) => tag === 'новое' || tag === 'новые') ?? false, [prompt]);

  const handleCopy = async () => {
    const promptText = prompt?.prompt_text || '';

    if (!promptText) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      } else {
        const area = document.createElement('textarea');
        area.value = promptText;
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }

      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({ message: 'Скопировано в буфер обмена' });
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThreeBg />
        <Header onLogoClick={() => navigate('/main-dashboard-premium')} />

        <div style={{ position: 'absolute', left: '85px', top: '193px', width: '1020px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>
            карточка промпта
          </p>
        </div>

        <div style={{ position: 'absolute', left: '85px', top: '273px', width: '760px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white' }}>
            достаточно одного клика, чтобы скопировать весь промпт
          </p>
        </div>

        <img src={mainCardUnderlay} alt="главная подложка" style={{ position: 'absolute', left: '141px', top: '402px', width: '894px', height: '1643px', objectFit: 'fill', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', left: '192px', top: '509px', width: '796px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontFamily: 'Cygre', fontSize: '32px', color: 'rgba(255,255,255,0.7)' }}>
              загружаем промпт
            </div>
          ) : error ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontFamily: 'Cygre', fontSize: '32px', color: '#ff7b7b', textAlign: 'center', padding: '40px' }}>
              {error}
            </div>
          ) : (
            <img
              src={prompt?.cover_image_url || fallbackCover}
              alt={prompt?.title || 'prompt cover'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== fallbackCover) {
                  target.src = fallbackCover;
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        <img src={likeIcon} alt="лайк" style={{ position: 'absolute', left: '214px', top: '531px', width: '20px', height: '20px' }} />
        {isNew ? <img src={articleBadge} alt="новое" style={{ position: 'absolute', right: '194px', top: '531px', width: '101px', height: '36px', objectFit: 'contain' }} /> : null}

        <div style={{ position: 'absolute', left: '255px', top: '1240px', width: '666px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
            {prompt?.title || 'ИИ-копирайтер для блога'}
          </p>
        </div>

        <div style={{ position: 'absolute', left: '462px', top: '1340px', width: '61px', height: '43px' }}>
          <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', left: '537px', top: '1350px' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '27px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
            Редакция
          </p>
        </div>

        <img
          src={promptBadge}
          alt="промпт"
          className="button-inner-glow"
          onClick={handleCopy}
          style={{ position: 'absolute', left: '465px', top: '1409px', width: '247px', height: '80px', objectFit: 'contain', cursor: 'pointer' }}
        />

        <div onClick={handleCopy} style={{ position: 'absolute', left: '223px', top: '1513px', width: '729px', minHeight: '315px', cursor: 'pointer' }}>
          <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
            {prompt?.prompt_text || 'Промпт пока недоступен'}
          </p>
        </div>

        <Footer />
      </div>
    </div>
  );
};
