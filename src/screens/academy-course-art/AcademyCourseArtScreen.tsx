import React from 'react';
import { AcademyCourseGridScreen } from '../../components/AcademyCourseGridScreen';

export const AcademyCourseArtScreen: React.FC = () => {
  return (
    <AcademyCourseGridScreen
      source="academy"
      courseType="искусство"
      homeRoute="/main-dashboard-premium"
      title="курс «искусство»"
      subtitleLines={[
        'создание сильного визуального контента',
        'с ИИ (и не только) через практику',
      ]}
      placeholderCount={8}
      placeholderText="Курс «Искусство» — про сильный визуал, AI-эстетику и выразительную подачу."
      cardDescriptionOverride={'Курс «Искусство» —\nпро сильный визуал,\nAI-эстетику\nи выразительную подачу'}
      cardTextFontSize={35}
    />
  );
};
