import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import logoFooter from '../../assets/figma-welcome/logo-footer.png';
import socialsIcons from '../../assets/welcome-elements/socials-icons.png';
import exitArrow from '../../assets/tour-video/exit-arrow.png';
import supportButton from '../../assets/tour-video/support-button.png';

export const PrivacyPolicyScreen: React.FC = () => {
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
          left: '95px',
          top: '197px',
          width: '1020px',
          height: '320px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '80px',
            lineHeight: '1',
            color: 'white',
            whiteSpace: 'pre-wrap',
          }}>
            <p style={{ margin: 0 }}>политика конфиденциальности </p>
            <p style={{ margin: 0 }}>и обработки персональных данных</p>
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
                  Настоящая Политика конфиденциальности и обработки персональных данных (далее — Политика) определяет порядок обработки и защиты персональных данных пользователей, предоставляемых при использовании сайта, сервисов и услуг индивидуального предпринимателя.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>1. Общие положения</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  1.1. Настоящая Политика разработана в соответствии с Конституцией Российской Федерации, Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», иными нормативными правовыми актами Российской Федерации.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>1.2. Оператором персональных данных является:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>Индивидуальный предприниматель Мищенко Иван Сергеевич</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>ИНН: 440703001205</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>ОГРН: 323440000024387</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Юридический адрес: 157500, Россия, Костромская область, Шарьинский район, г. Шарья, Садовый переулок, д. 5
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  1.3. Используя сайт, оформляя заявки, регистрируясь, оплачивая услуги или иным образом взаимодействуя с Оператором, пользователь подтверждает своё согласие с настоящей Политикой.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  1.4. Оператор обрабатывает персональные данные законно, справедливо и ограничивается достижением конкретных, заранее определённых и законных целей.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>2. Цели обработки персональных данных</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Оператор обрабатывает персональные данные в следующих целях:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• предоставление доступа к сайту, сервисам и услугам;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• исполнение договорных обязательств;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• направление информационных и рекламных сообщений (с согласия пользователя);</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• проведение статистического и иного анализа использования сайта;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• обеспечение безопасности и предотвращение мошенничества.</p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>3. Состав персональных данных</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Оператор может обрабатывать следующие категории персональных данных:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• фамилия, имя, отчество;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• контактные данные (телефон, адрес электронной почты);</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• данные платёжных систем (при оплате услуг);</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• техническая информация о посещениях сайта (IP-адрес, тип браузера и операционной системы, время доступа, адреса запрашиваемых страниц и т.д.);</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• иные данные, предоставленные пользователем при взаимодействии с Оператором.</p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>4. Правовые основания обработки персональных данных</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Обработка персональных данных осуществляется на основании:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• согласия пользователя на обработку его персональных данных;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• заключённого договора между пользователем и Оператором;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• законодательства Российской Федерации.</p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>5. Порядок обработки персональных данных</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  5.1. Обработка персональных данных осуществляется с использованием средств автоматизации и без их использования.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  5.2. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий третьих лиц.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  5.3. Срок обработки персональных данных определяется достижением целей обработки, если иное не предусмотрено договором или законодательством.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>6. Передача персональных данных третьим лицам</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  6.1. Оператор не передаёт персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством РФ, или с явного согласия пользователя.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  6.2. Оператор может привлекать третьих лиц для обработки персональных данных (например, платёжные системы, хостинг-провайдеры), при этом обеспечивается конфиденциальность и безопасность данных.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>7. Права пользователя</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>Пользователь имеет право:</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• получать информацию о факте, целях и способах обработки его персональных данных;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• требовать уточнения, блокирования или уничтожения своих персональных данных;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>• отозвать согласие на обработку персональных данных;</p>
                <p style={{ margin: 0, marginBottom: '35px' }}>
                  • обжаловать действия или бездействие Оператора в уполномоченные органы или в судебном порядке.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Отзыв согласия на обработку персональных данных может быть направлен Оператору в письменной форме или по электронной почте.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>8. Cookie-файлы и аналитика</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Сайт может использовать cookie-файлы и иные технологии для анализа поведения пользователей и улучшения качества сервиса. Пользователь может отключить использование cookie в настройках своего браузера, однако это может повлиять на корректность работы сайта.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>9. Порядок отзыва согласия</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  Пользователь вправе в любой момент отозвать согласие на обработку персональных данных, направив уведомление Оператору. После получения такого уведомления обработка персональных данных прекращается, за исключением случаев, предусмотренных законодательством РФ.
                </p>

                <p style={{ margin: 0, marginBottom: '35px', fontWeight: 700 }}>10. Заключительные положения</p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  10.1. Оператор вправе вносить изменения в настоящую Политику без предварительного уведомления пользователя.
                </p>

                <p style={{ margin: 0, marginBottom: '35px' }}>
                  10.2. Актуальная версия Политики размещается в свободном доступе на сайте Оператора.
                </p>

                <p style={{ margin: 0 }}>
                  10.3. Все вопросы, связанные с обработкой персональных данных, пользователь может направить Оператору по контактным данным, указанным в настоящей Политике.
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
