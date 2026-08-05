import { connection } from "../db/connection.js";

//returns a two arrays: nodes (buildings) and edges (route connections between buildings).
export async function loadCampusRouteGraph(executor = connection) {
  const [nodes] = await executor.query(
    `SELECT
      id AS building_id, campus_code, short_name,
      map_x, map_y
     FROM buildings
     WHERE is_active = TRUE
     ORDER BY CAST(campus_code AS UNSIGNED), campus_code, id`,
  );

  const [edges] = await executor.query(
    `SELECT
      edge.from_building_id,
      from_building.campus_code AS from_code,
      edge.to_building_id,
      to_building.campus_code AS to_code,
      edge.distance_meters,
      edge.stairs_distance_meters
     FROM campus_route_edges edge
     JOIN buildings from_building
       ON from_building.id = edge.from_building_id
      AND from_building.is_active = TRUE
     JOIN buildings to_building
       ON to_building.id = edge.to_building_id
      AND to_building.is_active = TRUE
     WHERE edge.is_active = TRUE
     ORDER BY edge.from_building_id, edge.to_building_id, edge.id`,
  );

  return { nodes, edges };
}
