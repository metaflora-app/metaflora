import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Background pattern image (dots)
import bgPattern from '../../assets/figma-welcome/pattern.png';
// Logo image
import logo from '../../assets/figma-welcome/splash-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#020101',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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

      {/* Logo - centered */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
        }}
      >
        <img
          src={logo}
          alt="МЕТАФЛОРА*"
          style={{
            width: 'min(80vw, 592px)',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

        <img
          src={bgPattern}
          alt=""
          style={{
            width: '263px',
            height: '567px',
            position: 'absolute',
            left: '0px',
            top: '0px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '279px',
            top: '0px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '593px',
            top: '0px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '285px',
            height: '567px',
            position: 'absolute',
            left: '895px',
            top: '0px',
            objectFit: 'cover',
          }}
        />

        {/* Second row (y: 575) */}
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '263px',
            height: '567px',
            position: 'absolute',
            left: '0px',
            top: '575px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '279px',
            top: '575px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '593px',
            top: '575px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '285px',
            height: '567px',
            position: 'absolute',
            left: '895px',
            top: '575px',
            objectFit: 'cover',
          }}
        />

        {/* Third row (y: 1108) */}
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '263px',
            height: '567px',
            position: 'absolute',
            left: '0px',
            top: '1108px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '279px',
            top: '1108px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '593px',
            top: '1108px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '285px',
            height: '567px',
            position: 'absolute',
            left: '895px',
            top: '1108px',
            objectFit: 'cover',
          }}
        />

        {/* Fourth row (y: 1683) */}
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '263px',
            height: '567px',
            position: 'absolute',
            left: '0px',
            top: '1683px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '279px',
            top: '1683px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '567px',
            position: 'absolute',
            left: '593px',
            top: '1683px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '285px',
            height: '567px',
            position: 'absolute',
            left: '895px',
            top: '1683px',
            objectFit: 'cover',
          }}
        />

        {/* Bottom row (y: 2261) */}
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '263px',
            height: '289px',
            position: 'absolute',
            left: '0px',
            top: '2261px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '295px',
            height: '289px',
            position: 'absolute',
            left: '279px',
            top: '2261px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '290.06px',
            height: '289px',
            position: 'absolute',
            left: '593px',
            top: '2261px',
            objectFit: 'cover',
          }}
        />
        <img
          src={bgPattern}
          alt=""
          style={{
            width: '290.06px',
            height: '289px',
            position: 'absolute',
            left: '889.94px',
            top: '2261px',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          width: '592px',
          height: '429px',
          position: 'absolute',
          left: '278px',
          top: '927px',
        }}
      >
        <img
          src={logo}
          alt="МЕТАФЛОРА*"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
