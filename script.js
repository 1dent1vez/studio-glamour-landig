/* =========================================================
   Studio Glamour – JS principal
   Navegación, smooth scroll, animaciones, galería y utilidades
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------
     Utilidades pequeñas
  ----------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const body = document.body;
  const header = $(".header");
  const hamburger = $(".hamburger");
  const navMenu = $(".nav-menu");
  const navLinks = $$(".nav-link");
  const heroButtons = $$(".hero-buttons a");

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -----------------------------
     Bloqueo de scroll del body
  ----------------------------- */
  const lockScroll = () => {
    body.dataset.scrollLock = "1";
    body.style.top = `-${window.scrollY}px`;
    body.classList.add("is-locked");
  };
  const unlockScroll = () => {
    const y = body.style.top;
    body.classList.remove("is-locked");
    body.style.top = "";
    if (y) window.scrollTo(0, parseInt(y || "0") * -1);
    delete body.dataset.scrollLock;
  };

  /* =========================================================
     NAVEGACIÓN MÓVIL (con ARIA + focus trap)
     ========================================================= */
  let menuOpen = false;
  let lastFocused = null;

  const setMenuAria = (open) => {
    hamburger?.setAttribute("aria-expanded", open ? "true" : "false");
    navMenu?.setAttribute("aria-hidden", open ? "false" : "true");
  };

  const openMenu = () => {
    if (!hamburger || !navMenu || menuOpen) return;
    lastFocused = document.activeElement;
    hamburger.classList.add("active");
    navMenu.classList.add("active");
    setMenuAria(true);
    lockScroll();
    menuOpen = true;
    // Enfocar primer link
    const firstLink = navMenu.querySelector("a, button");
    firstLink?.focus();
  };

  const closeMenu = () => {
    if (!hamburger || !navMenu || !menuOpen) return;
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
    setMenuAria(false);
    unlockScroll();
    menuOpen = false;
    lastFocused?.focus();
  };

  const toggleMenu = () => (menuOpen ? closeMenu() : openMenu());

  hamburger?.setAttribute("aria-controls", "primary-navigation");
  if (navMenu) navMenu.id = navMenu.id || "primary-navigation";
  setMenuAria(false);

  hamburger?.addEventListener("click", toggleMenu);
  navLinks.forEach((l) => l.addEventListener("click", closeMenu));

  // Click fuera + Escape
  document.addEventListener("click", (e) => {
    if (!menuOpen || !navMenu || !hamburger) return;
    const clickInside =
      navMenu.contains(e.target) || hamburger.contains(e.target);
    if (!clickInside) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) closeMenu();
    // Focus trap básico
    if (menuOpen && e.key === "Tab") {
      const focusables = $$(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
        navMenu
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && menuOpen) closeMenu();
  });

  /* =========================================================
     SMOOTH SCROLL con offset del header
     ========================================================= */
  const getHeaderOffset = () => Math.max(0, header?.offsetHeight || 0) + 8;

  const smoothScrollTo = (hash) => {
    const target = document.querySelector(hash);
    if (!target) return;
    const top = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - getHeaderOffset()
    );
    if (prefersReduced) window.scrollTo(0, top);
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const bindSmooth = (el) => {
    el.addEventListener("click", (e) => {
      const href = el.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        e.preventDefault();
        closeMenu();
        smoothScrollTo(href);
        history.pushState(null, "", href);
      }
    });
  };

  navLinks.forEach(bindSmooth);
  heroButtons.forEach(bindSmooth);
  // Delegación para cualquier enlace hash del site:
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("nav-link") || a.closest(".hero-buttons"))
      return;
    const href = a.getAttribute("href") || "";
    if (href.length > 1) {
      e.preventDefault();
      smoothScrollTo(href);
    }
  });

  /* =========================================================
     HEADER: blur/sombra y ocultar en scroll móvil
     ========================================================= */
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY || 0;
    if (header) {
      if (y > 8) {
        header.style.backgroundColor = "rgba(255,255,255,0.95)";
        header.style.backdropFilter = "blur(12px)";
        header.style.boxShadow = "0 6px 24px rgba(0,0,0,.06)";
      } else {
        header.style.backgroundColor = "";
        header.style.backdropFilter = "";
        header.style.boxShadow = "";
      }
      if (window.innerWidth <= 768) {
        header.style.transform =
          y > lastY && y > 120 ? "translateY(-100%)" : "translateY(0)";
      } else {
        header.style.transform = "translateY(0)";
      }
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* =========================================================
     ANIMACIONES EN APARICIÓN (IntersectionObserver)
     ========================================================= */
  const revealSelectors = [
    ".service-card",
    ".gallery-item",
    ".contact-content",
    ".developer-showcase",
    ".dev-section .dev-card",
    ".dev-section .dev-side",
    ".dev-section .stat",
  ];

  const revealAll = () => {
    $$(revealSelectors.join(",")).forEach((el) =>
      el.classList.add("fade-in-visible")
    );
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    $$(revealSelectors.join(",")).forEach((el) => {
      el.classList.add("fade-in-hidden");
      io.observe(el);
    });
  } else {
    revealAll();
  }

  /* =========================================================
     FORMULARIO DE CONTACTO (validación y feedback)
     ========================================================= */
  const contactForm = $(".contact-form form");
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function notify(message, type = "info") {
    // Quitar previas
    $$(".notification").forEach((n) => n.remove());

    const colors = { success: "#4CAF50", error: "#f44336", info: "#2196F3" };
    const n = document.createElement("div");
    n.className = "notification";
    n.setAttribute("role", "status");
    n.setAttribute("aria-live", "polite");
    n.innerHTML = `
      <span>${message}</span>
      <button type="button" aria-label="Cerrar notificación">&times;</button>
    `;
    Object.assign(n.style, {
      position: "fixed",
      top: window.innerWidth <= 768 ? "80px" : "100px",
      right: window.innerWidth <= 768 ? "10px" : "20px",
      left: window.innerWidth <= 768 ? "10px" : "auto",
      background: colors[type] || colors.info,
      color: "#fff",
      padding: window.innerWidth <= 768 ? "12px 15px" : "14px 18px",
      borderRadius: "10px",
      boxShadow: "0 4px 20px rgba(0,0,0,.15)",
      zIndex: "10000",
      transform: "translateY(-16px)",
      opacity: "0",
      transition: "all .28s var(--ease)",
      maxWidth: window.innerWidth <= 768 ? "none" : "360px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    });
    document.body.appendChild(n);

    setTimeout(() => {
      n.style.transform = "translateY(0)";
      n.style.opacity = "1";
    }, 60);
    n.querySelector("button")?.addEventListener("click", () => n.remove());
    setTimeout(() => {
      if (document.body.contains(n)) {
        n.style.opacity = "0";
        setTimeout(() => n.remove(), 280);
      }
    }, 5000);
  }

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name =
      contactForm.querySelector('input[type="text"]')?.value.trim() || "";
    const email =
      contactForm.querySelector('input[type="email"]')?.value.trim() || "";
    const message = contactForm.querySelector("textarea")?.value.trim() || "";

    if (!name || !email || !message)
      return notify(
        "Por favor, completa todos los campos obligatorios.",
        "error"
      );
    if (!isValidEmail(email))
      return notify("Por favor, ingresa un email válido.", "error");

    const btn = contactForm.querySelector(".btn-primary");
    const original = btn?.textContent;
    if (btn) {
      btn.textContent = "Enviando…";
      btn.disabled = true;
    }

    // Simulación de envío
    setTimeout(() => {
      if (btn) {
        btn.textContent = original || "Enviar Mensaje";
        btn.disabled = false;
      }
      notify("¡Mensaje enviado con éxito! Te contactaremos pronto.", "success");
      contactForm.reset();
    }, 1200);
  });

  /* =========================================================
     GALERÍA INTERACTIVA (modal con imagen real, teclado y swipe)
     ========================================================= */
  const galleryItems = $$(".gallery-item");
  const galleryImgs = $$(".gallery-item .gallery-img");
  if (galleryItems.length) {
    galleryItems.forEach((item, index) => {
      item.style.cursor = "pointer";
      item.addEventListener("click", () => openGalleryModal(index));
    });
  }

  function openGalleryModal(startIndex = 0) {
    if (!galleryImgs.length) return;

    let current = Math.max(0, Math.min(startIndex, galleryImgs.length - 1));

    const modal = document.createElement("div");
    modal.className = "gallery-modal";
    Object.assign(modal.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,.92)",
      display: "grid",
      placeItems: "center",
      zIndex: "10000",
      opacity: "0",
    });

    // Estructura del modal
    modal.innerHTML = `
      <div class="gm-wrap" style="position:relative;max-width:min(92vw,1100px);max-height:88vh;display:flex;flex-direction:column;gap:12px;align-items:center">
        <button class="gm-close" aria-label="Cerrar" style="position:absolute;top:-44px;right:0;background:none;border:0;color:#fff;font-size:28px;cursor:pointer">&times;</button>
        <div class="gm-stage" style="position:relative;width:min(92vw,1100px);height:min(72vh,800px);display:grid;place-items:center;overflow:hidden;border-radius:12px;background:#0f0f10;border:1px solid #222">
          <img class="gm-img" alt="Vista ampliada" style="max-width:100%;max-height:100%;object-fit:contain;transition:opacity .2s var(--ease);opacity:0"/>
          <button class="gm-prev" aria-label="Anterior" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);border:0;color:#fff;padding:10px 12px;border-radius:10px;cursor:pointer">‹</button>
          <button class="gm-next" aria-label="Siguiente" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.1);border:0;color:#fff;padding:10px 12px;border-radius:10px;cursor:pointer">›</button>
        </div>
        <div class="gm-caption" style="color:#fff;opacity:.8;font-size:.95rem"></div>
      </div>
    `;

    const img = $(".gm-img", modal);
    const caption = $(".gm-caption", modal);

    const update = () => {
      const src = galleryImgs[current].getAttribute("src");
      const alt =
        galleryImgs[current].getAttribute("alt") || `Diseño ${current + 1}`;
      img.style.opacity = "0";
      // Pequeño delay para imagen nueva
      setTimeout(() => {
        img.src = src;
        img.alt = `Vista ampliada: ${alt}`;
        caption.textContent = alt;
        img.onload = () => (img.style.opacity = "1");
      }, 60);
    };

    const prev = () => {
      current = (current - 1 + galleryImgs.length) % galleryImgs.length;
      update();
    };
    const next = () => {
      current = (current + 1) % galleryImgs.length;
      update();
    };

    // Listeners
    modal.querySelector(".gm-close")?.addEventListener("click", close);
    modal.querySelector(".gm-prev")?.addEventListener("click", prev);
    modal.querySelector(".gm-next")?.addEventListener("click", next);

    // Cerrar con click en fondo
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    // Teclado
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);

    // Swipe táctil
    let startX = 0,
      startY = 0;
    $(".gm-stage", modal)?.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      },
      { passive: true }
    );
    $(".gm-stage", modal)?.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dy) < 80) {
          dx > 0 ? prev() : next();
        }
      },
      { passive: true }
    );

    function close() {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 180);
      document.removeEventListener("keydown", onKey);
      if (body.dataset.scrollLock !== "1") unlockScroll(); // por si estaba bloqueado
    }

    lockScroll();
    document.body.appendChild(modal);
    setTimeout(() => (modal.style.opacity = "1"), 16);
    update();
  }

  /* =========================================================
     OPTIMIZACIONES MÓVILES / MEDIO AMBIENTE
     ========================================================= */
  // Flag táctil
  if ("ontouchstart" in window) body.classList.add("touch-device");

  // Unidades vh fiables en móviles
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  setVH();
  window.addEventListener("resize", setVH, { passive: true });
  window.addEventListener("orientationchange", setVH);

  // Evitar zoom accidental por doble tap en iOS (solo si no es input)
  let lastTouch = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (
        now - lastTouch <= 300 &&
        !e.target.closest("input, textarea, select")
      ) {
        e.preventDefault();
      }
      lastTouch = now;
    },
    { passive: false }
  );

  /* =========================================================
     Mensaje de bienvenida (puedes remover si no lo quieres)
     ========================================================= */
  setTimeout(() => {
    // Reutiliza el toast accesible
    const greetShown = sessionStorage.getItem("greeted");
    if (!greetShown) {
      notify("¡Bienvenido a Studio Glamour! 💅✨", "success");
      sessionStorage.setItem("greeted", "1");
    }
  }, 900);

  // Log
  console.log("✅ Studio Glamour inicializado");
});
// === BRILINT: armado de mailto con ofuscación básica ===
(function () {
  const btn = document.getElementById("mailBtn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    const user = this.dataset.mailUser;
    const domain = this.dataset.mailDomain;
    if (!user || !domain) return;
    const to = `${user}@${domain}`;
    const subject = encodeURIComponent("Contacto desde la web");
    const body = encodeURIComponent(
      "Hola BRILINT, me gustaría información sobre..."
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
})();
//whats
(() => {
  const PHONE = "525534762060";
  const form = document.getElementById("formWhatsapp");
  const btn = document.getElementById("btnWhatsapp");

  if (!form || !btn) return;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const fechaInput = document.getElementById("waFecha");
  if (fechaInput) fechaInput.setAttribute("min", `${yyyy}-${mm}-${dd}`);

  function setError(id, msg = "") {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function encode(text) {
    return encodeURIComponent(text).replace(/%20/g, "+");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Honeypot (antispam)
    const hp = document.getElementById("website");
    if (hp && hp.value.trim() !== "") return;

    const nombre = document.getElementById("waNombre")?.value.trim() || "";
    const servicioSelect = document.getElementById("waServicio");
    const servicio = servicioSelect?.value || "";
    const selOpt = servicioSelect?.selectedOptions?.[0] || null;
    const fecha = document.getElementById("waFecha")?.value || "";
    const hora = document.getElementById("waHora")?.value || "";
    const notas = document.getElementById("waMensaje")?.value.trim() || "";
    const consent = document.getElementById("waConsent")?.checked || false;

    // Reset errores
    setError("errNombre");
    setError("errServicio");
    setError("errFecha");
    setError("errHora");

    let ok = true;
    if (!nombre) {
      setError("errNombre", "Este campo es obligatorio.");
      ok = false;
    }
    if (!servicio || !selOpt) {
      setError("errServicio", "Selecciona un servicio.");
      ok = false;
    }
    if (!fecha) {
      setError("errFecha", "Indica la fecha.");
      ok = false;
    }
    if (!hora) {
      setError("errHora", "Indica la hora.");
      ok = false;
    }
    if (!consent) {
      alert("Debes aceptar el consentimiento para continuar.");
      ok = false;
    }

    if (!ok) return;

    // Metadatos de servicio (solo duración)
    const dur = selOpt?.dataset?.duracion
      ? ` (${selOpt.dataset.duracion} min)`
      : "";

    // Mensaje preformateado (sin precio)
    const mensaje = `Hola, soy ${nombre}.
Quiero reservar: ${servicio}${dur}
Fecha: ${fecha}
Hora: ${hora}
${notas ? "Notas: " + notas : ""}

¿Tienen este horario disponible?`;

    const url = `https://wa.me/${PHONE}?text=${encode(mensaje)}`;

    // Estado de carga
    btn.classList.add("loading");
    btn.disabled = true;

    // Intento de abrir WhatsApp
    const newWin = window.open(url, "_blank", "noopener,noreferrer");

    // Fallback si el popup fue bloqueado
    setTimeout(() => {
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        window.location.href = url;
      }
      btn.classList.remove("loading");
      btn.disabled = false;
    }, 500);
  });
})();
// ===== WhatsApp robusto (móvil + desktop, con fallbacks) =====
document.addEventListener("DOMContentLoaded", () => {
  const PHONE = "525534762060"; // <-- cámbialo a tu número (formato internacional)
  const DEFAULT_TEXT =
    "Hola , vengo del sitio web de Glam Studio y quiero agendar una cita ";

  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = () => /android/i.test(navigator.userAgent);

  const buildMessage = (txt = DEFAULT_TEXT) => encodeURIComponent(txt);

  const openWhatsApp = (text) => {
    const encoded = buildMessage(text);

    // 1) Intento preferido: URL corta oficial (funciona en la mayoría)
    let url = `https://wa.me/${PHONE}?text=${encoded}`;

    // 2) Ajustes por plataforma
    if (isAndroid()) {
      // Android suele abrir bien wa.me, pero si el usuario no tiene app, abre web
      url = `https://wa.me/${PHONE}?text=${encoded}`;
    } else if (isIOS()) {
      // iOS también prefiere wa.me; el esquema whatsapp:// solo si tienen app
      // url = `whatsapp://send?phone=${PHONE}&text=${encoded}`;
      url = `https://wa.me/${PHONE}?text=${encoded}`;
    }

    // 3) Evita bloqueadores de emergentes en móvil: usar same-tab
    try {
      window.location.href = url; // abre en la misma pestaña (mejor en móvil)
    } catch (e) {
      // 4) Fallback web universal
      window.location.href = `https://api.whatsapp.com/send?phone=${PHONE}&text=${encoded}`;
    }
  };

  const btn = document.getElementById("btnWhatsappHero");
  if (btn) {
    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        openWhatsApp();
      },
      { passive: true }
    );
  }
});
