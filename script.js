/* ==========================================================================
   Farm2Local Public Website Script (script.js)
   Routes the 4 public pages (Home, Shop, For Farmers, About & Contact),
   populates sample vegetable previews, and connects to the existing
   Customer and Farmer application views.
   ========================================================================== */

(function () {
  const homeEl = document.getElementById("f2l-home");
  const portalEl = document.getElementById("f2l-portal");
  const mobileNavEl = document.getElementById("f2l-mobile-nav");
  const menuBtnEl = document.getElementById("f2l-menu-btn");

  const PAGES = ["home", "shop", "farmers", "about"];
  let currentPage = "home";

  // 1. Populate the 4 Featured Produce Cards on Home from embedded IMG data
  function initHeroImages() {
    if (typeof IMG === "undefined") return;
    const mapping = [
      ["hero-img-tomato", 9],    // Cherry Tomato
      ["hero-img-pepper", 21],   // Bell Pepper
      ["hero-img-carrot", 18],   // Bunch Carrots
      ["hero-img-coriander", 24] // Coriander
    ];
    mapping.forEach(([id, imgKey]) => {
      const el = document.getElementById(id);
      if (el && IMG[imgKey]) {
        el.src = IMG[imgKey];
      }
    });
  }

  // 2. Render Compact Selected Vegetables Preview on the Shop Page
  const SELECTED_VEGETABLES = [
    { name: "Carrot (Bunch with tops)", img: 18, farm: "Porvorim Kitchen Garden", price: 65, org: true },
    { name: "Cherry Tomato", img: 9, farm: "Calangute Polyhouse", price: 110, org: true },
    { name: "Bell Pepper (Capsicum)", img: 21, farm: "Valpoi Hill Farm", price: 125, org: true },
    { name: "Cucumber (Desi)", img: 2, farm: "Pernem Growers", price: 45, org: false },
    { name: "Cabbage", img: 19, farm: "Ponda Spice Farm", price: 40, org: true },
    { name: "Green Peas", img: 3, farm: "Valpoi Hill Farm", price: 140, org: true }
  ];

  function renderShopPreview() {
    const gridEl = document.getElementById("f2l-sample-grid");
    if (!gridEl) return;

    gridEl.innerHTML = SELECTED_VEGETABLES.map(item => {
      const imgSrc = (typeof IMG !== "undefined" && IMG[item.img]) ? IMG[item.img] : "";
      return `
        <article class="f2l-sample-card">
          <div class="f2l-sample-card__img-wrap">
            <img src="${imgSrc}" alt="${item.name}" loading="lazy">
            <span class="f2l-sample-card__tag">${item.org ? "Organic" : "Conventional"}</span>
          </div>
          <div class="f2l-sample-card__farm">${item.farm}</div>
          <h3>${item.name}</h3>
          <div class="f2l-sample-card__price">₹${item.price}<small>/kg</small></div>
        </article>
      `;
    }).join("");
  }

  // 3. Switch Between the 4 Public Pages
  function showPage(pageId, updateHash) {
    const valid = PAGES.includes(pageId) ? pageId : "home";
    currentPage = valid;

    if (homeEl && portalEl) {
      portalEl.hidden = true;
      homeEl.hidden = false;
    }

    document.querySelectorAll("[data-page-view]").forEach(viewEl => {
      viewEl.hidden = viewEl.getAttribute("data-page-view") !== valid;
    });

    document.querySelectorAll("[data-page-link]").forEach(linkEl => {
      const isMatch = linkEl.getAttribute("data-page-link") === valid;
      if (linkEl.closest(".f2l-nav-links") || linkEl.closest("#f2l-mobile-nav")) {
        linkEl.classList.toggle("active", isMatch);
        if (isMatch) {
          linkEl.setAttribute("aria-current", "page");
        } else {
          linkEl.removeAttribute("aria-current");
        }
      }
    });

    if (mobileNavEl) {
      mobileNavEl.hidden = true;
      if (menuBtnEl) menuBtnEl.setAttribute("aria-expanded", "false");
    }

    if (updateHash !== false) {
      try {
        history.pushState({ page: valid }, "", "#" + valid);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 4. Open Untouched Customer / Farmer Application Portal
  function openPortal(targetRole) {
    if (!homeEl || !portalEl) return;
    homeEl.hidden = true;
    portalEl.hidden = false;

    if (mobileNavEl) {
      mobileNavEl.hidden = true;
      if (menuBtnEl) menuBtnEl.setAttribute("aria-expanded", "false");
    }

    if (typeof S !== "undefined" && S.user) {
      if ((targetRole === "customer" && S.user.role !== "c") ||
          (targetRole === "farmer" && S.user.role !== "f")) {
        const logoutBtn = document.querySelector("[data-logout]");
        if (logoutBtn) logoutBtn.click();
      }
    }

    if (targetRole === "farmer") {
      const farmerTabBtn = document.querySelector('[data-lt="1"]');
      if (farmerTabBtn) farmerTabBtn.click();
    } else if (targetRole === "customer") {
      const customerTabBtn = document.querySelector('[data-lt="0"]');
      if (customerTabBtn) customerTabBtn.click();
    }

    if (typeof movePill === "function") {
      setTimeout(movePill, 50);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToHome() {
    const modalEl = document.getElementById("modal");
    if (modalEl) modalEl.hidden = true;
    showPage(currentPage || "home", false);
  }

  // 5. Event Listeners
  document.addEventListener("click", function (e) {
    const portalTrigger = e.target.closest("[data-open-portal]");
    if (portalTrigger) {
      e.preventDefault();
      openPortal(portalTrigger.getAttribute("data-open-portal"));
      return;
    }

    const backTrigger = e.target.closest("[data-back-home]");
    if (backTrigger) {
      e.preventDefault();
      backToHome();
      return;
    }

    const pageTrigger = e.target.closest("[data-page-link]");
    if (pageTrigger) {
      e.preventDefault();
      showPage(pageTrigger.getAttribute("data-page-link"), true);
      return;
    }
  });

  window.addEventListener("popstate", function () {
    const hash = (window.location.hash || "").replace(/^#/, "");
    showPage(PAGES.includes(hash) ? hash : "home", false);
  });

  if (menuBtnEl && mobileNavEl) {
    menuBtnEl.addEventListener("click", function () {
      const isHidden = mobileNavEl.hidden;
      mobileNavEl.hidden = !isHidden;
      menuBtnEl.setAttribute("aria-expanded", isHidden ? "true" : "false");
    });
  }

  // 6. Contact Form Handler on About & Contact Page
  const contactForm = document.getElementById("f2l-contact-form");
  const contactStatus = document.getElementById("f2l-contact-status");
  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameInput = document.getElementById("cf-name");
      const name = nameInput && nameInput.value ? nameInput.value.trim() : "there";
      contactStatus.hidden = false;
      contactStatus.textContent = `Thank you, ${name}. Your message has been recorded in this demo.`;
      contactForm.reset();
    });
  }

  initHeroImages();
  renderShopPreview();
  const initialHash = (window.location.hash || "").replace(/^#/, "");
  showPage(PAGES.includes(initialHash) ? initialHash : "home", false);
})();
