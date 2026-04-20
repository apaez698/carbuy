export const CAR_DB = [
  { brand: "Toyota",    models: ["Corolla","Yaris","Hilux","RAV4","Fortuner","Prado","Highlander","4Runner"] },
  { brand: "Chevrolet", models: ["Sail","Aveo","Spark","Onix","Captiva","Tracker","D-Max","Grand Vitara","Sonic"] },
  { brand: "Hyundai",   models: ["Accent","Elantra","Tucson","Santa Fe","Creta","i10","Kona"] },
  { brand: "Kia",       models: ["Rio","Picanto","Sportage","Sorento","Cerato","Seltos","Stonic"] },
  { brand: "Mazda",     models: ["3","CX-5","CX-30","BT-50","CX-9","6","2"] },
  { brand: "Nissan",    models: ["Sentra","Versa","X-Trail","Frontier","Qashqai","Kicks","March"] },
];

// Rough base prices in USD (Quito market) — used only for breakdown display, not for prediction
const BASE_PRICES = {
  "Toyota Corolla": 15800, "Toyota Yaris": 12500, "Toyota Hilux": 24500, "Toyota RAV4": 21500,
  "Toyota Fortuner": 29500, "Toyota Prado": 38000, "Toyota Highlander": 27000, "Toyota 4Runner": 32000,
  "Chevrolet Sail": 10500, "Chevrolet Aveo": 9500, "Chevrolet Spark": 8200, "Chevrolet Onix": 13500,
  "Chevrolet Captiva": 14000, "Chevrolet Tracker": 16500, "Chevrolet D-Max": 22500,
  "Chevrolet Grand Vitara": 13000, "Chevrolet Sonic": 9800,
  "Hyundai Accent": 11800, "Hyundai Elantra": 14500, "Hyundai Tucson": 19500,
  "Hyundai Santa Fe": 24000, "Hyundai Creta": 17500, "Hyundai i10": 10200, "Hyundai Kona": 18500,
  "Kia Rio": 11500, "Kia Picanto": 9200, "Kia Sportage": 18800, "Kia Sorento": 23500,
  "Kia Cerato": 13800, "Kia Seltos": 18000, "Kia Stonic": 15000,
  "Mazda 3": 15500, "Mazda CX-5": 22000, "Mazda CX-30": 20500, "Mazda BT-50": 23000,
  "Mazda CX-9": 28000, "Mazda 6": 18000, "Mazda 2": 11000,
  "Nissan Sentra": 13500, "Nissan Versa": 12000, "Nissan X-Trail": 19800, "Nissan Frontier": 22000,
  "Nissan Qashqai": 17500, "Nissan Kicks": 16200, "Nissan March": 10500,
};

export function getBasePrice(brand, model) {
  return BASE_PRICES[`${brand} ${model}`] ?? 14000;
}
