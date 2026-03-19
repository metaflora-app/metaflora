import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from './ScreenLayout';
import { convertPngToJpeg } from '../utils/imageConverter';
import { FigmaDownloadIconButton, FigmaMaterialsBadge, FigmaPromptBadge } from './FigmaPills';

interface ContentBlockLike {
  id: string;
  type: string;
  content: any;
}

interface MaterialsContentScreenProps {
  homeRoute: string;
  heading: string;
  subtitleLines: string[];
  contentTitle: string;
  contentBlocks: ContentBlockLike[];
  downloadCount: number;
  onSendMaterials: () => void;
  onContentScroll?: React.UIEventHandler<HTMLDivElement>;
  badgeTheme?: 'academy' | 'article';
}

export const MaterialsContentScreen: React.FC<MaterialsContentScreenProps> = ({
  homeRoute,
  heading,
  subtitleLines,
  contentTitle,
  contentBlocks,
  downloadCount,
  onSendMaterials,
  onContentScroll,
  badgeTheme = 'academy',
}) => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);

  const renderBlock = (block: ContentBlockLike) => {
    if (block.type === 'text') {
      return (
        <div key={block.id} style={{ marginBottom: '30px', fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
          {block.content}
        </div>
      );
    }

    if (block.type === 'image') {
      const imageUrl = convertPngToJpeg(block.content);
      return (
        <div key={block.id} style={{ position: 'relative', width: '760px', margin: '30px auto' }}>
          <img
            src={imageUrl}
            alt="изображение"
            loading="eager"
            crossOrigin="anonymous"
            onClick={() => setExpandedImage(imageUrl)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== block.content) {
                target.src = block.content;
              }
            }}
            style={{ width: '760px', display: 'block', borderRadius: '20px', cursor: 'pointer' }}
          />
        </div>
      );
    }

    if (block.type === 'prompt') {
      return (
        <div key={block.id} style={{ margin: '28px 0 30px' }}>
          <FigmaPromptBadge className="button-inner-glow" style={{ display: 'block', margin: '0 auto 24px' }} />
          <div style={{ fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
            {block.content}
          </div>
        </div>
      );
    }

    if (block.type === 'materials') {
      return (
        <div key={block.id} style={{ margin: '34px 0 10px' }}>
          <FigmaMaterialsBadge className="button-inner-glow" style={{ display: 'block', margin: '0 auto 24px' }} />
          <button
            type="button"
            onClick={onSendMaterials}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '14px auto 0',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'Cygre', fontWeight: 700, fontSize: '32px', lineHeight: '1', color: 'white', transform: 'translateY(1px)' }}>
              скачать файлы ({downloadCount})
            </span>
            <FigmaDownloadIconButton className="button-inner-glow" style={{ marginTop: '2px' }} />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <img src={expandedImage} alt="fullscreen" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020101', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '1180px', minHeight: '2550px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ThreeBg />
          <Header onLogoClick={() => navigate(homeRoute)} />

          <div style={{ position: 'absolute', left: '85px', top: '207px', width: '1020px' }}>
            <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '80px', lineHeight: '1', color: 'white' }}>{heading}</p>
          </div>

          <div style={{ position: 'absolute', left: '85px', top: '291px', width: '915px' }}>
            {subtitleLines.map((line, index) => (
              <p key={`${heading}-${index}`} style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '40px', lineHeight: '1', color: 'white', whiteSpace: 'pre-wrap' }}>
                {line}
              </p>
            ))}
          </div>

          <div style={{ position: 'absolute', left: '141px', top: '399px', width: '894px', height: '1643px', backdropFilter: 'blur(50px)', background: 'rgba(255,255,255,0.1)', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px' }} />

          <div style={{ position: 'absolute', left: '175px', top: '437px', width: '826px', height: '1569px', backdropFilter: 'blur(50px)', background: 'black', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', overflow: 'hidden' }}>
            <div
              onScroll={onContentScroll}
              style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '40px 25px 110px', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)', maskImage: 'linear-gradient(to bottom, black calc(100% - 70px), transparent 100%)' }}
            >
              <h2 style={{ margin: '0 0 34px', fontFamily: 'Cygre', fontWeight: 700, fontSize: '52px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                {contentTitle}
              </h2>
              {contentBlocks.map(renderBlock)}
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};
