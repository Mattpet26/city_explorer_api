DROP TABLE IF EXISTS city_explorer;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  latitude VARCHAR(255),
  longitude VARCHAR(255),
  formatted_query VARCHAR(255),
  search_query VARCHAR(255)
);