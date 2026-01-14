import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Background pattern image
import bgPattern from '../../assets/figma-welcome/pattern.png';

export const PromptCardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyPrompt = async () => {
    const promptText = `Создай детальный, креативный промпт для генерации изображения в стиле цифрового искусства с элементами неореализма и футуризма. Тема: [вставь тему]. Стиль: [вставь стиль]. Детализация: высокая. Цветовая палитра: [вставь цвета]. Композиция: [вставь композицию]. Освещение: [вставь тип освещения].`;

    try {
      await navigator.clipboard.writeText(promptText);
      console.log('Prompt copied to clipboard');
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleBackToCatalog = () => {
    navigate('/prompt-first');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#020101',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Header Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          ←
        </button>

        <div
          style={{
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: '"Gotham Pro", sans-serif',
          }}
        >
          Карточка промпта
        </div>

        <div style={{ width: '40px' }} />
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto',
        }}
      >
        {/* Description Text */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '14px',
            fontFamily: '"Gotham Pro", sans-serif',
            padding: '0 16px',
          }}
        >
          описание: создайте и настройте копирайтера за один промпт
        </div>

        {/* Tab Indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '10px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #00E8FF 0%, #00DFF5 25%, #F0D825 50%, #B6FF3C 75%, #00E8FF 100%)',
              backgroundClip: 'content-box, border-box',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: '"Gotham Pro", sans-serif',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundImage: 'linear-gradient(90deg, #00E8FF 0%, #00DFF5 25%, #F0D825 50%, #B6FF3C 75%, #00E8FF 100%)',
              backgroundOrigin: 'border-box',
            }}
          >
            промпт
          </div>
        </div>

        {/* Prompt Content Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '20px',
          }}
        >
          {/* Image Placeholder (Top Half) */}
          <div
            style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '14px',
              fontFamily: '"Gotham Pro", sans-serif',
            }}
          >
            [Изображение промпта]
          </div>

          {/* Title */}
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: '"Gotham Pro", sans-serif',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            ИИ-копирайтер для блога
          </h2>

          {/* Prompt Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontFamily: '"Gotham Pro", sans-serif',
              }}
            >
              промпт
            </div>
          </div>

          {/* Prompt Text */}
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: '"Gotham Pro", sans-serif',
              marginBottom: '16px',
              maxHeight: isExpanded ? 'none' : '120px',
              overflow: 'hidden',
            }}
          >
            идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр: Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом
            {!isExpanded && (
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                ... [ещё текст]
              </span>
            )}
          </div>

          {/* Expand Button */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#00E8FF',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontFamily: '"Gotham Pro", sans-serif',
              }}
            >
              <span>+</span>
              развернуть
            </button>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button
              onClick={handleCopyPrompt}
              className="animated-border"
              style={{
                background: 'linear-gradient(90deg, #00E8FF 0%, #00DFF5 25%, #F0D825 50%, #B6FF3C 75%, #00E8FF 100%)',
                color: '#020101',
                border: 'none',
                borderRadius: '25px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: '"Gotham Pro", sans-serif',
                cursor: 'pointer',
                width: '100%',
                transition: 'transform 0.2s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              скопировать
            </button>

            <button
              onClick={handleBackToCatalog}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: '"Gotham Pro", sans-serif',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              вернуться к каталогу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
