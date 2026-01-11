import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';
import pricingBackground from '../../assets/pricing/background.png';
import strikethrough from '../../assets/pricing/strikethrough.png';
import infoIcon from '../../assets/pricing/info-icon.png';
import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';

export const PricingScreen: React.FC = () => {
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

        {/* Кнопка "выход" - готовая PNG */}
        <img 
          src={exitArrow}
          alt="назад"
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 452px)',
            top: '75px',
            width: '100px',
            height: '100px',
            cursor: 'pointer',
          }}
        />

        {/* Логотип маленький */}
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

        {/* Кнопка "написать в поддержку" */}
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

        {/* Заголовок "выберите вариант подписки" */}
        <div style={{
          position: 'absolute',
          left: '94px',
          top: '198px',
          width: '1020px',
          height: '160px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: 0,
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>выберите вариант подписки</p>
          </div>
        </div>

        {/* Фоновое изображение для карточек */}
        <div style={{
          position: 'absolute',
          left: '135px',
          top: '562px',
          width: '922px',
          height: '348px',
          borderRadius: '24px',
        }}>
          <img 
            src={pricingBackground}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '24px',
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* КАРТОЧКА ТАРИФ "1 МЕСЯЦ" */}
        <div style={{
          position: 'absolute',
          left: '131px',
          top: '418px',
          width: '930px',
          height: '603px',
        }}>
          {/* Внутренний контейнер карточки */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            {/* Заголовок "1 месяц" */}
            <div style={{
              position: 'absolute',
              inset: 'calc(6.97% - 4px) calc(43.23% - 4px) calc(79.77% - 4px) calc(6.77% - 4px)',
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
                <p style={{ margin: 0, lineHeight: '1' }}>1 месяц</p>
              </div>
            </div>

            {/* Обводка для подсказки */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 81.5px)',
              top: '6px',
              transform: 'translateX(-50%)',
              width: '275px',
              height: '42px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />

            {/* Текст подсказки */}
            <div style={{
              position: 'absolute',
              bottom: 'calc(93.2% - 4px)',
              left: 'calc(50% - 44px)',
              top: 'calc(3.48% - 4px)',
              width: '255px',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '10px',
                lineHeight: '1',
                color: 'white',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ marginBottom: 0 }}>списание средств происходит ежемесячно. </p>
                <p style={{ margin: 0 }}>Вы можете отменить подписку в любой момент</p>
              </div>
            </div>

            {/* Иконка подробнее */}
            <div style={{
              position: 'absolute',
              left: '372px',
              top: '42px',
              width: '26px',
              height: '26px',
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '33px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={infoIcon}
                  alt="i"
                  style={{
                    width: '11px',
                    height: '11px',
                  }}
                />
              </div>
            </div>

            {/* Текст описания тарифа (8 строк) */}
            <div style={{
              position: 'absolute',
              inset: 'calc(24.54% - 4px) calc(8.17% - 4px) calc(9.12% - 4px) calc(6.77% - 4px)',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontSize: '40px',
                lineHeight: '1',
                color: 'white',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* академия: </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>большой цикл курсов по ИИ</span>
                </p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* лаба: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>контент-среда и личный креатор 24/7</p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* цех: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>промты для любой задачи</p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* полигон: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>статьи с разборами ИИ-новинок</p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 700, margin: 0 }}>а также: общий чат, канал и бонусы каждый месяц</p>
              </div>
            </div>

            {/* Кнопка "2690 руб." (зачеркнутая) с белым градиентом */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 172px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              cursor: 'pointer',
            }}>
              {/* Белые блоки градиента */}
              <div style={{ position: 'absolute', left: '47px', top: '-77px' }}>
                <div style={{ position: 'absolute', width: '72.959px', height: '147.81px', left: '51px', top: '-68.13px', background: 'white', borderRadius: '1568.563px' }} />
                <div style={{ position: 'absolute', left: '69.25px', top: '-73px', width: '64.754px', height: '108.071px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'rotate(30.322deg) skewX(11.368deg)', width: '40.639px', height: '92.447px', background: 'white', borderRadius: '1568.563px' }} />
                </div>
                <div style={{ position: 'absolute', width: '40.179px', height: '100.192px', left: '83.77px', top: '23.56px', background: 'white', borderRadius: '1568.563px' }} />
              </div>
              {/* Текст "2690 руб." */}
              <div style={{
                position: 'absolute',
                inset: 'calc(12.56% - 4px) calc(21.94% - 4px) calc(83.94% - 4px) calc(61.94% - 4px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                lineHeight: 0,
                color: 'white',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, lineHeight: '1' }}>2690 руб.</p>
              </div>
              {/* Зачеркивание */}
              <div style={{
                position: 'absolute',
                inset: '14.26% 24.09% 85.74% 64.09%',
              }}>
                <img 
                  src={strikethrough}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: '-2px -1.87% 0 0',
                    width: '100%',
                    height: '100%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>

            {/* Кнопка "1990 руб." с зелёным градиентом */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 348px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              cursor: 'pointer',
            }}>
              {/* Цветные блоки градиента */}
              <div style={{ position: 'absolute', left: '52px', top: '-77px' }}>
                <div style={{ position: 'absolute', width: '70.322px', height: '147.81px', left: '56px', top: '-68.13px', background: '#37ecf7', borderRadius: '1568.563px' }} />
                <div style={{ position: 'absolute', left: '73.59px', top: '-73px', width: '62.414px', height: '108.071px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'rotate(31.249deg) skewX(12.824deg)', width: '39.549px', height: '92.108px', background: '#f0d825', borderRadius: '1568.563px' }} />
                </div>
                <div style={{ position: 'absolute', width: '38.727px', height: '100.192px', left: '87.59px', top: '23.56px', background: '#d5fc44', borderRadius: '1568.563px' }} />
              </div>
              {/* Текст "1990 руб." */}
              <div style={{
                position: 'absolute',
                bottom: 'calc(83.94% - 4px)',
                top: 'calc(12.56% - 4px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                lineHeight: 0,
                color: 'white',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, lineHeight: '1' }}>1990 руб.</p>
              </div>
            </div>
          </div>
        </div>

        {/* КАРТОЧКА ТАРИФ "3 МЕСЯЦА" */}
        <div style={{
          position: 'absolute',
          left: '131px',
          top: '1082px',
          width: '930px',
          height: '603px',
        }}>
          {/* Внутренний контейнер карточки */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'clip',
          }}>
            {/* Плашка "ВЫГОДНО" */}
            <div style={{
              position: 'absolute',
              inset: '6.97% 0.61% 87.36% 91.4%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '71.629px',
                height: '20.809px',
                transform: 'rotate(11.089deg)',
                background: 'linear-gradient(to right, #880709, #e90004 52.404%, #880709)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Текст "выгодно" */}
                <div style={{
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  fontSize: '10px',
                  color: 'white',
                }}>
                  выгодно
                </div>
              </div>
            </div>

            {/* Заголовок "3 месяца" */}
            <div style={{
              position: 'absolute',
              inset: 'calc(6.97% - 4px) calc(43.23% - 4px) calc(79.77% - 4px) calc(6.77% - 4px)',
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
                <p style={{ margin: 0, lineHeight: '1' }}>3 месяца</p>
              </div>
            </div>

            {/* Обводка для подсказки */}
            <div style={{
              position: 'absolute',
              inset: '1.33% 21.08% 91.71% 49.35%',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
            }} />

            {/* Текст подсказки */}
            <div style={{
              position: 'absolute',
              inset: '2.99% 21.61% 93.7% 50.97%',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 300,
                fontSize: '10px',
                lineHeight: '1',
                color: 'white',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ marginBottom: 0 }}>списание средств происходит ежемесячно. </p>
                <p style={{ margin: 0 }}>Вы можете отменить подписку в любой момент</p>
              </div>
            </div>

            {/* Иконка подробнее */}
            <div style={{
              position: 'absolute',
              inset: '7.63% 48.77% 88.06% 48.44%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '33px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={infoIcon}
                  alt="i"
                  style={{
                    width: '11px',
                    height: '11px',
                  }}
                />
              </div>
            </div>

            {/* Текст описания тарифа (9 строк) */}
            <div style={{
              position: 'absolute',
              inset: 'calc(24.88% - 4px) calc(5.04% - 4px) calc(8.79% - 4px) calc(6.73% - 4px)',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontSize: '40px',
                lineHeight: '1',
                color: 'white',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* академия: </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>большой цикл курсов по ИИ</span>
                </p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* лаба: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>контент-среда и личный креатор 24/7</p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* цех: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>промты для любой задачи</p>
                <p style={{ marginBottom: 0 }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* полигон: </span>
                </p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 300, marginBottom: 0 }}>статьи с разборами ИИ-новинок</p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 700, marginBottom: 0 }}>а также: чат, канал и другие бонусы</p>
                <p style={{ fontFamily: 'Gotham Pro', fontWeight: 700, margin: 0 }}>каждый месяц</p>
              </div>
            </div>

            {/* Кнопка "8070 руб." (зачеркнутая) с белым градиентом */}
            <div style={{
              position: 'absolute',
              inset: '9.45% 20.86% 81.09% 60.22%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              cursor: 'pointer',
            }}>
              {/* Белые блоки градиента */}
              <div style={{ position: 'absolute', left: '47px', top: '-77px' }}>
                <div style={{ position: 'absolute', width: '72.959px', height: '147.81px', left: '51px', top: '-68.13px', background: 'white', borderRadius: '1568.563px' }} />
                <div style={{ position: 'absolute', left: '69.25px', top: '-73px', width: '64.754px', height: '108.071px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'rotate(30.322deg) skewX(11.368deg)', width: '40.639px', height: '92.447px', background: 'white', borderRadius: '1568.563px' }} />
                </div>
                <div style={{ position: 'absolute', width: '40.179px', height: '100.192px', left: '83.77px', top: '23.56px', background: 'white', borderRadius: '1568.563px' }} />
              </div>
              {/* Текст "8070 руб." */}
              <div style={{
                position: 'absolute',
                bottom: 'calc(30.14% - 4px)',
                top: 'calc(32.88% - 4px)',
                left: 'calc(50% + 2.6px)',
                transform: 'translateX(-50%)',
                width: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                lineHeight: 0,
                color: 'white',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, lineHeight: '1' }}>8070 руб.</p>
              </div>
              {/* Зачеркивание */}
              <div style={{
                position: 'absolute',
                left: '32px',
                top: '25px',
                width: '110px',
                height: 0,
              }}>
                <img 
                  src={strikethrough}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: '-2px -1.82% 0 0',
                    width: '100%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>

            {/* Кнопка "5490 руб." с зелёным градиентом */}
            <div style={{
              position: 'absolute',
              inset: '9.45% 1.94% 81.09% 79.14%',
              backdropFilter: 'blur(50px)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              overflow: 'clip',
              cursor: 'pointer',
            }}>
              {/* Цветные блоки градиента */}
              <div style={{ position: 'absolute', left: '52px', top: '-77px' }}>
                <div style={{ position: 'absolute', width: '70.322px', height: '147.81px', left: '56px', top: '-68.13px', background: '#37ecf7', borderRadius: '1568.563px' }} />
                <div style={{ position: 'absolute', left: '73.59px', top: '-73px', width: '62.414px', height: '108.071px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'rotate(31.249deg) skewX(12.824deg)', width: '39.549px', height: '92.108px', background: '#f0d825', borderRadius: '1568.563px' }} />
                </div>
                <div style={{ position: 'absolute', width: '38.727px', height: '100.192px', left: '87.59px', top: '23.56px', background: '#d5fc44', borderRadius: '1568.563px' }} />
              </div>
              {/* Текст "5490 руб." */}
              <div style={{
                position: 'absolute',
                bottom: 'calc(30.14% - 4px)',
                top: 'calc(32.88% - 4px)',
                left: 'calc(50% + 2.6px)',
                transform: 'translateX(-50%)',
                width: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                lineHeight: 0,
                color: 'white',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, lineHeight: '1' }}>5490 руб.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка "оплатить полный доступ" с красным градиентом */}
        <button
          onClick={() => navigate('/main-dashboard-free')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1902px',
            transform: 'translateX(-50%)',
            width: '892px',
            height: '140px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {/* PNG кнопка с красным градиентом под текстом */}
          <img 
            src={payButtonBg}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />

          {/* Текст кнопки - поверх градиента */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            fontSize: '40px',
            color: 'white',
            textAlign: 'center',
          }}>
            оплатить полный доступ
          </div>
        </button>

        {/* Футер */}
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
            {/* Первая иконка */}
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
            
            {/* Группа иконок */}
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
