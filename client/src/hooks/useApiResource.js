import { useCallback, useEffect, useRef, useState } from "react";

export function useApiResource(loader) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await loaderRef.current();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error });
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
