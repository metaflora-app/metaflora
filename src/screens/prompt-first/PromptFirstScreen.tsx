import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, ThreeBg } from '../../components/ScreenLayout';
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

const PROMPT_CARD_OFFSETS = [24, 1111];
const figmaPromptPeopleBackdrop = 'https://www.figma.com/api/mcp/asset/f39d72bc-157d-4232-9f18-dca4c5669a06';
const figmaPromptLogoBackdrop = 'https://www.figma.com/api/mcp/asset/d94d68cd-a055-4a91-b14a-70e3041d4f6f';

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

        <div style={{ position: 'absolute', left: '182px', top: '927px', width: '832px', height: '1116px', overflow: 'hidden', pointerEvents: 'none' }}>
          <img
            src={figmaPromptPeopleBackdrop}
            alt=""
            style={{
              position: 'absolute',
              height: '105.83%',
              left: '-10.74%',
              top: '-0.86%',
              width: '113.22%',
              maxWidth: 'none',
            }}
          />
        </div>

        <div style={{ position: 'absolute', left: '113px', top: '836px', width: '997px', height: '1335px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: '1335px', height: '997px', transform: 'rotate(-90deg)' }}>
            <div style={{ position: 'absolute', left: '164.44px', top: '114.29px', width: '740.55px', height: '1035.86px', overflow: 'hidden' }}>
              <img
                src={figmaPromptLogoBackdrop}
                alt=""
                style={{
                  position: 'absolute',
                  height: '252.58%',
                  left: '-46.02%',
                  top: '-71.61%',
                  width: '188.85%',
                  maxWidth: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '151px',
            top: '920px',
            width: '884px',
            height: '1121px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <div style={{ position: 'absolute', left: '182px', top: '949px', width: '831px', height: '1064px', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', zIndex: 2 }}>
          <div style={{ position: 'relative', width: '831px', height: '2151px' }}>
            {PROMPT_CARD_OFFSETS.map((top, index) => (
              <div key={`${top}-${index}`} style={{ position: 'absolute', left: 0, top: `${index === 0 ? 0 : 1087}px`, width: '831px', height: '1064px', background: '#000', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '30px', boxSizing: 'border-box', overflow: 'hidden', isolation: 'isolate' }}>
                  <div style={{ position: 'absolute', left: '35px', top: '37px', width: '758px', height: '744px', borderRadius: '62px', overflow: 'hidden' }}>
                    <img src={skeletonPrompt} alt="скелет промпт" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <img src={likeButton} alt="лайк" style={{ position: 'absolute', left: '73px', top: '59px', width: '72px', height: '72px', objectFit: 'contain' }} />
                  <img src={articleBadge} alt="новое" style={{ position: 'absolute', left: '642px', top: '73px', width: '121px', height: '43px', objectFit: 'fill' }} />

                  <button
                    type="button"
                    onClick={handleOpenPromptCard}
                    className="button-inner-glow"
                    style={{
                      position: 'absolute',
                      left: '293px',
                      top: '366px',
                      width: '246.9305px',
                      height: '79.25px',
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
                        left: '13px',
                        top: '19px',
                        width: '223px',
                        height: '29.3116px',
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
                      ИИ-копирайтер для блога
                    </p>
                  </div>

                  <div style={{ position: 'absolute', left: '47px', top: '865px', width: '738px', height: '69px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontFamily: 'Cygre', fontWeight: 400, fontSize: '35px', lineHeight: '1', color: 'white', textAlign: 'center' }}>
                      настройте ИИ-копирайтера за один промпт, настройте ИИ-копирайтера
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
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};
