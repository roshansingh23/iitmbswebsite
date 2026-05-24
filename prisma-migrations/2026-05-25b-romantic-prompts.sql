-- Replace casual / random prompts with romantic, date-centric ones.
-- Existing user answers and hooks on the removed prompts are wiped too.
BEGIN;

-- Snapshot the prompt ids that are getting deleted.
CREATE TEMP TABLE _doomed AS
SELECT id FROM "Prompt" WHERE text IN (
  'My toxic trait is…',
  'Two truths and a lie',
  'I''m weirdly good at…',
  'I go quiet when…',
  'The last thing I texted that made me laugh out loud',
  'An unpopular opinion I''ll die on',
  'A small thing that means a lot to me',
  'My most controversial Spotify Wrapped',
  'I''m convinced that…',
  'The fastest way to my Saturday morning is…'
);

-- 1. Hooks that reference a UserPrompt or Prompt that's about to die —
--    null the FKs so the deletes don't fail.
UPDATE "Hook"
  SET "userPromptId" = NULL
  WHERE "userPromptId" IN (
    SELECT id FROM "UserPrompt" WHERE "promptId" IN (SELECT id FROM _doomed)
  );
UPDATE "Hook"
  SET "promptId" = NULL
  WHERE "promptId" IN (SELECT id FROM _doomed);

-- 2. Delete user answers to the doomed prompts.
DELETE FROM "UserPrompt"
  WHERE "promptId" IN (SELECT id FROM _doomed);

-- 3. Delete the doomed prompts themselves.
DELETE FROM "Prompt" WHERE id IN (SELECT id FROM _doomed);

DROP TABLE _doomed;

-- 4. Insert the new romantic / date-centric prompts. Text is unique so
--    re-running the migration is a no-op.
INSERT INTO "Prompt" (id, text, active) VALUES
  ('cpr_first_date',     'My idea of a perfect first date is…',     true),
  ('cpr_fall_for_you',   'I''ll fall for you if…',                  true),
  ('cpr_daydream_date',  'A date I daydream about…',                true),
  ('cpr_love_lang',      'My love language is…',                    true),
  ('cpr_want_someone',   'I want someone who…',                     true),
  ('cpr_most_romantic',  'The most romantic thing I''ve done…',     true),
  ('cpr_first_date_ick', 'A first-date ick I just can''t…',         true),
  ('cpr_crush_moment',   'I knew I had a crush when…',              true),
  ('cpr_ideal_sunday',   'An ideal Sunday with you would be…',      true),
  ('cpr_looking_for',    'I''m looking for someone to…',            true),
  ('cpr_favorite_rom',   'My favorite kind of romance is…',         true),
  ('cpr_fall_hardest',   'I fall hardest for people who…',          true),
  ('cpr_show_care',      'How I show I care is…',                   true),
  ('cpr_date_with_you',  'We should go on a date if you…',          true),
  ('cpr_first_kiss',     'My ideal first kiss is…',                 true),
  ('cpr_relationship_winner', 'I''m at my best in a relationship when…', true)
ON CONFLICT (text) DO NOTHING;

COMMIT;
