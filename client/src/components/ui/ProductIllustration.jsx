const productArt = {
  "MC-GRILL-01": ["plate", "CHICKEN", "#d97745", "#57905f"],
  "MC-BURGER-01": ["sandwich", "BURGER", "#934a32", "#f0b94e"],
  "MC-SHAWARMA-01": ["pita", "SHAWARMA", "#c26d3d", "#65a05d"],
  "MC-WATER-01": ["bottle", "WATER", "#46a9d7", "#d9f5ff"],
  "MC-SCHNITZEL-01": ["sandwich", "SCHNITZEL", "#d79538", "#70a65a"],
  "MC-KEBAB-01": ["skewers", "KEBAB", "#78402d", "#dfa948"],
  "MC-MEATBALL-01": ["bowl", "MEATBALLS", "#974630", "#e8a542"],
  "MC-TURKEY-01": ["sandwich", "TURKEY", "#d48655", "#6b9d5b"],
  "MC-STIRFRY-01": ["bowl", "STIR-FRY", "#b85f39", "#5a9f64"],
  "MC-ROAST-01": ["sandwich", "ROAST BEEF", "#82412f", "#ce8f42"],
  "MC-SOUP-01": ["bowl", "CHICKEN SOUP", "#dda33d", "#78a95d"],
  "MC-FALAFEL-01": ["plate", "FALAFEL", "#8c7036", "#63a05b"],
  "MC-HUMMUS-01": ["bowl", "HUMMUS + BEEF", "#d0a24c", "#83442d"],
  "MC-FRIES-01": ["fries", "FRIES", "#efb83d", "#d85243"],
  "MC-RINGS-01": ["rings", "ONION RINGS", "#d89434", "#f2c65e"],
  "MC-SIDE-SALAD-01": ["bowl", "SALAD", "#62a658", "#e05e4d"],
  "MC-COLA-01": ["can", "COLA", "#a83237", "#f8e7e3"],
  "MC-ORANGE-01": ["bottle", "ORANGE", "#f29a31", "#ffd46e"],
  "MC-ICEDTEA-01": ["cold-cup", "ICED TEA", "#d78a41", "#f1c568"],
  "MC-BLACKCOFFEE-01": ["hot-cup", "BLACK COFFEE", "#5b392d", "#eee0d1"],

  "DC-TOAST-01": ["sandwich", "CHEESE TOAST", "#e5af46", "#f2dc7c"],
  "DC-PASTA-01": ["bowl", "PASTA", "#e0b049", "#d8c99c"],
  "DC-SALAD-01": ["bowl", "GREEK SALAD", "#65a557", "#f1eccf"],
  "DC-YOGURT-01": ["bowl", "YOGURT", "#f1eadb", "#ba6a7d"],
  "DC-COFFEE-01": ["hot-cup", "CAPPUCCINO", "#b9784f", "#f1dfc4"],
  "DC-PIZZA-01": ["round", "PIZZA", "#e65b3e", "#f2c74d"],
  "DC-ZITI-01": ["bowl", "BAKED ZITI", "#d56a43", "#efc15a"],
  "DC-SHAKSHUKA-01": ["pan", "SHAKSHUKA", "#cb493e", "#f6d457"],
  "DC-TUNA-01": ["sandwich", "TUNA", "#d6c58b", "#729bad"],
  "DC-OMELET-01": ["bagel", "OMELET", "#e4b44a", "#f3d565"],
  "DC-QUINOA-01": ["bowl", "QUINOA", "#c19a55", "#61a05f"],
  "DC-TOMATO-SOUP-01": ["bowl", "TOMATO SOUP", "#d64c41", "#efb25f"],
  "DC-QUICHE-01": ["round", "QUICHE", "#e1ba54", "#679b56"],
  "DC-CHEESEPASTRY-01": ["pastry", "CHEESE PASTRY", "#dea64b", "#f3d981"],
  "DC-CROISSANT-01": ["croissant", "CHOCOLATE", "#d7933b", "#65402f"],
  "DC-FRUIT-01": ["fruit", "FRUIT CUP", "#e25c55", "#69a657"],
  "DC-ICEDCOFFEE-01": ["cold-cup", "ICED COFFEE", "#a76742", "#e5c399"],
  "DC-CHOCOLATE-01": ["hot-cup", "HOT CHOCOLATE", "#70412f", "#ead8c0"],
  "DC-FRESHORANGE-01": ["cold-cup", "FRESH ORANGE", "#f2992e", "#76a65b"],
  "DC-HERBALTEA-01": ["tea", "HERBAL TEA", "#a5a146", "#d7df8a"],

  "OS-PEN-01": ["pens", "PENS", "#345fa7", "#d94e59"],
  "OS-NOTE-01": ["notebook", "NOTEBOOK", "#6e55b7", "#f3e9d3"],
  "OS-USB-01": ["usb", "32 GB", "#3e5369", "#8db8ca"],
  "OS-HIGHLIGHT-01": ["markers", "HIGHLIGHTERS", "#f0d34c", "#ed7aa6"],
  "OS-PAPER-01": ["document", "A4 PAPER", "#edf1f5", "#4d6d91"],
  "PC-BW-10": ["document", "B&W PRINT", "#edf1f5", "#283746"],
  "PC-COLOR-05": ["color-print", "COLOR PRINT", "#edf1f5", "#dd536b"],
  "PC-BIND-01": ["binding", "SPIRAL BIND", "#f2f3f5", "#5c54a2"],
  "PC-LAM-A4": ["lamination", "LAMINATION", "#def4f5", "#42a5b3"],
  "PC-SCAN-01": ["scanner", "SCAN", "#526376", "#80c2d2"],
};

