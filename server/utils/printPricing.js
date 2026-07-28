const BLACK_WHITE_PAGE_AGOROT = 10;
const COLOR_PAGE_AGOROT = 50;
const LAMINATION_SHEET_AGOROT = 800;
const SPIRAL_BINDING_COPY_AGOROT = 1200;

export function printPageRateAgorot(colorMode) {
  return colorMode === "color"
    ? COLOR_PAGE_AGOROT
    : BLACK_WHITE_PAGE_AGOROT;
}

export function calculatePrintPrice({
  pageCount,
  copies,
  colorMode,
  sides,
  laminated = false,
  spiralBound = false,
}) {
  const pageRateAgorot = printPageRateAgorot(colorMode);
  const printedSheetsPerCopy = sides === "double"
    ? Math.ceil(pageCount / 2)
    : pageCount;
  const printingAgorot = pageCount * copies * pageRateAgorot;
  const laminationAgorot = laminated
    ? printedSheetsPerCopy * copies * LAMINATION_SHEET_AGOROT
    : 0;
  const bindingAgorot = spiralBound
    ? copies * SPIRAL_BINDING_COPY_AGOROT
    : 0;
  return {
    pageRateAgorot,
    printedSheetsPerCopy,
    printingAgorot,
    laminationAgorot,
    bindingAgorot,
    totalAgorot: printingAgorot + laminationAgorot + bindingAgorot,
  };
}

export function calculatePrintPriceAgorot(options) {
  return calculatePrintPrice(options).totalAgorot;
}

export function printPriceNote({
  pageCount,
  copies,
  colorMode,
  sides,
  laminated,
  spiralBound,
  totalAgorot,
}) {
  const rate = printPageRateAgorot(colorMode);
  const finishing = [
    laminated ? "A4 lamination included" : null,
    spiralBound ? "spiral binding included" : null,
  ].filter(Boolean).join("; ");
  return `Fixed campus price: ${pageCount} PDF pages × ${copies} copies × ${(rate / 100).toFixed(2)} ILS per page${sides === "double" ? " (double-sided)" : ""}${finishing ? `; ${finishing}` : ""} = ${(totalAgorot / 100).toFixed(2)} ILS.`;
}
