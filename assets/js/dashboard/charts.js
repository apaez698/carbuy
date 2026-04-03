export function createChartRegistry() {
  const charts = {};

  function makeChart(id, config) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }

  return { makeChart };
}
