import { loadCampusRouteGraph } from "../models/routingModel.js";
import { floydWarshall, reconstructPath } from "../utils/floydWarshall.js";
import { approximateMetricTspTour } from "../utils/metricTspApproximation.js";

const STAIRS_WEIGHT_MULTIPLIER = 1.5;
let routingStatePromise;

/// returns the weight of a route edge, which is the distance plus a penalty for stairs
export function calculateEdgeWeight(edge) {
  if (!edge || typeof edge !== "object") {
    throw new TypeError("A route edge is required");
  }
  if (!Number.isFinite(edge.distanceMeters) || edge.distanceMeters <= 0) {
    throw new TypeError("Route edge distance must be a positive number");
  }
  if (
    !Number.isFinite(edge.stairsDistanceMeters)
    || edge.stairsDistanceMeters < 0
    || edge.stairsDistanceMeters > edge.distanceMeters
  ) {
    throw new TypeError(
      "Route edge stairs distance must be between zero and the total distance",
    );
  }

  // This means that if STAIRS_WEIGHT_MULTIPLIER is 1.5, then the penalty for stairs is 0.5 times the stairs distance, effectively increasing the weight of edges with stairs.
  return edge.distanceMeters
    + edge.stairsDistanceMeters * (STAIRS_WEIGHT_MULTIPLIER - 1);
}

function edgeKey(fromNodeId, toNodeId) {
  return [fromNodeId, toNodeId].sort().join("|");
}

// builds the routing state, which includes the routing matrices and a mapping of edges by their node IDs
async function buildRoutingState() {
  const graph = await loadCampusRouteGraph();
  const nodeIds = graph.nodes.map((node) => node.campus_code);
  const edgeByNodes = new Map();
  const weightedEdges = graph.edges.map((edge) => {
    const routeEdge = {
      from: edge.from_code,
      to: edge.to_code,
      distanceMeters: edge.distance_meters,
      stairsDistanceMeters: edge.stairs_distance_meters,
    };
    const weight = calculateEdgeWeight(routeEdge);

    edgeByNodes.set(edgeKey(routeEdge.from, routeEdge.to), {
      ...routeEdge,
      weight,
    });
    return {
      from: routeEdge.from,
      to: routeEdge.to,
      weight,
    };
  });


  return {
    matrices: floydWarshall(nodeIds, weightedEdges),
    edgeByNodes,
    nodeByCode: new Map(
      graph.nodes.map((node) => [node.campus_code, node]),
    ),
  };
}

// returns the current routing state, building it if necessary
async function getRoutingState() {
  if (!routingStatePromise) { // if the routing state is not already being built, start building it
    routingStatePromise = buildRoutingState().catch((error) => {
      routingStatePromise = undefined;
      throw error;
    });
  }
  return routingStatePromise;
}

// given a routing state and two node IDs, returns the cost of the shortest route between them
function getShortestRouteCost(matrices, fromNodeId, toNodeId) {
  const fromIndex = matrices.indexByNodeId.get(fromNodeId);
  const toIndex = matrices.indexByNodeId.get(toNodeId);

  if (fromIndex === undefined) {
    throw new TypeError(`Unknown route start node: ${fromNodeId}`);
  }
  if (toIndex === undefined) {
    throw new TypeError(`Unknown route destination node: ${toNodeId}`);
  }

  return matrices.distances[fromIndex][toIndex];
}

// given a routing state and two node IDs, returns the details of the shortest route between them
export async function planCampusTour(destinationNodeIds, rootNodeId) {
  if (!Array.isArray(destinationNodeIds)) {
    throw new TypeError("Campus tour destinations must be an array");
  }

  const vertices = [...new Set([
    rootNodeId,
    ...destinationNodeIds.filter((nodeId) => nodeId !== rootNodeId), 
  ])];
  const routingState = await getRoutingState(); //contain the graph after floyd-warshall and the edges with weights
  const { matrices } = routingState;
  const getCost = (fromNodeId, toNodeId) => ( //create function to get the cost of the shortest route between two nodes, given the routing matrices
    getShortestRouteCost(matrices, fromNodeId, toNodeId)
  );
  const tour = approximateMetricTspTour(vertices, rootNodeId, getCost); // returns an approximate solution to the metric TSP using the MST-based 2-approximation algorithm
  const legs = tour.legs.map((leg) => ( // build the real route details for each leg of the tour, using the routing state to reconstruct the path and calculate distances
    buildRouteDetails(leg.from, leg.to, routingState)
  ));

  return {
    ...tour,
    legs,
    totalDistanceMeters: legs.reduce(
      (total, leg) => total + leg.distanceMeters,
      0,
    ),
    totalStairsDistanceMeters: legs.reduce(
      (total, leg) => total + leg.stairsDistanceMeters,
      0,
    ),
  };
}

//for a single leg of a tour, returns the details of the shortest route between them
function buildRouteDetails(fromNodeId, toNodeId, routingState) {
  const nodes = reconstructPath(fromNodeId, toNodeId, routingState.matrices);

  if (nodes.length === 0) {
    return null;
  }

  const segments = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const from = nodes[index];
    const to = nodes[index + 1];
    const edge = routingState.edgeByNodes.get(edgeKey(from, to));

    if (!edge) {
      throw new Error(`Shortest route contains an unknown edge: ${from}-${to}`);
    }
    segments.push({
      from,
      to,
      distanceMeters: edge.distanceMeters,
      stairsDistanceMeters: edge.stairsDistanceMeters,
      weight: edge.weight,
    });
  }

  return {
    from: fromNodeId,
    to: toNodeId,
    nodes, // nodes is the list of campus codes for the buildings along the route, in order
    path: nodes.map((nodeId) => { //path is the visual representation of the route (e.g the building name and coordinates)
      const node = routingState.nodeByCode.get(nodeId);
      return {
        campusCode: nodeId,
        buildingName: node?.short_name ?? null,
        mapX: node?.map_x ?? null,
        mapY: node?.map_y ?? null,
      };
    }),
    segments, // this is the details for each edge (e.g the distance and stairs distance) along the route, in order
    distanceMeters: segments.reduce( //reduce for the total distance and stairs distance for the entire route, as well as the total weight (which includes the stairs penalty)
      (total, segment) => total + segment.distanceMeters,
      0,
    ),
    stairsDistanceMeters: segments.reduce(
      (total, segment) => total + segment.stairsDistanceMeters,
      0,
    ),
    weight: segments.reduce((total, segment) => total + segment.weight, 0),
  };
}

