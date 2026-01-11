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
import pricingBackground2 from '../../assets/pricing/background2.png';
import infoIcon from '../../assets/pricing/info-icon.png';
import payButtonBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';
import priceButtonGreen from '../../assets/pricing/кнопка цена зеленая.png';
import priceButtonGray from '../../assets/pricing/кнопка цена серая.png';
import strikethroughLine from '../../assets/pricing/зачеркнута цена.png';
import badgeVygodno from '../../assets/pricing/выгодно кнопка.png';
import descriptionText from '../../assets/pricing/description-text.png';
import tooltip from '../../assets/pricing/tooltip.png';

export const PricingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showTooltip1, setShowTooltip1] = React.useState(false);
  const [showTooltip2, setShowTooltip2] = React.useState(false);

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

        {/* Фоновое изображение ПОД карточкой 1 месяц */}
        <div style={{
          position: 'absolute',
          left: '148px',
          top: '418px',
          width: '884px',
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
          left: '144px',
          top: '418px',
          width: '892px',
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

            {/* Иконка "i" - подробнее */}
            <img 
              src={infoIcon}
              alt="i"
              onClick={() => setShowTooltip1(!showTooltip1)}
              style={{
                position: 'absolute',
                left: '372px',
                top: '42px',
                width: '26px',
                height: '26px',
                cursor: 'pointer',
              }}
            />

            {/* Всплывашка про списание - PNG (показывается по клику) */}
            {showTooltip1 && (
              <img 
                src={tooltip}
                alt=""
                onClick={() => setShowTooltip1(false)}
                style={{
                  position: 'absolute',
                  left: 'calc(50% + 73.5px)',
                  top: '6px',
                  transform: 'translateX(-50%)',
                  width: '275px',
                  height: '42px',
                  cursor: 'pointer',
                }}
              />
            )}

            {/* Текст описания тарифа - PNG */}
            <img 
              src={descriptionText}
              alt=""
              style={{
                position: 'absolute',
                left: '52px',
                top: '148px',
                width: '802px',
                height: '400px',
              }}
            />

            {/* Кнопка "2690 руб." (зачеркнутая) - серая плашка */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 172px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}>
              <img 
                src={priceButtonGray}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* Текст цены */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                color: 'white',
              }}>
                2690 руб.
              </div>
              {/* Зачеркивание */}
              <img 
                src={strikethroughLine}
                alt=""
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '110px',
                }}
              />
            </div>

            {/* Кнопка "1990 руб." - зеленая плашка */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 348px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}>
              <img 
                src={priceButtonGreen}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* Текст цены */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                color: 'white',
              }}>
                1990 руб.
              </div>
            </div>
          </div>
        </div>

        {/* Фоновое изображение ПОД карточкой 3 месяца */}
        <div style={{
          position: 'absolute',
          left: '147px',
          top: '1082px',
          width: '884px',
          height: '348px',
          borderRadius: '24px',
        }}>
          <img 
            src={pricingBackground2}
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

        {/* КАРТОЧКА ТАРИФ "3 МЕСЯЦА" */}
        <div style={{
          position: 'absolute',
          left: '143px',
          top: '1082px',
          width: '892px',
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

            {/* Иконка "i" - подробнее */}
            <img 
              src={infoIcon}
              alt="i"
              onClick={() => setShowTooltip2(!showTooltip2)}
              style={{
                position: 'absolute',
                left: '372px',
                top: '42px',
                width: '26px',
                height: '26px',
                cursor: 'pointer',
              }}
            />

            {/* Всплывашка про списание - PNG (показывается по клику) */}
            {showTooltip2 && (
              <img 
                src={tooltip}
                alt=""
                onClick={() => setShowTooltip2(false)}
                style={{
                  position: 'absolute',
                  left: 'calc(50% + 73.5px)',
                  top: '6px',
                  transform: 'translateX(-50%)',
                  width: '275px',
                  height: '42px',
                  cursor: 'pointer',
                }}
              />
            )}

            {/* Текст описания тарифа (8 строк) */}
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
                <p style={{ margin: 0, lineHeight: '1' }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* академия: </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>большой цикл курсов по ИИ</span>
                </p>
                <p style={{ margin: 0, lineHeight: '1' }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* лаба: </span>
                </p>
                <p style={{ margin: 0, lineHeight: '1', fontFamily: 'Gotham Pro', fontWeight: 300 }}>контент-среда и личный креатор 24/7</p>
                <p style={{ margin: 0, lineHeight: '1' }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* цех: </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>промты для любой задачи</span>
                </p>
                <p style={{ margin: 0, lineHeight: '1' }}>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>доступ к </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 700 }}>МЕТАФЛОРА* полигон: </span>
                  <span style={{ fontFamily: 'Gotham Pro', fontWeight: 300 }}>статьи с разборами ИИ-новинок</span>
                </p>
                <p style={{ margin: 0, lineHeight: '1', fontFamily: 'Gotham Pro', fontWeight: 700 }}>а также: чат, канал и другие бонусы</p>
                <p style={{ margin: 0, lineHeight: '1', fontFamily: 'Gotham Pro', fontWeight: 700 }}>каждый месяц</p>
              </div>
            </div>

            {/* Кнопка "8070 руб." (зачеркнутая) - серая плашка */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 172px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}>
              <img 
                src={priceButtonGray}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* Текст цены */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                color: 'white',
              }}>
                8070 руб.
              </div>
              {/* Зачеркивание */}
              <img 
                src={strikethroughLine}
                alt=""
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '110px',
                }}
              />
            </div>

            {/* Кнопка "5490 руб." - зеленая плашка */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% + 348px)',
              top: '53px',
              transform: 'translateX(-50%)',
              width: '176px',
              height: '57px',
              cursor: 'pointer',
            }}>
              <img 
                src={priceButtonGreen}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* Текст цены */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Gotham Pro',
                fontWeight: 500,
                fontSize: '23px',
                color: 'white',
              }}>
                5490 руб.
              </div>
            </div>

            {/* Плашка "ВЫГОДНО" - ПОВЕРХ зелёной кнопки */}
            <img 
              src={badgeVygodno}
              alt="выгодно"
              style={{
                position: 'absolute',
                left: 'calc(50% + 390px)',
                top: '40px',
                width: '72px',
                height: '35px',
                zIndex: 100,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Кнопка "оплатить полный доступ" с красным градиентом */}
        <button
          onClick={() => navigate('/main-dashboard-free')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 1px)',
            top: '1744px',
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
