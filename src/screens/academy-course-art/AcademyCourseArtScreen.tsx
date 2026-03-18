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
      placeholderText="Практика создания визуального контента с ИИ, композиция, стиль и выразительная подача."
    />
  );
};
