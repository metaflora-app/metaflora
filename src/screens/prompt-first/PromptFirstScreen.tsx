import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Local PNG assets from project
import smallLogo from '../../assets/figma-welcome/logo-small.png';

// Figma MCP assets with exact URLs
const footerLogo = "https://www.figma.com/api/mcp/asset/eec42cbf-412b-4926-850b-463f55b43abf";
const socialIcons = "https://www.figma.com/api/mcp/asset/96863808-46d4-499a-878e-c15950dc56ad"; 
const threePeopleBg = "https://www.figma.com/api/mcp/asset/1f6ef230-2b81-4e04-8d67-9a5cf1485327";
const houseImage = "https://www.figma.com/api/mcp/asset/3d1cba2c-4fbf-4899-bf0b-a768d478b52d";
const homeVector1 = "https://www.figma.com/api/mcp/asset/9f881007-3e31-4135-b2fe-e06b91dd0712";
const homeVector2 = "https://www.figma.com/api/mcp/asset/21ea9087-2499-427f-928b-a8d6dfbe722a";
const backArrow = "https://www.figma.com/api/mcp/asset/e111f38a-80d6-4b85-840f-0e5fffc9fffb";
const heartFilled = "https://www.figma.com/api/mcp/asset/356cce97-ba9a-426b-b68e-46da1edaf70b";
const heartFilledAlt = "https://www.figma.com/api/mcp/asset/69d2fe69-70ad-4a1f-8fd5-c87407bb72a2";
const heartEmpty = "https://www.figma.com/api/mcp/asset/d487f0d7-58b0-45f3-ba61-5cd64c3e2ff0";
const searchIcon = "https://www.figma.com/api/mcp/asset/4cc4ace0-2607-4d2d-a638-eeac8477fc94";

const ScreenContainer = styled.div`
  background: #020101;
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const BackgroundPeople = styled.div`
  position: absolute;
  height: 474px;
  left: 147px;
  top: 1289px;
  width: 886px;
  
  img {
    position: absolute;
    height: 222.88%;
    left: -39.72%;
    max-width: none;
    top: -55.58%;
    width: 179.18%;
  }
`;

const HeaderBackButton = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: calc(50% - 452px);
  width: 100px;
  height: 100px;
  top: 75px;
  transform: translateX(-50%);
  cursor: pointer;
  
  .outer {
    transform: rotate(270deg);
  }
  
  .inner {
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 62px;
    overflow: hidden;
    width: 100px;
    height: 100px;
    position: relative;
  }
  
  .arrow {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 11px;
    width: 71px;
    height: 71px;
    top: 10px;
  }
  
  .arrow-inner {
    transform: rotate(90deg);
    width: 71px;
    height: 71px;
    position: relative;
  }
  
  .arrow-vector {
    position: absolute;
    inset: 3.13%;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
`;

