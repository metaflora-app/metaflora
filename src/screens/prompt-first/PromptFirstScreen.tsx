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
  width: 100vw;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

// Header Section
const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderButton = styled.div`
  width: 60px;
  height: 60px;
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
`;

const HeaderLogo = styled.div`
  img {
    height: 40px;
    width: auto;
  }
`;

const SupportButton = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  padding: 10px 15px;
  cursor: pointer;
  
  font-family: 'Gotham Pro', sans-serif;
  font-weight: 300;
  font-size: 12px;
  color: white;
  text-align: center;
  
  .bold {
    font-weight: 700;
  }
`;

// Hero Section
const HeroImage = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  
  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

// Search Section
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  backdrop-filter: blur(50px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  padding: 15px;
  margin-bottom: 20px;
`;

const SearchIcon = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 15px;
  
  img {
    width: 100%;
    height: 100%;
    filter: brightness(0) saturate(100%) invert(100%);
  }
`;

const SearchInput = styled.input`
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
`;

// Filters Section
const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
`;

const FiltersGridSecond = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const FilterButton = styled.div<{ isActive?: boolean }>`
  backdrop-filter: blur(50px);
  background: ${props => props.isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.9)'};
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  .text {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: white;
    position: relative;
    z-index: 2;
  }
  
  ${props => props.isActive && `
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, #37ecf7, #f0d825, #d5fc44);
      opacity: 0.1;
    }
  `}
`;

// Cards Section
const CardsContainer = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const PromptCard = styled.div`
  backdrop-filter: blur(50px);
  background: black;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  padding: 15px;
  position: relative;
  
  .card-image {
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 10px;
    
    img {
      width: 100%;
      height: 100px;
      object-fit: cover;
    }
  }
  
  .card-title {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: white;
    margin-bottom: 5px;
    line-height: 1.2;
  }
  
  .card-description {
    font-family: 'Gotham Pro', sans-serif;
    font-weight: 300;
    font-size: 11px;
    color: white;
    margin-bottom: 10px;
    line-height: 1.3;
  }
  
  .card-button {
    backdrop-filter: blur(50px);
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    padding: 6px 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, #37ecf7, #f0d825, #d5fc44);
      opacity: 0.3;
    }
    
    .text {
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 11px;
      color: white;
      position: relative;
      z-index: 2;
    }
  }
  
  .card-like {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    
    img {
      width: 100%;
      height: 100%;
    }
  }
  
  .new-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    backdrop-filter: blur(50px);
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 2px 6px;
    
    .text {
      font-family: 'Gotham Pro', sans-serif;
      font-weight: 500;
      font-size: 8px;
      color: white;
    }
  }
`;

// Footer Section
const FooterSection = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FooterLogo = styled.div`
  margin-bottom: 10px;
  
  img {
    height: 50px;
    width: auto;
  }
`;

const FooterCopyright = styled.div`
  font-family: 'Gotham Pro', sans-serif;
  font-weight: 300;
  font-size: 12px;
  color: white;
  margin-bottom: 15px;
`;

const FooterSocials = styled.div`
  backdrop-filter: blur(50px);
  background: rgba(255, 255, 255, 0.1);
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 8px 15px;
  display: flex;
  gap: 8px;
  
  img {
    width: 20px;
    height: 20px;
    opacity: 0.6;
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
      {/* Header */}
      <HeaderSection>
        <HeaderButton onClick={handleBack}>
          <img src={backArrow} alt="Назад" />
        </HeaderButton>
        
        <HeaderButton onClick={handleHome}>
          <img src={homeVector1} alt="Домой" />
        </HeaderButton>

        <HeaderLogo>
          <img src={smallLogo} alt="МЕТАФЛОРА" />
        </HeaderLogo>

        <SupportButton onClick={handleSupport}>
          написать <span className="bold">в поддержку</span>
        </SupportButton>
      </HeaderSection>

      {/* Hero Image */}
      <HeroImage>
        <img src={houseImage} alt="" />
      </HeroImage>

      {/* Search */}
      <SearchContainer>
        <SearchIcon>
          <img src={searchIcon} alt="" />
        </SearchIcon>
        <SearchInput
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="промпт для ИИ-копирайтера любых текстов"
        />
      </SearchContainer>

      {/* Filters */}
      <FiltersGrid>
        <FilterButton isActive>
          <div className="text">вернуть</div>
        </FilterButton>
        <FilterButton>
          <div className="text">избранное</div>
        </FilterButton>
        <FilterButton>
          <div className="text">недавние</div>
        </FilterButton>
      </FiltersGrid>
      
      <FiltersGridSecond>
        <FilterButton>
          <div className="text">топ-выбор</div>
        </FilterButton>
        <FilterButton>
          <div className="text">новые</div>
        </FilterButton>
      </FiltersGridSecond>

      {/* Cards */}
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
            <div className="text">новое</div>
          </div>
          <div className="card-title">ИИ-копирайтер для блога</div>
          <div className="card-description">настройте ИИ-копирайтера за один промпт</div>
          <div className="card-button" onClick={handlePromptCard}>
            <div className="text">перейти</div>
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
            <div className="text">перейти</div>
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
            <div className="text">перейти</div>
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
            <div className="text">перейти</div>
          </div>
        </PromptCard>
      </CardsContainer>

      {/* Footer */}
      <FooterSection>
        <FooterLogo>
          <img src={footerLogo} alt="МЕТАФЛОРА" />
        </FooterLogo>
        <FooterCopyright>
          Copyright © Все права защищены.
        </FooterCopyright>
        <FooterSocials>
          <img src={socialIcons} alt="" />
          <img src={socialIcons} alt="" />
          <img src={socialIcons} alt="" />
          <img src={socialIcons} alt="" />
        </FooterSocials>
      </FooterSection>
    </ScreenContainer>
  );
};