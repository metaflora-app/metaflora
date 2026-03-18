import React from 'react';
import { AcademyCourseGridScreen } from '../../components/AcademyCourseGridScreen';

export const AcademyCourseSystemScreen: React.FC = () => {
  return (
    <AcademyCourseGridScreen
      source="academy"
      courseType="система"
      homeRoute="/main-dashboard-premium"
      title="курс «система»"
      subtitleLines={[
        'базовый курс, без которого сложно',
        'полноценно погрузиться в обучение',
      ]}
      placeholderCount={8}
      placeholderText="Как выстраивать процессы, собирать понятную логику и двигаться к результату без хаоса."
    />
  );
};
