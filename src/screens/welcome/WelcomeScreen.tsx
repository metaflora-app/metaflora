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
      {/* Background pattern */}
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

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            marginTop: '10px',
          }}
        >
          {/* Logo */}
          <img
            src={logoSmall}
            alt="МЕТАФЛОРА*"
            style={{
              width: '120px',
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
              width: 'auto',
              minWidth: '140px',
              height: '50px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(50px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'Gotham Pro',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.2,
              padding: '8px 16px',
            }}
          >
            <span style={{ fontWeight: 300 }}>написать</span>
            <span style={{ fontWeight: 700 }}>в поддержку</span>
          </button>
        </div>

        {/* Main title */}
        <div
          style={{
            width: '100%',
            marginBottom: '30px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: 'clamp(32px, 8vw, 80px)',
              lineHeight: 1,
              color: 'white',
              margin: 0,
              marginBottom: '15px',
            }}
          >
            добро пожаловать
            <br />в МЕТАФЛОРУ*
          </h1>
          <p
            style={{
              fontFamily: 'Gotham Pro',
              fontSize: 'clamp(16px, 4vw, 40px)',
              lineHeight: 1.2,
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

        {/* Carousel */}
        <div
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '9/16',
            maxHeight: '500px',
            position: 'relative',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Left card */}
          <img
            src={carouselLeft}
            alt="Carousel left"
            style={{
              position: 'absolute',
              left: '-10%',
              width: '45%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '20px',
              transform: 'rotate(-5deg)',
              opacity: 0.7,
            }}
          />

          {/* Center card */}
          <img
            src={carouselCenter}
            alt="Carousel center"
            style={{
              position: 'relative',
              width: '50%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '20px',
              zIndex: 2,
            }}
          />

          {/* Right card */}
          <img
            src={carouselRight}
            alt="Carousel right"
            style={{
              position: 'absolute',
              right: '-10%',
              width: '45%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '20px',
              transform: 'rotate(5deg) scaleY(-1)',
              opacity: 0.7,
            }}
          />
        </div>

        {/* Pagination dots */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#d6d6d6',
            }}
          />
          <div
            style={{
              width: '40px',
              height: '12px',
              borderRadius: '12px',
              background: '#fffdfe',
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#d6d6d6',
            }}
          />
        </div>

        {/* Tour button */}
        <button
          onClick={() => navigate('/tour-video')}
          style={{
            width: '90%',
            maxWidth: '500px',
            height: '70px',
            background: 'transparent',
            backdropFilter: 'blur(50px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            color: 'white',
            fontSize: 'clamp(16px, 4vw, 28px)',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '15px',
          }}
        >
          экскурсия по платформе
        </button>

        {/* Try free button with gradient */}
        <button
          onClick={() => navigate('/demo-access')}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '500px',
            height: '70px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(50px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '62px',
            color: 'white',
            fontSize: 'clamp(16px, 4vw, 28px)',
            fontFamily: 'Gotham Pro',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '40px',
            overflow: 'hidden',
          }}
        >
          {/* Gradient background */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              left: '20%',
              width: '200px',
              height: '200px',
              background: '#37ecf7',
              borderRadius: '1568px',
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '40%',
              width: '150px',
              height: '150px',
              background: '#f0d825',
              borderRadius: '1568px',
              transform: 'rotate(12deg)',
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              width: '150px',
              height: '150px',
              background: '#d5fc44',
              borderRadius: '1568px',
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>
            попробовать бесплатно
          </span>
        </button>

        {/* Footer */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            marginTop: '20px',
            marginBottom: '40px',
          }}
        >
          {/* Logo */}
          <img
            src={footerLogo}
            alt="МЕТАФЛОРА*"
            style={{
              width: 'min(80%, 300px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />

          {/* Privacy text */}
          <p
            style={{
              fontFamily: 'Gotham Pro',
              fontSize: 'clamp(10px, 2.5vw, 14px)',
              lineHeight: 1.3,
              color: 'white',
              margin: 0,
              textAlign: 'center',
            }}
          >
            <span style={{ fontWeight: 300 }}>нажимая на кнопку, вы соглашаетесь</span>
            <br />
            <span style={{ fontWeight: 700 }}>с политикой конфиденциальности</span>{' '}
            <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
          </p>

          {/* Socials button */}
          <div
            style={{
              width: '80px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(50px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '62px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={socials}
              alt="Social media"
              style={{
                width: '60%',
                height: 'auto',
                objectFit: 'contain',
                opacity: 0.6,
              }}
            />
          </div>

          {/* Marketing text */}
          <p
            style={{
              fontFamily: 'Gotham Pro',
              fontSize: 'clamp(10px, 2.5vw, 14px)',
              lineHeight: 1.3,
              color: 'white',
              margin: 0,
              textAlign: 'center',
            }}
          >
            <span style={{ fontWeight: 300 }}>нажимая на кнопку, вы соглашаетесь</span>
            <br />
            <span style={{ fontWeight: 700 }}>на получение информационной</span>
            <br />
            <span style={{ fontWeight: 700 }}>и рекламной рассылки</span>{' '}
            <span style={{ fontWeight: 700 }}>МЕТАФЛОРА*</span>
          </p>
        </div>
      </div>
    </div>
  );
};
