const SAME_BUILDING_FEE_AGOROT = 400;
const NEAR_FEE_AGOROT = 600;
const MEDIUM_FEE_AGOROT = 900;
const FAR_FEE_AGOROT = 1200;

const campusMapPositions = Object.freeze({
  1: { map_x: 23.3, map_y: 23.7 },
  12: { map_x: 35.7, map_y: 64.4 },
  13: { map_x: 22.0, map_y: 64.7 },
  22: { map_x: 46.6, map_y: 38.1 },
  24: { map_x: 26.2, map_y: 43.5 },
  26: { map_x: 11.0, map_y: 42.7 },
  27: { map_x: 5.0, map_y: 44.2 },
  36: { map_x: 13.2, map_y: 17.3 },
  37: { map_x: 7.9, map_y: 26.9 },
  "41A": { map_x: 66.4, map_y: 25.6 },
  "41B": { map_x: 71.0, map_y: 24.9 },
  42: { map_x: 75.4, map_y: 19.9 },
  43: { map_x: 80.6, map_y: 17.9 },
  44: { map_x: 70.5, map_y: 40.5 },
  45: { map_x: 77.4, map_y: 37.2 },
  46: { map_x: 85.0, map_y: 29.3 },
  47: { map_x: 88.8, map_y: 12.1 },
});

export function withCampusMapPosition(building) {
  return { ...building, ...(campusMapPositions[building.campus_code] ?? {}) };
}

export function campusMapDistance(source, destination) {
  const sourceX = Number(source.source_map_x ?? source.map_x);
  const sourceY = Number(source.source_map_y ?? source.map_y);
  const destinationX = Number(destination.destination_map_x ?? destination.map_x);
  const destinationY = Number(destination.destination_map_y ?? destination.map_y);

  if (![sourceX, sourceY, destinationX, destinationY].every(Number.isFinite)) {
    return null;
  }
  return Math.hypot(destinationX - sourceX, destinationY - sourceY);
}

export function calculateDeliveryFeeAgorot(zone) {
  if (String(zone.vendor_building_id) === String(zone.building_id)) {
    return SAME_BUILDING_FEE_AGOROT;
  }

  const sourcePosition = campusMapPositions[zone.source_campus_code] ?? {
    map_x: zone.source_map_x,
    map_y: zone.source_map_y,
  };
  const destinationPosition = campusMapPositions[zone.campus_code] ?? {
    map_x: zone.map_x,
    map_y: zone.map_y,
  };
  const distance = campusMapDistance(
    { source_map_x: sourcePosition.map_x, source_map_y: sourcePosition.map_y },
    { destination_map_x: destinationPosition.map_x, destination_map_y: destinationPosition.map_y },
  );

  if (distance === null) return FAR_FEE_AGOROT;
  if (distance <= 18) return NEAR_FEE_AGOROT;
  if (distance <= 40) return MEDIUM_FEE_AGOROT;
  return FAR_FEE_AGOROT;
}
