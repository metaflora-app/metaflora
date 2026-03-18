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
      placeholderText="Вводный урок для знакомства с академией и логикой прохождения материалов."
    />
  );
};
