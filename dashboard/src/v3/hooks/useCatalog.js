import { useState, useEffect, useRef } from "react";
import { fetchMarcas, fetchModelos } from "../data/catalogCache.js";
import { CAR_DB } from "../data/carDb.js";

// Immediate brand list from the bundled DB (shown while the API warms up)
const SEED_BRANDS = CAR_DB.map((b) => b.brand);

export default function useCatalog(selectedBrand) {
  const [brands, setBrands] = useState(SEED_BRANDS);
  const [models, setModels] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const lastBrand = useRef(null);

  // ── Load brands once on mount ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchMarcas().then((list) => {
      if (!cancelled) {
        setBrands(list);
        setLoadingBrands(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load models when selected brand changes ───────────────────────
  useEffect(() => {
    if (!selectedBrand || selectedBrand === "Otra") {
      setModels([]);
      setLoadingModels(false);
      return;
    }

    // Avoid duplicate fetches for the same brand
    if (lastBrand.current === selectedBrand) return;
    lastBrand.current = selectedBrand;

    let cancelled = false;
    setLoadingModels(true);
    setModels([]);

    fetchModelos(selectedBrand).then((list) => {
      if (!cancelled) {
        setModels(list);
        setLoadingModels(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedBrand]);

  return { brands, models, loadingBrands, loadingModels };
}
