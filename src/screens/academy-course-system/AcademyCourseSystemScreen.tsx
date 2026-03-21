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
      placeholderText="Курс «Система» — про то, как грамотно процессы, а не тушить пожары."
      cardDescriptionOverride={'Курс «Система» —\nпро то, как грамотно\nпроцессы,\nа не тушить пожары'}
      cardTextFontSize={35}
    />
  );
};