const HeaderHomeButton = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: calc(50% - 352px);
  width: 100px;
  height: 100px;
  top: 75px;
  transform: translateX(-50%);
  cursor: pointer;
  
  .outer {
    transform: rotate(270deg);
  }
  
  .inner {
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 62px;
    overflow: hidden;
    width: 100px;
    height: 100px;
    position: relative;
  }
  
  .home-icon {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 24px;
    width: 65px;
    height: 65px;
    top: 13px;
  }
  
  .home-inner {
    transform: rotate(90deg);
    width: 65px;
    height: 65px;
    position: relative;
  }
  
  .vector1 {
    position: absolute;
    inset: 19.15% 15.36% -12.9% 12.77%;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
  
  .vector2 {
    position: absolute;
    inset: 27.81% 42.67% 33.98% 19.82%;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
`;

const HeaderLogo = styled.div`
  position: absolute;
  height: 131px;
  left: 500px;
  top: 61px;
  width: 186px;
  
  img {
    position: absolute;
    height: 131.84%;
    left: -21.84%;
    max-width: none;
    top: -16.38%;
    width: 143.34%;
  }
`;

const HeaderSupport = styled.div`
  position: absolute;
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  height: 78px;
  left: calc(50% + 341.5px);
  border-radius: 62px;
  top: 97px;
  transform: translateX(-50%);
  width: 205px;
  overflow: hidden;
  cursor: pointer;
  
  .text {
    position: absolute;
    bottom: calc(25.64% - 4px);
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    font-size: 20px;
    color: white;
    left: calc(50% - 68.5px);
    top: calc(23.08% - 4px);
    width: 145px;
    line-height: 1;
    text-align: center;
    
    .bold {
      font-weight: 700;
    }
  }
`;

const HeroImage = styled.div`
  position: absolute;
  border: 4px solid rgba(255, 255, 255, 0.3);
  height: 377px;
  left: 155px;
  border-radius: 30px;
  top: 224px;
  width: 880px;
  
  img {
    position: absolute;
    inset: 0;
    max-width: none;
    object-fit: cover;
    pointer-events: none;
    border-radius: 30px;
    width: 100%;
    height: 100%;
  }
`;

const SearchContainer = styled.div`
  position: absolute;
  backdrop-filter: blur(50px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  height: 72px;
  left: calc(50% + 3px);
  border-radius: 62px;
  top: 631px;
  transform: translateX(-50%);
  width: 876px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 26px;
  width: 38px;
  height: 38px;
  top: calc(50% - 19px);
  
  .vector {
    position: absolute;
    inset: 3.12% 3.12% 3.13% 3.12%;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
`;

const SearchInput = styled.input`
  position: absolute;
  font-family: 'Gotham Pro', sans-serif;
  font-weight: 300;
  color: white;
  font-size: 27px;
  left: calc(50% - 365px);
  top: calc(50% - 0.5px);
  transform: translateY(-50%);
  width: 612px;
  background: transparent;
  border: none;
  outline: none;
  line-height: 1;
  
  &::placeholder {
    color: #848484;
  }
`;

const FilterButton = styled.div<{ isActive?: boolean }>`
  position: absolute;
  backdrop-filter: blur(50px);
  background: rgba(0, 0, 0, 0.9);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 62px;
  overflow: hidden;
  cursor: pointer;
  
  .text {
    position: absolute;
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 500;
    font-size: 27px;
    color: white;
    text-align: center;
    line-height: 1;
  }
  
  ${props => props.isActive && `
    .colors {
      position: absolute;
      left: 73px;
      top: -44px;
      
      .color1 {
        position: absolute;
        background: white;
        height: 107.431px;
        left: 77px;
        border-radius: 1568.563px;
        top: -36.46px;
        width: 101.963px;
      }
      
      .color2 {
        position: absolute;
        display: flex;
        height: 78.548px;
        align-items: center;
        justify-content: center;
        left: 102.5px;
        top: -40px;
        width: 90.498px;
        
        .inner {
          transform: rotate(16.918deg) skewX(-15.566deg);
          background: white;
          height: 75.957px;
          border-radius: 1568.563px;
          width: 51.243px;
        }
      }
      
      .color3 {
        position: absolute;
        background: white;
        height: 72.822px;
        left: 122.8px;
        border-radius: 1568.563px;
        top: 30.18px;
        width: 56.152px;
      }
    }
  `}
`;

const FilterReturn = styled(FilterButton)`
  inset: 28.75% 60.43% 68.15% 18.64%;
  
  .text {
    height: 29.312px;
    left: calc(50% - 1.47px);
    top: calc(50% + 0.03px);
    transform: translate(-50%, -50%);
    width: 150px;
  }
`;

const FilterFavorites = styled(FilterButton)`
  inset: 28.75% 39.5% 68.15% 39.58%;
  
  .text {
    height: 29px;
    left: calc(50% - 0.97px);
    top: calc(50% - 0.13px);
    transform: translate(-50%, -50%);
    width: 169px;
  }
`;

const FilterRecent = styled(FilterButton)`
  inset: 28.75% 18.57% 68.15% 60.51%;
  
  .text {
    height: 29.312px;
    left: calc(50% - 1.47px);
    top: calc(50% + 0.03px);
    transform: translate(-50%, -50%);
    width: 150px;
  }
`;

const FilterTopPick = styled(FilterButton)`
  inset: 31.84% 50.01% 65.05% 29.07%;
  
  .text {
    height: 29px;
    left: calc(50% + 4.03px);
    top: calc(50% - 0.13px);
    transform: translate(-50%, -50%);
    width: 161px;
  }
`;

const FilterNew = styled(FilterButton)`
  bottom: 65.05%;
  left: 50%;
  right: 29.07%;
  top: 31.84%;
  
  .text {
    height: 29px;
    left: calc(50% - 0.47px);
    top: calc(50% - 0.13px);
    transform: translate(-50%, -50%);
    width: 216px;
  }
`;

const CardsWindow = styled.div`
  position: absolute;
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  height: 1121px;
  left: calc(50% + 3px);
  border-radius: 30px;
  top: 921px;
  transform: translateX(-50%);
  width: 884px;
  overflow: hidden;
`;

const PromptCard = styled.div<{ left: number; top: number }>`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  
  .card-bg {
    position: absolute;
    backdrop-filter: blur(50px);
    background: black;
    border: 4px solid rgba(255, 255, 255, 0.3);
    height: 782px;
    left: calc(50% - 211px);
    border-radius: 30px;
    top: 27px;
    transform: translateX(-50%);
    width: 410px;
  }
  
  .card-image {
    position: absolute;
    border: 2px solid rgba(0, 0, 0, 0.3);
    height: 359px;
    left: 53px;
    border-radius: 25px;
    top: 54px;
    width: 356px;
    
    img {
      position: absolute;
      inset: 0;
      max-width: none;
      object-fit: cover;
      pointer-events: none;
      border-radius: 25px;
      width: 100%;
      height: 100%;
    }
  }
  
  .card-title {
    position: absolute;
    bottom: 54.42%;
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 700;
    font-size: 40px;
    color: white;
    left: calc(50% - 376px);
    top: 40.41%;
    width: 329px;
    line-height: 1;
    
    p {
      line-height: 1;
      white-space: pre-wrap;
      margin: 0;
    }
  }
  
  .card-description {
    position: absolute;
    bottom: 44.07%;
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    font-size: 32px;
    color: white;
    left: calc(50% - 376px);
    top: 47.46%;
    width: 329px;
    line-height: 1;
    
    p {
      line-height: 1;
      white-space: pre-wrap;
      margin: 0;
    }
  }
  
  .open-text {
    position: absolute;
    bottom: 65.45%;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 19px;
    color: black;
    left: calc(50% - 250px);
    top: 33.23%;
    width: 87px;
    line-height: 1;
    
    p {
      line-height: 1;
      white-space: pre-wrap;
      margin: 0;
    }
  }
  
  .new-badge {
    position: absolute;
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    inset: 6.33% 55.29% 90.45% 29.52%;
    border-radius: 62px;
    overflow: hidden;
    
    .text {
      position: absolute;
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 18px;
      color: white;
      left: calc(50% - 0.6px);
      top: calc(50% - 0.5px);
      transform: translate(-50%, -50%);
      width: 111px;
      text-align: center;
      line-height: 1;
      
      p {
        line-height: 1;
        white-space: pre-wrap;
        margin: 0;
      }
    }
  }
  
  .card-button {
    position: absolute;
    backdrop-filter: blur(50px);
    background: rgba(0, 0, 0, 0.9);
    border: 4px solid rgba(255, 255, 255, 0.3);
    bottom: 33.43%;
    left: calc(50% - 210.53px);
    border-radius: 62px;
    top: 59.5%;
    transform: translateX(-50%);
    width: 246.931px;
    overflow: hidden;
    cursor: pointer;
    
    .colors {
      position: absolute;
      left: 73px;
      top: -44px;
      
      .color1 {
        position: absolute;
        background: #37ecf7;
        height: 107.431px;
        left: 77px;
        border-radius: 1568.563px;
        top: -36.46px;
        width: 101.963px;
      }
      
      .color2 {
        position: absolute;
        display: flex;
        height: 78.548px;
        align-items: center;
        justify-content: center;
        left: 102.5px;
        top: -40px;
        width: 90.498px;
        
        .inner {
          transform: rotate(16.918deg) skewX(-15.566deg);
          background: #f0d825;
          height: 75.957px;
          border-radius: 1568.563px;
          width: 51.243px;
        }
      }
      
      .color3 {
        position: absolute;
        background: #d5fc44;
        height: 72.822px;
        left: 122.8px;
        border-radius: 1568.563px;
        top: 30.18px;
        width: 56.152px;
      }
    }
    
    .text {
      position: absolute;
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 27px;
      color: white;
      left: calc(50% + 0.03px);
      top: calc(50% - 0.12px);
      transform: translate(-50%, -50%);
      width: 119px;
      text-align: center;
      line-height: 1;
      
      p {
        line-height: 1;
        white-space: pre-wrap;
        margin: 0;
      }
    }
  }
  
  .card-like {
    position: absolute;
    inset: 6.33% 88.46% 90.45% 7.47%;
    cursor: pointer;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
`;

const FooterContainer = styled.div`
  position: absolute;
  height: 124px;
  left: calc(50% - 5px);
  top: calc(50% + 858px);
  transform: translate(-50%, -50%);
  width: 888px;
`;

const FooterLogo = styled.div`
  position: absolute;
  height: 83px;
  left: 2px;
  top: -16px;
  width: 380px;
  
  img {
    position: absolute;
    height: 526.54%;
    left: -37.89%;
    max-width: none;
    top: -202.47%;
    width: 170.37%;
  }
`;

const FooterCopyright = styled.div`
  position: absolute;
  bottom: 38.71%;
  font-family: 'Gotham Pro', sans-serif;
  font-weight: 300;
  font-size: 20px;
  color: white;
  left: calc(50% - 442px);
  top: 45.16%;
  width: 433px;
  line-height: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  p {
    line-height: 1;
    white-space: pre-wrap;
    margin: 0;
  }
`;

const FooterSocials = styled.div`
  position: absolute;
  height: 51px;
  left: calc(50% + 335px);
  top: calc(50% - 23.5px);
  transform: translate(-50%, -50%);
  width: 196px;
  
  .backdrop {
    position: absolute;
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 4px solid rgba(255, 255, 255, 0.3);
    height: 78px;
    left: -17px;
    border-radius: 62px;
    top: -15px;
    width: 230px;
  }
  
  .icon1 {
    position: absolute;
    height: 51px;
    left: 0;
    top: 0;
    width: 50px;
    opacity: 0.6;
    
    img {
      position: absolute;
      height: 339.84%;
      left: -377.92%;
      max-width: none;
      top: -118.33%;
      width: 517.92%;
    }
  }
  
  .icon2 {
    position: absolute;
    height: 51px;
    left: 54px;
    top: 0;
    width: 142px;
    opacity: 0.6;
    
    img {
      position: absolute;
      height: 339.84%;
      left: -16.64%;
      max-width: none;
      top: -118.33%;
      width: 183.64%;
    }
  }
`;

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const [likedCards, setLikedCards] = React.useState<number[]>([0, 1]);

  const handleBack = () => navigate(-1);
  const handleHome = () => navigate('/main-dashboard-premium');
  const handleSupport = () => {};
  const handlePromptCard = () => navigate('/prompt-card');
  
  const toggleLike = (cardIndex: number) => {
    setLikedCards(prev => 
      prev.includes(cardIndex) 
        ? prev.filter(id => id !== cardIndex)
        : [...prev, cardIndex]
    );
  };

  return (
    <ScreenContainer>
      {/* Background */}
      <BackgroundPeople>
        <img src={threePeopleBg} alt="" />
      </BackgroundPeople>

      {/* Header */}
      <HeaderBackButton onClick={handleBack}>
        <div className="outer">
          <div className="inner">
            <div className="arrow">
              <div className="arrow-inner">
                <div className="arrow-vector">
                  <img src={backArrow} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeaderBackButton>

      <HeaderHomeButton onClick={handleHome}>
        <div className="outer">
          <div className="inner">
            <div className="home-icon">
              <div className="home-inner">
                <div className="vector1">
                  <img src={homeVector1} alt="" />
                </div>
                <div className="vector2">
                  <img src={homeVector2} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeaderHomeButton>

      <HeaderLogo>
        <img src={smallLogo} alt="" />
      </HeaderLogo>

      <HeaderSupport onClick={handleSupport}>
        <div className="text">
          написать <span className="bold">в поддержку</span>
        </div>
      </HeaderSupport>

      {/* Hero Image */}
      <HeroImage>
        <img src={houseImage} alt="" />
      </HeroImage>

      {/* Search */}
      <SearchContainer>
        <SearchIcon>
          <div className="vector">
            <img src={searchIcon} alt="" />
          </div>
        </SearchIcon>
        <SearchInput
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="промпт для ИИ-копирайтера любых текстов"
        />
      </SearchContainer>

      {/* Filters */}
      <FilterReturn isActive>
        <div className="colors">
          <div className="color1"></div>
          <div className="color2">
            <div className="inner"></div>
          </div>
          <div className="color3"></div>
        </div>
        <div className="text">
          <p>вернуть</p>
        </div>
      </FilterReturn>

      <FilterFavorites>
        <div className="text">
          <p>избранное</p>
        </div>
      </FilterFavorites>

      <FilterRecent>
        <div className="text">
          <p>недавние</p>
        </div>
      </FilterRecent>

      <FilterTopPick>
        <div className="text">
          <p>топ-выбор</p>
        </div>
      </FilterTopPick>

      <FilterNew>
        <div className="text">
          <p>новые</p>
        </div>
      </FilterNew>

      {/* Cards */}
      <CardsWindow>
        {/* Card 1 */}
        <PromptCard left={22} top={23}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">
            <p>ИИ-копирайтер для блога</p>
          </div>
          <div className="card-description">
            <p>настройте ИИ-копирайтера за один промпт</p>
          </div>
          <div className="open-text">
            <p>открыть</p>
          </div>
          <div className="new-badge">
            <div className="text">
              <p>новое</p>
            </div>
          </div>
          <div className="card-like" onClick={() => toggleLike(0)}>
            <img src={likedCards.includes(0) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="text">
              <p>перейти</p>
            </div>
          </div>
        </PromptCard>

        {/* Card 2 */}
        <PromptCard left={443} top={23}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">
            <p>ИИ-копирайтер для блога</p>
          </div>
          <div className="card-description">
            <p>настройте ИИ-копирайтера за один промпт</p>
          </div>
          <div className="open-text">
            <p>открыть</p>
          </div>
          <div className="card-like" onClick={() => toggleLike(1)}>
            <img src={likedCards.includes(1) ? heartFilledAlt : heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="text">
              <p>перейти</p>
            </div>
          </div>
        </PromptCard>

        {/* Card 3 */}
        <PromptCard left={22} top={828}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">
            <p>ИИ-копирайтер для блога</p>
          </div>
          <div className="card-description">
            <p>настройте ИИ-копирайтера за один промпт</p>
          </div>
          <div className="open-text">
            <p>открыть</p>
          </div>
          <div className="card-like" onClick={() => toggleLike(2)}>
            <img src={likedCards.includes(2) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="text">
              <p>перейти</p>
            </div>
          </div>
        </PromptCard>

        {/* Card 4 */}
        <PromptCard left={443} top={828}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">
            <p>ИИ-копирайтер для блога</p>
          </div>
          <div className="card-description">
            <p>настройте ИИ-копирайтера за один промпт</p>
          </div>
          <div className="open-text">
            <p>открыть</p>
          </div>
          <div className="card-like" onClick={() => toggleLike(3)}>
            <img src={likedCards.includes(3) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="text">
              <p>перейти</p>
            </div>
          </div>
        </PromptCard>
      </CardsWindow>

      {/* Footer */}
      <FooterContainer>
        <FooterLogo>
          <img src={footerLogo} alt="" />
        </FooterLogo>
        <FooterCopyright>
          <p>Copyright © Все права защищены.</p>
        </FooterCopyright>
        <FooterSocials>
          <div className="backdrop" />
          <div className="icon1">
            <img src={socialIcons} alt="" />
          </div>
          <div className="icon2">
            <img src={socialIcons} alt="" />
          </div>
        </FooterSocials>
      </FooterContainer>
    </ScreenContainer>
  );
};