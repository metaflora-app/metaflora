import React from 'react';
import { AcademyCourseGridScreen } from '../../components/AcademyCourseGridScreen';

export const AcademyCoursePromptingScreen: React.FC = () => {
  return (
    <AcademyCourseGridScreen
      source="academy"
      courseType="промптинг"
      homeRoute="/main-dashboard-premium"
      title="курс «промптинг»"
      subtitleLines={[
        'промпт-инжиниринг от «А» до «Я»: техники,',
        'форматы и советы',
      ]}
      placeholderCount={8}
      placeholderText="Техники и форматы промпт-инжиниринга, которые помогают получать нужный результат от LLM."
    />
  );
};
