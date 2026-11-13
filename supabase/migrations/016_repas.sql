-- Choix du repas et des boissons (13 nov. 2026) : réponses des invités présents.
-- choices = [{ "q": "Plat principal", "a": [["Poulet"], ["Poisson"]] }] (une liste de choix par personne)
-- remarks = allergies ou remarques (facultatif)
alter table public.rsvps add column if not exists choices jsonb;
alter table public.rsvps add column if not exists remarks text check (char_length(remarks) <= 500);
