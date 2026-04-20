export function buildWhatsAppLink(celular, nombre, marca, modelo) {
  const stripped = (celular || "").replace(/^0/, "");
  const phone = stripped.startsWith("593") ? stripped : `593${stripped}`;
  const text = encodeURIComponent(
    `Hola ${nombre}, te contactamos de AutoCash sobre tu ${marca} ${modelo}`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}
