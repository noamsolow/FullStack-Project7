import * as media from "../services/mediaService.js";

function send(response, file, attachment = false) {
  response.setHeader("Content-Type", file.mimeType);
  response.setHeader(
    "Cache-Control",
    file.isPrivate ? "private, no-store" : "public, max-age=86400",
  );
  response.setHeader(
    "Content-Disposition",
    `${attachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.downloadName)}`,
  );
  response.sendFile(file.path);
}

export async function productImageHandler(request, response) {
  send(response, await media.productImage(request.params.publicId));
}

export async function printFileHandler(request, response) {
  send(response, await media.printFile(request.user, request.params.publicId), true);
}

export async function maintenanceImageHandler(request, response) {
  send(response, await media.maintenanceImage(request.user, request.params.publicId));
}

