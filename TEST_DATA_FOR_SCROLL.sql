-- ============================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ПРОВЕРКИ СКРОЛЛА С ФЕЙДОМ
-- Дата: 2026-01-29
-- ============================================

-- ============================================
-- 1. ПОЛИГОН: 5 СТАТЕЙ (для теста скролла >4)
-- ============================================

INSERT INTO polygon_articles (title, annotation, filter_tags, keywords, is_active, order_index, content_blocks)
VALUES 
  (
    'тестовая статья 1: морфинг',
    'изучаем технику морфинга между изображениями через общие элементы',
    ARRAY['искусство', 'новое'],
    ARRAY['морфинг', 'изображения', 'midjourney'],
    true,
    1,
    '[
      {"id": "1", "type": "text", "content": "Морфинг — это плавный переход между двумя изображениями через общие элементы композиции."},
      {"id": "2", "type": "image", "content": "https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/polygon-covers/test-image-1.jpg"}
    ]'::jsonb
  ),
  (
    'тестовая статья 2: промптинг',
    'продвинутые техники составления промптов для получения качественных результатов',
    ARRAY['промптинг'],
    ARRAY['промпты', 'midjourney', 'chatgpt'],
    true,
    2,
    '[
      {"id": "1", "type": "text", "content": "Эффективный промпт состоит из нескольких ключевых элементов: описание объекта, стиль, освещение, композиция."},
      {"id": "2", "type": "prompt", "content": "ultra detailed portrait of a cyberpunk hacker, neon lighting, blade runner style, 8k, photorealistic --ar 16:9"}
    ]'::jsonb
  ),
  (
    'тестовая статья 3: автоматизация',
    'настраиваем автоматические пайплайны для обработки контента',
    ARRAY['автоматизация'],
    ARRAY['автоматизация', 'api', 'workflow'],
    true,
    3,
    '[
      {"id": "1", "type": "text", "content": "Автоматизация позволяет создавать сотни вариаций контента за считанные минуты."},
      {"id": "2", "type": "text", "content": "Используйте API для интеграции нейросетей в ваш рабочий процесс."}
    ]'::jsonb
  ),
  (
    'тестовая статья 4: система работы',
    'выстраиваем процессы работы с нейросетями от идеи до результата',
    ARRAY['система', 'новое'],
    ARRAY['система', 'процессы', 'методология'],
    true,
    4,
    '[
      {"id": "1", "type": "text", "content": "Системный подход позволяет не тушить пожары, а выстраивать понятную логику: цель → действия → результат."},
      {"id": "2", "type": "materials", "content": "[{\"name\": \"шаблон_процессов.pdf\", \"url\": \"https://example.com/template.pdf\"}]"}
    ]'::jsonb
  ),
  (
    'тестовая статья 5: референсы',
    'как правильно подбирать и использовать референсы для генерации',
    ARRAY['искусство'],
    ARRAY['референсы', 'стиль', 'композиция'],
    true,
    5,
    '[
      {"id": "1", "type": "text", "content": "Качественный референс — половина успеха. Он задает стиль, настроение и композицию будущего изображения."},
      {"id": "2", "type": "image", "content": "https://lwjsbflvsmscfrdkejia.supabase.co/storage/v1/object/public/polygon-covers/test-image-2.jpg"}
    ]'::jsonb
  );

-- ============================================
-- 2. АКАДЕМИЯ КУРС "СИСТЕМА": 9 УРОКОВ (для теста скролла >8)
-- ============================================

-- Сначала получаем ID курса "система"
DO $$
DECLARE
  sistema_course_id UUID;
BEGIN
  -- Находим или создаем курс "система"
  SELECT id INTO sistema_course_id FROM academy_courses WHERE course_type = 'система' LIMIT 1;
  
  IF sistema_course_id IS NULL THEN
    INSERT INTO academy_courses (course_type, title, description, is_active, order_index)
    VALUES ('система', 'Курс «Система»', 'Системный подход к работе с нейросетями', true, 1)
    RETURNING id INTO sistema_course_id;
  END IF;

  -- Добавляем 9 уроков
  INSERT INTO academy_lessons (course_id, lesson_number, title, description, is_active, order_index)
  VALUES 
    (sistema_course_id, 1, 'урок 1: основы системного подхода', 'знакомство с методологией системной работы с AI', true, 1),
    (sistema_course_id, 2, 'урок 2: постановка целей', 'учимся формулировать четкие цели для нейросетей', true, 2),
    (sistema_course_id, 3, 'урок 3: декомпозиция задач', 'разбиваем большую задачу на маленькие шаги', true, 3),
    (sistema_course_id, 4, 'урок 4: выбор инструментов', 'какие нейросети использовать для каких задач', true, 4),
    (sistema_course_id, 5, 'урок 5: workflow и pipeline', 'выстраиваем автоматические цепочки обработки', true, 5),
    (sistema_course_id, 6, 'урок 6: контроль качества', 'как проверять и улучшать результаты работы AI', true, 6),
    (sistema_course_id, 7, 'урок 7: масштабирование', 'переходим от одного промпта к массовой генерации', true, 7),
    (sistema_course_id, 8, 'урок 8: анализ эффективности', 'измеряем ROI от использования нейросетей', true, 8),
    (sistema_course_id, 9, 'урок 9: итоговый проект', 'собираем полную систему работы с AI от А до Я', true, 9);
  
  RAISE NOTICE 'Добавлено 9 уроков в курс "Система" (ID: %)', sistema_course_id;
END $$;

-- ============================================
-- ПРОВЕРКА СОЗДАННЫХ ДАННЫХ
-- ============================================

-- Проверяем статьи полигона
SELECT COUNT(*) as total_polygon_articles FROM polygon_articles WHERE is_active = true;

-- Проверяем уроки курса "система"
SELECT 
  c.title as course_title,
  COUNT(l.id) as total_lessons
FROM academy_courses c
LEFT JOIN academy_lessons l ON c.id = l.course_id AND l.is_active = true
WHERE c.course_type = 'система'
GROUP BY c.title;

-- ============================================
-- ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ
-- ============================================

/*
1. Открыть Supabase SQL Editor:
   https://supabase.com/dashboard/project/lwjsbflvsmscfrdkejia/sql

2. Скопировать и выполнить этот SQL скрипт

3. После деплоя мини-аппа:
   - Зайти в "все статьи в полигоне" → должен появиться скролл с фейдом (>4 статьи)
   - Зайти в курс "Система" → должен появиться скролл с фейдом (>8 уроков)

4. Проверить на десктопе и на iPhone

5. После проверки можно удалить тестовые данные:
   DELETE FROM polygon_articles WHERE title LIKE 'тестовая статья%';
   DELETE FROM academy_lessons WHERE title LIKE 'урок %:%';
*/
