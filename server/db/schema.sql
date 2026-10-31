CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE zone(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nome TEXT NOT NULL
);

CREATE TABLE assets(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nome TEXT NOT NULL,
geom GEOGRAPHY(POINT, 4326) NOT NULL,
indirizzo TEXT,
tipologia TEXT CHECK(tipologia IN ('cabina','traliccio','contatore')) NOT NULL,
zona_id BIGINT REFERENCES zone(id) ON DELETE SET NULL
);

CREATE TABLE utenti(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nome TEXT NOT NULL,
password_hash TEXT NOT NULL,
ruolo TEXT NOT NULL CHECK(ruolo IN('operatore','supervisore','admin')),
email TEXT NOT NULL UNIQUE,
zona_id BIGINT REFERENCES zone(id) ON DELETE SET NULL
);

CREATE TABLE ispezioni(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
utente_id BIGINT REFERENCES utenti(id) ON DELETE SET NULL,
asset_id BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
esito TEXT NOT NULL CHECK(esito IN('conforme','non_conforme','conforme_con_riserva')),
note TEXT,
data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
validazione TEXT NOT NULL CHECK(validazione IN('in_sospeso','accettata','rifiutata')) DEFAULT 'in_sospeso'
);

CREATE TABLE difetti(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
ispezione_id BIGINT NOT NULL REFERENCES ispezioni(id) ON DELETE CASCADE,
descrizione TEXT,
severita TEXT NOT NULL CHECK(severita IN('lieve','media','grave'))
);

CREATE TABLE foto(
id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
difetto_id BIGINT NOT NULL REFERENCES difetti(id) ON DELETE CASCADE,
url TEXT NOT NULL
);

CREATE INDEX idx_ispezioni_data ON ispezioni(data);
CREATE INDEX idx_ispezioni_utente_id ON ispezioni(utente_id);
CREATE INDEX idx_ispezioni_asset_id ON ispezioni(asset_id);
CREATE INDEX idx_assets_geom ON assets USING GIST(geom);
CREATE INDEX idx_difetti_ispezione_id ON difetti(ispezione_id);
CREATE INDEX idx_foto_difetto_id ON foto(difetto_id);