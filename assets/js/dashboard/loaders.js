export function createDashboardLoaders({ fetchMetric, makeChart, colors }) {
  function setTrend(id, cur, prev, label) {
    const el = document.getElementById(id);
    const diff = (cur || 0) - (prev || 0);
    const pct = prev > 0 ? Math.abs(Math.round((diff / prev) * 100)) : 0;

    el.textContent =
      (diff >= 0 ? "↑ +" : "↓ -") + Math.abs(diff) + " (" + pct + "%) " + label;
    el.className = "kpi-trend " + (diff >= 0 ? "up" : "down");
  }

  async function loadKPIs() {
    const d = await fetchMetric("kpis");
    if (!d) return;

    const conv =
      d.totalSessions > 0
        ? ((d.totalLeads / d.totalSessions) * 100).toFixed(1)
        : 0;

    document.getElementById("kpi-visits").textContent =
      d.totalSessions.toLocaleString();
    document.getElementById("kpi-leads").textContent =
      d.totalLeads.toLocaleString();
    document.getElementById("kpi-conv").textContent = conv + "%";
    document.getElementById("kpi-wha").textContent =
      d.whaClicks.toLocaleString();

    setTrend("kpi-visits-trend", d.sesHoy, d.sesAyer, "hoy vs ayer");
    setTrend("kpi-leads-trend", d.leadsHoy, d.leadsAyer, "hoy vs ayer");

    const convHoy =
      d.sesHoy > 0 ? ((d.leadsHoy / d.sesHoy) * 100).toFixed(1) : 0;
    const convAyer =
      d.sesAyer > 0 ? ((d.leadsAyer / d.sesAyer) * 100).toFixed(1) : 0;
    document.getElementById("kpi-conv-trend").textContent =
      `${convHoy}% hoy vs ${convAyer}% ayer`;

    if (d.totalSessions > 0) {
      document.getElementById("configBanner").style.display = "none";
    }
  }

  async function loadLeadsDia() {
    const d = await fetchMetric("leads_dia");
    if (!d) return;

    const counts = {};
    (d.data || []).forEach((r) => {
      const day = r.created_at.slice(0, 10);
      counts[day] = (counts[day] || 0) + 1;
    });

    const labels = [];
    const values = [];
    for (let i = 29; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      labels.push(
        dt.toLocaleDateString("es-EC", { month: "short", day: "numeric" }),
      );
      values.push(counts[key] || 0);
    }

    makeChart("chartLeadsDia", {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Leads",
            data: values,
            backgroundColor: "rgba(30,58,138,0.15)",
            borderColor: "#1E3A8A",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: "#1E3A8A",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
        },
      },
    });
  }

  async function loadMarcas() {
    const d = await fetchMetric("marcas");
    if (!d) return;

    const counts = {};
    (d.data || []).forEach((r) => {
      if (r.marca) counts[r.marca] = (counts[r.marca] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    makeChart("chartMarcas", {
      type: "doughnut",
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [
          {
            data: sorted.map(([, v]) => v),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "white",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 11, weight: "700" }, padding: 10 },
          },
        },
        cutout: "60%",
      },
    });
  }

  async function loadCiudades() {
    const d = await fetchMetric("ciudades");
    if (!d) return;

    const counts = {};
    (d.data || []).forEach((r) => {
      if (r.ciudad) counts[r.ciudad] = (counts[r.ciudad] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    makeChart("chartCiudades", {
      type: "bar",
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [
          {
            label: "Leads",
            data: sorted.map(([, v]) => v),
            backgroundColor: colors.slice(0, sorted.length),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: "700" } },
          },
        },
      },
    });
  }

  async function loadFunnel() {
    const d = await fetchMetric("funnel");
    if (!d) return;

    const counters = { s1: 0, s2: 0, s3: 0, sub: 0, wha: 0 };
    (d.data || []).forEach((r) => {
      if (r.event_type === "step_start" && r.step === 1) counters.s1++;
      if (r.event_type === "step_start" && r.step === 2) counters.s2++;
      if (r.event_type === "step_start" && r.step === 3) counters.s3++;
      if (r.event_type === "form_submit") counters.sub++;
      if (r.event_type === "whatsapp_click") counters.wha++;
    });

    const base = counters.s1 || 1;
    const steps = [
      { label: "1. Datos del auto", n: counters.s1, color: "#1E3A8A" },
      { label: "2. Estado y extras", n: counters.s2, color: "#2563EB" },
      { label: "3. Datos contacto", n: counters.s3, color: "#10B981" },
      { label: "✅ Formulario enviado", n: counters.sub, color: "#059669" },
      { label: "💬 Click WhatsApp", n: counters.wha, color: "#25D366" },
    ];

    document.getElementById("funnelContainer").innerHTML = steps
      .map((s) => {
        const pct = Math.round((s.n / base) * 100);
        return `<div class="funnel-step">
<div class="funnel-label"><span>${s.label}</span><span>${s.n} (${pct}%)</span></div>
<div class="funnel-bar-track"><div class="funnel-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
</div>`;
      })
      .join("");
  }

  async function loadScroll() {
    const d = await fetchMetric("scroll");
    if (!d) return;

    const buckets = { 25: 0, 50: 0, 75: 0, 90: 0, 100: 0 };
    (d.data || []).forEach((r) => {
      const pct = r.event_data?.value;
      if (buckets[pct] !== undefined) buckets[pct]++;
    });

    makeChart("chartScroll", {
      type: "bar",
      data: {
        labels: ["25%", "50%", "75%", "90%", "100%"],
        datasets: [
          {
            label: "Usuarios",
            data: Object.values(buckets),
            backgroundColor: [
              "#BFDBFE",
              "#93C5FD",
              "#60A5FA",
              "#3B82F6",
              "#1E3A8A",
            ],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  async function loadCamposVacios() {
    const d = await fetchMetric("campos_vacios");
    if (!d) return;

    const counts = {};
    (d.data || []).forEach((r) => {
      if (r.field_name) counts[r.field_name] = (counts[r.field_name] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const canvas = document.getElementById("chartScroll");
    const existing = document.getElementById("campos-vacios-list");
    if (existing) existing.remove();

    if (sorted.length === 0) return;

    const div = document.createElement("div");
    div.id = "campos-vacios-list";
    div.style.cssText = "margin-top:12px;font-size:12px;";
    div.innerHTML =
      '<div style="font-weight:800;color:var(--blue-dark);margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px">Campos más abandonados</div>' +
      sorted
        .map(
          ([k, v]) =>
            `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f3f4f6;color:var(--text-mid);font-weight:700"><span>${k}</span><span style="color:var(--red);font-weight:800">${v}x</span></div>`,
        )
        .join("");

    canvas.parentNode.appendChild(div);
  }

  async function loadLeadsTable() {
    const d = await fetchMetric("leads_tabla");
    if (!d) return;

    document.getElementById("leads-count-badge").textContent =
      (d.count || 0) + " total";

    const tbody = document.getElementById("leadsTable");
    if (!d.data || d.data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="10"><div class="empty">📭 Sin leads aún.</div></td></tr>';
      return;
    }

    tbody.innerHTML = d.data
      .map((r) => {
        const fecha = new Date(r.created_at).toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        const badge =
          r.estado_general === "Excelente"
            ? "green"
            : r.estado_general === "Bueno"
              ? "blue"
              : "orange";

        const whaNum = "593" + (r.celular || "").replace(/^0/, "");
        const whaMsg = encodeURIComponent(
          `Hola ${r.nombre}, te contactamos de AutoCash sobre tu ${r.marca} ${r.modelo}`,
        );

        return `<tr>
<td style="color:var(--text);font-weight:700;white-space:nowrap">${fecha}</td>
<td style="color:var(--text);font-weight:700">${r.nombre || "—"}</td>
<td><strong>${r.marca || "—"} ${r.modelo || ""}</strong></td>
<td>${r.anio || "—"}</td>
<td style="white-space:nowrap">${r.kilometraje || "—"}</td>
<td><span class="badge ${badge}">${r.estado_general || "—"}</span></td>
<td style="color:var(--green);font-weight:800;white-space:nowrap">${r.estimado_texto || "—"}</td>
<td><a href="https://wa.me/${whaNum}?text=${whaMsg}" target="_blank" style="color:var(--green);font-weight:700;text-decoration:none">📱 ${r.celular || "—"}</a></td>
<td>${r.ciudad || "—"}</td>
<td><span class="badge gray">${r.utm_source || "orgánico"}</span></td>
</tr>`;
      })
      .join("");
  }

  async function loadAll() {
    document.getElementById("lastUpdate").textContent = "Actualizando...";
    await Promise.all([
      loadKPIs(),
      loadLeadsDia(),
      loadMarcas(),
      loadCiudades(),
      loadFunnel(),
      loadScroll(),
      loadCamposVacios(),
      loadLeadsTable(),
    ]);

    document.getElementById("lastUpdate").textContent =
      "Actualizado " +
      new Date().toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  return {
    loadAll,
  };
}
