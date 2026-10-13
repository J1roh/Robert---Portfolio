-- 09: caps what the CMS can upload to the `posters` bucket (made in 04). Paste the whole file into the
-- Supabase SQL editor and Run. Safe to re-run. Keep the 5 MB in sync with uploadPoster in src/lib/content.ts.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'posters';