const fallbackArt = {
  meal: ["plate", "MEAL", "#d97745", "#63a05b"],
  snack: ["pastry", "SNACK", "#dda344", "#f0cc75"],
  drink: ["cold-cup", "DRINK", "#4ca6c7", "#d8f5ff"],
  study: ["notebook", "STUDY", "#6e55b7", "#f3e9d3"],
  technology: ["usb", "TECH", "#3e5369", "#8db8ca"],
  personal: ["bottle", "PERSONAL", "#d66f91", "#f4d6e1"],
  dormitory: ["document", "DORM", "#4c927b", "#cce8dc"],
};

function FoodArt({ kind, primary, secondary }) {
  if (kind === "sandwich" || kind === "bagel" || kind === "pita") {
    const bagel = kind === "bagel";
    const pita = kind === "pita";
    return <>{pita ? <path className="svg-bread" d="M58 129c4-65 28-101 62-101s58 36 62 101Z" /> : <><path className="svg-bread" d="M54 66c8-28 30-42 66-42s58 14 66 42Z" />{bagel && <ellipse className="svg-cutout" cx="120" cy="48" rx="18" ry="9" />}</>}<path className="svg-secondary" style={{ color: secondary }} d="M57 79h126l-16 20-25-9-25 11-25-12-27 11Z" /><path className="svg-primary" style={{ color: primary }} d="M63 101h114l-11 20H74Z" />{!pita && <path className="svg-bread" d="M53 123h134c-8 18-24 23-45 23H98c-21 0-37-5-45-23Z" />}</>;
  }
  if (kind === "skewers") return <><ellipse className="svg-plate" cx="120" cy="88" rx="78" ry="51" /><g className="svg-primary" style={{ color: primary }}><path d="M66 104 171 55M72 117l103-48" /><circle cx="96" cy="88" r="12" /><circle cx="127" cy="73" r="12" /><circle cx="116" cy="102" r="12" /><circle cx="148" cy="86" r="12" /></g></>;
  if (kind === "round") return <><circle className="svg-crust" cx="120" cy="79" r="62" /><circle className="svg-primary" style={{ color: primary }} cx="120" cy="79" r="51" /><g className="svg-secondary" style={{ color: secondary }}><circle cx="94" cy="55" r="8" /><circle cx="140" cy="53" r="8" /><circle cx="148" cy="91" r="8" /><circle cx="105" cy="103" r="8" /><path d="M120 28v102M69 79h102" /></g></>;
  if (kind === "pan") return <><circle className="svg-pan" cx="112" cy="80" r="58" /><path className="svg-pan" d="M163 99h55v17h-62" /><circle className="svg-primary" style={{ color: primary }} cx="112" cy="80" r="49" /><g className="svg-egg"><circle cx="91" cy="72" r="15" /><circle cx="133" cy="88" r="15" /><circle cx="91" cy="72" r="6" /><circle cx="133" cy="88" r="6" /></g></>;
  if (kind === "fries") return <><g className="svg-primary" style={{ color: primary }}><path d="m76 28 12-2 8 70-13 2Zm29-7 13 1v73h-13Zm31 7 12 3-11 67-13-2Zm29 14 11 6-21 57-12-5Z" /></g><path className="svg-secondary" style={{ color: secondary }} d="M67 80h106l-14 65H81Z" /></>;
  if (kind === "rings") return <g className="svg-primary" style={{ color: primary }}><circle cx="88" cy="70" r="30" /><circle className="svg-cutout" cx="88" cy="70" r="14" /><circle cx="146" cy="78" r="35" /><circle className="svg-cutout" cx="146" cy="78" r="17" /><circle cx="111" cy="116" r="25" /><circle className="svg-cutout" cx="111" cy="116" r="12" /></g>;
  if (kind === "fruit") return <><path className="svg-glass" d="M70 40h100l-13 105H83Z" /><g className="svg-primary" style={{ color: primary }}><circle cx="93" cy="76" r="16" /><circle cx="128" cy="68" r="17" /><circle cx="150" cy="94" r="16" /></g><g className="svg-secondary" style={{ color: secondary }}><circle cx="108" cy="103" r="15" /><circle cx="132" cy="121" r="14" /></g></>;
  if (kind === "croissant") return <><path className="svg-primary" style={{ color: primary }} d="M42 97c18-58 52-73 78-37 26-36 60-21 78 37-23-16-42-19-55-3-13 16-35 16-48 0-13-16-30-13-53 3Z" /><path className="svg-lines" d="m77 57 20 37m66-37-20 37" /><circle className="svg-dark" cx="120" cy="94" r="10" /></>;
  if (kind === "pastry") return <><path className="svg-primary" style={{ color: primary }} d="M62 112 89 36l31 20 32-20 26 76-58 29Z" /><path className="svg-lines" d="m89 36 31 74 32-74M72 84h96" /><path className="svg-secondary" style={{ color: secondary }} d="M94 72h52l-26 36Z" /></>;
  return <><ellipse className="svg-plate" cx="120" cy="88" rx="78" ry="51" /><path className="svg-primary" style={{ color: primary }} d="M82 64c20-17 57-13 76 5l-9 39c-22 13-51 11-70-4Z" /><g className="svg-secondary" style={{ color: secondary }}><circle cx="65" cy="94" r="13" /><circle cx="179" cy="91" r="13" /><path d="M53 70c12-14 23-14 35 0" /></g></>;
}

