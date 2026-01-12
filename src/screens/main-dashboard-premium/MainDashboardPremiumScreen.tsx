import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import supportButton from '../../assets/tour-video/support-button.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import userPhoto from '../../assets/main-dashboard/фото из тг.png';
import metacoinIcon from '../../assets/main-dashboard/кружок подарки.png';
import academyBg from '../../assets/main-dashboard/фон академия.png';
import labaBg from '../../assets/main-dashboard/фон лаба.png';
import tsekhBg from '../../assets/main-dashboard/фон цех.png';
import poligonBg from '../../assets/main-dashboard/фон полигон.png';
import chatBg from '../../assets/main-dashboard/фон чат.png';
import topUpButton from '../../assets/main-dashboard/кнопка пополнить.png';
import goButton from '../../assets/main-dashboard/кнопка перейти.png';

export const MainDashboardPremiumScreen: React.FC = () => {
  const navigate = useNavigate();

  // Calculate scale based on viewport width (design width: 1180px)
  const scale = typeof window !== 'undefined' ? Math.min(window.innerWidth / 1180, 1) : 1;

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
        {/* Background pattern (фон точки) */}
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

        {/* Header - Маленькое лого */}
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

        {/* Header - Кнопка написать в поддержку */}
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

        {/* Большое лого (25:383) - САМОЕ ПЕРВОЕ, ПОД ВСЕМИ карточками, узкое */}
        <img 
          src={bigLogo}
          alt="МЕТАФЛОРА*"
          style={{
            position: 'absolute',
            left: '145px',
            top: '1210px',
            width: '890px',
            height: '814px',
            objectFit: 'contain',
          }}
        />

        {/* Кнопка "выход" */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/pricing')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Приветствие "Иван Сергеевич" (27:688) */}
        <div style={{
          position: 'absolute',
          left: '85px',
          top: '199px',
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
            <p style={{ margin: 0, lineHeight: '1' }}>Иван Сергеевич </p>
          </div>
        </div>

        {/* Блок баланса и метакоины */}
        <div style={{
          position: 'absolute',
          left: '80px',
          top: '327px',
          width: '1020px',
          height: '200px',
        }}>
          {/* Фото пользователя из ТГ (7:315) */}
          <img 
            src={userPhoto}
            alt="фото"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '159px',
              height: '159px',
              borderRadius: '79.5px',
            }}
          />

          {/* Текст "комьюнити" (7:311) */}
          <div style={{
            position: 'absolute',
            left: '193px',
            top: '28px',
            width: '357px',
            height: '40px',
            fontFamily: 'Gotham Pro',
            fontWeight: 300,
            fontSize: '40px',
            lineHeight: 0,
            color: 'white',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>комьюнити</p>
          </div>

          {/* Текст "доступ до 31.12" */}
          <div style={{
            position: 'absolute',
            left: '193px',
            top: '67px',
            width: '755px',
            height: '80px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: '1',
              color: 'white',
            }}>
              <p style={{ margin: 0, lineHeight: '1' }}>доступ до </p>
              <p style={{ margin: 0, lineHeight: '1' }}>31.12</p>
            </div>
          </div>

          {/* Иконка метакоинов - круг */}
          <div style={{
            position: 'absolute',
            left: '520px',
            top: '5px',
            width: '159px',
            height: '159px',
            borderRadius: '80px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
          }}>
            <img 
              src={metacoinIcon}
              alt="метакоины"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Текст "150 метакоинов" - Gotham Pro Bold */}
          <div style={{
            position: 'absolute',
            left: '678px',
            top: '35px',
            width: '347px',
            height: '45px',
            fontFamily: 'Gotham Pro',
            fontWeight: 700,
            fontSize: '45px',
            lineHeight: 0,
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>150 метакоинов</p>
          </div>

          {/* Кнопка "пополнить" - PNG */}
          <img 
            src={topUpButton}
            alt="пополнить"
            style={{
              position: 'absolute',
              left: '679px',
              top: '87px',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка Академия (27:687) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '538px',
          width: '894px',
          height: '249px',
        }}>
          {/* Фон академия - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '2.01% 49.78% 1.2% 0',
          }}>
            <img 
              src={academyBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '26px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 50.22%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Шторка (затемнение) со стрелкой */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 63.07%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: '40px',
              color: 'white',
            }}>
              →
            </div>
          </div>

          {/* Кнопка "открыть" */}
          <img 
            src={goButton}
            alt="открыть"
            onClick={() => navigate('/about-academy')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '91px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />

          {/* Плашка "новое" (27:630) */}
          <div style={{
            position: 'absolute',
            inset: '7.63% 52.81% 77.91% 32.18%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            overflow: 'clip',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'Gotham Pro',
              fontWeight: 500,
              fontSize: '18px',
              color: 'white',
            }}>
              новое
            </div>
          </div>
        </div>

        {/* Карточка Лаба (27:684) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '851px',
          width: '894px',
          height: '250px',
        }}>
          {/* Фон лаба - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 49.78% 0.4% 0',
          }}>
            <img 
              src={labaBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0.4% 0 0 50.22%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Шторка покороче со стрелкой */}
          <div style={{
            position: 'absolute',
            inset: '0.4% 0 0 80.45%',
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: '30px',
              color: 'white',
            }}>
              →
            </div>
          </div>

          {/* Кнопка "открыть" */}
          <img 
            src={goButton}
            alt="открыть"
            onClick={() => navigate('/about-laba')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '86px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка Цех (27:685) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1166px',
          width: '894px',
          height: '249px',
        }}>
          {/* Фон цех - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 49.68% 0 0',
          }}>
            <img 
              src={tsekhBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 50.32%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Кнопка "открыть" */}
          <img 
            src={goButton}
            alt="открыть"
            onClick={() => navigate('/about-prompt')}
            style={{
              position: 'absolute',
              left: '96px',
              top: '85px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка Полигон (27:686) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1480px',
          width: '894px',
          height: '249px',
        }}>
          {/* Фон полигон - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 50.05% 0 0',
          }}>
            <img 
              src={poligonBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 49.97%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Кнопка "открыть" */}
          <img 
            src={goButton}
            alt="открыть"
            onClick={() => navigate('/poligon-articles-all')}
            style={{
              position: 'absolute',
              left: '98px',
              top: '85px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Карточка Чат (27:692) */}
        <div style={{
          position: 'absolute',
          left: '141px',
          top: '1794px',
          width: '894px',
          height: '249px',
        }}>
          {/* Фон чат - левая половина */}
          <div style={{
            position: 'absolute',
            inset: '0 50.44% 0 0',
          }}>
            <img 
              src={chatBg}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '30px',
              }}
            />
          </div>

          {/* Текст справа - черная карточка */}
          <div style={{
            position: 'absolute',
            inset: '0 0 0 49.56%',
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            <div style={{
              position: 'absolute',
              inset: '8.43% 4% 8.43% 4%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              fontFamily: 'Gotham Pro',
              fontWeight: 300,
              fontSize: '23px',
              lineHeight: '1.1',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0 }}>
                Курс «Система» — про то, как выстраивать процессы, а не тушить пожары. Ты собираешь понятную логику: цель → действия → результат, без хаоса и лишних шагов. На выходе — рабочая система, которую можно повторять и масштабировать.
              </p>
            </div>
          </div>

          {/* Кнопка "открыть" */}
          <img 
            src={goButton}
            alt="открыть"
            style={{
              position: 'absolute',
              left: '89px',
              top: '88px',
              width: '257px',
              height: '73px',
              cursor: 'pointer',
            }}
          />
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
          {/* Логотип в подвале */}
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
          
          {/* Copyright текст */}
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
          
          {/* Подложка под соцсети */}
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
          
          {/* Иконки соцсетей */}
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
