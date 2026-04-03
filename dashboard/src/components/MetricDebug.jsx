import useMetric from "../hooks/useMetric.js";

function MetricDebug({ password }) {
  const { data, isLoading, isError } = useMetric(password, "kpis");

  if (isLoading) return <p>Cargando...</p>;
  if (isError) return <p>Error auth</p>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default MetricDebug;
