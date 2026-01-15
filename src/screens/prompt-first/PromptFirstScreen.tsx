import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Local PNG assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import socialIcons from '../../assets/figma-welcome/socials.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
import threePeopleBackground from '../../assets/about-screens/лого люди на фон.png';
import houseImage from '../../assets/prompt-card/фото для карточки промпта.png';
import homeIcon from '../../assets/about-screens/домой.png';
import supportButton from '../../assets/welcome-elements/написать в поддержку.png';
// import buttonGoTo from '../../assets/main-dashboard/кнопка перейти.png';
// import promptBadge from '../../assets/about-screens/промпт плашка.png';

// Fallback assets from Figma MCP for missing items
const heartFilled = "https://www.figma.com/api/mcp/asset/69727d28-6aae-45cb-8ca5-25ccb61d9931";
const heartFilledAlt = "https://www.figma.com/api/mcp/asset/fff6f51c-cdfc-40ce-a0f3-f8bdaf16a761";
const heartEmpty = "https://www.figma.com/api/mcp/asset/d9b1696b-f2e5-4467-bccb-8e99ebc54d0c";
const searchIcon = "https://www.figma.com/api/mcp/asset/d16d2a0f-0b75-482b-a08e-b2c133882170";
const backArrow = "https://www.figma.com/api/mcp/asset/7035a0a5-ff68-4e69-bede-aec478289efc";

const ScreenContainer = styled.div`
  background: #020101;
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
`;

const FooterContainer = styled.div`
  position: absolute;
  height: 124px;
  left: calc(50% - 5px);
  top: calc(50% + 957px);
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

const FooterCopyright = styled.p`
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
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FooterSocial = styled.div`
  position: absolute;
  height: 51px;
  left: calc(50% + 335px);
  top: calc(50% - 23.5px);
  transform: translate(-50%, -50%);
  width: 196px;

  .social-backdrop {
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

  .social-icon {
    position: absolute;
    height: 51px;
    top: 0;
    width: 50px;
    opacity: 0.6;

    &:first-child {
      left: 0;
    }
    
    &:last-child {
      left: 54px;
      width: 142px;
    }

    img {
      position: absolute;
      height: 339.84%;
      max-width: none;
      top: -118.33%;
      width: auto;
    }
  }
`;

const HeaderButton = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  top: 75px;
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 62px;
  overflow: hidden;
  transform: translateX(-50%);
`;

const BackButton = styled(HeaderButton)`
  left: calc(50% - 452px);
  transform: translateX(-50%) rotate(270deg);

  .inner {
    transform: rotate(90deg);
    width: 71px;
    height: 71px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
    }
  }
`;

const HomeButton = styled(HeaderButton)`
  left: calc(50% - 352px);
  transform: translateX(-50%) rotate(270deg);

  .inner {
    transform: rotate(90deg);
    width: 65px;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

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
  }
`;

const Logo = styled.div`
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

const SupportButton = styled.div`
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
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 30px;
  }
`;

const SearchBar = styled.div`
  position: absolute;
  backdrop-filter: blur(50px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  height: 72px;
  left: calc(50% + 3px);
  border-radius: 62px;
  top: 631px;
  transform: translateX(-50%);
  width: 876px;
  overflow: hidden;

  .search-icon {
    position: absolute;
    left: 24px;
    width: 38px;
    height: 38px;
    top: 50%;
    transform: translateY(-50%);

    img {
      width: 100%;
      height: 100%;
    }
  }

  .search-text {
    position: absolute;
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    color: #848484;
    font-size: 27px;
    left: calc(50% - 370px);
    top: calc(50% + 0.5px);
    transform: translateY(-50%);
    width: 612px;
    line-height: 1;
  }
`;

const FilterButton = styled.div<{ isActive?: boolean }>`
  position: absolute;
  backdrop-filter: blur(50px);
  background: rgba(0, 0, 0, 0.9);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 62px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .text {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 500;
    font-size: 27px;
    color: white;
    text-align: center;
    line-height: 1;
  }

  ${props => props.isActive && `
    background: rgba(0, 0, 0, 0.9);
    
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
`;

const FilterFavorites = styled(FilterButton)`
  inset: 28.75% 39.5% 68.15% 39.58%;
`;

const FilterRecent = styled(FilterButton)`
  inset: 28.75% 18.57% 68.15% 60.51%;
