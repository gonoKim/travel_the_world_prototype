declare module 'topojson-client' {
  import type { Topology, Objects } from 'topojson-specification';
  export function feature(topology: Topology, object: Objects): GeoJSON.FeatureCollection;
}
