-- drop table if exists city_explorer;

CREATE TABLE city_explorer (
  id SERIAL PRIMARY KEY,
  latitude INTEGER,
  longitude INTEGER,
  formatted_query VARCHAR(255),
  search_query VARCHAR(255)

);