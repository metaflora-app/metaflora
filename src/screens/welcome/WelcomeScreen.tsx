import React from "react";
import styled from "styled-components";
import { useNavigate } from 'react-router-dom';

// Images
import bgPattern from '../../assets/figma-welcome/pattern.png';
import logoSmall from '../../assets/figma-welcome/logo-small.png';
import footerLogo from '../../assets/figma-welcome/footer-logo.png';
import socials from '../../assets/figma-welcome/socials.png';
import carouselLeft from '../../assets/figma-welcome/carousel-left.png';
import carouselCenter from '../../assets/figma-welcome/carousel-center.png';
import carouselRight from '../../assets/figma-welcome/carousel-right.png';

const StyledBackgroundoverlay = styled.div`
  width: 1180px;
  height: 2550px;
  background: black;
`;

const StyledWelcometextspan = styled.span`
  color: white;
  font-size: 80px;
  font-family: Inter;
  font-weight: 800;
  line-height: 80px;
  word-wrap: break-word;
`;

const StyledTelegramservicestextspan01 = styled.span`
  color: white;
  font-size: 40px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 40px;
  word-wrap: break-word;
`;

const StyledTelegramservicestextspan02 = styled.span`
  color: white;
  font-size: 40px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 40px;
  word-wrap: break-word;
`;

const StyledTelegramservicestextspan03 = styled.span`
  color: white;
  font-size: 40px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 40px;
  word-wrap: break-word;
`;

const StyledTourButtonDiv = styled.div`
  width: 892px;
  height: 139px;
  padding: 10px;
  left: 147px;
  top: 1759px;
  position: absolute;
  border-radius: 62px;
  border: 4px rgba(255, 255, 255, 0.30) solid;
  backdrop-filter: blur(50px);
`;

const StyledPlatformtourbuttontextspan = styled.span`
  color: white;
  font-size: 40px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 40px;
  word-wrap: break-word;
`;

const StyledButtonbackground = styled.button`
  align-self: stretch;
  height: 136px;
  border-radius: 62px;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const StyledColorblock = styled.div`
  width: 575.78px;
  height: 423.34px;
  left: 145px;
  top: -189.57px;
  position: absolute;
  background: #37ECF7;
  border-radius: 1568.56px;
  filter: blur(100px);
`;

const StyledColorblock01 = styled.div`
  width: 476.73px;
  height: 215.23px;
  left: 333.66px;
  top: -203.51px;
  position: absolute;
  transform: rotate(12deg);
  transform-origin: top left;
  background: #F0D825;
  border-radius: 1568.56px;
  filter: blur(100px);
`;

const StyledColorblock02 = styled.div`
  width: 317.09px;
  height: 286.96px;
  left: 403.64px;
  top: 73.04px;
  position: absolute;
  background: #D5FC44;
  border-radius: 1568.56px;
  filter: blur(100px);
`;

const StyledTryforfreebuttontextspan = styled.span`
  color: white;
  font-size: 40px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 40px;
  word-wrap: break-word;
