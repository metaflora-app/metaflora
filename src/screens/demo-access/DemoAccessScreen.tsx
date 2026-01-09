import { useNavigate } from 'react-router-dom';

// Импорт элементов
import bgImage from '../../assets/demo-access-elements/хэдер и подвал.png';
import bgDots from '../../assets/demo-access-elements/фон точки.png';
import title from '../../assets/demo-access-elements/что входит в ваш демо-доступ.png';
import description from '../../assets/demo-access-elements/course-description.png';
import iconIncluded from '../../assets/demo-access-elements/иконка что включено в демо.png';
import iconNotIncluded from '../../assets/demo-access-elements/иконка что не включено в демо.png';
import accessList from '../../assets/demo-access-elements/access-list.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import btnContinueBg from '../../assets/demo-access-elements/кнопка продолжить.png';
import btnContinueText from '../../assets/demo-access-elements/продолжить.png';
import btnPayBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';
import btnPayText from '../../assets/demo-access-elements/оплатить полный доступ.png';
import exitBtn from '../../assets/demo-access-elements/выход.png';
import supportBtn from '../../assets/demo-access-elements/Frame 2131330093.png';

// Размеры дизайна
const DESIGN_W = 1180;
const DESIGN_H = 2550;

export const DemoAccessScreen = () => {
  const navigate = useNavigate();
  const scale = window.innerWidth / DESIGN_W;
  const scaledHeight = DESIGN_H * scale;

  return (
    <div 
      className="relative w-full bg-[#020101]"
      style={{ height: `${scaledHeight}px`, overflow: 'hidden' }}
    >
      {/* Контейнер с масштабированием */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Background */}
        <img
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1180,
            height: 2550,
          }}
          alt="Background"
          src={bgImage}
        />

        {/* Dots background */}
        <img
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1180,
            height: 2550,
          }}
          alt=""
          src={bgDots}
        />

        {/* Title - что входит в ваш демо-доступ */}
        <img
          style={{
            position: 'absolute',
            height: '6.27%',
            left: '20.68%',
            top: '20.45%',
            width: '68.14%',
          }}
          alt=""
          src={title}
        />

        {/* Description */}
        <img
          style={{
            position: 'absolute',
            height: '7.84%',
            left: '20.92%',
            top: '29.09%',
            width: '71.61%',
          }}
          alt=""
          src={description}
        />

        {/* Icon included (left) */}
        <img
          style={{
            position: 'absolute',
            height: 98,
            left: 'calc(50% - 487px)',
            top: 551,
            width: 98,
          }}
          alt=""
          src={iconIncluded}
        />

        {/* Access list block */}
        <img
          style={{
            position: 'absolute',
            height: 861,
            left: 21,
            top: 959,
            width: 1137,
          }}
          alt=""
          src={accessList}
        />

        {/* Big logo */}
        <img
          style={{
            position: 'absolute',
            height: '6.27%',
            left: '8.51%',
            top: '12.34%',
            width: '86.44%',
          }}
          alt=""
          src={bigLogo}
        />

        {/* Button continue bg */}
        <button
          onClick={() => navigate('/main')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 441px)',
            top: 1850,
            width: 891,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={btnContinueBg}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
          <img
            src={btnContinueText}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 250,
              height: 'auto',
            }}
          />
        </button>

        {/* Icon not included (left) */}
        <img
          style={{
            position: 'absolute',
            height: 98,
            left: 'calc(50% - 488px)',
            top: 793,
            width: 98,
          }}
          alt=""
          src={iconNotIncluded}
        />

        {/* Exit button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 'calc(50% - 465px)',
            top: 204,
            width: 81,
            height: 64,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={exitBtn}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
        </button>

        {/* Button pay bg */}
        <button
          onClick={() => navigate('/pricing')}
          style={{
            position: 'absolute',
            left: 'calc(50% - 441px)',
            top: 2010,
            width: 891,
            height: 139,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={btnPayBg}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
          <img
            src={btnPayText}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 508,
              height: 36,
            }}
          />
        </button>

        {/* Support button */}
        <button
          onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
          style={{
            position: 'absolute',
            left: 'calc(50% + 265px)',
            top: 190,
            width: 205,
            height: 78,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src={supportBtn}
            alt=""
            style={{ width: '100%', height: '100%' }}
          />
        </button>
      </div>
    </div>
  );
};
