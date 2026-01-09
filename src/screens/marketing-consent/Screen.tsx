/**
 * экран рекламная и информационная рассылка (7:2904)
 * Marketing Consent Screen - 1180x2550px
 * 
 * Figma→Code mapping:
 * - согласие на получение... (7:2933) → main heading
 * - Frame 12343455 (7:2949) → outer container (886x1560)
 * - карточка промпта (7:2950) → content card (801x1445)
 * - Frame 12343456 (7:2951) → black inner card
 * - Frame 12343457 (7:2952) → content area (759x1359)
 * - Consent text (7:2953) → marketing consent full text
 */

import React from 'react';
import { ScreenRoot } from '../../components/layout';

export default function MarketingConsentScreen() {
  return (
    <ScreenRoot className="bg-[#020101] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 w-full h-full opacity-10">
        <div className="grid grid-cols-4 gap-0 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-full h-full bg-black opacity-5" />
          ))}
        </div>
      </div>

      <div className="relative w-[1180px] h-[2550px] mx-auto">
        {/* Top navigation */}
        <div className="absolute top-[930px] left-[120px] flex gap-[2px]">
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M29.375 11.75L17.625 23.5L29.375 35.25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-[81px] h-[64px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 flex items-center justify-center ml-[2px]">
            <svg width="47" height="47" viewBox="0 0 47 47" fill="none">
              <path d="M23.5 12L11.75 23.75V35.25H18.375V27.625H28.625V35.25H35.25V23.75L23.5 12Z" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <button className="absolute top-[916px] right-[120px] w-[205px] h-[78px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30 flex items-center justify-center">
          <span className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px] text-center">
            написать<br />в поддержку
          </span>
        </button>

        <div className="absolute top-[866px] left-[505px] w-[177px] h-[128px] bg-white/10 rounded-lg" />

        {/* Heading (7:2933) */}
        <h1 className="absolute top-[1057px] left-[115px] w-[1020px] text-white text-[80px] font-['Inter'] font-extrabold leading-[80px]">
          согласие на получение<br />информационной<br />и рекламной рассылки
        </h1>

        {/* Main container (7:2949) */}
        <div className="absolute top-[1380px] left-[147px] w-[886px] h-[1560px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30">
          {/* Content card (7:2950) */}
          <div className="absolute top-[55px] left-[45px] w-[801px] h-[1445px] bg-black rounded-[30px] border border-white/30 p-[21px]">
            {/* Content area (7:2952) */}
            <div className="w-[759px] h-[1359px] bg-white/10 backdrop-blur rounded-[30px] border border-white/30 p-[65px]">
              {/* Consent text (7:2953) */}
              <div className="text-white text-[35px] font-['TT_Commons'] font-light leading-[35px] text-center overflow-y-auto">
                <p className="mb-[35px]">
                  Проставляя отметку (галочку) в чекбоксе «Согласен на получение информационной и рекламной рассылки», я свободно, своей волей и в своём интересе даю согласие Индивидуальному предпринимателю Мищенко Ивану Сергеевичу
                </p>
                <p className="mb-[35px]">
                  (ИНН 440703001205, ОГРН 323440000024387, юридический адрес: 157500, Россия, Костромская область, Шарьинский район, г. Шарья, Садовый переулок, д. 5)<br />
                  (далее — Продавец, Оператор)
                </p>
                <p className="mb-[35px]">
                  на получение от Продавца информационной и рекламной рассылки, касающейся информации об услугах, продуктах, акциях, специальных предложениях, мероприятиях и иных новостях Продавца.
                </p>
                <p className="mb-[25px]">
                  Информационная и рекламная рассылка может направляться следующими способами:
                </p>
                <p className="mb-[35px]">
                  • по электронной почте на адрес, указанный мной при заполнении форм на сайте;<br />
                  • в виде SMS-сообщений и сообщений в мессенджерах на номер телефона, указанный мной;<br />
                  • иными средствами связи, предоставленными мной Продавцу.
                </p>
                <p>
                  Цель обработки персональных данных — информирование пользователя о новостях, услугах и товарах Продавца, проведение маркетинговых и рекламных коммуникаций.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (7:2891, 7:2941) */}
        <footer className="absolute bottom-[723px] left-[125px] right-[125px]">
          <div className="mb-[20px]">
            <div className="w-[587px] h-[125px] bg-white/10 rounded-lg" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-white text-[20px] font-['Gotham_Pro'] font-light leading-[20px]">
              Copyright ©<br />Все права защищены.
            </p>
            <div className="flex items-center gap-[10px] px-[17px] py-[13px] bg-white/10 backdrop-blur rounded-[62px] border border-white/30">
              <div className="w-[50px] h-[51px] bg-white/20 rounded-full" />
              <div className="w-[142px] h-[51px] bg-white/20 rounded-lg" />
            </div>
          </div>
        </footer>
      </div>
    </ScreenRoot>
  );
}
