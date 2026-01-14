import { useNavigate } from 'react-router-dom';

export const LabaLoadingScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      backgroundColor: '#020101',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      padding: '0 24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '75px 0 60px',
        gap: '20px'
      }}>
        {/* Back button */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate(-1)}
        >
          <div style={{ transform: 'rotate(270deg)', fontSize: '24px' }}>←</div>
        </div>

        {/* Home button */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/main-dashboard-premium')}
        >
          <div style={{ fontSize: '32px' }}>🎴</div>
        </div>

        {/* Logo */}
        <div style={{
          height: '131px',
          width: '186px',
          backgroundImage: 'url(/src/assets/figma-welcome/splash-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }} />

        {/* Support button */}
        <div style={{
          width: '205px',
          height: '78px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          textAlign: 'center',
          lineHeight: '1.2',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 300
        }}>
          написать<br/>
          <strong style={{ fontWeight: 'bold' }}>в поддержку</strong>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        marginTop: '100px',
        position: 'relative'
      }}>
        {/* Left Panel */}
        <div style={{
          width: '428px',
          height: '1820px',
          borderRadius: '30px',
          border: '4px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          backgroundImage: 'url(/src/assets/слева.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />

        {/* Right Panel */}
        <div style={{
          width: '428px',
          height: '1820px',
          borderRadius: '30px',
          border: '4px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          backgroundImage: 'url(/src/assets/справа.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />

        {/* Open Button */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '16px 32px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '30px',
          fontSize: '19px',
          fontWeight: 'bold',
          color: 'black',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          border: '2px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(10px)'
        }}
        onClick={() => navigate('/laba-main')}
        >
          открыть
        </div>
      </div>

      {/* Bottom Sidebar */}
      <div style={{
        position: 'fixed',
        bottom: '180px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '688px',
        height: '139px'
      }}>
        {/* Sidebar Background */}
        <img 
          src="/src/assets/laba-sidebar/sidebar-bg.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '62px',
            pointerEvents: 'none'
          }}
        />
        
        {/* Navigation Icons - positioned based on Figma 7:665 */}
        {/* Icon 1: на главную лабы - left: 303px */}
        <img 
          src="/src/assets/laba-sidebar/icon-main.png"
          alt="на главную лабы"
          onClick={() => navigate('/laba-main')}
          style={{
            position: 'absolute',
            left: '113px',
            top: '6px',
            width: '129px',
            height: '127px',
            cursor: 'pointer'
          }}
        />
        
        {/* Icon 3: на избранное - left: 598px */}
        <img 
          src="/src/assets/laba-sidebar/icon-favorites.png"
          alt="на избранное"
          onClick={() => navigate('/laba-favorites')}
          style={{
            position: 'absolute',
            left: '408px',
            top: '8px',
            width: '129px',
            height: '124px',
            cursor: 'pointer'
          }}
        />
        
        {/* Icon 4: на экран пополнения баланса - left: 741px */}
        <img 
          src="/src/assets/laba-sidebar/icon-balance.png"
          alt="на экран пополнения баланса"
          onClick={() => navigate('/metacoins')}
          style={{
            position: 'absolute',
            left: '551px',
            top: '4px',
            width: '129px',
            height: '132px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* OVERLAY: Icon 2 - на экран анализа ПОВЕРХ ВСЕГО */}
      <img 
        src="/src/assets/laba-sidebar/icon-analysis-overlay.png"
        alt="на экран анализа"
        onClick={() => navigate('/laba-no-tracked')}
        style={{
          position: 'fixed',
          bottom: '187px',
          left: '50%',
          transform: 'translateX(-50%)',
          marginLeft: '-154px',
          width: '129px',
          height: '126px',
          cursor: 'pointer',
          zIndex: 9999
        }}
      />

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '124px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px',
        backgroundColor: 'rgba(2,1,1,0.8)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          width: '380px',
          height: '83px',
          backgroundImage: 'url(/src/assets/figma-welcome/footer-logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }} />
        
        <div style={{
          fontSize: '20px',
          color: 'white',
          fontFamily: 'Gotham Pro, sans-serif',
          fontWeight: 300
        }}>
          Copyright © Все права защищены.
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '62px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '4px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(50px)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '51px', 
            opacity: 0.6,
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }} />
        </div>
      </div>
    </div>
  );
};