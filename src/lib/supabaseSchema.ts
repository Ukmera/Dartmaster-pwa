export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- DARTMASTER PRO - SUPABASE DATABASE SCHEMA
-- Exécutez ce script dans l'éditeur SQL de votre console Supabase
-- ========================================================

-- 1. Table des Joueurs (Players)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🎯',
    color TEXT NOT NULL DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Statistiques Cumulées (Player Stats)
CREATE TABLE IF NOT EXISTS public.player_stats (
    player_id UUID PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    
    -- X01 Stats
    x01_games INTEGER DEFAULT 0,
    x01_wins INTEGER DEFAULT 0,
    x01_total_darts INTEGER DEFAULT 0,
    x01_total_score INTEGER DEFAULT 0,
    x01_best_average NUMERIC(6, 2) DEFAULT 0,
    x01_count_180 INTEGER DEFAULT 0,
    x01_count_140_plus INTEGER DEFAULT 0,
    x01_count_100_plus INTEGER DEFAULT 0,
    x01_highest_checkout INTEGER DEFAULT 0,

    -- Cricket Stats
    cricket_games INTEGER DEFAULT 0,
    cricket_wins INTEGER DEFAULT 0,
    cricket_total_marks INTEGER DEFAULT 0,
    cricket_total_rounds INTEGER DEFAULT 0,
    cricket_best_mpr NUMERIC(5, 2) DEFAULT 0,

    -- King Stats
    king_games INTEGER DEFAULT 0,
    king_wins INTEGER DEFAULT 0,
    king_total_eliminations INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Parties (Matches)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL, -- '301', '501', '701', 'cricket', 'king'
    winner_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    players_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_seconds INTEGER DEFAULT 0,
    summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activer Row Level Security (RLS) & Politiques d'accès public/anonyme
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Allow public read player_stats" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert player_stats" ON public.player_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update player_stats" ON public.player_stats FOR UPDATE USING (true);

CREATE POLICY "Allow public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update matches" ON public.matches FOR UPDATE USING (true);

-- 5. Activer le temps réel (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
`;
