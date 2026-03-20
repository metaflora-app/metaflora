import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
import reelsScrollWindowNew from '../../assets/laba-main/reels-scroll-window-new.png';
import returnButton from '../../assets/prompt-redesign/кнопка вернуть.png';
import sortButtonInactive from '../../assets/prompt-redesign/кнопка сортировка промпта неактив.png';
import newButtonInactive from '../../assets/prompt-redesign/кнопка новое неактив.png';
import recentButtonInactive from '../../assets/prompt-redesign/кнопка недавние неактив.png';
import favoriteButtonInactive from '../../assets/prompt-redesign/кнопка избранное неактив.png';
import workshopGif from '../../assets/prompt-redesign/мастерская в окошке флоры.gif';
import skeletonPrompt from '../../assets/prompt-redesign/скелет промпт.png';
import likeButton from '../../assets/prompt-redesign/кнопка лайк актив.png';
import articleBadge from '../../assets/prompt-redesign/плашка новое в статье.png';
import tinyLogo from '../../assets/prompt-redesign/лого очень маленькое.png';

const PROMPT_CARD_POSITIONS = [24, 1111];

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;
  const handleOpenPromptCard = () => navigate('/prompt-card');

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

        {[
          [returnButton, 220, 732],
          [sortButtonInactive, 467, 732],
          [newButtonInactive, 714, 732],
          [recentButtonInactive, 343, 811],
          [favoriteButtonInactive, 590, 811],
        ].map(([src, left, top], index) => (
          <img key={index} src={src as string} alt="" style={{ position: 'absolute', left: `${left}px`, top: `${top}px`, width: '247px', height: '80px', objectFit: 'contain' }} />
        ))}

        <div style={{ position: 'absolute', left: '145px', top: '921px', width: '884px', height: '1121px' }}>
          <img
            src={reelsScrollWindowNew}
            alt="окошко скролла промптов"
            style={{
              position: 'absolute',
              left: '-89px',
              top: '-79px',
              width: '1119px',
              height: '1499px',
              objectFit: 'fill',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          <div style={{ position: 'absolute', left: '54px', top: '58px', width: '776px', height: '1030px', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', pointerEvents: 'auto', zIndex: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '34px', paddingBottom: '34px' }}>
              {PROMPT_CARD_POSITIONS.map((top, index) => (
                <div key={`${top}-${index}`} style={{ position: 'relative', width: '776px', height: '995px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate' }}>
                  <div style={{ position: 'absolute', left: '32px', top: '35px', width: '712px', height: '699px', borderRadius: '58px', overflow: 'hidden' }}>
                    <img src={skeletonPrompt} alt="скелет промпт" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <img src={likeButton} alt="лайк" style={{ position: 'absolute', left: '68px', top: '56px', width: '68px', height: '68px', objectFit: 'contain' }} />
                  <img src={articleBadge} alt="новое" style={{ position: 'absolute', left: '598px', top: '69px', width: '113px', height: '40px', objectFit: 'fill' }} />

                  <button
                    type="button"
                    onClick={handleOpenPromptCard}
                    className="button-inner-glow"
                    style={{
                      position: 'absolute',
                      left: '274px',
                      top: '344px',
                      width: '230.942px',
                      height: '74.108px',
                      borderRadius: '62px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.9)',
                      padding: 0,
                      cursor: 'pointer',
                      zIndex: 999,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '18px',
                        width: '207px',
                        height: '27px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Cygre',
                        fontWeight: 700,
                        fontSize: '25px',
                        lineHeight: '1',
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      скопировать
                    </div>
                  </button>

                  <div style={{ position: 'absolute', left: '64px', top: '752px', width: '648px' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 700, fontSize: '48px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      ИИ-копирайтер для блога
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '44px', top: '809px', width: '689px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '33px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      настройте ИИ-копирайтера за один промпт, настройте ИИ-копирайтера
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '274px', top: '900px', width: '57px', height: '40px' }}>
                    <img src={tinyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>

                  <div style={{ position: 'absolute', left: '343px', top: '908px' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '25px', lineHeight: '1', color: 'rgba(255,255,255,0.6)' }}>
                      Редакция
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
