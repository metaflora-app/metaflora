import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import homeIcon from '../../assets/about-screens/домой.png';
import peopleLogo from '../../assets/about-screens/лого люди на фон.png';
import promptButton from '../../assets/about-screens/промпт плашка.png';
import materialsButton from '../../assets/about-screens/кнопка материалы.png';

export const AcademyLessonMaterialsScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

  // Dynamic content flags
  const hasPrompts = true; // Можно сделать динамическим
  const hasMaterials = true; // Можно сделать динамическим

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#020101',
      overflow: 'hidden',
    }}>
      {/* Scaled container */}
      <div style={{
        position: 'relative',
        width: '1180px',
        minHeight: '2550px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '1180px',
          height: '2550px',
          backgroundImage: `url(${bgPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }} />

        {/* Header */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/academy-lesson-video')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        <img 
          src={homeIcon}
          alt="домой"
          onClick={() => navigate('/main-dashboard-premium')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 352px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        <div style={{
          position: 'absolute',
          left: '500px',
          top: '61px',
          width: '186px',
          height: '131px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={logoSmall}
              alt="МЕТАФЛОРА*"
              style={{
                position: 'absolute',
                height: '131.84%',
                left: '-21.84%',
                top: '-16.38%',
                width: '143.34%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        <img 
          src={supportButton}
          alt="написать в поддержку"
          style={{
            position: 'absolute',
            left: '829px',
            top: '97px',
            width: '205px',
            height: '78px',
            cursor: 'pointer',
          }}
        />

        {/* Заголовок "материалы урока" (7:2066) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '193px',
          width: '1020px',
          height: '80px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>материалы урока</p>
          </div>
        </div>

        {/* Подзаголовок (7:2067) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '292px',
          width: '880px',
          height: '104px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '40px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>внутри: </span>
              <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>саммари урока, исползованные промпты, файлы генераций</span>
            </p>
          </div>
        </div>

        {/* Лого "люди на фоне" (32:755) */}
        <div style={{
          position: 'absolute',
          inset: '38.39% 11.78% 23.69% 12.37%',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <img 
              src={peopleLogo}
              alt="МЕТАФЛОРА*"
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
        </div>

        {/* Белая подложка (32:710) */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 1px)',
          top: '399px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '1643px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Черная карточка со скроллом (32:840) */}
        <div style={{
          position: 'absolute',
          left: '198px',
          top: '452px',
          width: '784px',
          height: '1536px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}>
            {/* Скроллируемый контейнер */}
            <div style={{
              position: 'absolute',
              inset: '20px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              <div style={{
                fontFamily: 'TT Commons',
                fontWeight: 300,
                fontSize: '35px',
                lineHeight: '1.2',
                color: 'white',
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
              }}>
                {/* Заголовок внутри (32:715) */}
                <p style={{ 
                  margin: 0, 
                  marginBottom: '20px',
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: '52px',
                }}>
                  морфинг через общие элементы
                </p>

                {/* Описание (32:716) */}
                <p style={{ margin: 0, marginBottom: '20px' }}>
                  идея в том, чтобы в конце одного кадра был объект, похожий по форме или цвету на объект в начале следующего. Допустим, вы хотите перейти от сцены с костром к восходу солнца. Тогда в первом клипе огонь должен постепенно заполнить весь кадр:
                </p>

                {/* Блок с промптами (условный) */}
                {hasPrompts && (
                  <>
                    {/* Кнопка "промпт" - PNG (32:726) */}
                    <div style={{ textAlign: 'center', margin: '15px 0' }}>
                      <img 
                        src={promptButton}
                        alt="промпт"
                        style={{
                          width: '257px',
                          height: '73px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>

                    {/* Текст промптов - меньшие отступы (32:717) */}
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      А второй клип начинается с солнца, которое тоже заполняет кадр:
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>&nbsp;</p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      A bright orange sun rising over the ocean horizon, starting as a small glowing orb that fills the frame, golden light reflecting on water.
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      Оба объекта оранжевые, оба занимают весь экран — нейросеть сама выстроит между ними.
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>&nbsp;</p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      A close-up of a campfire burning intensely, flames dancing and flickering, the fire gradually fills the entire frame, warm orange glow.
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      А второй клип начинается с солнца, которое тоже заполняет кадр:
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>&nbsp;</p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      A bright orange sun rising over the ocean horizon, starting as a small glowing orb that fills the frame, golden light reflecting on water.
                    </p>
                    <p style={{ margin: 0, marginBottom: '15px' }}>
                      Оба объекта оранжевые, оба занимают весь экран — нейросеть сама выстроит между ними.
                    </p>
                  </>
                )}

                {/* Блок с материалами (условный) */}
                {hasMaterials && (
                  <>
                    {/* Кнопка "материалы" - PNG (32:749) */}
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                      <img 
                        src={materialsButton}
                        alt="материалы"
                        style={{
                          width: '257px',
                          height: '73px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>

                    {/* Текст "скачать файлы (5)" с плюсиком (32:735, 32:737) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '15px',
                      marginTop: '15px',
                    }}>
                      <div style={{
                        fontFamily: 'Gotham Pro',
                        fontWeight: 500,
                        fontSize: '32px',
                        lineHeight: 0,
                      }}>
                        <p style={{ margin: 0, lineHeight: '1' }}>скачать файлы (5)</p>
                      </div>
                      <div 
                        onClick={() => {
                          // Отправить материалы в чат с ботом
                          alert('Материалы будут отправлены в чат с ботом');
                        }}
                        style={{
                          width: '35px',
                          height: '35px',
                          backdropFilter: 'blur(50px)',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '24px',
                          color: 'white',
                        }}
                      >
                        +
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 5px)',
          top: '2071px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '124px',
        }}>
          <div style={{
            position: 'absolute',
            width: '380px',
            height: '83px',
            left: '2px',
            top: '-16px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <img 
                src={logoFooter}
                alt="МЕТАФЛОРА*"
                style={{
                  position: 'absolute',
                  height: '526.54%',
                  left: '-37.89%',
                  top: '-202.47%',
                  width: '170.37%',
                  maxWidth: 'none',
                }}
              />
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '56px',
            width: '433px',
            height: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '20px',
            lineHeight: '0',
            color: 'white',
          }}>
            <p style={{ 
              margin: 0,
              lineHeight: 'normal',
              whiteSpace: 'pre-wrap',
            }}>
              Copyright © Все права защищены.
            </p>
          </div>
          
          <div style={{
            position: 'absolute',
            left: '664px',
            top: '-2px',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            height: '78px',
            width: '230px',
          }} />
          
          <div style={{
            position: 'absolute',
            left: '681px',
            top: '13px',
            width: '196px',
            height: '51px',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Telegram"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-377.92%',
                    top: '-118.33%',
                    width: '517.92%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
            
            <div style={{
              position: 'absolute',
              left: '54px',
              top: 0,
              width: '142px',
              height: '51px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.6,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <img 
                  src={socialsIcons}
                  alt="Соцсети"
                  style={{
                    position: 'absolute',
                    height: '339.84%',
                    left: '-16.64%',
                    top: '-118.33%',
                    width: '183.64%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
