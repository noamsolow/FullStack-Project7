import { listVendorDeliveryOrdersForRoute } from "../models/orderModel.js";
import { findVendorRouteDepot } from "../models/routingModel.js";
import { AppError } from "../utils/AppError.js";
import { planCampusTour } from "./campusRoutingService.js";
import { requireMembership } from "./partnerService.js";

const ROUTABLE_ORDER_STATUSES = ["preparing", "out_for_delivery"];
const ROUTE_ORDER_LIMIT = 50;

export async function vendorDeliveryRoutePlan(user) {
  const membership = await requireMembership(user.id);
  const depot = await findVendorRouteDepot(membership.vendor_id);
  if (!depot) {
    throw new AppError(
      409,
      "VENDOR_ROUTE_DEPOT_UNAVAILABLE",
      "This vendor does not have an active campus building for route planning",
    );
  }

  const rows = await listVendorDeliveryOrdersForRoute(
    membership.vendor_id,
    ROUTABLE_ORDER_STATUSES,
    ROUTE_ORDER_LIMIT + 1,
  );
  const hasMoreOrders = rows.length > ROUTE_ORDER_LIMIT;
  const orders = rows.slice(0, ROUTE_ORDER_LIMIT);
  const ordersByBuilding = new Map();

  for (const order of orders) {
    const buildingOrders = ordersByBuilding.get(order.campus_code) ?? [];
    buildingOrders.push(order);
    ordersByBuilding.set(order.campus_code, buildingOrders);
  }

  let tour;
  try {
    tour = await planCampusTour(
      [...ordersByBuilding.keys()],
      depot.campus_code,
    );
  } catch (error) {
    if (error instanceof TypeError || error?.message?.includes("disconnected graph")) {
      throw new AppError(
        409,
        "VENDOR_ROUTE_UNAVAILABLE",
        "A route could not be calculated for one or more campus buildings",
      );
    }
    throw error;
  }

  const stops = tour.visitOrder
    .map((campusCode) => ({
      campusCode,
      buildingName: ordersByBuilding.get(campusCode)?.[0]?.building_name ?? null,
      orders: ordersByBuilding.get(campusCode) ?? [],
    }))
    .filter((stop) => stop.orders.length > 0);

  return {
    vendor: {
      publicId: depot.vendor_public_id,
      name: depot.vendor_name,
    },
    depotBuilding: depot.campus_code,
    depotBuildingName: depot.building_name,
    includedStatuses: [...ROUTABLE_ORDER_STATUSES],
    orderCount: orders.length,
    stopCount: stops.length,
    hasMoreOrders,
    limit: ROUTE_ORDER_LIMIT,
    cycle: tour.cycle,
    legs: tour.legs,
    totalDistanceMeters: tour.totalDistanceMeters,
    totalStairsDistanceMeters: tour.totalStairsDistanceMeters,
    totalWeight: tour.totalWeight,
    stops,
  };
}