`;

const FilterTopPick = styled(FilterButton)`
  inset: 31.84% 50.01% 65.05% 29.07%;
`;

const FilterNew = styled(FilterButton)`
  bottom: 65.05%;
  left: 50%;
  right: 29.07%;
  top: 31.84%;
`;

const CardsContainer = styled.div`
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
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 25px;
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

    .button-text {
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
    }
  }

  .card-like {
    position: absolute;
    inset: 6.33% 88.46% 90.45% 7.47%;

    img {
      width: 100%;
      height: 100%;
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

    .badge-text {
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
  }
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

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/main-dashboard-premium');
  };

  const handleSupport = () => {
    // Navigate to support or open modal
  };

  const handlePromptCard = () => {
    navigate('/prompt-card');
  };

  return (
    <ScreenContainer>
      {/* Background People */}
      <BackgroundPeople>
        <img src={threePeopleBackground} alt="" />
      </BackgroundPeople>

      {/* Header */}
      <BackButton onClick={handleBack}>
        <div className="inner">
          <img src={backArrow} alt="" />
        </div>
      </BackButton>

      <HomeButton onClick={handleHome}>
        <div className="inner">
          <img src={homeIcon} alt="Домой" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </HomeButton>

      <Logo>
        <img src={smallLogo} alt="МЕТАФЛОРА" />
      </Logo>

      <SupportButton onClick={handleSupport}>
        <img src={supportButton} alt="Написать в поддержку" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </SupportButton>

      {/* Hero Image */}
      <HeroImage>
        <img src={houseImage} alt="" />
      </HeroImage>

      {/* Search Bar */}
      <SearchBar>
        <div className="search-icon">
          <img src={searchIcon} alt="" />
        </div>
        <div className="search-text">промпт для ИИ-копирайтера любых текстов</div>
      </SearchBar>

      {/* Filter Buttons */}
      <FilterReturn isActive>
        <div className="colors">
          <div className="color1"></div>
          <div className="color2">
            <div className="inner"></div>
          </div>
          <div className="color3"></div>
        </div>
        <div className="text">вернуть</div>
      </FilterReturn>

      <FilterFavorites>
        <div className="text">избранное</div>
      </FilterFavorites>

      <FilterRecent>
        <div className="text">недавние</div>
      </FilterRecent>

      <FilterTopPick>
        <div className="text">топ-выбор</div>
      </FilterTopPick>

      <FilterNew>
        <div className="text">новые</div>
      </FilterNew>

      {/* Cards Container */}
      <CardsContainer>
        {/* Card 1 */}
        <PromptCard left={22} top={23}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
          <div className="open-text">открыть</div>
          <div className="new-badge">
            <div className="badge-text">новое</div>
          </div>
          <div className="card-like">
            <img src={heartFilled} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="button-text">перейти</div>
          </div>
        </PromptCard>

        {/* Card 2 */}
        <PromptCard left={443} top={23}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
          <div className="open-text">открыть</div>
          <div className="card-like">
            <img src={heartFilledAlt} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="button-text">перейти</div>
          </div>
        </PromptCard>

        {/* Card 3 */}
        <PromptCard left={22} top={828}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
          <div className="open-text">открыть</div>
          <div className="card-like">
            <img src={heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="button-text">перейти</div>
          </div>
        </PromptCard>

        {/* Card 4 */}
        <PromptCard left={443} top={828}>
          <div className="card-bg" />
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
          <div className="open-text">открыть</div>
          <div className="card-like">
            <img src={heartEmpty} alt="" />
          </div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2">
                <div className="inner"></div>
              </div>
              <div className="color3"></div>
            </div>
            <div className="button-text">перейти</div>
          </div>
        </PromptCard>
      </CardsContainer>

      {/* Footer */}
      <FooterContainer>
        <FooterLogo>
          <img src={bgPattern} alt="" />
        </FooterLogo>
        <FooterCopyright>Copyright © Все права защищены.</FooterCopyright>
        <FooterSocial>
          <div className="social-backdrop" />
          <div className="social-icon">
            <img src={socialIcons} alt="" />
          </div>
          <div className="social-icon">
            <img src={socialIcons} alt="" />
          </div>
        </FooterSocial>
      </FooterContainer>
    </ScreenContainer>
  );
};