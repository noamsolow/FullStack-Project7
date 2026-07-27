import * as catalog from "../services/catalogService.js";

export async function buildingsHandler(request, response) {
  response.json(await catalog.buildings(request.query));
}

export async function categoriesHandler(request, response) {
  response.json(await catalog.categories(request.query));
}

export async function vendorsHandler(request, response) {
  response.json(await catalog.vendors(request.query));
}

export async function vendorHandler(request, response) {
  response.json({ data: await catalog.vendorDetails(request.params.slug) });
}

export async function productsHandler(request, response) {
  response.json(await catalog.vendorProducts(request.params.slug, request.query));
}

export async function printCentersHandler(request, response) {
  response.json(await catalog.printCenters(request.query));
}

