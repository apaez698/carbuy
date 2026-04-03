import { useQuery } from "@tanstack/react-query";
import { fetchMetric } from "../api.js";

function useMetric(dashPass, query) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["metric", dashPass, query],
    queryFn: () => fetchMetric(dashPass, query),
    refetchInterval: 30000,
    retry: false,
    enabled: Boolean(dashPass),
  });

  return { data, isLoading, isError };
}

export default useMetric;
