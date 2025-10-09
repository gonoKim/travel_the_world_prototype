// src/regionSources.ts
export type RegionSource = { url: string; name: string };

export const REGION_SOURCES: Record<string, RegionSource> = {
  JPN: {
    url: 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson',
    name: '도도부현'
  },
  KOR: {
    url: 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo.json',
    name: '시·도'
  }
};
