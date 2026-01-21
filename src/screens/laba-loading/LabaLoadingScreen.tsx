import { useNavigate } from 'react-router-dom';
import favoritesIcon from '../../assets/laba-main-buttons/на избранное.png';
import bgPattern from '../../assets/figma-welcome/pattern.png';

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
      {/* Background pattern - full screen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '75px 0 60px',
        gap: '20px'
      }}>
        {/* Back button */}
        <div className="blur-wave" style={{
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
        <div className="blur-wave" style={{
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
        <div className="blur-wave" style={{
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
      <div className="blur-wave" style={{
        position: 'fixed',
        bottom: '180px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '688px',
        height: '139px',
        borderRadius: '62px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '4px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(50px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 60px'
      }}>
        {/* Navigation Icons - равномерно распределены */}
        <div style={{
          width: '129px',
          height: '127px',
          cursor: 'pointer',
          backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.8
        }}
        onClick={() => navigate('/laba-main')}
        />
        
        <div 
          onClick={() => {
            navigate('/laba-no-tracked');
          }}
          style={{
            width: '129px',
            height: '126px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.8,
          }} />
        </div>
        
        <img 
          src={favoritesIcon}
          alt="на избранное"
          style={{
            width: '129px',
            height: '124px',
            cursor: 'pointer',
            objectFit: 'contain',
            opacity: 0.8
          }}
          onClick={() => navigate('/laba-favorites')}
        />
        
        <div 
          onClick={() => navigate('/metacoins')}
          style={{
            width: '129px',
            height: '132px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/src/assets/figma-welcome/socials.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.8,
          }} />
          {/* Белая точка (356:806) */}
          <div style={{
            position: 'absolute',
            top: '62px',
            right: '42px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'white',
          }} />
        </div>
      </div>

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

        <div className="blur-wave" style={{
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