function BowlArt({ primary, secondary }) {
  return <><ellipse className="svg-bowl-rim" cx="120" cy="57" rx="71" ry="27" /><ellipse className="svg-primary" style={{ color: primary }} cx="120" cy="57" rx="61" ry="19" /><g className="svg-secondary" style={{ color: secondary }}><circle cx="88" cy="54" r="9" /><circle cx="112" cy="47" r="9" /><circle cx="139" cy="56" r="9" /><circle cx="157" cy="48" r="7" /></g><path className="svg-bowl" d="M50 62h140c-7 48-27 70-70 70S57 110 50 62Z" /></>;
}

function DrinkArt({ kind, label, primary, secondary }) {
  if (kind === "bottle") return <><rect className="svg-cap" x="104" y="14" width="32" height="16" rx="4" /><path className="svg-glass" d="M98 29h44l8 23v80c0 9-6 13-14 13h-32c-8 0-14-4-14-13V52Z" /><path className="svg-primary" style={{ color: primary }} d="M95 70h50v60H95Z" /><text className="svg-label" x="120" y="105">{label}</text></>;
  if (kind === "can") return <><rect className="svg-primary" style={{ color: primary }} x="81" y="24" width="78" height="120" rx="14" /><ellipse className="svg-can-top" cx="120" cy="29" rx="34" ry="8" /><path className="svg-wave" d="M82 94c25-25 51 22 77-3" /><text className="svg-label svg-label--light" x="120" y="73">{label}</text></>;
  if (kind === "cold-cup") return <><path className="svg-glass" d="M79 34h82l-11 111H90Z" /><path className="svg-primary" style={{ color: primary }} d="M86 62h68l-8 75H94Z" /><g className="svg-ice"><rect x="98" y="70" width="17" height="14" rx="3" /><rect x="127" y="76" width="17" height="15" rx="3" /><rect x="111" y="99" width="18" height="15" rx="3" /></g><path className="svg-straw" d="m132 64 18-51" /><text className="svg-label" x="120" y="127">{label}</text></>;
  const tea = kind === "tea";
  return <><path className="svg-mug" d="M63 47h102v64c0 21-15 34-38 34H99c-23 0-36-13-36-34Z" /><path className="svg-handle" d="M164 63h14c25 0 25 40 0 40h-14" /><ellipse className="svg-primary" style={{ color: primary }} cx="114" cy="51" rx="50" ry="15" /><path className="svg-steam" d="M92 34c-9-11 10-16 1-28m28 28c-9-11 10-16 1-28m28 28c-9-11 10-16 1-28" />{tea && <><path className="svg-tea-string" d="M136 49v39" /><rect className="svg-secondary" style={{ color: secondary }} x="128" y="85" width="18" height="20" rx="3" /></>}<text className="svg-label" x="114" y="104">{label}</text></>;
}

