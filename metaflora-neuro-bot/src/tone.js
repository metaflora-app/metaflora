const informalForms = Object.freeze([
  ['выберите', 'выбери'],
  ['выбирайте', 'выбирай'],
  ['пришлите', 'пришли'],
  ['отправьте', 'отправь'],
  ['опишите', 'опиши'],
  ['укажите', 'укажи'],
  ['приложите', 'приложи'],
  ['прикрепите', 'прикрепи'],
  ['попросите', 'попроси'],
  ['используйте', 'используй'],
  ['задайте', 'задай'],
  ['покажите', 'покажи'],
  ['попробуйте', 'попробуй'],
  ['начните', 'начни'],
  ['загрузите', 'загрузи'],
  ['перечислите', 'перечисли'],
  ['дайте', 'дай'],
  ['сравните', 'сравни'],
  ['тестируйте', 'тестируй'],
  ['оставьте', 'оставь'],
  ['напишите', 'напиши'],
  ['нажмите', 'нажми'],
  ['повторите', 'повтори'],
  ['проверьте', 'проверь']
]);

function preserveCase(source, replacement) {
  return source[0] === source[0].toUpperCase()
    ? replacement[0].toUpperCase() + replacement.slice(1)
    : replacement;
}

export function informalizeText(text) {
  return informalForms.reduce(
    (result, [formal, informal]) => result.replace(
      new RegExp(`(?<![\\p{L}\\p{N}_])${formal}(?![\\p{L}\\p{N}_])`, 'giu'),
      (match) => preserveCase(match, informal)
    ),
    String(text)
  );
}
