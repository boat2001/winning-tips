-- Rebrand the seeded system rows from Tips Deck to Smart Tips.
--
-- The stage_four_auth migration inserts the system-admin placeholder that seeded
-- records hang off via createdById, and the seed writes the site.identity
-- setting. Both were created under the old name. Those migrations are already
-- applied elsewhere and are checksummed, so they are corrected forward here
-- rather than edited in place.

UPDATE "users"
SET "displayName" = 'Smart Tips System',
    "email" = 'system@smart-tips.local'
WHERE "username" = 'system-admin';

UPDATE "settings"
SET "value" = '{"name":"Smart Tips","tagline":"Read the game. Win the cash."}'::jsonb
WHERE "key" = 'site.identity';
