-- 11: the Game Localization card's Japanese subtitle and role, per the owner's landing-page translation review
-- (rows 29–30). The saved CMS row still has the old text, which overrides content/projects.json.
-- Paste the whole file into the Supabase SQL editor and Run. Safe to re-run.
update public.content c
set value = jsonb_set(c.value, '{projects}', (
      select jsonb_agg(
        case when p->>'slug' = 'games'
             then jsonb_set(jsonb_set(p, '{subtitle,ja}', '"翻訳からLQAまで"'), '{role,ja}', '"翻訳者 / ローカライズリード / プロジェクトマネージャー"')
             else p end
        order by p_i)
      from jsonb_array_elements(c.value->'projects') with ordinality as x(p, p_i)
    )),
    updated_at = now()
where c.key = 'site';
