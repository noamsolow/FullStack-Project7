import {
  findVendorBySlug,
  listBuildings,
  listCategories,
  listDeliveryZones,
  listPrintCenters,
  listProductsByVendor,
  listVendors,
} from "../models/catalogModel.js";
import { notFound } from "../utils/AppError.js";
import {
  calculateDeliveryFeeAgorot,
  withCampusMapPosition,
} from "../utils/deliveryPricing.js";
import { paginated, paginationFrom } from "../utils/pagination.js";

export async function buildings(query) {
  const paging = paginationFrom(query);
  const rows = await listBuildings(paging);
  return paginated(rows.map(withCampusMapPosition), paging.page, paging.limit);
}

export async function categories(query) {
  return { data: await listCategories(query.group), meta: {} };
}

export async function vendors(query) {
  const paging = paginationFrom(query);
  const rows = await listVendors({ ...paging, ...query });
  return paginated(rows.map(withCampusMapPosition), paging.page, paging.limit);
}

export async function vendorDetails(slug) {
  const vendor = await findVendorBySlug(slug);
  if (!vendor) throw notFound("Vendor not found");
  const zones = vendor.delivery_enabled ? await listDeliveryZones(vendor.id) : [];
  delete vendor.id;
  return {
    ...withCampusMapPosition(vendor),
    deliveryZones: zones.map((zone) => ({
      ...withCampusMapPosition(zone),
      fee_agorot: calculateDeliveryFeeAgorot(zone),
    })),
  };
}

export async function vendorProducts(slug, query) {
  const vendor = await findVendorBySlug(slug);
  if (!vendor) throw notFound("Vendor not found");
  const paging = paginationFrom(query);
  const rows = await listProductsByVendor(vendor.id, { ...paging, ...query });
  const result = paginated(rows, paging.page, paging.limit);
  result.meta.vendor = {
    publicId: vendor.public_id,
    name: vendor.name,
    slug: vendor.slug,
    type: vendor.vendor_type,
  };
  return result;
}

export async function printCenters(query) {
  const paging = paginationFrom(query);
  const rows = await listPrintCenters(paging);
  return paginated(rows, paging.page, paging.limit);
}
