const paths = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  eat: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" /><path d="M17 3v18M14 3c0 5 1 8 3 8" /></>,
  shop: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  print: <><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7z" /></>,
  report: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
  orders: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  cart: <><path d="M3 4h2l2 11h10l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
  arrow: <><path d="m9 18 6-6-6-6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  sparkles: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m5 15 .7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15Z" /><path d="m19 13 .6 1.9 1.9.6-1.9.6L19 18l-.6-1.9-1.9-.6 1.9-.6L19 13Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
  building: <><path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M10 21v-4h4v4" /></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  upload: <><path d="M12 16V3m0 0L7 8m5-5 5 5" /><path d="M5 14v7h14v-7" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-5" /></>,
};

export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.home}
    </svg>
  );
}

