import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// Images
import bgPattern from "../../assets/figma-welcome/pattern.png";
import logoSmall from "../../assets/figma-welcome/logo-small.png";
import footerLogo from "../../assets/figma-welcome/footer-logo.png";
import socials from "../../assets/figma-welcome/socials.png";
import carouselLeft from "../../assets/figma-welcome/carousel-left.png";
import carouselCenter from "../../assets/figma-welcome/carousel-center.png";
import carouselRight from "../../assets/figma-welcome/carousel-right.png";

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
`;

const StyledColorblock02 = styled.div`
  width: 317.09px;
  height: 286.96px;
  left: 403.64px;
  top: 73.04px;
  position: absolute;
  background: #D925F0;
  border-radius: 1568.56px;
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
  font-weight: 300;
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
  left: 950px;
  top: 28px;
  position: absolute;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 62px;
  border: 4px rgba(255, 255, 255, 0.30) solid;
  backdrop-filter: blur(50px);
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
  flex-direction: column;
  cursor: pointer;
`;

const StyledFooterdisclaimer2span01 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer2span02 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer2span03 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer2span04 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span01 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span02 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span03 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledFooterdisclaimer1span04 = styled.span`
  color: rgba(255, 255, 255, 0.40);
  font-size: 20px;
  font-family: Gotham Pro;
  font-weight: 700;
  line-height: 20px;
  word-wrap: break-word;
`;

const StyledWelcomeTextDiv = styled.div`
  width: 933px;
  height: 285px;
  left: 125px;
  top: 350px;
  position: absolute;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 25px;
  display: inline-flex;
`;

const StyledAITelegram = styled.div`
  width: 731px;
  height: 120px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  display: flex;
`;

const StyledTryFreeButtonDiv = styled.div`
  width: 892px;
  height: 139px;
  left: 147px;
  top: 1918px;
  position: absolute;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 62px;
  backdrop-filter: blur(50px);
  overflow: hidden;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
  cursor: pointer;
`;

const StyledPaginationDiv = styled.div`
  left: 483px;
  top: 1646px;
  position: absolute;
  justify-content: center;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledPaginationDot = styled.div<{ active?: boolean }>`
  width: ${props => props.active ? '30px' : '15px'};
  height: 15px;
  background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.40)'};
  border-radius: 25px;
`;

const StyledLogoSmallImg = styled.img`
  width: 189px;
  height: 137px;
  left: 25px;
  top: 28px;
  position: absolute;
`;

const StyledCarouselCenterFrame = styled.div`
  padding: 10px;
  left: 315px;
  top: 710px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledCarouselCenterDiv = styled.div`
  width: 530px;
  height: 930px;
  border-radius: 40px;
`;

const StyledCarouselLeftFrame = styled.div`
  padding: 10px;
  left: -132px;
  top: 710px;
  position: absolute;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  display: inline-flex;
`;

const StyledCarouselLeftDiv = styled.div`
  width: 530px;
  height: 930px;
  transform: rotate(-5deg);
  transform-origin: top left;
  border-radius: 40px;
`;

const StyledCarouselRightFrame = styled.div`
  padding: 10px;
  left: 764px;
  top: 710px;
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
`;

const StyledFooterLogoDiv = styled.div`
  width: 189px;
  height: 137px;
  left: 492px;
  top: 2350px;
  position: absolute;
`;

const StyledSocialsImg = styled.img`
  width: 142px;
  height: 51px;
  left: 745px;
  top: 2437px;
  position: absolute;
`;

const StyledFooterDiv = styled.div`
  width: 904px;
  height: 195px;
  left: 125px;
  top: 2085px;
  position: absolute;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 19px;
  display: inline-flex;
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
`;

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StyledMainDiv style={{backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <StyledContentDiv>
        <StyledBackgroundoverlay />
        
        {/* Logo Small */}
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
          
          <StyledAITelegram>
            <StyledTelegramservicestextspan01>обучайтесь AI прямо в Telegram</StyledTelegramservicestextspan01>
            <StyledTelegramservicestextspan02>с МЕТАФЛОРОЙ*:</StyledTelegramservicestextspan02>
            <StyledTelegramservicestextspan03>академия, лаба, цех и другие сервисы</StyledTelegramservicestextspan03>
          </StyledAITelegram>
        </StyledWelcomeTextDiv>
        
        {/* Carousel */}
        <StyledCarouselLeftFrame>
          <StyledCarouselLeftDiv>
            <img src={carouselLeft} alt="Carousel Left" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px'}} />
          </StyledCarouselLeftDiv>
        </StyledCarouselLeftFrame>
        
        <StyledCarouselCenterFrame>
          <StyledCarouselCenterDiv>
            <img src={carouselCenter} alt="Carousel Center" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px'}} />
          </StyledCarouselCenterDiv>
        </StyledCarouselCenterFrame>
        
        <StyledCarouselRightFrame>
          <StyledCarouselRightDiv>
            <img src={carouselRight} alt="Carousel Right" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px'}} />
          </StyledCarouselRightDiv>
        </StyledCarouselRightFrame>
        
        {/* Pagination */}
        <StyledPaginationDiv>
          <StyledPaginationDot active />
          <StyledPaginationDot />
          <StyledPaginationDot />
        </StyledPaginationDiv>
        
        {/* Tour Button */}
        <StyledTourButtonDiv>
          <StyledButtonbackground>
            <StyledPlatformtourbuttontextspan>увидеть экскурсию по платформе</StyledPlatformtourbuttontextspan>
          </StyledButtonbackground>
        </StyledTourButtonDiv>
        
        {/* Try Free Button */}
        <StyledTryFreeButtonDiv onClick={() => navigate('/tour-video')}>
          <StyledColorblock />
          <StyledColorblock01 />
          <StyledColorblock02 />
          <StyledTryforfreebuttontextspan>попробовать бесплатно</StyledTryforfreebuttontextspan>
        </StyledTryFreeButtonDiv>
        
        {/* Footer */}
        <StyledFooterDiv>
          <div style={{width: '904px', height: '80px'}}>
            <StyledFooterdisclaimer1span01>мы предоставляем </StyledFooterdisclaimer1span01>
            <StyledFooterdisclaimer1span02>бесплатный доступ к демо </StyledFooterdisclaimer1span02>
            <StyledFooterdisclaimer1span03>нашего сервиса. полная версия и тарифные планы доступны </StyledFooterdisclaimer1span03>
            <StyledFooterdisclaimer1span04>за дополнительную плату</StyledFooterdisclaimer1span04>
          </div>
          
          <div style={{width: '904px', height: '60px'}}>
            <StyledFooterdisclaimer2span01>наш сервис помогает в освоении </StyledFooterdisclaimer2span01>
            <StyledFooterdisclaimer2span02>ИИ-инструментов, </StyledFooterdisclaimer2span02>
            <StyledFooterdisclaimer2span03>но </StyledFooterdisclaimer2span03>
            <StyledFooterdisclaimer2span04>не гарантирует конкретных результатов</StyledFooterdisclaimer2span04>
          </div>
        </StyledFooterDiv>
        
        {/* Footer Logo */}
        <StyledFooterLogoDiv>
          <img src={footerLogo} alt="МЕТАФЛОРА*" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        </StyledFooterLogoDiv>
        
        {/* Socials */}
        <StyledSocialsImg src={socials} alt="Socials" />
      </StyledContentDiv>
    </StyledMainDiv>
  );
};
