import { audioWorkflowCatalog, getAudioWorkflowById } from './audio-workflow-catalog.js';
import { metacoinHtml } from './brand-icons.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const cardFromWorkflow = (workflow) => Object.freeze({
  title: workflow.name,
  description: workflow.description,
  instruction: workflow.instruction,
  highlights: Object.freeze([workflow.highlight])
});

export const audioWorkflowCards = Object.freeze(Object.fromEntries(
  audioWorkflowCatalog.map((workflow) => [workflow.id, cardFromWorkflow(workflow)])
));

export const getAudioWorkflowCard = (id) => {
  const card = audioWorkflowCards[id];
  if (!card) throw new RangeError(`карточка аудиосценария «${id}» не найдена`);
  return card;
};

const priceSummary = ({ min, max, unit }) => min === max
  ? `${min} метакоинов ${unit}`
  : `${min}–${max} метакоинов ${unit}`;

export const formatAudioWorkflowPrice = (workflowOrId) => {
  const workflow = typeof workflowOrId === 'string'
    ? getAudioWorkflowById(workflowOrId)
    : workflowOrId;
  if (!workflow) throw new RangeError(`аудиосценарий «${workflowOrId}» не найден`);
  return priceSummary(workflow.pricing);
};

const highlightedDescription = (description, highlight) => {
  const start = description.indexOf(highlight);
  if (start < 0) return escapeHtml(description);
  const end = start + highlight.length;
  return [
    escapeHtml(description.slice(0, start)),
    `<b>${escapeHtml(description.slice(start, end))}</b>`,
    escapeHtml(description.slice(end))
  ].join('');
};

export const buildAudioWorkflowCardText = (workflowOrId) => {
  const workflow = typeof workflowOrId === 'string'
    ? getAudioWorkflowById(workflowOrId)
    : workflowOrId;
  if (!workflow) throw new RangeError(`аудиосценарий «${workflowOrId}» не найден`);

  const card = getAudioWorkflowCard(workflow.id);
  return [
    `<b>${escapeHtml(workflow.customEmojiFallback)} ${escapeHtml(card.title)}</b>`,
    highlightedDescription(card.description, workflow.highlight),
    `${escapeHtml(card.instruction)}👇`,
    `<b>стоимость: ${metacoinHtml()} ${escapeHtml(formatAudioWorkflowPrice(workflow))}</b>`
  ].join('\n\n');
};
