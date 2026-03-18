import React from 'react';
import { AcademyCourseGridScreen } from '../../components/AcademyCourseGridScreen';

export const AcademyCourseAutomationScreen: React.FC = () => {
  return (
    <AcademyCourseGridScreen
      source="academy"
      courseType="автоматизация"
      homeRoute="/main-dashboard-premium"
      title="курс «автоматизация»"
      subtitleLines={[
        'n8n, рабочие воркфлоу и вайбкодинг —',
        'вся автоматизация на ладони',
      ]}
      placeholderCount={8}
      placeholderText="n8n, воркфлоу и практические сценарии автоматизации, которые можно быстро применить в работе."
    />
  );
};
