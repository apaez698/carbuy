import { useState, useMemo } from "react";
import ScreenHeader from "./ScreenHeader.jsx";
import Chip from "../components/Chip.jsx";
import CondCard from "../components/CondCard.jsx";
import Slider from "../components/Slider.jsx";
import FieldLabel from "../components/FieldLabel.jsx";
import TextInput from "../components/TextInput.jsx";
import ScrollRow from "../components/ScrollRow.jsx";
import { PrimaryBtn } from "../components/Buttons.jsx";
import useCatalog from "../hooks/useCatalog.js";

const F = "DM Sans, system-ui, sans-serif";
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 1980 + 1 }, (_, i) => CUR_YEAR - i);

function fmtKm(n) { return n.toLocaleString("en-US") + " km"; }

export default function ScreenVehicle({ t, copy, value, onChange, onBack, onNext, step, totalSteps }) {
  const { brands, models, loadingBrands, loadingModels } = useCatalog(value.brand);
  const [modelFilter, setModelFilter] = useState("");

  const filteredModels = useMemo(() => {
    if (!modelFilter) return models;
    const q = modelFilter.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, modelFilter]);

  const valid = value.brand && value.model && value.year && value.km > 0 && value.estado;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <ScreenHeader t={t} onBack={onBack} step={step} total={totalSteps} title={copy.vehTitle} sub={copy.vehSub} />

      <div style={{ padding: "22px 24px 22px", display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>

        {/* Marca */}
        <div>
          <FieldLabel t={t}>Marca{loadingBrands && <span style={{ fontFamily: F, fontSize: 11, color: t.dim, marginLeft: 6 }}>cargando…</span>}</FieldLabel>
          <ScrollRow gap={8} resetKey="brands" rows={2}>
            {brands.map(b => (
              <Chip key={b} t={t} active={value.brand === b}
                onClick={() => { setModelFilter(""); onChange({ ...value, brand: b, model: "" }); }}>
                {b}
              </Chip>
            ))}
            <Chip t={t} active={value.brand === "Otra"}
              onClick={() => { setModelFilter(""); onChange({ ...value, brand: "Otra", model: "" }); }}>
              + Otra
            </Chip>
          </ScrollRow>
        </div>

        {/* Modelo — chips cargados desde API */}
        {value.brand && value.brand !== "Otra" && (
          <div>
            <FieldLabel t={t}>Modelo{loadingModels && <span style={{ fontFamily: F, fontSize: 11, color: t.dim, marginLeft: 6 }}>cargando…</span>}</FieldLabel>
            {models.length > 12 && (
              <div style={{ marginBottom: 8 }}>
                <TextInput t={t} value={modelFilter}
                  onChange={setModelFilter}
                  placeholder="Buscar modelo…" />
              </div>
            )}
            <ScrollRow gap={12} resetKey={value.brand + modelFilter} reverse rows={2} rowGap={10}>
              {filteredModels.map(m => (
                <Chip key={m} size="sm" t={t} active={value.model === m}
                  onClick={() => onChange({ ...value, model: m })}>
                  {m}
                </Chip>
              ))}
            </ScrollRow>
            {!loadingModels && filteredModels.length === 0 && modelFilter && (
              <div style={{ fontFamily: F, fontSize: 12, color: t.dim, marginTop: 6 }}>
                Sin resultados para "{modelFilter}"
              </div>
            )}
          </div>
        )}

        {/* Modelo — campo libre para "Otra" */}
        {value.brand === "Otra" && (
          <div>
            <FieldLabel t={t}>Marca / modelo</FieldLabel>
            <TextInput t={t} value={value.model}
              onChange={v => onChange({ ...value, model: v })}
              placeholder="Ej. Peugeot 208" />
          </div>
        )}

        {/* Año */}
        <div>
          <FieldLabel t={t}>Año</FieldLabel>
          <ScrollRow gap={8} resetKey="years">
            {YEARS.map(y => (
              <Chip key={y} size="sm" t={t} active={value.year === y}
                onClick={() => onChange({ ...value, year: y })}>
                {y}
              </Chip>
            ))}
          </ScrollRow>
        </div>

        {/* Kilometraje */}
        <div>
          <FieldLabel t={t}>Kilometraje</FieldLabel>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 24, color: t.text }}>
            {fmtKm(value.km)}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: t.dim, marginTop: 2, marginBottom: 14 }}>
            Arrastra para ajustar
          </div>
          <Slider t={t} value={value.km} min={0} max={200000} step={1000}
            onChange={v => onChange({ ...value, km: v })} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 10, color: t.dim, marginTop: 10 }}>
            <span>0 km</span><span>200,000 km</span>
          </div>
        </div>

        {/* Estado */}
        <div>
          <FieldLabel t={t}>Estado del auto</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <CondCard t={t} icon="✨" title="Excelente" sub="Sin golpes ni fallas"
              active={value.estado === "Excelente"} onClick={() => onChange({ ...value, estado: "Excelente" })} />
            <CondCard t={t} icon="👍" title="Bueno" sub="Detalles menores"
              active={value.estado === "Bueno"} onClick={() => onChange({ ...value, estado: "Bueno" })} />
            <CondCard t={t} icon="🔧" title="Regular" sub="Necesita trabajo"
              active={value.estado === "Regular"} onClick={() => onChange({ ...value, estado: "Regular" })} />
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 6 }}>
          <PrimaryBtn t={t} disabled={!valid} onClick={onNext}>Ver estimación →</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
