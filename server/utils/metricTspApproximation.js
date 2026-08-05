
// help to take the node with "lowest" by name, if the value is equal
function compareNodeIds(first, second) {
  return first.localeCompare(second, "en", { numeric: true });
}

// returns MST of the given vertices, starting from the specified root vertex, using Prim's algorithm
export function primMinimumSpanningTree(vertices, root, getCost) {
  if (!Array.isArray(vertices) || vertices.length === 0) {
    throw new TypeError("MST vertices must be a non-empty array");
  }
  if (typeof getCost !== "function") {
    throw new TypeError("MST getCost must be a function");
  }

  const uniqueVertices = new Set();
  vertices.forEach((vertex) => {
    if (typeof vertex !== "string" || vertex.length === 0) {
      throw new TypeError("Each MST vertex must be a non-empty string");
    }
    if (uniqueVertices.has(vertex)) {
      throw new TypeError(`Duplicate MST vertex: ${vertex}`);
    }
    uniqueVertices.add(vertex);
  });
  if (!uniqueVertices.has(root)) {
    throw new TypeError(`MST root is not part of the graph: ${root}`);
  }

  const remaining = new Set(vertices);
  const cheapestConnection = new Map(
    vertices.map((vertex) => [vertex, Infinity]),
  );
  const parent = new Map(vertices.map((vertex) => [vertex, null]));
  const edges = [];
  cheapestConnection.set(root, 0);

  while (remaining.size > 0) {
    let selected = null;

    for (const vertex of remaining) {
      if (
        selected === null
        || cheapestConnection.get(vertex) < cheapestConnection.get(selected)
        || (
          cheapestConnection.get(vertex) === cheapestConnection.get(selected)
          && compareNodeIds(vertex, selected) < 0
        )
      ) {
        selected = vertex;
      }
    }

    if (cheapestConnection.get(selected) === Infinity) {
      throw new Error("Cannot build an MST for a disconnected graph");
    }

    remaining.delete(selected);
    const selectedParent = parent.get(selected);
    if (selectedParent !== null) {
      edges.push({
        from: selectedParent,
        to: selected,
        weight: cheapestConnection.get(selected),
      });
    }

    for (const neighbor of remaining) {
      const cost = getCost(selected, neighbor);
      if (typeof cost !== "number" || Number.isNaN(cost) || cost < 0) {
        throw new TypeError(`Invalid MST edge cost: ${selected}-${neighbor}`);
      }

      const currentCost = cheapestConnection.get(neighbor);
      const currentParent = parent.get(neighbor);
      if (
        cost < currentCost
        || (
          cost === currentCost
          && (currentParent === null || compareNodeIds(selected, currentParent) < 0)
        )
      ) {
        cheapestConnection.set(neighbor, cost);
        parent.set(neighbor, selected);
      }
    }
  }

  return {
    root,
    edges,
    totalWeight: edges.reduce((total, edge) => total + edge.weight, 0),
  };
}

// returns a preorder traversal of the given rooted tree, which is represented as a root node and an array of edges
export function preorderTreeWalk(tree) {
  if (!tree || typeof tree !== "object") {
    throw new TypeError("A rooted MST is required");
  }
  if (typeof tree.root !== "string" || tree.root.length === 0) {
    throw new TypeError("The MST root must be a non-empty string");
  }
  if (!Array.isArray(tree.edges)) {
    throw new TypeError("MST edges must be an array");
  }

  const childrenByNode = new Map([[tree.root, []]]);
  const parentByNode = new Map();

  tree.edges.forEach((edge) => {
    if (
      !edge
      || typeof edge.from !== "string"
      || typeof edge.to !== "string"
      || edge.from.length === 0
      || edge.to.length === 0
      || edge.from === edge.to
    ) {
      throw new TypeError("Each MST edge must connect two different nodes");
    }
    if (parentByNode.has(edge.to)) {
      throw new TypeError(`MST node has more than one parent: ${edge.to}`);
    }

    if (!childrenByNode.has(edge.from)) childrenByNode.set(edge.from, []);
    if (!childrenByNode.has(edge.to)) childrenByNode.set(edge.to, []);
    childrenByNode.get(edge.from).push(edge.to);
    parentByNode.set(edge.to, edge.from);
  });

  if (parentByNode.has(tree.root)) {
    throw new TypeError("The MST root cannot have a parent");
  }

  childrenByNode.forEach((children) => children.sort(compareNodeIds));

  const order = [];
  const visited = new Set();

  function visit(node) {
    if (visited.has(node)) {
      throw new TypeError(`MST contains a cycle at node: ${node}`);
    }

    visited.add(node);
    order.push(node);
    childrenByNode.get(node).forEach(visit);
  }

  visit(tree.root);

  if (visited.size !== childrenByNode.size) {
    throw new TypeError("MST contains nodes that are not connected to its root");
  }

  return order;
}

// given a set of vertices, a root vertex, and a cost function, returns an approximate solution to the metric TSP using the MST-based 2-approximation algorithm
export function approximateMetricTspTour(vertices, root, getCost) {
  const tree = primMinimumSpanningTree(vertices, root, getCost);
  const visitOrder = preorderTreeWalk(tree);
  const cycle = [...visitOrder, root];
  const legs = [];

  for (let index = 0; index < cycle.length - 1; index += 1) {
    const from = cycle[index];
    const to = cycle[index + 1];
    const weight = getCost(from, to);

    if (!Number.isFinite(weight) || weight < 0) {
      throw new TypeError(`Invalid TSP tour cost: ${from}-${to}`);
    }

    legs.push({ from, to, weight });
  }

  return {
    root,
    tree,
    visitOrder,
    cycle,
    legs,
    totalWeight: legs.reduce((total, leg) => total + leg.weight, 0),
  };
}
