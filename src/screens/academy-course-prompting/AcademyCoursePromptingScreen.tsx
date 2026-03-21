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
      placeholderText="Курс «Промптинг» — про техники, форматы и логику запросов для сильного результата."
      cardDescriptionOverride={'Курс «Промптинг» — про техники,\nформаты и логику запросов\nдля сильного результата.\nкурс промптинг'}
      cardTextFontSize={35}
    />
  );
};
