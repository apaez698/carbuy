import { clearTestData, fetchMetric } from "./api.js";
import { createChartRegistry } from "./charts.js";
import { COLORS, DASH_PASS } from "./config.js";
import { createDashboardLoaders } from "./loaders.js";

const { makeChart } = createChartRegistry();
const metricFetcher = (q) => fetchMetric(DASH_PASS, q);
const { loadAll } = createDashboardLoaders({
  fetchMetric: metricFetcher,
  makeChart,
  colors: COLORS,
});

window.loadAll = loadAll;
window.clearTestData = () => clearTestData(DASH_PASS, loadAll);

if (DASH_PASS) {
  loadAll();
  setInterval(loadAll, 30000);
}

document.querySelectorAll(".nav-item[data-target]").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((x) => x.classList.remove("active"));

    item.classList.add("active");
    const targetId = item.getAttribute("data-target");
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
