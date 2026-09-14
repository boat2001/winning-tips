-- Rebrand the seeded system rows from Tips Deck to winning tips.
--
-- The stage_four_auth migration inserts the system-admin placeholder that seeded
-- records hang off via createdById, and the seed writes the site.identity
-- setting. Both were created under the old name. Those migrations are already
-- applied elsewhere and are checksummed, so they are corrected forward here
-- rather than edited in place.

UPDATE "users"
SET "displayName" = 'winning tips System',
    "email" = 'system@smart-tips.local'
WHERE "username" = 'system-admin';

UPDATE "settings"
SET "value" = '{"name":"winning tips","tagline":"We always win"}'::jsonb
WHERE "key" = 'site.identity';
