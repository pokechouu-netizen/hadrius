/**
 * Cookie Consent Manager - RGPD Compliant
 * Restaurant Hadrius
 *
 * Ce script gère le consentement aux cookies de manière conforme au RGPD :
 * - Opt-in par défaut (aucun cookie tiers avant consentement)
 * - Possibilité de personnaliser les choix
 * - Mémorisation du choix pour 12 mois
 * - Possibilité de modifier le choix à tout moment
 */

(function() {
  'use strict';

  // Configuration
  const CONSENT_COOKIE_NAME = 'cookie_consent';
  const CONSENT_DURATION_DAYS = 365; // 12 mois

  // État du consentement
  let consentState = {
    necessary: true, // Toujours actif
    functional: false, // Google Maps, etc.
    analytics: false, // Google Analytics, etc. (non utilisé actuellement)
    marketing: false // Pixels publicitaires (non utilisé actuellement)
  };

  // ==========================================================================
  // Utilitaires cookies
  // ==========================================================================

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + ';' + expires + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  function deleteCookie(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  }

  // ==========================================================================
  // Gestion du consentement
  // ==========================================================================

  function loadConsent() {
    const saved = getCookie(CONSENT_COOKIE_NAME);
    if (saved && typeof saved === 'object') {
      consentState = { ...consentState, ...saved };
      return true;
    }
    return false;
  }

  function saveConsent() {
    setCookie(CONSENT_COOKIE_NAME, consentState, CONSENT_DURATION_DAYS);
  }

  function hasConsent(category) {
    return consentState[category] === true;
  }

  // ==========================================================================
  // Actions selon le consentement
  // ==========================================================================

  function applyConsent() {
    // Google Maps est chargé directement sans consentement (pas de cookies tiers)

    // Analytics (non utilisé actuellement, mais préparé)
    if (hasConsent('analytics')) {
      // loadAnalytics();
    }

    // Marketing (non utilisé actuellement, mais préparé)
    if (hasConsent('marketing')) {
      // loadMarketing();
    }
  }

  // ==========================================================================
  // Google Maps
  // ==========================================================================

  function loadGoogleMaps() {
    const mapPlaceholder = document.getElementById('mapPlaceholder');
    const mapIframe = document.getElementById('mapIframe');

    if (mapPlaceholder) {
      mapPlaceholder.style.display = 'none';
    }

    if (mapIframe) {
      // Charger l'iframe si elle a un data-src
      const src = mapIframe.getAttribute('data-src');
      if (src && !mapIframe.src) {
        mapIframe.src = src;
      }
      mapIframe.style.display = 'block';
    }
  }

  function blockGoogleMaps() {
    const mapPlaceholder = document.getElementById('mapPlaceholder');
    const mapIframe = document.getElementById('mapIframe');

    if (mapIframe) {
      mapIframe.style.display = 'none';
      // Ne pas supprimer le src si déjà chargé (pour éviter les rechargements)
    }

    if (mapPlaceholder) {
      mapPlaceholder.style.display = 'flex';
    }
  }

  // ==========================================================================
  // Interface utilisateur - Bannière
  // ==========================================================================

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookieBannerTitle');
    banner.setAttribute('aria-describedby', 'cookieBannerDesc');

    banner.innerHTML = `
      <div class="cookie-banner-content">
        <div class="cookie-banner-text">
          <h2 id="cookieBannerTitle" class="cookie-banner-title">🍪 Gestion des cookies</h2>
          <p id="cookieBannerDesc" class="cookie-banner-desc">
            Nous utilisons des cookies pour améliorer votre expérience sur notre site.
            Les cookies fonctionnels (Google Maps) ne sont activés qu'avec votre consentement.
            <a href="politique-cookies.html">En savoir plus</a>
          </p>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" class="cookie-btn cookie-btn-accept" id="cookieAcceptAll">
            Tout accepter
          </button>
          <button type="button" class="cookie-btn cookie-btn-reject" id="cookieRejectAll">
            Tout refuser
          </button>
          <button type="button" class="cookie-btn cookie-btn-settings" id="cookieSettings">
            Personnaliser
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('cookieAcceptAll').addEventListener('click', function() {
      acceptAll();
      hideBanner();
    });

    document.getElementById('cookieRejectAll').addEventListener('click', function() {
      rejectAll();
      hideBanner();
    });

    document.getElementById('cookieSettings').addEventListener('click', function() {
      hideBanner();
      showModal();
    });

    return banner;
  }

  function showBanner() {
    let banner = document.getElementById('cookieBanner');
    if (!banner) {
      banner = createBanner();
    }
    banner.classList.add('is-visible');
    banner.setAttribute('aria-hidden', 'false');
  }

  function hideBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
      banner.classList.remove('is-visible');
      banner.setAttribute('aria-hidden', 'true');
    }
  }

  // ==========================================================================
  // Interface utilisateur - Modale de préférences
  // ==========================================================================

  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'cookieModal';
    modal.className = 'cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'cookieModalTitle');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="cookie-modal-backdrop" id="cookieModalBackdrop"></div>
      <div class="cookie-modal-content">
        <div class="cookie-modal-header">
          <h2 id="cookieModalTitle" class="cookie-modal-title">Préférences de cookies</h2>
          <button type="button" class="cookie-modal-close" id="cookieModalClose" aria-label="Fermer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="cookie-modal-body">
          <p class="cookie-modal-intro">
            Gérez vos préférences de cookies. Les cookies strictement nécessaires ne peuvent pas être désactivés.
          </p>

          <!-- Cookies nécessaires -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3 class="cookie-category-title">Cookies strictement nécessaires</h3>
                <p class="cookie-category-desc">
                  Ces cookies sont indispensables au fonctionnement du site (mémorisation des préférences, thème).
                  Ils ne collectent pas de données personnelles.
                </p>
              </div>
              <div class="cookie-toggle">
                <input type="checkbox" id="cookieNecessary" checked disabled>
                <label for="cookieNecessary" class="cookie-toggle-label cookie-toggle-disabled">
                  Toujours actif
                </label>
              </div>
            </div>
          </div>

          <!-- Cookies fonctionnels -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3 class="cookie-category-title">Cookies fonctionnels</h3>
                <p class="cookie-category-desc">
                  Ces cookies permettent d'activer des fonctionnalités améliorées comme l'affichage de la carte Google Maps.
                  Sans votre consentement, la carte interactive ne sera pas affichée.
                </p>
              </div>
              <div class="cookie-toggle">
                <input type="checkbox" id="cookieFunctional">
                <label for="cookieFunctional" class="cookie-toggle-label">
                  <span class="cookie-toggle-switch"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Cookies analytics (préparé mais non utilisé) -->
          <div class="cookie-category cookie-category-disabled">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3 class="cookie-category-title">Cookies d'analyse</h3>
                <p class="cookie-category-desc">
                  Ces cookies permettent de mesurer l'audience du site.
                  <em>(Non utilisé actuellement sur ce site)</em>
                </p>
              </div>
              <div class="cookie-toggle">
                <input type="checkbox" id="cookieAnalytics" disabled>
                <label for="cookieAnalytics" class="cookie-toggle-label cookie-toggle-disabled">
                  Non utilisé
                </label>
              </div>
            </div>
          </div>

          <!-- Cookies marketing (préparé mais non utilisé) -->
          <div class="cookie-category cookie-category-disabled">
            <div class="cookie-category-header">
              <div class="cookie-category-info">
                <h3 class="cookie-category-title">Cookies marketing</h3>
                <p class="cookie-category-desc">
                  Ces cookies permettent d'afficher des publicités personnalisées.
                  <em>(Non utilisé actuellement sur ce site)</em>
                </p>
              </div>
              <div class="cookie-toggle">
                <input type="checkbox" id="cookieMarketing" disabled>
                <label for="cookieMarketing" class="cookie-toggle-label cookie-toggle-disabled">
                  Non utilisé
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="cookie-modal-footer">
          <button type="button" class="cookie-btn cookie-btn-reject" id="cookieModalReject">
            Tout refuser
          </button>
          <button type="button" class="cookie-btn cookie-btn-accept" id="cookieModalSave">
            Enregistrer mes choix
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('cookieModalClose').addEventListener('click', hideModal);
    document.getElementById('cookieModalBackdrop').addEventListener('click', hideModal);

    document.getElementById('cookieModalReject').addEventListener('click', function() {
      rejectAll();
      hideModal();
    });

    document.getElementById('cookieModalSave').addEventListener('click', function() {
      saveFromModal();
      hideModal();
    });

    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
        hideModal();
      }
    });

    return modal;
  }

  function showModal() {
    let modal = document.getElementById('cookieModal');
    if (!modal) {
      modal = createModal();
    }

    // Mettre à jour les checkboxes selon l'état actuel
    const functionalCheckbox = document.getElementById('cookieFunctional');
    if (functionalCheckbox) {
      functionalCheckbox.checked = consentState.functional;
    }

    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus sur le premier élément interactif
    const firstFocusable = modal.querySelector('button, input:not([disabled])');
    if (firstFocusable) firstFocusable.focus();
  }

  function hideModal() {
    const modal = document.getElementById('cookieModal');
    if (modal) {
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function saveFromModal() {
    const functionalCheckbox = document.getElementById('cookieFunctional');

    consentState.functional = functionalCheckbox ? functionalCheckbox.checked : false;
    // Analytics et marketing sont désactivés sur ce site
    consentState.analytics = false;
    consentState.marketing = false;

    saveConsent();
    applyConsent();
  }

  // ==========================================================================
  // Actions rapides
  // ==========================================================================

  function acceptAll() {
    consentState.functional = true;
    consentState.analytics = false; // Non utilisé
    consentState.marketing = false; // Non utilisé
    saveConsent();
    applyConsent();
  }

  function rejectAll() {
    consentState.functional = false;
    consentState.analytics = false;
    consentState.marketing = false;
    saveConsent();
    applyConsent();
  }

  // ==========================================================================
  // Initialisation
  // ==========================================================================

  function init() {
    // Charger le consentement existant
    const hasExistingConsent = loadConsent();

    // Appliquer le consentement (ou bloquer par défaut)
    applyConsent();

    // Afficher la bannière si pas de consentement enregistré
    if (!hasExistingConsent) {
      // Petit délai pour laisser la page se charger
      setTimeout(showBanner, 500);
    }

    // Ajouter les event listeners pour les liens "Gérer mes cookies"
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (target.id === 'openCookieSettings' ||
          target.id === 'openCookieSettingsBtn' ||
          target.id === 'openCookieSettingsInline' ||
          target.classList.contains('open-cookie-settings')) {
        e.preventDefault();
        showModal();
      }
    });
  }

  // Exposer les fonctions publiques
  window.CookieConsent = {
    showBanner: showBanner,
    hideBanner: hideBanner,
    showModal: showModal,
    hideModal: hideModal,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    hasConsent: hasConsent,
    getState: function() { return { ...consentState }; }
  };

  // Initialiser au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
