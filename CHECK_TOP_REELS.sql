-- Проверка данных в laba_top_reels
SELECT COUNT(*) as total FROM laba_top_reels;

-- Проверка по категориям
SELECT category, COUNT(*) as count 
FROM laba_top_reels 
GROUP BY category;

-- Проверка JOIN с laba_reels
SELECT 
  ltr.category,
  ltr.position,
  ltr.reel_id,
  lr.instagram_reel_id,
  lr.owner_username
FROM laba_top_reels ltr
LEFT JOIN laba_reels lr ON ltr.reel_id = lr.id
LIMIT 10;
