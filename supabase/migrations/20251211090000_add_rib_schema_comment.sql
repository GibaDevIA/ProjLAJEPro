-- Documentation migration to reflect schema updates for Transverse Ribs
-- The projects.content JSONB column will now support shapes of type 'rib'
-- containing properties for transverse rib configuration (steel, channels, dimensions).

COMMENT ON COLUMN public.projects.content IS 'JSONB content containing shapes (including new rib type), view state, and project metadata.';
