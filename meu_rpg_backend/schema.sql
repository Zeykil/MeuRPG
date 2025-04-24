DROP TABLE IF EXISTS personagens;
DROP TABLE IF EXISTS monstros;

CREATE TABLE personagens (
    id TEXT PRIMARY KEY,
    hp_atual INTEGER NOT NULL,
    mana_estamina_atual INTEGER NOT NULL,
    level INTEGER NOT NULL,
    pontos_disponiveis INTEGER NOT NULL,
    for_attr INTEGER NOT NULL,
    agi_attr INTEGER NOT NULL,
    vel_attr INTEGER NOT NULL,
    int_attr INTEGER NOT NULL,
    res_attr INTEGER NOT NULL,
    esp_attr INTEGER NOT NULL,
    car_attr INTEGER NOT NULL
);

CREATE TABLE monstros (
    id TEXT PRIMARY KEY,
    hp_atual INTEGER NOT NULL,
    stats_json TEXT, -- Para guardar atributos como JSON string
    abilities_json TEXT, -- Para guardar especiais/poderes como JSON string
    description_json TEXT -- Para guardar descrição como JSON string
);