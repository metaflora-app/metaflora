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
      placeholderText="Курс «Система» — про то, как грамотно выстраивать процессы, а не тушить пожары."
      cardDescriptionOverride={'Курс «Система» — про то, как грамотно\nвыстраивать процессы,\nа не тушить пожары.\nкурс система'}
      cardTextFontSize={35}
    />
  );
};
