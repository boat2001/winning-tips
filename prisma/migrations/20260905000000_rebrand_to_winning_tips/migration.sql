-- Rebrand the seeded system rows from winning tips to Winning Tips.
--
-- Same shape as the Tips Deck correction before it: the system-admin placeholder
-- comes from stage_four_auth and the site.identity setting from the seed, both
-- written under the previous name. Those files are already applied and are
-- checksummed, so they are corrected forward here rather than edited in place.
--
-- site.identity is also written on update by the seed, so a re-seed heals it too;
-- this statement covers databases that are migrated but not re-seeded.

UPDATE "users"
SET "displayName" = 'Winning Tips System',
    "email" = 'system@winning-tips.local'
WHERE "username" = 'system-admin';

UPDATE "settings"
SET "value" = '{"name":"Winning Tips","tagline":"We always win"}'::jsonb
WHERE "key" = 'site.identity';
