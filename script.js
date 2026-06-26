(() => {
  // --- CMS backend : contenu lu depuis data/*.json (versionnés sur GitHub, édités via /admin) ---
  function fetchJSON(path) {
    return fetch(path, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function attr(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  const root = document.documentElement;
  const stored = localStorage.getItem("hadrius-theme");
  if (stored) root.setAttribute("data-theme", stored);

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") || "dark";
    const next = cur === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("hadrius-theme", next);
  });

  const cta = document.getElementById("ctaContact");
  const phone = "04 90 41 75 12";
  const phoneHref = "tel:+33490417512";
  let revealed = false;

  function sparkBurst(x, y, n = 22) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "spark";
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * 40;
      s.style.left = x - 4 + "px";
      s.style.top = y - 4 + "px";
      s.style.setProperty("--dx", Math.cos(a) * r + "px");
      s.style.setProperty("--dy", Math.sin(a) * r + "px");
      s.style.opacity = (0.65 + Math.random() * 0.35).toFixed(2);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  }

  // Phone modal
  const modal = document.createElement("div");
  modal.id = "phoneModal";
  modal.innerHTML = `
    <div class="phone-modal__backdrop"></div>
    <div class="phone-modal__box card">
      <div class="phone-modal__number">${phone}</div>
      <div class="phone-modal__actions">
        <a class="cta phone-modal__btn" href="${phoneHref}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.7 0 1.3.6 1.3 1.3V21c0 .7-.6 1.3-1.3 1.3C10.1 22.3 1.7 13.9 1.7 3.3 1.7 2.6 2.3 2 3 2h3.6c.7 0 1.3.6 1.3 1.3 0 1.4.3 2.8.8 4.1.1.4 0 .9-.2 1.2l-2.9 2.2Z"/></svg>
          Appeler
        </a>
        <button type="button" class="pill phone-modal__btn" id="phoneCopy">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          Copier
        </button>
      </div>
      <button type="button" class="phone-modal__close" aria-label="Fermer">✕</button>
    </div>
  `;
  document.body.appendChild(modal);

  function openPhoneModal() {
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closePhoneModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  cta?.addEventListener("click", () => {
    const rect = cta.getBoundingClientRect();
    sparkBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 24);
    openPhoneModal();
  });

  // All elements with .open-phone-modal class open the phone modal
  document.querySelectorAll(".open-phone-modal").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openPhoneModal();
    });
  });

  modal.querySelector(".phone-modal__backdrop").addEventListener("click", closePhoneModal);
  modal.querySelector(".phone-modal__close").addEventListener("click", closePhoneModal);
  document.getElementById("phoneCopy").addEventListener("click", () => {
    navigator.clipboard.writeText("04 90 41 75 12").then(() => {
      const btn = document.getElementById("phoneCopy");
      btn.querySelector("svg + text, span")?.remove();
      const span = btn.lastChild;
      if (span) span.textContent = "Copié !";
      setTimeout(() => { if (span) span.textContent = "Copier"; }, 1500);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePhoneModal();
  });

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  let w, h, dpr;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  };
  window.addEventListener("resize", resize);
  resize();

  const pts = Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: (0.6 + Math.random() * 1.8) * dpr,
    vx: (-0.22 + Math.random() * 0.44) * dpr,
    vy: (0.1 + Math.random() * 0.34) * dpr,
    a: 0.16 + Math.random() * 0.3,
  }));

  const step = () => {
    ctx.clearRect(0, 0, w, h);
    const theme = root.getAttribute("data-theme") || "dark";

    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
      if (p.y > h + 40) p.y = -40;

      p.vx += (-0.002 + Math.random() * 0.004) * dpr;
      p.vx = Math.max(Math.min(p.vx, 0.3 * dpr), -0.3 * dpr);

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      if (theme === "light") {
        g.addColorStop(0, `rgba(145,110,30,${p.a})`);
        g.addColorStop(0.35, `rgba(202,162,74,${p.a * 0.55})`);
        g.addColorStop(1, "rgba(202,162,74,0)");
      } else {
        g.addColorStop(0, `rgba(247,210,122,${p.a})`);
        g.addColorStop(0.35, `rgba(202,162,74,${p.a * 0.55})`);
        g.addColorStop(1, "rgba(202,162,74,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  };



  // --- Birds (slow drift) ---
  const birdsLayer = document.querySelector(".birds-layer");
  if (birdsLayer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const BIRDS_COUNT = 10;
    for (let i = 0; i < BIRDS_COUNT; i++) {
      const bird = document.createElement("img");
      bird.src = "assets/oiseau.png";
      bird.alt = "";
      bird.className = "bird";

      const y = Math.random() * 62 + 8; // vh
      const size = Math.random() * 44 + 28; // px
      const duration = Math.random() * 34 + 46; // s
      const delay = Math.random() * 18; // s

      bird.style.setProperty("--y", y + "vh");
      bird.style.setProperty("--size", size + "px");
      bird.style.setProperty("--duration", duration + "s");
      bird.style.animationDelay = (-delay) + "s"; // start mid-flight

      // subtle variation
      bird.style.opacity = (Math.random() * 0.12 + 0.18).toFixed(2);

      birdsLayer.appendChild(bird);
    }
  }

  requestAnimationFrame(step);

  // --- Injection du contenu depuis data/*.json ---
  function applyTextes(textes) {
    if (!textes) return;
    document.querySelectorAll("[data-text]").forEach((el) => {
      const key = el.getAttribute("data-text");
      if (textes[key] != null && textes[key] !== "") el.textContent = textes[key];
    });
    if (Array.isArray(textes.chips)) {
      const box = document.querySelector("[data-chips]");
      if (box && textes.chips.length) {
        box.innerHTML = textes.chips
          .map((c) => `<div class="chip">${esc(c)}</div>`)
          .join("");
      }
    }
  }

  function applyGalerie(galerie) {
    if (!galerie) return;
    if (galerie.logo) {
      document.querySelectorAll(".brand img").forEach((img) => { img.src = galerie.logo; });
    }
    if (galerie.hero) {
      const heroImg = document.querySelector(".hero-banner__img img");
      if (heroImg) heroImg.src = galerie.hero;
    }
    const track = document.querySelector(".gallery-carousel-track");
    if (track && Array.isArray(galerie.photos)) {
      const vis = galerie.photos.filter((p) => p.image && p.visible !== false);
      if (vis.length) {
        track.innerHTML = vis
          .map(
            (p, i) => `
          <div class="gallery-carousel-slide" data-category="${attr(p.categorie || "plats")}" data-index="${i}">
            <img src="${attr(p.image)}" alt="${attr(p.legende || "")}" decoding="async">
            <div class="gallery-slide-overlay">
              <span class="gallery-slide-caption">${esc(p.legende || "")}</span>
              <svg class="gallery-slide-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>`
          )
          .join("");
      }
    }
  }

  function applyCarte(carte) {
    if (!carte) return;
    const link = document.getElementById("cartePdfLink");
    if (link) {
      if (carte.pdf) { link.href = carte.pdf; link.style.display = ""; }
      else { link.style.display = "none"; }
    }
    const box = document.getElementById("carteMenu");
    if (box && Array.isArray(carte.sections) && carte.sections.length) {
      const html = carte.sections
        .map((sec) => {
          const items = (sec.items || [])
            .map(
              (it) => `
            <div class="carte-category">
              <span class="carte-cat-label">
                <span class="carte-cat-nom">${esc(it.nom)}</span>
                ${it.desc ? `<span class="carte-cat-desc">${esc(it.desc)}</span>` : ""}
              </span>
              ${it.prix ? `<span class="carte-cat-price">${esc(it.prix)}</span>` : ""}
            </div>`
            )
            .join("");
          return `<h3 class="carte-section-title">${esc(sec.titre)}</h3>${items}`;
        })
        .join("");
      box.innerHTML = '<div class="carte-menu-grid">' + html + "</div>";
    }
  }

  function applyHoraires(periodes) {
    const hList = document.getElementById("horairesList");
    if (!hList) return;
    if (!Array.isArray(periodes) || !periodes.length) {
      hList.innerHTML = '<div class="horaires-error">Horaires à venir.</div>';
      return;
    }
    hList.innerHTML = periodes
      .map((p) => {
        const rows = (p.lignes || [])
          .map((l) => {
            const slots = [];
            if (l.midi) slots.push(`<span class="horaires-slot"><strong>Midi</strong> ${esc(l.midi)}</span>`);
            if (l.soir) slots.push(`<span class="horaires-slot"><strong>Soir</strong> ${esc(l.soir)}</span>`);
            return `<div class="horaires-row"><span class="horaires-jours">${esc(l.jours || "")}</span><span class="horaires-temps">${slots.join("") || "<em>Fermé</em>"}</span></div>`;
          })
          .join("");
        return `${p.label ? `<div class="horaires-periode">${esc(p.label)}</div>` : ""}${rows}`;
      })
      .join("");
  }

  function applyInfos(infos) {
    if (!infos) return;
    if (infos.telephone) {
      document.querySelectorAll('[data-info="phone"]').forEach((e) => { e.textContent = infos.telephone; });
      const modalNum = document.querySelector(".phone-modal__number");
      if (modalNum) modalNum.textContent = infos.telephone;
    }
    if (infos.telephone_raw) {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => { a.href = "tel:" + infos.telephone_raw; });
    }
    if (infos.email) {
      document.querySelectorAll('[data-info="email"]').forEach((e) => { e.textContent = infos.email; });
      document.querySelectorAll('a[href^="mailto:"],[data-info-mail]').forEach((a) => {
        if (a.tagName === "A") a.href = "mailto:" + infos.email;
        a.textContent = infos.email;
      });
    }
    const addr = [infos.adresse, ((infos.code_postal || "") + " " + (infos.ville || "")).trim()]
      .filter(Boolean)
      .join(", ");
    if (addr) document.querySelectorAll('[data-info="address"]').forEach((e) => { e.textContent = addr; });
    if (infos.facebook) document.querySelectorAll('a[href*="facebook.com"]').forEach((a) => { a.href = infos.facebook; });
    if (infos.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach((a) => { a.href = infos.instagram; });
    if (infos.maps_query) {
      const map = document.getElementById("mapIframe");
      if (map) map.src = "https://www.google.com/maps?q=" + encodeURIComponent(infos.maps_query) + "&output=embed";
    }
  }

  function initPopup(popup) {
    if (!popup || !popup.actif || !popup.message) return;
    const wrap = document.createElement("div");
    wrap.id = "promoPopup";
    wrap.style.cssText =
      "position:fixed;left:16px;right:16px;bottom:16px;max-width:420px;margin:0 auto;z-index:9998;" +
      "background:var(--card,#15141a);color:var(--text,#fff);border:1px solid rgba(247,210,122,.35);" +
      "border-radius:16px;padding:18px 20px;box-shadow:0 18px 60px rgba(0,0,0,.5);display:none;";
    const cta = popup.cta_url && popup.cta_label
      ? `<a class="cta" href="${attr(popup.cta_url)}" style="margin-top:10px;display:inline-flex">${esc(popup.cta_label)}</a>`
      : "";
    wrap.innerHTML =
      `<button aria-label="Fermer" style="position:absolute;top:8px;right:12px;background:none;border:none;color:inherit;font-size:20px;cursor:pointer">×</button>` +
      `<div style="font-size:14px;line-height:1.5">${esc(popup.message)}</div>${cta}`;
    document.body.appendChild(wrap);
    wrap.querySelector("button").addEventListener("click", () => wrap.remove());
    setTimeout(() => { wrap.style.display = "block"; }, (parseInt(popup.delai_secondes) || 0) * 1000);
  }

  function applyContent() {
    return Promise.all([
      fetchJSON("data/contenu.json"),
      fetchJSON("data/galerie.json"),
      fetchJSON("data/carte.json"),
      fetchJSON("data/infos.json"),
    ]).then(([contenu, galerie, carte, infos]) => {
      if (contenu) applyTextes(contenu.textes);
      applyGalerie(galerie);
      applyCarte(carte);
      if (infos) {
        applyHoraires(infos.horaires && infos.horaires.periodes);
        applyInfos(infos);
        initPopup(infos.popup);
      }
      // met à jour les compteurs de la galerie après injection
      const total = document.querySelectorAll(".gallery-carousel-slide").length;
      const t1 = document.querySelector(".gal-car-total");
      const t2 = document.querySelector(".lightbox-total");
      if (t1) t1.textContent = total;
      if (t2) t2.textContent = total;
    });
  }

  // --- Gallery Carousel + Lightbox ---
  function initGalleryAndLightbox() {
    const galCarousel = document.getElementById('galleryCarousel');
    if (!galCarousel) return;

    const track = galCarousel.querySelector('.gallery-carousel-track');
    const slides = Array.from(galCarousel.querySelectorAll('.gallery-carousel-slide'));
    const prevBtn = galCarousel.querySelector('.gal-car-prev');
    const nextBtn = galCarousel.querySelector('.gal-car-next');
    const counterCurrent = galCarousel.querySelector('.gal-car-current');
    const counterTotal = galCarousel.querySelector('.gal-car-total');
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));

    let visibleSlides = slides.filter(s => s.dataset.category === 'plats');
    let page = 0;
    let perPage = 3;
    let galStartX = 0, galDx = 0, galIsDown = false, wasDragged = false;

    const getPerPage = () => {
      if (window.innerWidth <= 560) return 1;
      if (window.innerWidth <= 920) return 2;
      return 3;
    };

    const getGap = () => window.innerWidth <= 560 ? 0 : 14;

    const totalPages = () => Math.max(1, visibleSlides.length - perPage + 1);

    const getSlideStep = () => {
      const vw = track.parentElement.offsetWidth;
      const gap = getGap();
      return (vw + gap) / perPage;
    };

    const updateCounter = () => {
      if (counterCurrent) counterCurrent.textContent = page + 1;
      if (counterTotal) counterTotal.textContent = totalPages();
    };

    const updateButtons = () => {
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= totalPages() - 1;
    };

    const goTo = (p, animate = true) => {
      page = Math.max(0, Math.min(p, totalPages() - 1));
      const step = getSlideStep();
      track.style.transition = animate ? 'transform .5s cubic-bezier(.2,.75,.2,1)' : 'none';
      track.style.transform = `translate3d(${-page * step}px,0,0)`;
      updateCounter();
      updateButtons();
    };

    const refreshLayout = () => {
      perPage = getPerPage();
      slides.forEach(s => {
        s.style.display = visibleSlides.includes(s) ? '' : 'none';
      });
      if (page >= totalPages()) page = Math.max(0, totalPages() - 1);
      goTo(page, false);
    };

    prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); goTo(page - 1); });
    nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); goTo(page + 1); });

    // Pointer drag (with click detection)
    galCarousel.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.gal-car-btn')) return;
      galIsDown = true;
      wasDragged = false;
      galStartX = e.clientX;
      galDx = 0;
      track.style.transition = 'none';
    });

    galCarousel.addEventListener('pointermove', (e) => {
      if (!galIsDown) return;
      galDx = e.clientX - galStartX;
      if (Math.abs(galDx) > 5) wasDragged = true;
      const step = getSlideStep();
      track.style.transform = `translate3d(${-page * step + galDx}px,0,0)`;
    });

    const galPointerUp = (e) => {
      if (!galIsDown) return;
      galIsDown = false;
      if (Math.abs(galDx) > 48) {
        if (galDx > 0) goTo(page - 1);
        else goTo(page + 1);
      } else {
        goTo(page);
      }
    };
    galCarousel.addEventListener('pointerup', galPointerUp);
    galCarousel.addEventListener('pointercancel', galPointerUp);

    window.addEventListener('resize', () => refreshLayout());
    refreshLayout();

    // --- Gallery Filters ---
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        visibleSlides = slides.filter(s => s.dataset.category === filter);

        page = 0;
        refreshLayout();
      });
    });

    // --- Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const lightboxImageWrap = lightbox?.querySelector('.lightbox-image-wrap');
    const lightboxClose = lightbox?.querySelector('.lightbox-close');
    const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
    const lightboxNext = lightbox?.querySelector('.lightbox-next');
    const lightboxZoom = lightbox?.querySelector('.lightbox-zoom');
    const lightboxPlay = lightbox?.querySelector('.lightbox-play');
    const lightboxCurrent = lightbox?.querySelector('.lightbox-current');
    const lightboxTotal = lightbox?.querySelector('.lightbox-total');
    const lightboxBackdrop = lightbox?.querySelector('.lightbox-backdrop');

    let lbIndex = 0;
    let isZoomed = false;
    let isPlaying = false;
    let playInterval = null;

    const openLightbox = (idx) => {
      lbIndex = idx;
      updateLightboxImage();
      lightbox?.classList.add('is-open');
      lightbox?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox?.classList.remove('is-open');
      lightbox?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      stopAutoplay();
      if (isZoomed) toggleZoom();
    };

    const updateLightboxImage = () => {
      const slide = visibleSlides[lbIndex];
      if (!slide) return;
      const img = slide.querySelector('img');
      if (lightboxImage && img) {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
      }
      if (lightboxCurrent) lightboxCurrent.textContent = lbIndex + 1;
      if (lightboxTotal) lightboxTotal.textContent = visibleSlides.length;
    };

    const lbNavigate = (dir) => {
      if (isZoomed) toggleZoom();
      lbIndex = (lbIndex + dir + visibleSlides.length) % visibleSlides.length;
      updateLightboxImage();
    };

    const toggleZoom = () => {
      isZoomed = !isZoomed;
      lightboxImageWrap?.classList.toggle('is-zoomed', isZoomed);
    };

    const startAutoplay = () => {
      if (isPlaying) return;
      isPlaying = true;
      lightboxPlay?.classList.add('is-playing');
      playInterval = setInterval(() => lbNavigate(1), 3500);
    };
    const stopAutoplay = () => {
      if (!isPlaying) return;
      isPlaying = false;
      lightboxPlay?.classList.remove('is-playing');
      if (playInterval) clearInterval(playInterval);
      playInterval = null;
    };
    const toggleAutoplay = () => {
      if (isPlaying) stopAutoplay(); else startAutoplay();
    };

    // Click on slides -> open lightbox (only if not dragging)
    slides.forEach(slide => {
      slide.addEventListener('click', (e) => {
        if (wasDragged) return;
        const idx = visibleSlides.indexOf(slide);
        if (idx >= 0) openLightbox(idx);
      });
    });

    // Lightbox controls
    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxBackdrop?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => lbNavigate(-1));
    lightboxNext?.addEventListener('click', () => lbNavigate(1));
    lightboxZoom?.addEventListener('click', toggleZoom);
    lightboxPlay?.addEventListener('click', toggleAutoplay);

    document.addEventListener('keydown', (e) => {
      if (!lightbox?.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lbNavigate(-1);
      else if (e.key === 'ArrowRight') lbNavigate(1);
      else if (e.key === ' ') { e.preventDefault(); toggleAutoplay(); }
      else if (e.key === 'z' || e.key === 'Z') toggleZoom();
    });

    // Pan on drag when zoomed
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;

    lightboxImageWrap?.addEventListener('pointerdown', (e) => {
      if (!isZoomed) { toggleZoom(); return; }
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      lightboxImageWrap.style.cursor = 'grabbing';
    });
    document.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      if (lightboxImage) lightboxImage.style.transform = `scale(1.5) translate(${translateX}px, ${translateY}px)`;
    });
    document.addEventListener('pointerup', () => {
      if (!isDragging) return;
      isDragging = false;
      if (lightboxImageWrap) lightboxImageWrap.style.cursor = 'zoom-out';
    });
  }

  // --- Boot: injecte le contenu JSON puis initialise la galerie ---
  applyContent().finally(() => initGalleryAndLightbox());

  // --- Parallax Scrolling ---
  (() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const parallaxElements = document.querySelectorAll('.hero-main, .card');

    const handleScroll = () => {
      const scrollY = window.pageYOffset;

      parallaxElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;

        // Only apply parallax when element is in viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const scrollPercent = (scrollY + viewportHeight - elementTop) / (viewportHeight + elementHeight);
          const parallaxY = (scrollPercent - 0.5) * 15;

          // Subtle parallax effect
          el.style.transform = `translateY(${parallaxY}px)`;
        }
      });
    };

    // Throttle scroll handler for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    handleScroll(); // Initial call
  })();

  // --- Micro-interactions: Magnetic effect on CTA ---
  (() => {
    const ctas = document.querySelectorAll('.cta');

    ctas.forEach(cta => {
      cta.addEventListener('mousemove', (e) => {
        const rect = cta.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const moveX = x * 0.15;
        const moveY = y * 0.15;

        cta.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      cta.addEventListener('mouseleave', () => {
        cta.style.transform = '';
      });
    });
  })();

  // --- Scroll reveal animations ---
  (() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const revealElements = document.querySelectorAll('.card, .gallery-carousel-wrap, .info-box');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach((el, idx) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.6s ease ${idx * 0.08}s, transform 0.6s ease ${idx * 0.08}s`;
      observer.observe(el);
    });
  })();

  // --- Menu images (carte de saison) lightbox ---
  (() => {
    const menuImgs = Array.from(document.querySelectorAll('[data-menu-lightbox]'));
    if (!menuImgs.length) return;

    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const lightboxImageWrap = lightbox?.querySelector('.lightbox-image-wrap');
    const lightboxClose = lightbox?.querySelector('.lightbox-close');
    const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
    const lightboxNext = lightbox?.querySelector('.lightbox-next');
    const lightboxBackdrop = lightbox?.querySelector('.lightbox-backdrop');
    const lightboxCurrent = lightbox?.querySelector('.lightbox-current');
    const lightboxTotal = lightbox?.querySelector('.lightbox-total');

    let menuIdx = 0;
    let menuActive = false;

    const openMenu = (idx) => {
      menuIdx = idx;
      menuActive = true;
      if (lightboxImage) {
        lightboxImage.src = menuImgs[menuIdx].src;
        lightboxImage.alt = menuImgs[menuIdx].alt;
      }
      if (lightboxCurrent) lightboxCurrent.textContent = menuIdx + 1;
      if (lightboxTotal) lightboxTotal.textContent = menuImgs.length;
      lightbox?.classList.add('is-open');
      lightbox?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      if (!menuActive) return;
      menuActive = false;
      lightbox?.classList.remove('is-open');
      lightbox?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const navMenu = (dir) => {
      if (!menuActive) return;
      menuIdx = (menuIdx + dir + menuImgs.length) % menuImgs.length;
      if (lightboxImage) {
        lightboxImage.src = menuImgs[menuIdx].src;
        lightboxImage.alt = menuImgs[menuIdx].alt;
      }
      if (lightboxCurrent) lightboxCurrent.textContent = menuIdx + 1;
    };

    menuImgs.forEach((img, i) => {
      img.addEventListener('click', () => openMenu(i));
    });

    // Reuse existing lightbox controls when menu lightbox is active
    lightboxClose?.addEventListener('click', closeMenu);
    lightboxBackdrop?.addEventListener('click', closeMenu);
    lightboxPrev?.addEventListener('click', () => navMenu(-1));
    lightboxNext?.addEventListener('click', () => navMenu(1));

    document.addEventListener('keydown', (e) => {
      if (!menuActive || !lightbox?.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeMenu();
      else if (e.key === 'ArrowLeft') navMenu(-1);
      else if (e.key === 'ArrowRight') navMenu(1);
    });
  })();

})();
