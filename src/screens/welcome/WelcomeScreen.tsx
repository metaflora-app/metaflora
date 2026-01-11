import React from 'react';
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import footerLogo from '../../assets/figma-welcome/footer-logo.png';
import socials from '../../assets/figma-welcome/socials.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        background: '#020101',
        overflow: 'auto',
      }}
    >
      {/* Background pattern - fixed */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          zIndex: 0,
        }}
      />

      {/* Content wrapper - scrollable */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            maxWidth: '1180px',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            marginBottom: '60px',
          }}
        >
          {/* Logo small */}
          <img
            src={logoSmall}
            alt="МЕТАФЛОРА*"
            style={{
              width: 'clamp(120px, 16vw, 189px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />

          {/* Support button */}
          <button
            onClick={() => {
              // TODO: Add support link
            }}
            style={{
              width: 'clamp(140px, 17vw, 205px)',
              height: 'clamp(50px, 6.6vw, 78px)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(50px)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              color: 'white',
              fontSize: 'clamp(14px, 1.7vw, 20px)',
              fontFamily: 'Gotham Pro',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              overflow: 'hidden',
            }}
          >
            <span style={{ fontWeight: 300 }}>написать</span>
            <span style={{ fontWeight: 700 }}>в поддержку</span>
          </button>
        </div>

        {/* Main title - "добро пожаловать в МЕТАФЛОРУ*" */}
        <div
          style={{
            width: '100%',
            maxWidth: '1180px',
            padding: '0 20px',
            marginBottom: '40px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: 'clamp(40px, 6.8vw, 80px)',
              lineHeight: 1,
              color: 'white',
              margin: 0,
              marginBottom: '25px',
            }}
          >
            добро пожаловать
            <br />в МЕТАФЛОРУ*
          </h1>

          {/* Subtitle - "обучайтесь AI..." */}
          <p
            style={{
              fontFamily: 'Gotham Pro',
              fontSize: 'clamp(20px, 3.4vw, 40px)',
              lineHeight: 1,
              color: 'white',
              margin: 0,
            }}
          >
            обучайтесь AI прямо в Telegram
            <br />
            <span style={{ fontWeight: 700 }}>с МЕТАФЛОРОЙ*:</span> академия, лаба, цех
            <br />и другие сервисы
          </p>
        </div>

        {/* Carousel container */}
        <div
          style={{
            width: '100%',
            maxWidth: '1180px',
            height: 'auto',
            position: 'relative',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(400px, 78.8vw, 930px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Left carousel card */}
            <div
              style={{
                position: 'absolute',
                left: 'clamp(-100px, -18vw, -213px)',
                width: 'clamp(200px, 44.9vw, 530px)',
                height: 'clamp(360px, 78.8vw, 930px)',
                transform: 'rotate(-5deg)',
                opacity: 0.8,
              }}
            >
              <img
                src={carouselLeft}
                alt="Carousel left"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '40px',
                }}
              />
            </div>

            {/* Center carousel card */}
            <div
              style={{
                position: 'relative',
                width: 'clamp(200px, 44.9vw, 530px)',
                height: 'clamp(360px, 78.8vw, 930px)',
                zIndex: 2,
              }}
            >
              <img
                src={carouselCenter}
                alt="Carousel center"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '40px',
                }}
              />
            </div>

            {/* Right carousel card */}
            <div
              style={{
                position: 'absolute',
                right: 'clamp(-100px, -18vw, -213px)',
                width: 'clamp(200px, 44.9vw, 530px)',
                height: 'clamp(360px, 78.8vw, 930px)',
                transform: 'rotate(5deg) scaleY(-1)',
                opacity: 0.8,
              }}
            >
              <img
                src={carouselRight}
                alt="Carousel right"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '40px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Pagination dots - "крутилка" */}
        <div
          style={{
            display: 'flex',
            gap: '11px',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '17px',
              height: '17px',
              borderRadius: '33px',
              background: '#d6d6d6',
            }}
          />
          <div
            style={{
              width: '63px',
              height: '17px',
              borderRadius: '33px',
              background: '#fffdfe',
            }}
          />
          <div
            style={{
              width: '17px',
              height: '17px',
              borderRadius: '33px',
              background: '#d6d6d6',
            }}
          />
        </div>

        {/* Tour button - "экскурсия по платформе" */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            width: '90%',
            maxWidth: '892px',
            height: 'clamp(70px, 11.8vw, 139px)',
            background: 'transparent',
            backdropFilter: 'blur(50px)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            color: 'white',
            fontSize: 'clamp(20px, 3.4vw, 40px)',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          экскурсия по платформе
        </button>

        {/* Try free button with gradient - "попробовать бесплатно" */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '892px',
            height: 'clamp(70px, 11.8vw, 139px)',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(50px)',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            color: 'white',
            fontSize: 'clamp(20px, 3.4vw, 40px)',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '60px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {/* Gradient blobs - colors */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(-120px, -16vw, -189.57px)',
              left: 'clamp(80px, 12.3vw, 145px)',
              width: 'clamp(300px, 48.8vw, 575.78px)',
              height: 'clamp(220px, 35.9vw, 423.34px)',
              background: '#37ecf7',
              borderRadius: '1568.56px',
              filter: 'blur(100px)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'clamp(-130px, -17.3vw, -203.51px)',
              left: 'clamp(150px, 24.5vw, 288.97px)',
              width: 'clamp(150px, 24vw, 283px)',
              height: 'clamp(180px, 29.1vw, 343.11px)',
              background: '#f0d825',
              borderRadius: '1568.56px',
              transform: 'rotate(12deg) skewX(-27.29deg)',
              filter: 'blur(100px)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'clamp(40px, 6.2vw, 73.04px)',
              left: 'clamp(210px, 34.2vw, 403.64px)',
              width: 'clamp(165px, 26.9vw, 317.09px)',
              height: 'clamp(150px, 24.3vw, 286.96px)',
              background: '#d5fc44',
              borderRadius: '1568.56px',
              filter: 'blur(100px)',
              zIndex: 0,
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>
            попробовать бесплатно
          </span>
        </button>

        {/* Footer - "подвал" */}
        <div
          style={{
            width: '100%',
            maxWidth: '904px',
            padding: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            marginBottom: '60px',
          }}
        >
          {/* Footer logo */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <img
              src={footerLogo}
              alt="МЕТАФЛОРА*"
              style={{
                width: 'clamp(250px, 49.7vw, 587px)',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Footer text and socials container */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Left - Privacy text */}
            <div
              style={{
                flex: '1 1 300px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Gotham Pro',
                fontSize: 'clamp(12px, 1.7vw, 20px)',
                lineHeight: 1,
                color: 'white',
              }}
            >
              <p style={{ margin: 0, marginBottom: '5px', fontWeight: 300 }}>
                нажимая на кнопку, вы соглашаетесь
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ fontWeight: 700 }}>с политикой конфиденциальности</span>{' '}
                <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
              </p>
            </div>

            {/* Right - Socials and marketing text */}
            <div
              style={{
                flex: '1 1 300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '15px',
              }}
            >
              {/* Socials button */}
              <div
                style={{
                  width: 'clamp(80px, 11vw, 130px)',
                  height: 'clamp(40px, 5.5vw, 65px)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(50px)',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '62px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={socials}
                  alt="Social media"
                  style={{
                    width: '70%',
                    height: 'auto',
                    objectFit: 'contain',
                    opacity: 0.6,
                  }}
                />
              </div>

              {/* Marketing text */}
              <div
                style={{
                  fontFamily: 'Gotham Pro',
                  fontSize: 'clamp(12px, 1.7vw, 20px)',
                  lineHeight: 1,
                  color: 'white',
                  textAlign: 'right',
                }}
              >
                <p style={{ margin: 0, marginBottom: '5px', fontWeight: 300 }}>
                  нажимая на кнопку, вы соглашаетесь
                </p>
                <p style={{ margin: 0, marginBottom: '5px', fontWeight: 700 }}>
                  на получение информационной
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>и рекламной рассылки</span>{' '}
                  <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
