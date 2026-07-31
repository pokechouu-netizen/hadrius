(() => {
  "use strict";

  /* ==========================================================================
     1. Backend CMS — contenus lus depuis data/*.json
        Ces fichiers sont versionnés sur GitHub et édités par la restauratrice
        depuis /admin (interface protégée par mot de passe, Netlify Identity +
        Git Gateway). Ne pas remplacer par une autre source : chaque
        modification faite dans /admin écrit dans ces JSON.
     ========================================================================== */

  async function fetchJSON(path) {
    try {
      const r = await fetch(path, { cache: "no-store" });
      return r.ok ? await r.json() : null;
    } catch (e) {
      console.warn("[Hadrius] fetchJSON failed", path, e);
      return null;
    }
  }

  const escapeAttr = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  /* --- Textes libres (admin → Textes) --- */
  function applyTextes(textes) {
    if (!textes) return;
    document.querySelectorAll("[data-text]").forEach((el) => {
      const v = textes[el.getAttribute("data-text")];
      if (typeof v === "string" && v.trim()) el.textContent = v;
    });
    const chipsBox = document.querySelector("[data-chips]");
    if (chipsBox && Array.isArray(textes.chips) && textes.chips.length) {
      chipsBox.innerHTML = textes.chips
        .filter(Boolean)
        .map((c) => `<span class="pill pill--static">${escapeAttr(c)}</span>`)
        .join("");
    }
  }

  /* --- Logo, visuel d'ouverture, galerie (admin → Photos & galerie) --- */
  function applyGalerie(galerie) {
    if (!galerie) return;

    if (galerie.logo) {
      document.querySelectorAll(".brand img, .footer-brand img").forEach((img) => {
        img.src = galerie.logo;
      });
    }

    if (galerie.hero) {
      const heroImg = document.querySelector(".hero-banner__img img");
      if (heroImg) heroImg.src = galerie.hero;
    }

    construireBande(galerie.photos);
  }

  /* --- Bande photos défilante (admin → Photos & galerie) ------------------
     Le rail contient deux copies identiques de la liste : l'animation CSS
     translate de -50%, donc la seconde moitié prend exactement la place de
     la première et la boucle est sans raccord. Pas de loading="lazy" : les
     vignettes sont hors de l'écran et ne se chargeraient jamais. */

  // Vitesse de défilement, en pixels par seconde.
  var BANDE_VITESSE = 90;

  function bandeVignettes(list, original) {
    return list
      .map(function (p, i) {
        var leg = p.legende || "";
        return (
          '<figure class="photo-band__slide"' +
          (original ? ' data-original="1"' : "") +
          ' data-src="' + escapeAttr(p.image) + '"' +
          ' tabindex="' + (original ? "0" : "-1") + '" role="button"' +
          ' aria-label="Agrandir la photo' + (leg ? " : " + escapeAttr(leg) : "") + '">' +
          '<img src="' + escapeAttr(p.image) + '" alt="' + escapeAttr(leg || "Restaurant Hadrius") +
          '" decoding="async" fetchpriority="low">' +
          (leg ? '<figcaption class="photo-band__caption">' + escapeAttr(leg) + "</figcaption>" : "") +
          "</figure>"
        );
      })
      .join("");
  }

  function construireBande(photos) {
    var track = document.querySelector(".photo-band__track");
    if (!track || !Array.isArray(photos)) return;
    var vis = photos.filter(function (p) { return p.image && p.visible !== false; });
    if (!vis.length) return;

    // 1er passage : on mesure la largeur réelle de la liste. Les vignettes ont
    // un aspect-ratio en CSS, donc la largeur est connue avant même que les
    // images soient chargées.
    track.innerHTML = bandeVignettes(vis, true);
    var largeurBase = track.scrollWidth;
    if (!largeurBase) {
      track.innerHTML = bandeVignettes(vis, true) + bandeVignettes(vis, false);
      return;
    }

    // Une copie doit couvrir l'écran, sinon on verrait un vide entre la fin de
    // la liste et son retour. Peu de photos + grand écran = on répète.
    var parCopie = Math.max(1, Math.ceil((window.innerWidth * 1.2) / largeurBase));
    var copie = [];
    for (var i = 0; i < parCopie; i++) copie = copie.concat(vis);

    track.innerHTML = bandeVignettes(copie, true) + bandeVignettes(copie, false);
    track.style.setProperty(
      "--bande-duree",
      (largeurBase * parCopie / BANDE_VITESSE).toFixed(1) + "s"
    );
  }

  // Rotation d'un téléphone, fenêtre agrandie : on recalcule le nombre de
  // copies, sinon un écran devenu plus large laisse apparaître un trou.
  function surveillerBande(photos) {
    if (!Array.isArray(photos)) return;
    var derniere = window.innerWidth;
    var minuteur = null;
    window.addEventListener("resize", function () {
      if (window.innerWidth === derniere) return;
      derniere = window.innerWidth;
      clearTimeout(minuteur);
      minuteur = setTimeout(function () {
        construireBande(photos);
        document.dispatchEvent(new CustomEvent("bande:rendue"));
      }, 250);
    });
  }

  /* --- Carte : plats saisis dans /admin + PDF téléversé (admin → Carte) --- */
  function applyCarte(carte) {
    if (!carte) return;

    // Le PDF téléversé depuis /admin est la carte de référence : il s'affiche
    // en permanence, en haut de la section, et reste ouvrable en plein écran.
    if (carte.pdf) {
      const iframe = document.querySelector(".carte-iframe");
      if (iframe) iframe.src = carte.pdf + "#view=FitH&toolbar=0&navpanes=0";
      const openBtn = document.querySelector(".carte-iframe-open");
      if (openBtn) openBtn.href = carte.pdf;
    }

    // Les plats saisis dans /admin sont rendus SOUS le PDF, en version texte :
    // lisible sur téléphone (où les PDF s'affichent mal) et indexable par les
    // moteurs de recherche. Ils ne remplacent pas le PDF.
    const box = document.getElementById("carteMenu");
    const sections = Array.isArray(carte.sections) ? carte.sections : [];
    const remplies = sections.filter((s) => Array.isArray(s.items) && s.items.length);
    if (!box || !remplies.length) return;

    box.innerHTML =
      '<p class="carte-menu__intro">La carte en texte</p>' + remplies
      .map(
        (s) => `
        <div class="carte-section">
          <h4 class="carte-section__titre">${escapeAttr(s.titre || "")}</h4>
          <ul class="carte-liste">
            ${s.items
              .map(
                (it) => `
              <li class="carte-item">
                <div class="carte-item__ligne">
                  <span class="carte-item__nom">${escapeAttr(it.nom || "")}</span>
                  <span class="carte-item__points" aria-hidden="true"></span>
                  <span class="carte-item__prix">${escapeAttr(it.prix || "")}</span>
                </div>
                ${it.desc ? `<p class="carte-item__desc">${escapeAttr(it.desc)}</p>` : ""}
              </li>`
              )
              .join("")}
          </ul>
        </div>`
      )
      .join("");

    // Le PDF téléversé par la restauratrice reste affiché en permanence :
    // c'est sa carte de référence. La version texte ci-dessus ne fait que la
    // compléter. (Auparavant l'aperçu PDF était masqué dès que des plats
    // étaient saisis — le PDF devenait invisible sur le site.)
  }

  /* --- Horaires par période (admin → Horaires) --- */
  function applyHoraires(horaires) {
    const hList = document.getElementById("horairesList");
    if (!hList) return;
    const periodes = horaires && Array.isArray(horaires.periodes) ? horaires.periodes : [];
    const utiles = periodes.filter((p) => Array.isArray(p.lignes) && p.lignes.length);

    if (!utiles.length) {
      hList.innerHTML =
        '<div class="horaires-error">Les horaires ne se chargent pas. Appelez le 04 90 41 75 12.</div>';
      return;
    }

    hList.innerHTML = utiles
      .map((p) => {
        const entete = p.label
          ? `<div class="horaires-row horaires-row--label"><span class="horaires-jours"><strong>${escapeAttr(p.label)}</strong></span></div>`
          : "";
        const lignes = p.lignes
          .map((l) => {
            const slots = [];
            if (l.midi) slots.push(`<span class="horaires-slot"><strong>Midi</strong> ${escapeAttr(l.midi)}</span>`);
            if (l.soir) slots.push(`<span class="horaires-slot"><strong>Soir</strong> ${escapeAttr(l.soir)}</span>`);
            return `<div class="horaires-row"><span class="horaires-jours">${escapeAttr(l.jours || "")}</span><span class="horaires-temps">${slots.join("") || "<em>Fermé</em>"}</span></div>`;
          })
          .join("");
        return entete + lignes;
      })
      .join("");
  }

  /* --- Coordonnées, réseaux, plan (admin → Infos & contact) --- */
  function applyInfos(infos) {
    if (!infos) return;

    // Les attributs du HTML (phone, email, address) ne portent pas le meme nom
    // que les cles du JSON ecrit par /admin (telephone, email, adresse +
    // code_postal + ville) : la correspondance est explicite.
    const valeurs = {
      phone:   infos.telephone,
      email:   infos.email,
      address: [infos.adresse, ((infos.code_postal || "") + " " + (infos.ville || "")).trim()]
                 .filter(Boolean).join(", "),
    };
    document.querySelectorAll("[data-info]").forEach((el) => {
      const v = valeurs[el.getAttribute("data-info")];
      if (typeof v === "string" && v.trim()) el.textContent = v;
    });

    if (infos.telephone) {
      document.querySelectorAll(".phone-modal__number").forEach((el) => {
        el.textContent = infos.telephone;
      });
    }
    if (infos.telephone_raw) {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        a.href = "tel:" + infos.telephone_raw;
      });
    }
    if (infos.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
        a.href = "mailto:" + infos.email;
      });
    }
    if (infos.instagram) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach((a) => { a.href = infos.instagram; });
    }
    if (infos.facebook) {
      document.querySelectorAll('a[href*="facebook.com"]').forEach((a) => { a.href = infos.facebook; });
    }

    const map = document.getElementById("mapIframe");
    if (map && infos.maps_query) {
      map.src = "https://www.google.com/maps?q=" + encodeURIComponent(infos.maps_query) + "&output=embed";
    }
  }

  /* --- Message pop-up (admin → Infos & contact → Popup) ---
     La restauratrice l'active depuis son backoffice avec un message, un
     bouton et un delai d'apparition. Present sur l'ancien site, il avait ete
     perdu lors du passage a la nouvelle mise en page : il est retabli. */
  function initPopup(popup) {
    if (!popup || !popup.actif || !popup.message) return;
    if (document.getElementById("promoPopup")) return;

    const wrap = document.createElement("div");
    wrap.id = "promoPopup";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Message du restaurant");

    const cta = popup.cta_url && popup.cta_label
      ? '<a class="cta promo-popup__cta" href="' + escapeAttr(popup.cta_url) + '">' +
        escapeAttr(popup.cta_label) + "</a>"
      : "";
    wrap.innerHTML =
      '<button type="button" class="promo-popup__close" aria-label="Fermer">&times;</button>' +
      '<p class="promo-popup__text">' + escapeAttr(popup.message) + "</p>" + cta;

    document.body.appendChild(wrap);
    wrap.querySelector(".promo-popup__close").addEventListener("click", () => wrap.remove());
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { wrap.remove(); document.removeEventListener("keydown", esc); }
    });

    setTimeout(() => wrap.classList.add("is-open"),
               (parseInt(popup.delai_secondes, 10) || 0) * 1000);
  }

  async function applyContent() {
    const [contenu, galerie, carte, infos] = await Promise.all([
      fetchJSON("data/contenu.json"),
      fetchJSON("data/galerie.json"),
      fetchJSON("data/carte.json"),
      fetchJSON("data/infos.json"),
    ]);
    applyTextes(contenu && contenu.textes);
    applyGalerie(galerie);
    if (galerie && Array.isArray(galerie.photos)) surveillerBande(galerie.photos);
    applyCarte(carte);
    if (infos) {
      applyHoraires(infos.horaires);
      applyInfos(infos);
      initPopup(infos.popup);
    } else {
      applyHoraires(null);
    }
  }
  /* ==========================================================================
     2. Thème jour / nuit
     ========================================================================== */

  const root = document.documentElement;
  const stored = localStorage.getItem("hadrius-theme");
  if (stored) root.setAttribute("data-theme", stored);

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = (root.getAttribute("data-theme") || "dark") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("hadrius-theme", next);
  });

  /* ==========================================================================
     3. Année courante
     ========================================================================== */

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     4. Menu mobile
     ========================================================================== */

  (() => {
    const menu = document.getElementById("mobileMenu");
    if (!menu) return;

    const btn = document.getElementById("menuBtn");
    const closeBtn = document.getElementById("menuClose");
    const backdrop = document.getElementById("menuBackdrop");

    const open = () => {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      btn?.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      closeBtn?.focus();
    };

    const close = () => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      btn?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    btn?.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    menu.querySelectorAll("[data-menu-link]").forEach((el) =>
      el.addEventListener("click", close)
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) close();
    });

    // La modale téléphone est déclenchée ailleurs : on ferme d'abord le menu.
    menu.querySelectorAll(".open-phone-modal").forEach((el) =>
      el.addEventListener("click", close)
    );
  })();

  /* ==========================================================================
     5. Modale téléphone
     ========================================================================== */

  const PHONE = "04 90 41 75 12";
  const PHONE_HREF = "tel:+33490417512";

  // Décor de temple : chapiteau corinthien, fût cannelé, base attique.
  const capitalSvg = `
    <svg class="colonne__capital" viewBox="0 0 120 122" fill="none" stroke="currentColor"
         stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 10 Q60 2 116 10 V22 Q60 14 4 22 Z"/>
      <path d="M60 15 c-5 6 -5 12 0 17 5-5 5-11 0-17"/>
      <path d="M18 24 c-3 13 6 19 13 15 6-4 5-14 -2-15"/>
      <path d="M102 24 c3 13 -6 19 -13 15 -6-4 -5-14 2-15"/>
      <path d="M45 27 c-3 11 3 16 8 13"/>
      <path d="M75 27 c3 11 -3 16 -8 13"/>
      <path d="M24 22 C26 56 34 87 60 113 C86 87 94 56 96 22"/>
      <path d="M60 97 C48 87 42 73 40 57 C47 66 54 71 60 73 C66 71 73 66 80 57 C78 73 72 87 60 97"/>
      <path d="M60 73 C57 65 55 57 55 49"/>
      <path d="M60 73 C63 65 65 57 65 49"/>
      <path d="M60 113 C50 107 44 99 41 89"/>
      <path d="M60 113 C70 107 76 99 79 89"/>
      <path d="M26 116 H94"/>
    </svg>`;

  const baseSvg = `
    <svg class="colonne__base" viewBox="0 0 120 58" fill="none" stroke="currentColor"
         stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M26 3 H94"/>
      <path d="M21 10 Q60 18 99 10"/>
      <path d="M16 21 Q60 12 104 21"/>
      <path d="M11 32 Q60 41 109 32"/>
      <path d="M4 39 H116 V54 H4 Z"/>
    </svg>`;

  const colonne = (side) => `
    <div class="colonne colonne--${side}" aria-hidden="true">
      ${capitalSvg}
      <div class="colonne__shaft"></div>
      ${baseSvg}
    </div>`;

  // Fronton à denticules
  const dentils = Array.from({ length: 21 }, (_, i) =>
    `<path d="M${14 + i * 18} 82 h11 v11 h-11 Z"/>`
  ).join("");

  const pedimentSvg = `
    <svg class="phone-modal__pediment" viewBox="0 0 400 104" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
      <path d="M6 74 L200 8 L394 74"/>
      <path d="M26 74 L200 25 L374 74"/>
      <path d="M0 74 H400"/>
      <path d="M0 96 H400"/>
      <g stroke-width="1.2">${dentils}</g>
    </svg>`;

  const phoneModal = document.createElement("div");
  phoneModal.id = "phoneModal";
  phoneModal.setAttribute("aria-hidden", "true");
  phoneModal.innerHTML = `
    <div class="phone-modal__backdrop"></div>
    <div class="phone-modal__scene" role="dialog" aria-modal="true" aria-labelledby="phoneModalTitle">
      ${colonne("left")}
      ${colonne("right")}

      <div class="phone-modal__inner">
        ${pedimentSvg}
        <span class="inscription phone-modal__label">Réservation</span>
        <h2 class="phone-modal__title" id="phoneModalTitle">Une table se réserve<br>d'un coup de fil</h2>
        <a class="phone-modal__number" href="${PHONE_HREF}">${PHONE}</a>

        <div class="phone-modal__actions">
          <a class="cta" href="${PHONE_HREF}">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.7 0 1.3.6 1.3 1.3V21c0 .7-.6 1.3-1.3 1.3C10.1 22.3 1.7 13.9 1.7 3.3 1.7 2.6 2.3 2 3 2h3.6c.7 0 1.3.6 1.3 1.3 0 1.4.3 2.8.8 4.1.1.4 0 .9-.2 1.2l-2.9 2.2Z"/></svg>
            Appeler
          </a>
          <button type="button" class="pill" id="phoneCopy">Copier le numéro</button>
        </div>

        <p class="phone-modal__note">5 rue Bernard Noël · 84110 Vaison-la-Romaine</p>
      </div>

      <button type="button" class="phone-modal__close" aria-label="Fermer">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(phoneModal);

  const openPhoneModal = () => {
    phoneModal.classList.add("is-open");
    phoneModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    phoneModal.querySelector(".phone-modal__close")?.focus();
  };
  const closePhoneModal = () => {
    phoneModal.classList.remove("is-open");
    phoneModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".open-phone-modal").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openPhoneModal();
    });
  });

  phoneModal.querySelector(".phone-modal__backdrop")?.addEventListener("click", closePhoneModal);
  phoneModal.querySelector(".phone-modal__close")?.addEventListener("click", closePhoneModal);

  const copyBtn = phoneModal.querySelector("#phoneCopy");
  copyBtn?.addEventListener("click", () => {
    navigator.clipboard?.writeText(PHONE).then(() => {
      copyBtn.textContent = "Numéro copié";
      setTimeout(() => { copyBtn.textContent = "Copier le numéro"; }, 1800);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && phoneModal.classList.contains("is-open")) closePhoneModal();
  });

  /* ==========================================================================
     6. Bande photos défilante + visionneuse
     ========================================================================== */

  function initGalleryAndLightbox() {
    const band = document.getElementById("photoBand");
    if (!band) return;
    const track = band.querySelector(".photo-band__track");
    if (!track) return;

    // Les vignettes uniques (la seconde moitié du rail n'est qu'une copie).
    let visibleSlides = Array.from(track.querySelectorAll('.photo-band__slide[data-original="1"]'));

    if (!visibleSlides.length) {
      track.innerHTML =
        '<p class="photo-band__vide">Les photos arrivent bientôt.</p>';
      return;
    }

    // Ouverture par délégation : fonctionne aussi sur les copies du rail, et
    // survit à une reconstruction de la bande (redimensionnement, CMS).
    const indexDepuis = (el) => {
      const src = el.getAttribute("data-src");
      return visibleSlides.findIndex((s) => s.getAttribute("data-src") === src);
    };

    track.addEventListener("click", (e) => {
      const slide = e.target.closest(".photo-band__slide");
      if (!slide) return;
      const i = indexDepuis(slide);
      if (i >= 0) openLightbox(i);
    });
    track.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const slide = e.target.closest(".photo-band__slide");
      if (!slide) return;
      e.preventDefault();
      const i = indexDepuis(slide);
      if (i >= 0) openLightbox(i);
    });

    // Après un recalcul de la bande, la liste des vignettes change.
    document.addEventListener("bande:rendue", () => {
      visibleSlides = Array.from(track.querySelectorAll('.photo-band__slide[data-original="1"]'));
    });


    // --- Visionneuse ---
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const lbImage = lightbox.querySelector(".lightbox-image");
    const lbWrap = lightbox.querySelector(".lightbox-image-wrap");
    const lbClose = lightbox.querySelector(".lightbox-close");
    const lbPrev = lightbox.querySelector(".lightbox-prev");
    const lbNext = lightbox.querySelector(".lightbox-next");
    const lbZoom = lightbox.querySelector(".lightbox-zoom");
    const lbPlay = lightbox.querySelector(".lightbox-play");
    const lbCurrent = lightbox.querySelector(".lightbox-current");
    const lbTotal = lightbox.querySelector(".lightbox-total");
    const lbBackdrop = lightbox.querySelector(".lightbox-backdrop");

    let lbIndex = 0;
    let isZoomed = false;
    let playTimer = null;
    let lastFocused = null;

    const renderLightbox = () => {
      const slide = visibleSlides[lbIndex];
      if (!slide) return;
      const img = slide.querySelector("img");
      if (lbImage && img) {
        lbImage.src = img.src;
        lbImage.alt = img.alt;
      }
      if (lbCurrent) lbCurrent.textContent = lbIndex + 1;
      if (lbTotal) lbTotal.textContent = visibleSlides.length;
    };

    const setZoom = (on) => {
      isZoomed = on;
      lbWrap?.classList.toggle("is-zoomed", on);
      if (!on && lbImage) lbImage.style.transform = "";
    };

    const stopAutoplay = () => {
      if (!playTimer) return;
      clearInterval(playTimer);
      playTimer = null;
      lbPlay?.classList.remove("is-playing");
      lbPlay?.setAttribute("aria-label", "Lecture automatique");
    };

    const navigate = (dir) => {
      setZoom(false);
      lbIndex = (lbIndex + dir + visibleSlides.length) % visibleSlides.length;
      renderLightbox();
    };

    const openLightbox = (idx) => {
      lastFocused = document.activeElement;
      lbIndex = idx;
      renderLightbox();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbClose?.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      stopAutoplay();
      setZoom(false);
      lastFocused?.focus?.();
    };

    const toggleAutoplay = () => {
      if (playTimer) { stopAutoplay(); return; }
      playTimer = setInterval(() => navigate(1), 3500);
      lbPlay?.classList.add("is-playing");
      lbPlay?.setAttribute("aria-label", "Arrêter la lecture automatique");
    };

    // L'ouverture des vignettes est gérée plus haut par délégation sur le
    // rail : cela couvre aussi les copies et survit à une reconstruction.

    lbClose?.addEventListener("click", closeLightbox);
    lbBackdrop?.addEventListener("click", closeLightbox);
    lbPrev?.addEventListener("click", () => navigate(-1));
    lbNext?.addEventListener("click", () => navigate(1));
    lbZoom?.addEventListener("click", () => setZoom(!isZoomed));
    lbPlay?.addEventListener("click", toggleAutoplay);

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
      else if (e.key === " ") { e.preventDefault(); toggleAutoplay(); }
    });

    // Déplacement de l'image quand elle est zoomée
    let panning = false, panStartX = 0, panStartY = 0, panX = 0, panY = 0;

    lbWrap?.addEventListener("pointerdown", (e) => {
      if (!isZoomed) { setZoom(true); return; }
      panning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
    });
    document.addEventListener("pointermove", (e) => {
      if (!panning || !lbImage) return;
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      lbImage.style.transform = `scale(1.5) translate(${panX / 1.5}px, ${panY / 1.5}px)`;
    });
    document.addEventListener("pointerup", () => { panning = false; });
  }

  /* ==========================================================================
     7. Apparitions au défilement
     ========================================================================== */

  function initReveals() {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    els.forEach((el) => observer.observe(el));
  }

  /* ==========================================================================
     8. Démarrage
     ========================================================================== */

  initReveals();
  applyContent().finally(() => initGalleryAndLightbox());
})();
