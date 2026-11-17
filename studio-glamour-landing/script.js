import {
  mexicoDateTime,
  validateBooking,
  buildWhatsAppUrl,
} from "./booking.mjs";

// Galería progresiva: sin JavaScript, todas las fotografías siguen siendo enlaces.
const galleryItems = [...document.querySelectorAll(".gallery-item")];
const filters = document.querySelector(".gallery-filters");
const more = document.querySelector("#gallery-more");
const galleryStatus = document.querySelector("#gallery-status");
let activeFilter = "all";
let expanded = false;
function renderGallery() {
  const matching = galleryItems.filter(
    (item) => activeFilter === "all" || item.dataset.category === activeFilter,
  );
  const visible =
    expanded || activeFilter !== "all" ? matching : matching.slice(0, 6);
  galleryItems.forEach((item) => {
    item.hidden = !visible.includes(item);
  });
  more.hidden = activeFilter !== "all" || expanded || matching.length <= 6;
  galleryStatus.textContent = `Mostrando ${visible.length} de ${matching.length} trabajos. Selecciona una fotografía para verla completa.`;
}
filters.hidden = false;
filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  expanded = false;
  filters
    .querySelectorAll("button")
    .forEach((control) =>
      control.setAttribute("aria-pressed", String(control === button)),
    );
  renderGallery();
  galleryItems
    .filter((item) => !item.hidden)
    .forEach((item) => {
      item.classList.remove("gallery-enter");
      void item.offsetWidth;
      item.classList.add("gallery-enter");
    });
});
more.addEventListener("click", () => {
  expanded = true;
  renderGallery();
});
renderGallery();

const dialog = document.querySelector("#gallery-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogCount = document.querySelector("#dialog-count");
const dialogLoading = document.querySelector("#dialog-loading");
const dialogConsult = document.querySelector("#dialog-consult");
const closeDialogButton = document.querySelector("#dialog-close");
let currentWork = 0;
let currentList = [];
let opener = null;
function showWork() {
  const link = currentList[currentWork];
  dialogTitle.textContent = link.dataset.title;
  dialogCount.textContent = `${currentWork + 1} / ${currentList.length}`;
  dialogImage.alt = `${link.dataset.title}, trabajo de Glam Studio`;
  dialogLoading.hidden = false;
  dialogLoading.textContent = "Cargando fotografía…";
  dialogImage.onload = () => {
    dialogLoading.hidden = true;
  };
  dialogImage.onerror = () => {
    dialogLoading.textContent =
      "No se pudo cargar la fotografía. Cierra e inténtalo de nuevo.";
  };
  dialogImage.src = link.href;
  if (dialogImage.complete && dialogImage.naturalWidth)
    dialogLoading.hidden = true;
  const message = `Hola, Glam Studio. Vi el trabajo «${link.dataset.title}» en su galería y quiero consultar una cita para ${link.dataset.service}.`;
  dialogConsult.href = `https://wa.me/525534762060?text=${encodeURIComponent(message)}`;
}
function moveWork(step) {
  currentWork = (currentWork + step + currentList.length) % currentList.length;
  showWork();
}
document.querySelector(".gallery-grid").addEventListener("click", (event) => {
  const link = event.target.closest("[data-gallery]");
  if (!link || typeof dialog.showModal !== "function") return;
  event.preventDefault();
  opener = link;
  currentList = galleryItems
    .filter((item) => !item.hidden)
    .map((item) => item.querySelector("[data-gallery]"));
  currentWork = currentList.indexOf(link);
  showWork();
  dialog.showModal();
  document.body.classList.add("dialog-open");
  closeDialogButton.focus();
});
function closeGallery() {
  dialog.close();
  // El evento nativo `close` puede esperar al siguiente frame en una pestaña inactiva.
  // Liberar scroll y devolver foco aquí evita dejarlo dentro de un diálogo cerrado.
  document.body.classList.remove("dialog-open");
  opener?.focus({ preventScroll: true });
}
closeDialogButton.addEventListener("click", closeGallery);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeGallery();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      closeGallery();
  }
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});
document
  .querySelector("#dialog-prev")
  .addEventListener("click", () => moveWork(-1));
document
  .querySelector("#dialog-next")
  .addEventListener("click", () => moveWork(1));
dialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    moveWork(event.key === "ArrowRight" ? 1 : -1);
  }
});
let touchStart = null;
dialogImage.addEventListener(
  "touchstart",
  (event) => {
    touchStart = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  },
  { passive: true },
);
dialogImage.addEventListener(
  "touchend",
  (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5)
      moveWork(dx < 0 ? 1 : -1);
    touchStart = null;
  },
  { passive: true },
);

// El menú es una divulgación, no un modal: Tab conserva el orden natural.
const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const mobileViewport = window.matchMedia("(max-width: 700px)");
function setMenu(open, restoreFocus = false) {
  mobileNav.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menuButton
    .querySelector("use")
    .setAttribute("href", open ? "#i-close" : "#i-menu");
  if (restoreFocus) menuButton.focus({ preventScroll: true });
}
menuButton.addEventListener("click", () => setMenu(mobileNav.hidden));
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileNav.hidden) setMenu(false, true);
});
document.addEventListener("click", (event) => {
  if (!mobileNav.hidden && !event.target.closest(".header")) setMenu(false);
});
mobileViewport.addEventListener("change", () => setMenu(false));

// La solicitud se prepara localmente. Solo la persona decide abrir y enviar en WhatsApp.
const form = document.querySelector("#formWhatsapp");
const dateInput = document.querySelector("#waFecha");
const timeInput = document.querySelector("#waHora");
const status = document.querySelector("#form-status");
const ready = document.querySelector("#booking-ready");
const fields = {
  nombre: ["waNombre", "errNombre"],
  servicio: ["waServicio", "errServicio"],
  fecha: ["waFecha", "errFecha"],
  hora: ["waHora", "errHora"],
  mensaje: ["waMensaje", "errMensaje"],
  consent: ["waConsent", "errConsent"],
};
function updateDateLimits() {
  dateInput.min = mexicoDateTime().date;
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)
    ? new Date(`${dateInput.value}T00:00:00Z`)
    : null;
  timeInput.min = selected && selected.getUTCDay() === 0 ? "12:00" : "09:00";
  timeInput.max = "19:59";
}
function clearBookingPreview() {
  ready.hidden = true;
  status.textContent = "";
}
updateDateLimits();
dateInput.addEventListener("change", updateDateLimits);
form.addEventListener("input", clearBookingPreview);
form.addEventListener("change", clearBookingPreview);
document.querySelectorAll(".service-action[data-service]").forEach((link) =>
  link.addEventListener("click", () => {
    document.querySelector("#waServicio").value = link.dataset.service;
    clearBookingPreview();
  }),
);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (document.querySelector("#website").value.trim()) return;
  updateDateLimits();
  const data = {
    nombre: document.querySelector("#waNombre").value.trim(),
    servicio: document.querySelector("#waServicio").value,
    fecha: dateInput.value,
    hora: timeInput.value,
    mensaje: document.querySelector("#waMensaje").value.trim(),
    consent: document.querySelector("#waConsent").checked,
  };
  const errors = validateBooking(data);
  for (const [key, [inputId, errorId]] of Object.entries(fields)) {
    document.getElementById(errorId).textContent = errors[key] || "";
    document
      .getElementById(inputId)
      .setAttribute("aria-invalid", String(Boolean(errors[key])));
  }
  ready.hidden = true;
  if (Object.keys(errors).length) {
    status.textContent =
      "Revisa los campos indicados para preparar tu solicitud.";
    const firstError = Object.keys(fields).find((key) => errors[key]);
    document.getElementById(fields[firstError][0]).focus();
    return;
  }
  const url = buildWhatsAppUrl(data);
  document.querySelector("#whatsapp-continue").href = url;
  document.querySelector("#message-preview").textContent = new URL(
    url,
  ).searchParams.get("text");
  status.textContent =
    "Solicitud preparada. Revisa el mensaje y abre WhatsApp cuando quieras enviarlo.";
  ready.hidden = false;
  document.querySelector("#whatsapp-continue").focus({ preventScroll: true });
  ready.scrollIntoView({
    block: "nearest",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
});
// Activate only after validation and the preventDefault handler are ready.
// Without JavaScript, the direct WhatsApp link is the only submission path.
const bookingSubmit = document.querySelector("#btnWhatsapp");
bookingSubmit.disabled = false;
bookingSubmit.hidden = false;
