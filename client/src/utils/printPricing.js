export const PRINT_RATES = Object.freeze({
  blackWhitePageAgorot: 10,
  colorPageAgorot: 50,
  laminationSheetAgorot: 800,
  spiralBindingCopyAgorot: 1200,
});

export function calculatePrintPrice({
  pageCount,
  copies,
  colorMode,
  sides,
  laminated,
  spiralBound,
}) {
  const numericCopies = Number(copies) || 0;
  const pageRateAgorot = colorMode === "color"
    ? PRINT_RATES.colorPageAgorot
    : PRINT_RATES.blackWhitePageAgorot;
  const printedSheetsPerCopy = sides === "double"
    ? Math.ceil(pageCount / 2)
    : pageCount;
  const printingAgorot = pageCount * numericCopies * pageRateAgorot;
  const laminationAgorot = laminated
    ? printedSheetsPerCopy * numericCopies * PRINT_RATES.laminationSheetAgorot
    : 0;
  const bindingAgorot = spiralBound
    ? numericCopies * PRINT_RATES.spiralBindingCopyAgorot
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
