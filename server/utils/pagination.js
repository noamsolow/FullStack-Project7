export function paginationFrom(query) {
  const page = Number(query.page ?? 1);
  const limit = Math.min(Number(query.limit ?? 12), 50);
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    fetchLimit: limit + 1,
  };
}

export function paginated(rows, page, limit) {
  const hasMore = rows.length > limit;
  return {
    data: hasMore ? rows.slice(0, limit) : rows,
    meta: { page, limit, hasMore },
  };
}

