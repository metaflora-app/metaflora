import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';

export const MarketingConsentScreen: React.FC = () => {
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
          onClick={() => navigate('/welcome')}
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

        {/* Заголовок */}
        <div style={{
          position: 'absolute',
          left: '123px',
          top: '197px',
          width: '934px',
          height: '240px',
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
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0, lineHeight: '1' }}>согласие на получение информационной и рекламной рассылки</p>
          </div>
        </div>

        {/* Главная подложка (белая) */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 1px)',
          top: '560px',
          transform: 'translateX(-50%)',
          width: '888px',
          height: '1482px',
          backdropFilter: 'blur(50px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '30px',
        }} />

        {/* Карточка с текстом (черная подложка + скролл) */}
        <div style={{
          position: 'absolute',
          left: '198px',
          top: '608px',
          width: '784px',
          height: '1384px',
        }}>
          {/* Черная подложка */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(50px)',
            background: 'black',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            overflow: 'hidden',
          }}>
            {/* Скроллируемый контейнер с текстом */}
            <div style={{
              position: 'absolute',
              inset: '6.16% 3.83% 6.75% 3.7%',
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
                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Проставляя отметку (галочку) в чекбоксе «Согласен на получение информационной и рекламной рассылки», я свободно, своей волей и в своём интересе даю согласие Индивидуальному предпринимателю Мищенко Ивану Сергеевичу (ИНН 440703001205, ОГРН 323440000024387, юридический адрес: 157500, Россия, Костромская область, Шарьинский район, г. Шарья, Садовый переулок, д. 5) (далее — Продавец, Оператор)
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  на получение от Продавца информационной и рекламной рассылки, касающейся информации об услугах, продуктах, акциях, специальных предложениях, мероприятиях и иных новостях Продавца.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Информационная и рекламная рассылка может направляться следующими способами:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• по электронной почте на адрес, указанный мной при заполнении форм на сайте;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• в виде SMS-сообщений и сообщений в мессенджерах на номер телефона, указанный мной;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• иными средствами связи, предоставленными мной Продавцу.</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Цель обработки персональных данных — информирование пользователя о новостях, услугах и товарах Продавца, проведение маркетинговых и рекламных коммуникаций.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  В рамках указанной цели Продавец вправе осуществлять следующие действия с моими персональными данными: сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (предоставление, доступ), блокирование, удаление и уничтожение.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Обрабатываемые персональные данные включают:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• адрес электронной почты;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• номер телефона;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• иные данные, предоставленные мной добровольно при заполнении форм на сайте.</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Я уведомлён(а), что имею право в любой момент отказаться от получения информационной и рекламной рассылки:
                </p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• путём перехода по ссылке для отписки в электронном письме;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• либо направив уведомление об отказе на адрес электронной почты Продавца;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• либо иным способом, указанным в сообщении рассылки.</p>

                <p style={{ margin: 0 }}>
                  В случае отзыва настоящего согласия Продавец вправе продолжить обработку персональных данных без моего согласия при наличии оснований, предусмотренных пунктами 2–11 части 1 статьи 6, частью 2 статьи 10 и частью 2 статьи 11 Федерального закона № 152-ФЗ «О персональных данных».
                </p>
              </div>
            </div>
          </div>
        </div>

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
