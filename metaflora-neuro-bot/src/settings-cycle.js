function selectableValues(definition) {
  return Array.isArray(definition?.values)
    ? definition.values.map(({ value }) => String(value))
    : [];
}

export function cycleSettingValue(source = {}, definition) {
  const current = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  const values = selectableValues(definition);
  if (!definition?.key || values.length < 2) return Object.freeze({ ...current });
  const selected = String(current[definition.key] ?? definition.defaultValue ?? '');
  const index = values.indexOf(selected);
  const nextIndex = index < 0 ? 0 : (index + 1) % values.length;
  return Object.freeze({ ...current, [definition.key]: values[nextIndex] });
}
