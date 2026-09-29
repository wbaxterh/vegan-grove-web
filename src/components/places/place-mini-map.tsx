'use client';

import { Map as MapLibreMap, Marker } from 'react-map-gl/maplibre';
import type { PlaceType, VeganLevel } from '@/lib/types';
import { STYLE_URL } from './maplibre';
import { MarkerGlyph, markerClassName } from './place-marker';

export type PlaceMiniMapProps = {
  lng: number;
  lat: number;
  type: PlaceType;
  veganLevel: VeganLevel;
};

/**
 * A still frame of the neighbourhood: same style and marker as the big map, no interaction.
 * The attribution is a caption under the frame (see the island): maplibre's compact control
 * opens expanded and only collapses on drag, which a non-interactive map never gets.
 */
export default function PlaceMiniMap({ lng, lat, type, veganLevel }: PlaceMiniMapProps) {
  return (
    <MapLibreMap
      initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
      mapStyle={STYLE_URL}
      style={{ width: '100%', height: '100%' }}
      interactive={false}
      attributionControl={false}
    >
      <Marker longitude={lng} latitude={lat} anchor="center">
        <span className={markerClassName(type, veganLevel)}>
          <MarkerGlyph type={type} />
        </span>
      </Marker>
    </MapLibreMap>
  );
}
