import { useCallback, useEffect, useRef, useState } from "react";

export function useApiResource(loader) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestNumber = latestRequest.current + 1;
    latestRequest.current = requestNumber;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await loader();
      if (latestRequest.current === requestNumber) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (error) {
      if (latestRequest.current === requestNumber) {
        setState({ data: null, loading: false, error });
      }
      return null;
    }
  }, [loader]);

  useEffect(() => {
    load();
    return () => {
      latestRequest.current += 1;
    };
  }, [load]);

  return { ...state, reload: load };
}
