import { useNavigate } from 'react-router-dom';

// Импорт элементов (используем уже скопированные файлы)
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
        <main className="bg-[#020101] w-full min-w-[1180px] h-[2550px] relative">
          <img
            className="absolute top-0 left-0 w-[1180px] h-[2550px]"
            alt="Background"
            src={bgImage}
          />

          <img
            className="absolute w-[68.14%] h-[6.27%] top-[20.45%] left-[20.68%]"
            alt=""
            src={title}
          />

          <img
            className="absolute w-[71.61%] h-[7.84%] top-[29.09%] left-[20.92%]"
            alt=""
            src={description}
          />

          <img
            className="absolute top-[551px] left-[calc(50.00%_-_487px)] w-[98px] h-[98px]"
            alt=""
            src={iconIncluded}
          />

          <img
            className="absolute top-[959px] left-[21px] w-[1137px] h-[861px]"
            alt=""
            src={accessList}
          />

          <img
            className="absolute w-[86.44%] h-[6.27%] top-[12.34%] left-[8.51%]"
            alt=""
            src={bigLogo}
          />

          {/* Button continue */}
          <button
            onClick={() => navigate('/main')}
            className="absolute top-[1850px] left-[calc(50.00%_-_441px)] w-[891px] h-[139px]"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              className="w-full h-full"
              alt=""
              src={btnContinueBg}
            />
          </button>

          <img
            className="absolute top-[793px] left-[calc(50.00%_-_488px)] w-[98px] h-[98px]"
            alt=""
            src={iconNotIncluded}
          />

          {/* Exit button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-[204px] left-[calc(50.00%_-_465px)] w-[81px] h-16"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              className="w-full h-full"
              alt=""
              src={exitBtn}
            />
          </button>

          {/* Button pay */}
          <button
            onClick={() => navigate('/pricing')}
            className="absolute top-[2010px] left-[calc(50.00%_-_441px)] w-[891px] h-[139px]"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              className="w-full h-full"
              alt=""
              src={btnPayBg}
            />
            <img
              className="absolute top-[2060px] left-[341px] w-[508px] h-9"
              alt=""
              src={btnPayText}
            />
          </button>

          {/* Support button */}
          <button
            onClick={() => window.open('https://t.me/mishchenko_is', '_blank')}
            className="absolute top-[190px] left-[calc(50.00%_+_265px)] w-[205px] h-[78px]"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              className="w-full h-full"
              alt=""
              src={supportBtn}
            />
          </button>
        </main>
      </div>
    </div>
  );
};
