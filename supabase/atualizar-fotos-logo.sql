-- =====================================================================
--  BAGAÚSTE BAR — Usar o logótipo como imagem de todos os produtos
--  Corra no SQL Editor do Supabase (New query -> colar -> Run).
--  Só afeta produtos que ainda não têm foto; não substitui fotos reais.
-- =====================================================================
update public.products
set image_url = '/logo.jpeg'
where image_url is null or image_url = '';
