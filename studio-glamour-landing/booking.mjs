// Funciones puras para preparar solicitudes de cita; no confirman disponibilidad.
export const SERVICES = Object.freeze([
  "Nail Art",
  "Manicura en Gel",
  "Extensiones de Pestañas",
  "Tratamientos",
]);

export function mexicoDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export function validateBooking(data, now = new Date()) {
  const errors = {};
  const today = mexicoDateTime(now);
  const date =
    typeof data.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.fecha)
      ? new Date(`${data.fecha}T00:00:00Z`)
      : new Date(NaN);
  const validDate =
    Number.isFinite(date.getTime()) &&
    Number(data.fecha.slice(0, 4)) > 0 &&
    date.toISOString().slice(0, 10) === data.fecha;
  if (!validDate)
    errors.fecha = "Elige una fecha válida con formato AAAA-MM-DD.";
  else if (data.fecha < today.date)
    errors.fecha = "Elige hoy o una fecha futura.";
  const validTime =
    typeof data.hora === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.hora);
  if (!validTime) errors.hora = "Elige una hora válida con formato HH:MM.";
  else if (validDate && data.fecha === today.date && data.hora < today.time) {
    errors.hora = "Elige una hora que no haya pasado en Ciudad de México.";
  }
  if (!errors.fecha && validTime) {
    // El día corresponde a la fecha solicitada, no a la zona horaria del equipo.
    const opens = date.getUTCDay() === 0 ? "12:00" : "09:00";
    if (data.hora < opens || data.hora >= "20:00") {
      errors.hora = `El horario publicado es de ${opens} a 20:00; solicita una hora anterior al cierre.`;
    }
  }
  const nameLength =
    typeof data.nombre === "string" ? [...data.nombre.trim()].length : 0;
  if (nameLength < 2 || nameLength > 80) {
    errors.nombre = "Escribe tu nombre (entre 2 y 80 caracteres).";
  }
  if (!SERVICES.includes(data.servicio))
    errors.servicio = "Elige un servicio del catálogo.";
  if (data.consent !== true)
    errors.consent = "Acepta el contacto por WhatsApp para continuar.";
  if (
    data.mensaje !== undefined &&
    (typeof data.mensaje !== "string" || [...data.mensaje].length > 1000)
  ) {
    errors.mensaje = "Las notas deben tener como máximo 1000 caracteres.";
  }
  return errors;
}

export function buildWhatsAppUrl(data) {
  const lines = [
    "Hola, Glam Studio. Me gustaría solicitar una cita.",
    `Nombre: ${data.nombre}`,
    `Servicio: ${data.servicio}`,
    `Fecha: ${data.fecha}`,
    `Hora aproximada (Ciudad de México): ${data.hora}`,
  ];
  if (typeof data.mensaje === "string" && data.mensaje.trim()) {
    lines.push(`Notas: ${data.mensaje}`);
  }
  lines.push("¿Tienen este horario disponible?");
  return `https://wa.me/525534762060?text=${encodeURIComponent(lines.join("\n"))}`;
}
