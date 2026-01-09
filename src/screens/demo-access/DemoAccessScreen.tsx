import { useNavigate } from 'react-router-dom';

// Импорт элементов
import bgImage from '../../assets/demo-access-elements/хэдер и подвал.png';
import title from '../../assets/demo-access-elements/что входит в ваш демо-доступ.png';
import description from '../../assets/demo-access-elements/course-description.png';
import iconIncluded from '../../assets/demo-access-elements/иконка что включено в демо.png';
import accessList from '../../assets/demo-access-elements/access-list.png';
import bigLogo from '../../assets/demo-access-elements/лого большое в экране демо.png';
import btnContinueBg from '../../assets/demo-access-elements/кнопка продолжить.png';
import iconNotIncluded from '../../assets/demo-access-elements/иконка что не включено в демо.png';
import exitBtn from '../../assets/demo-access-elements/выход.png';
import btnPayBg from '../../assets/demo-access-elements/кнопка оплатить полный доступ.png';
import btnPayText from '../../assets/demo-access-elements/оплатить полный доступ.png';
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
      style={{ 
        position: 'relative',
        width: '100%',
        height: `${scaledHeight}px`,
        overflow: 'hidden',
        background: '#020101'
      }}
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
        <div
          style={{
            position: "relative",
            width: "100%",
            minWidth: "1180px",
            height: "2550px",
            background: "#020101",
          }}
        >
          <img
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1180px",
              height: "2550px",
            }}
            alt="Background"
            src={bgImage}
          />

          <img
            style={{
              position: "absolute",
              width: "68.14%",
              height: "6.27%",
              top: "20.45%",
              left: "20.68%",
            }}
            alt=""
            src={title}
          />

          <img
            style={{
              position: "absolute",
              width: "71.61%",
              height: "7.84%",
              top: "29.09%",
              left: "20.92%",
            }}
            alt=""
            src={description}
          />

          <img
            style={{
              position: "absolute",
              top: "551px",
              left: "calc(50.00% - 487px)",
              width: "98px",
              height: "98px",
            }}
            alt=""
            src={iconIncluded}
          />

          <img
            style={{
              position: "absolute",
              top: "959px",
              left: "21px",
              width: "1137px",
              height: "861px",
            }}
            alt=""
            src={accessList}
          />

          <img
            style={{
              position: "absolute",
              width: "86.44%",
              height: "6.27%",
              top: "12.34%",
              left: "8.51%",
            }}
            alt=""
            src={bigLogo}
          />

          <button
            onClick={() => navigate('/main')}
            style={{
              position: "absolute",
              top: "1850px",
              left: "calc(50.00% - 441px)",
              width: "891px",
              height: "139px",
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img
              style={{ width: "100%", height: "100%" }}
              alt=""
              src={btnContinueBg}
            />
          </button>

          <img
            style={{
              position: "absolute",
              top: "793px",
              left: "calc(50.00% - 488px)",
              width: "98px",
              height: "98px",
            }}
            alt=""
            src={iconNotIncluded}
          />

          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              top: "204px",
              left: "calc(50.00% - 465px)",
              width: "81px",
              height: "64px",
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img
              style={{ width: "100%", height: "100%" }}
              alt=""
              src={exitBtn}
            />
          </button>

          <button
            onClick={() => navigate('/pricing')}
            style={{
              position: "absolute",
              top: "2010px",
              left: "calc(50.00% - 441px)",
              width: "891px",
              height: "139px",
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img
              style={{ width: "100%", height: "100%" }}
              alt=""
              src={btnPayBg}
            />
          </button>

          <img
            style={{
              position: "absolute",
              top: "2060px",
              left: "341px",
              width: "508px",
              height: "36px",
            }}
            alt=""
            src={btnPayText}
          />

          <button
            onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
            style={{
              position: "absolute",
              top: "190px",
              left: "calc(50.00% + 265px)",
              width: "205px",
              height: "78px",
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img
              style={{ width: "100%", height: "100%" }}
              alt=""
              src={supportBtn}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