function OfficeArt({ kind, label, primary, secondary }) {
  if (kind === "usb") return <><rect className="svg-primary" style={{ color: primary }} x="57" y="53" width="115" height="66" rx="15" /><rect className="svg-secondary" style={{ color: secondary }} x="154" y="67" width="38" height="38" rx="3" /><circle className="svg-cutout" cx="84" cy="86" r="10" /><text className="svg-label svg-label--light" x="124" y="91">{label}</text></>;
  if (kind === "pens" || kind === "markers") return <g transform="rotate(-15 120 82)"><rect className="svg-primary" style={{ color: primary }} x="48" y="53" width="145" height="23" rx="8" /><path className="svg-dark" d="m35 64 18-11v23Z" /><rect className="svg-secondary" style={{ color: secondary }} x="72" y="94" width="134" height="23" rx="8" /><path className="svg-dark" d="m59 105 18-11v23Z" /></g>;
  if (kind === "scanner") return <><path className="svg-primary" style={{ color: primary }} d="M47 84h146l15 48H32Z" /><rect className="svg-secondary" style={{ color: secondary }} x="62" y="43" width="116" height="52" rx="8" /><path className="svg-paper" d="M77 19h86v66H77Z" /><path className="svg-lines" d="M92 40h56M92 57h47" /></>;
  const isColor = kind === "color-print";
  const isLamination = kind === "lamination";
  return <><path className="svg-paper" d="M69 18h93l25 25v106H69Z" /><path className="svg-fold" d="M162 18v26h25" />{isColor ? <g><circle fill="#e84f61" cx="101" cy="72" r="12" /><circle fill="#43a9c2" cx="131" cy="72" r="12" /><circle fill="#e7c747" cx="116" cy="98" r="12" /></g> : <path className="svg-lines" d="M94 66h67M94 87h67M94 108h54" />}{kind === "binding" && <path className="svg-binding" d="M75 36h23m-23 19h23m-23 19h23m-23 19h23m-23 19h23m-23 19h23" />}{isLamination && <rect className="svg-secondary" style={{ color: secondary }} x="55" y="8" width="145" height="148" rx="10" opacity=".25" />}<text className="svg-label" x="128" y="137">{label}</text></>;
}

export function ProductIllustration({ product }) {
  const [kind, label, primary, secondary] = productArt[product.sku]
    ?? fallbackArt[product.need_type]
    ?? ["document", "PRODUCT", "#6e55b7", "#dcd6f4"];
  const props = { kind, label, primary, secondary };
  const isDrink = ["bottle", "can", "cold-cup", "hot-cup", "tea"].includes(kind);
  const isOffice = ["pens", "markers", "notebook", "usb", "document", "color-print", "binding", "lamination", "scanner"].includes(kind);
  return (
    <svg className="product-illustration" viewBox="0 0 240 160" focusable="false" aria-hidden="true">
      <circle className="svg-backdrop" cx="120" cy="80" r="75" />
      {kind === "bowl" && <BowlArt {...props} />}
      {isDrink && <DrinkArt {...props} />}
      {isOffice && <OfficeArt {...props} />}
      {!isDrink && !isOffice && kind !== "bowl" && <FoodArt {...props} />}
      {!isDrink && !isOffice && <text className="svg-caption" x="120" y="153">{label}</text>}
    </svg>
  );
}