`;

const StyledSupportbuttontextspan01 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledSupportbuttontextspan02 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledSupportButtonDiv = styled.div`
  width: 205px;
  height: 78px;
  left: 824px;
  top: 97px;
  position: absolute;
  background: rgba(255, 255, 255, 0.10);
  overflow: hidden;
  border-radius: 62px;
  outline: 4px rgba(255, 255, 255, 0.30) solid;
  outline-offset: -4px;
  backdrop-filter: blur(50px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const StyledFooterdisclaimer2span01 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer2span02 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer2span04 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span01 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span02 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span04 = styled.span`
  color: white;
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledWelcomeTextDiv = styled.div`
  left: 94px;
  top: 197px;
  position: absolute;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledAITelegram = styled.div`
  left: 94px;
  top: 382px;
  position: absolute;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledTryFreeButtonDiv = styled.div`
  width: 892px;
  height: 139px;
  left: 147px;
  top: 1917px;
  position: absolute;
  background: rgba(0, 0, 0, 0.90);
  overflow: hidden;
  border-radius: 62px;
  outline: 4px rgba(255, 255, 255, 0.30) solid;
  outline-offset: -4px;
  backdrop-filter: blur(50px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledPaginationDiv = styled.div`
  left: 531px;
  top: 1650px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 11px;
  display: inline-flex;
`;

const StyledPaginationDot = styled.div<{ active?: boolean }>`
  width: ${props => props.active ? '63px' : '17px'};
  height: 17px;
  border-radius: 33px;
  background: ${props => props.active ? '#fffdfe' : '#d6d6d6'};
`;

const StyledLogoSmallImg = styled.img`
  width: 189px;
  height: 137px;
  left: 492px;
  top: 28px;
  position: absolute;
`;

const StyledCarouselLeftFrame = styled.div`
  padding: 10px;
  left: -213px;
  top: 639px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledCarouselLeftDiv = styled.div`
  width: 530px;
  height: 930px;
  transform: rotate(-175deg);
  transform-origin: top left;
  border-radius: 40px;
  overflow: hidden;
`;

const StyledCarouselRightFrame = styled.div`
  padding: 10px;
  left: 764px;
  top: 639px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledCarouselRightDiv = styled.div`
  width: 530px;
  height: 930px;
  border-radius: 40px;
  overflow: hidden;
  transform: scaleY(-1);
`;

const StyledCarouselCenterFrame = styled.div`
  padding: 10px;
  left: 315px;
  top: 639px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  display: inline-flex;
  z-index: 2;
`;

const StyledCarouselCenterDiv = styled.div`
  width: 530px;
  height: 930px;
  border-radius: 40px;
  overflow: hidden;
`;

const StyledFooterLogoDiv = styled.div`
  width: 587px;
  height: 125px;
  left: 0px;
  top: 70px;
  position: absolute;
`;

const StyledSocialsImg = styled.img`
  width: 142px;
  height: 51px;
  left: 745px;
  top: 107px;
  position: absolute;
`;

const StyledFooterDiv = styled.div`
  width: 904px;
  height: 195px;
  left: 125px;
  top: 2085px;
  position: absolute;
`;

const StyledContentDiv = styled.div`
  width: 1180px;
  height: 2550px;
  left: 0px;
  top: 0px;
  position: absolute;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  display: inline-flex;
`;

const StyledMainDiv = styled.div`
  width: 1180px;
  height: 2550px;
  position: relative;
  background: #020101;
  overflow: hidden;
  background-image: url(${bgPattern});
  background-size: cover;
  background-position: center;
  background-repeat: repeat;
`;

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StyledMainDiv>
      <StyledContentDiv>
        <StyledBackgroundoverlay />
        
        {/* Logo */}
        <StyledLogoSmallImg src={logoSmall} alt="МЕТАФЛОРА*" />
        
        {/* Support Button */}
        <StyledSupportButtonDiv onClick={() => {/* TODO: Add support link */}}>
          <StyledSupportbuttontextspan01>написать</StyledSupportbuttontextspan01>
          <StyledSupportbuttontextspan02>в поддержку</StyledSupportbuttontextspan02>
        </StyledSupportButtonDiv>
        
        {/* Welcome Text */}
        <StyledWelcomeTextDiv>
          <StyledWelcometextspan>
            добро пожаловать<br />в МЕТАФЛОРУ*
          </StyledWelcometextspan>
        </StyledWelcomeTextDiv>
        
        {/* AI Telegram Text */}
        <StyledAITelegram>
          <div>
            <StyledTelegramservicestextspan01>обучайтесь AI прямо в Telegram</StyledTelegramservicestextspan01>
            <br />
            <StyledTelegramservicestextspan02>с МЕТАФЛОРОЙ*:</StyledTelegramservicestextspan02>
            {' '}
            <StyledTelegramservicestextspan03>академия, лаба, цех</StyledTelegramservicestextspan03>
            <br />
            <StyledTelegramservicestextspan01>и другие сервисы</StyledTelegramservicestextspan01>
          </div>
        </StyledAITelegram>
        
        {/* Carousel Left */}
        <StyledCarouselLeftFrame>
          <StyledCarouselLeftDiv>
            <img src={carouselLeft} alt="Carousel left" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </StyledCarouselLeftDiv>
        </StyledCarouselLeftFrame>
        
        {/* Carousel Center */}
        <StyledCarouselCenterFrame>
          <StyledCarouselCenterDiv>
            <img src={carouselCenter} alt="Carousel center" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </StyledCarouselCenterDiv>
        </StyledCarouselCenterFrame>
        
        {/* Carousel Right */}
        <StyledCarouselRightFrame>
          <StyledCarouselRightDiv>
            <img src={carouselRight} alt="Carousel right" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </StyledCarouselRightDiv>
        </StyledCarouselRightFrame>
        
        {/* Pagination Dots */}
        <StyledPaginationDiv>
          <StyledPaginationDot />
          <StyledPaginationDot active />
          <StyledPaginationDot />
        </StyledPaginationDiv>
        
        {/* Tour Button */}
        <StyledTourButtonDiv>
          <StyledButtonbackground onClick={() => navigate('/tour-video')}>
            <StyledPlatformtourbuttontextspan>
              экскурсия по платформе
            </StyledPlatformtourbuttontextspan>
          </StyledButtonbackground>
        </StyledTourButtonDiv>
        
        {/* Try Free Button with Gradient */}
        <StyledTryFreeButtonDiv onClick={() => navigate('/demo-access')}>
          <StyledColorblock />
          <StyledColorblock01 />
          <StyledColorblock02 />
          <StyledTryforfreebuttontextspan style={{ position: 'relative', zIndex: 1 }}>
            попробовать бесплатно
          </StyledTryforfreebuttontextspan>
        </StyledTryFreeButtonDiv>
        
        {/* Footer */}
        <StyledFooterDiv>
          <StyledFooterLogoDiv>
            <img src={footerLogo} alt="МЕТАФЛОРА*" style={{ width: '100%', height: 'auto' }} />
          </StyledFooterLogoDiv>
          
          <div style={{ position: 'absolute', left: '0px', top: '0px' }}>
            <StyledFooterdisclaimer1span01>нажимая на кнопку, вы соглашаетесь</StyledFooterdisclaimer1span01>
            <br />
            <StyledFooterdisclaimer1span02>с политикой конфиденциальности</StyledFooterdisclaimer1span02>
            {' '}
            <StyledFooterdisclaimer1span04>МЕТАФЛОРА*</StyledFooterdisclaimer1span04>
          </div>
          
          <StyledSocialsImg src={socials} alt="Social media" />
          
          <div style={{ position: 'absolute', right: '0px', top: '0px', textAlign: 'right' }}>
            <StyledFooterdisclaimer2span01>нажимая на кнопку, вы соглашаетесь</StyledFooterdisclaimer2span01>
            <br />
            <StyledFooterdisclaimer2span02>на получение информационной</StyledFooterdisclaimer2span02>
            <br />
            <StyledFooterdisclaimer2span02>и рекламной рассылки</StyledFooterdisclaimer2span02>
            {' '}
            <StyledFooterdisclaimer2span04>МЕТАФЛОРА*</StyledFooterdisclaimer2span04>
          </div>
        </StyledFooterDiv>
      </StyledContentDiv>
    </StyledMainDiv>
  );
};
