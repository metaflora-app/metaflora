import React from 'react';
import { AcademyCourseGridScreen } from '../../components/AcademyCourseGridScreen';

export const AcademyCourseDemoScreen: React.FC = () => {
  return (
    <AcademyCourseGridScreen
      source="demo"
      courseType="демо"
      homeRoute="/main-dashboard-free"
      title="курс «демо»"
      subtitleLines={[
        'короткий вводный курс для знакомства',
        'с академией',
      ]}
      placeholderCount={4}
      placeholderText="Курс «Демо» — короткий вводный маршрут, чтобы познакомиться с академией и логикой обучения."
      cardDescriptionOverride={'Курс «Демо» — короткий вводный маршрут,\nчтобы познакомиться с академией\nи логикой обучения.\nкурс демо'}
      cardTextFontSize={35}
    />
  );
};
