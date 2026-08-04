import { useCallback, useEffect, useRef, useState } from "react";

const keyFor = (item) => item.public_id ?? item.id;

const emptyState = {
  items: [],
  meta: { page: 0, limit: 0, hasMore: false },
  loading: true,
  loadingMore: false,
  error: null,
};

export function useLoadMoreResource(loader, { pageSize = 6, getKey = keyFor } = {}) {
  const [state, setState] = useState(emptyState);
  const generation = useRef(0);
  const currentPage = useRef(0);
  const activeRequest = useRef(null);

  const requestPage = useCallback(async (page, replace, requestGeneration) => {
    const requestKey = `${requestGeneration}:${page}`;
    if (activeRequest.current === requestKey) return null;
    activeRequest.current = requestKey;
    setState((current) => ({
      ...current,
      loading: replace,
      loadingMore: !replace,
      error: null,
    }));

    try {
      const result = await loader({ page, limit: pageSize });
      if (generation.current !== requestGeneration) return null;

      currentPage.current = result.meta?.page ?? page;
      setState((current) => {
        const incoming = result.data ?? [];
        const items = replace
          ? incoming
          : [...current.items, ...incoming].filter((item, index, all) => (
            all.findIndex((candidate) => getKey(candidate) === getKey(item)) === index
          ));
        return {
          items,
          meta: result.meta ?? { page, limit: pageSize, hasMore: false },
          loading: false,
          loadingMore: false,
          error: null,
        };
      });
      return result;
    } catch (error) {
      if (generation.current === requestGeneration) {
        setState((current) => ({
          ...current,
          loading: false,
          loadingMore: false,
          error,
        }));
      }
      return null;
    } finally {
      if (activeRequest.current === requestKey) activeRequest.current = null;
    }
  }, [getKey, loader, pageSize]);

  const reload = useCallback(() => {
    generation.current += 1;
    const requestGeneration = generation.current;
    currentPage.current = 0;
    activeRequest.current = null;
    setState(emptyState);
    return requestPage(1, true, requestGeneration);
  }, [requestPage]);

  const loadMore = useCallback(() => {
    if (state.loading || state.loadingMore || !state.meta.hasMore) return null;
    return requestPage(currentPage.current + 1, false, generation.current);
  }, [requestPage, state.loading, state.loadingMore, state.meta.hasMore]);

  useEffect(() => {
    reload();
    return () => {
      generation.current += 1;
      activeRequest.current = null;
    };
  }, [reload]);

  return { ...state, loadMore, reload };
}
