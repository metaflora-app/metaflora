import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Local PNG assets
import bgPattern from '../../assets/figma-welcome/pattern.png';
import socialIcons from '../../assets/figma-welcome/socials.png';
import smallLogo from '../../assets/figma-welcome/logo-small.png';
// import threePeopleBackground from '../../assets/about-screens/лого люди на фон.png';
import houseImage from '../../assets/prompt-card/фото для карточки промпта.png';
import homeIcon from '../../assets/about-screens/домой.png';
import supportButton from '../../assets/welcome-elements/написать в поддержку.png';

// Fallback assets from Figma MCP for missing items
const heartFilled = "https://www.figma.com/api/mcp/asset/69727d28-6aae-45cb-8ca5-25ccb61d9931";
const heartFilledAlt = "https://www.figma.com/api/mcp/asset/fff6f51c-cdfc-40ce-a0f3-f8bdaf16a761";
const heartEmpty = "https://www.figma.com/api/mcp/asset/d9b1696b-f2e5-4467-bccb-8e99ebc54d0c";
const searchIcon = "https://www.figma.com/api/mcp/asset/d16d2a0f-0b75-482b-a08e-b2c133882170";
const backArrow = "https://www.figma.com/api/mcp/asset/7035a0a5-ff68-4e69-bede-aec478289efc";

const ScreenContainer = styled.div`
  background: #020101;
  width: 100vw;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
`;

const HeaderButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  cursor: pointer;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    height: 60px;
    width: auto;
    object-fit: contain;
  }
`;

const SupportButton = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 40px;
  padding: 20px;
  cursor: pointer;
  
  img {
    height: 40px;
    width: auto;
  }
`;

const HeroImage = styled.div`
  margin: 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  overflow: hidden;

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  backdrop-filter: blur(50px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 40px;
  margin: 0 20px 20px 20px;
  padding: 15px 20px;
  position: relative;

  .search-icon {
    width: 24px;
    height: 24px;
    margin-right: 15px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
    }
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    color: white;
    font-size: 16px;
    
    &::placeholder {
      color: #848484;
    }
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 20px 20px 20px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const FilterButton = styled.div<{ isActive?: boolean }>`
  backdrop-filter: blur(50px);
  background: rgba(0, 0, 0, 0.9);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 12px 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  .text {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: white;
    text-align: center;
    line-height: 1;
    position: relative;
    z-index: 2;
  }

  ${props => props.isActive && `
    .colors {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .color1, .color2, .color3 {
        position: absolute;
        border-radius: 50%;
        opacity: 0.3;
      }

      .color1 {
        background: white;
        width: 40px;
        height: 40px;
        left: 10%;
      }

      .color2 {
        background: white;
        width: 30px;
        height: 30px;
        left: 50%;
        transform: translateX(-50%);
      }

      .color3 {
        background: white;
        width: 35px;
        height: 35px;
        right: 10%;
      }
    }
  `}
`;

const CardsContainer = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  margin: 0 20px 20px 20px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const PromptCard = styled.div`
  backdrop-filter: blur(50px);
  background: black;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;

  .card-image {
    border-radius: 15px;
    overflow: hidden;
    margin-bottom: 15px;
    position: relative;

    img {
      width: 100%;
      height: 120px;
      object-fit: cover;
    }
  }

  .card-title {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: white;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .card-description {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    font-size: 12px;
    color: white;
    margin-bottom: 15px;
    line-height: 1.3;
  }

  .card-button {
    backdrop-filter: blur(50px);
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 8px 16px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    align-self: center;

    .colors {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      opacity: 0.3;

      .color1 {
        background: #37ecf7;
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }

      .color2 .inner {
        background: #f0d825;
        width: 15px;
        height: 15px;
        border-radius: 50%;
      }

      .color3 {
        background: #d5fc44;
        width: 18px;
        height: 18px;
        border-radius: 50%;
      }
    }

    .button-text {
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 12px;
      color: white;
      text-align: center;
      position: relative;
      z-index: 2;
    }
  }

  .card-like {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .new-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    padding: 4px 8px;

    .badge-text {
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 10px;
      color: white;
      text-align: center;
    }
  }
`;

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  margin-top: auto;
`;

const FooterLogo = styled.div`
  margin-bottom: 10px;
  
  img {
    height: 60px;
    width: auto;
  }
`;

const FooterCopyright = styled.p`
  font-family: 'Gotham Pro', sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: white;
  margin: 10px 0;
  text-align: center;
`;

const FooterSocial = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  padding: 10px 20px;
  display: flex;
  gap: 10px;

  img {
    height: 30px;
    width: 30px;
    opacity: 0.6;
  }
`;

export const PromptFirstScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  // const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [likedCards, setLikedCards] = React.useState<number[]>([0, 1]); // Cards 0 and 1 are liked by default

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

  const toggleLike = (cardIndex: number) => {
    setLikedCards(prev => 
      prev.includes(cardIndex) 
        ? prev.filter(id => id !== cardIndex)
        : [...prev, cardIndex]
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <HeaderContainer>
        <HeaderButton onClick={handleBack}>
          <img src={backArrow} alt="Назад" style={{ width: '40px', height: '40px' }} />
        </HeaderButton>
        
        <HeaderButton onClick={handleHome}>
          <img src={homeIcon} alt="Домой" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        </HeaderButton>

        <Logo>
          <img src={smallLogo} alt="МЕТАФЛОРА" />
        </Logo>

        <SupportButton onClick={handleSupport}>
          <img src={supportButton} alt="Поддержка" />
        </SupportButton>
      </HeaderContainer>

      {/* Hero Image */}
      <HeroImage>
        <img src={houseImage} alt="" />
      </HeroImage>

      {/* Search Bar */}
      <SearchBar>
        <div className="search-icon">
          <img src={searchIcon} alt="" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="промпт для ИИ-копирайтера любых текстов"
        />
      </SearchBar>

      {/* Filter Buttons */}
      <FiltersContainer>
        <FilterRow>
          <FilterButton isActive>
            <div className="colors">
              <div className="color1"></div>
              <div className="color2"></div>
              <div className="color3"></div>
            </div>
            <div className="text">вернуть</div>
          </FilterButton>
          
          <FilterButton>
            <div className="text">избранное</div>
          </FilterButton>
          
          <FilterButton>
            <div className="text">недавние</div>
          </FilterButton>
        </FilterRow>
        
        <FilterRow>
          <FilterButton>
            <div className="text">топ-выбор</div>
          </FilterButton>
          
          <FilterButton>
            <div className="text">новые</div>
          </FilterButton>
        </FilterRow>
      </FiltersContainer>

      {/* Cards Container */}
      <CardsContainer>
        {/* Card 1 */}
        <PromptCard>
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-like" onClick={() => toggleLike(0)}>
            <img src={likedCards.includes(0) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="new-badge">
            <div className="badge-text">новое</div>
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
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
        <PromptCard>
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-like" onClick={() => toggleLike(1)}>
            <img src={likedCards.includes(1) ? heartFilledAlt : heartEmpty} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
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
        <PromptCard>
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-like" onClick={() => toggleLike(2)}>
            <img src={likedCards.includes(2) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
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
        <PromptCard>
          <div className="card-image">
            <img src={houseImage} alt="" />
          </div>
          <div className="card-like" onClick={() => toggleLike(3)}>
            <img src={likedCards.includes(3) ? heartFilled : heartEmpty} alt="" />
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
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
          <img src={socialIcons} alt="" />
          <img src={socialIcons} alt="" />
        </FooterSocial>
      </FooterContainer>
    </ScreenContainer>
  );
};