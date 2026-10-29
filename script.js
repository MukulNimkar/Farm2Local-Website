/* ==========================================================================
   Farm2Local Public Website & Demo Authentication Script (script.js)
   - Routes the 4 public pages (Home, Shop, For Farmers, About & Contact)
   - Adds Login, Sign Up (saved in browser localStorage), and 1-Click
     Customer Demo / Farmer Demo access for college project evaluation
   - Preserves all existing Customer Shop and Farmer Dashboard features
   ========================================================================== */

(function () {
  const homeEl = document.getElementById("f2l-home");
  const portalEl = document.getElementById("f2l-portal");
  const mobileNavEl = document.getElementById("f2l-mobile-nav");
  const menuBtnEl = document.getElementById("f2l-menu-btn");

  const PAGES = ["home", "shop", "farmers", "about"];
  const DEMO_USERS_KEY = "f2l_demo_accounts";
  let currentPage = "home";
  let authMode = "login"; // "login" or "signup"
  let signupRole = "c";   // "c" (Customer) or "f" (Farmer)

  // --------------------------------------------------------------------------
  // 1. Seed Default Farmer Vegetable Listings for Demo Evaluation
  // --------------------------------------------------------------------------
  function ensureDemoFarmerListings() {
    if (typeof S === "undefined" || !Array.isArray(S.lst)) return;
    if (S.lst.length === 0) {
      const d1 = typeof addD === "function" ? addD(1).toISOString().slice(0, 10) : "2026-10-30";
      const d2 = typeof addD === "function" ? addD(2).toISOString().slice(0, 10) : "2026-10-31";
      S.lst.push(
        { n: "Cherry Tomato", q: 25, d: d1, o: true },
        { n: "Bell Pepper (Capsicum)", q: 30, d: d1, o: true },
        { n: "Carrot (Bunch with tops)", q: 40, d: d2, o: true }
      );
      if (typeof save === "function") save();
    }
  }

  // --------------------------------------------------------------------------
  // 2. Browser localStorage Demo Account Helpers (No Plain-Text Passwords)
  // --------------------------------------------------------------------------
  function demoHash(input) {
    const raw = "f2l_demo_salt::" + String(input || "");
    if (typeof hash === "function") {
      return "demo_" + hash(raw).toString(16);
    }
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "demo_" + (h >>> 0).toString(16);
  }

  function getSavedDemoAccounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveDemoAccount(account) {
    const existing = getSavedDemoAccounts().filter(
      a => (a.email || "").toLowerCase() !== account.email.toLowerCase()
    );
    existing.push(account);
    try {
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(existing));
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // 3. Login / Sign Up UI Mode & Role Switchers
  // --------------------------------------------------------------------------
  function updatePortalTopBar() {
    const loggedIn = typeof S !== "undefined" && !!S.user;
    const guestBtns = document.getElementById("f2l-portal-guest-actions");
    const userBtns = document.getElementById("f2l-portal-user-actions");
    const activeUserLabel = document.getElementById("f2l-portal-user-label");

    if (guestBtns) guestBtns.hidden = loggedIn;
    if (userBtns) userBtns.hidden = !loggedIn;
    if (activeUserLabel && loggedIn && S.user) {
      activeUserLabel.textContent = S.user.name + " (" + (S.user.role === "f" ? "Farmer" : "Customer") + ")";
    }
  }

  function setSignupRole(roleCode) {
    signupRole = roleCode === "f" ? "f" : "c";
    const segEl = document.getElementById("su-lseg");
    const hiddenInput = document.getElementById("su-role");
    if (segEl) {
      segEl.style.cssText = `--n:2;--i:${signupRole === "f" ? 1 : 0};margin:6px 0 8px`;
    }
    if (hiddenInput) {
      hiddenInput.value = signupRole;
    }
    document.querySelectorAll("[data-su-role]").forEach(btn => {
      btn.classList.toggle("on", btn.getAttribute("data-su-role") === signupRole);
    });
  }

  function setAuthMode(mode, preferredRole) {
    authMode = mode === "signup" ? "signup" : "login";
    const loginView = document.getElementById("f2l-login-view");
    const signupView = document.getElementById("f2l-signup-view");
    const loginErr = document.getElementById("le");
    const signupErr = document.getElementById("su-err");

    if (loginView) loginView.hidden = authMode !== "login";
    if (signupView) signupView.hidden = authMode !== "signup";
    if (loginErr) loginErr.textContent = "";
    if (signupErr) signupErr.textContent = "";

    document.querySelectorAll("[data-auth-tab]").forEach(tabBtn => {
      tabBtn.classList.toggle("on", tabBtn.getAttribute("data-auth-tab") === authMode);
    });

    if (preferredRole === "farmer" || preferredRole === "f") {
      setSignupRole("f");
      const farmerTabBtn = document.querySelector('[data-lt="1"]');
      if (farmerTabBtn) farmerTabBtn.click();
    } else if (preferredRole === "customer" || preferredRole === "c") {
      setSignupRole("c");
      const customerTabBtn = document.querySelector('[data-lt="0"]');
      if (customerTabBtn) customerTabBtn.click();
    }
  }

  // --------------------------------------------------------------------------
  // 4. Enhanced Login, Sign Up & 1-Click Demo Login Logic
  // --------------------------------------------------------------------------
  function completeAuthSession(userObj) {
    if (typeof S === "undefined") return;
    ensureDemoFarmerListings();
    S.user = userObj;
    if (typeof tab !== "undefined") tab = 0;
    if (typeof lt !== "undefined") lt = userObj.role === "f" ? 1 : 0;
    if (typeof save === "function") save();
    if (typeof view === "function") view();
    if (typeof render === "function") render();
    updatePortalTopBar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Override global login() to support both localStorage accounts and built-in demo accounts
  window.login = function () {
    const luEl = document.getElementById("lu");
    const lpEl = document.getElementById("lp");
    const leEl = document.getElementById("le");
    if (!luEl || !lpEl || !leEl) return;

    const idVal = luEl.value.trim().toLowerCase();
    const pwVal = lpEl.value;

    if (!idVal || !pwVal) {
      leEl.style.color = "#b3261e";
      leEl.textContent = "Please enter your email/username and password.";
      return;
    }

    // 1. Check browser localStorage registered demo accounts
    const savedAccounts = getSavedDemoAccounts();
    const pwToken = demoHash(pwVal);
    const savedMatch = savedAccounts.find(
      a =>
        ((a.email && a.email.toLowerCase() === idVal) ||
          (a.name && a.name.toLowerCase() === idVal)) &&
        a.passToken === pwToken
    );

    if (savedMatch) {
      leEl.textContent = "";
      lpEl.value = "";
      completeAuthSession({
        name: savedMatch.name + " (Demo)",
        role: savedMatch.role === "f" ? "f" : "c",
        email: savedMatch.email,
        isDemo: true
      });
      return;
    }

    // 2. Check built-in demo accounts (anita / ramesh or demo email aliases)
    const builtInAliases = {
      "anita": { p: "anita123", role: "c", name: "Anita (Customer Demo)" },
      "customer@demo.com": { p: "anita123", role: "c", name: "Anita (Customer Demo)" },
      "ramesh": { p: "farm123", role: "f", name: "Ramesh (Farmer Demo)" },
      "farmer@demo.com": { p: "farm123", role: "f", name: "Ramesh (Farmer Demo)" }
    };

    const builtIn = (typeof ACC !== "undefined" && ACC[idVal]) || builtInAliases[idVal];
    if (builtIn && builtIn.p === pwVal) {
      leEl.textContent = "";
      lpEl.value = "";
      completeAuthSession({
        name: builtIn.name.includes("Demo") ? builtIn.name : builtIn.name + " (Demo)",
        role: builtIn.role,
        isDemo: true
      });
      return;
    }

    leEl.style.color = "#b3261e";
    leEl.textContent = "Invalid credentials. Use the Quick Demo buttons below or Sign Up first.";
  };

  function handleSignupSubmit(e) {
    if (e) e.preventDefault();
    const nameEl = document.getElementById("su-name");
    const emailEl = document.getElementById("su-email");
    const passEl = document.getElementById("su-pass");
    const confirmEl = document.getElementById("su-confirm");
    const roleEl = document.getElementById("su-role");
    const errEl = document.getElementById("su-err");

    if (!nameEl || !emailEl || !passEl || !confirmEl || !errEl) return;

    const fullName = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;
    const confirmPass = confirmEl.value;
    const acctRole = (roleEl && roleEl.value === "f") || signupRole === "f" ? "f" : "c";

    errEl.style.color = "#b3261e";

    if (!fullName) {
      errEl.textContent = "Please enter your Full Name.";
      nameEl.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = "Please enter a valid Email address.";
      emailEl.focus();
      return;
    }
    if (!pass) {
      errEl.textContent = "Please enter a demo Password.";
      passEl.focus();
      return;
    }
    if (pass.length < 4) {
      errEl.textContent = "Password must be at least 4 characters long.";
      passEl.focus();
      return;
    }
    if (!confirmPass) {
      errEl.textContent = "Please confirm your Password.";
      confirmEl.focus();
      return;
    }
    if (pass !== confirmPass) {
      errEl.textContent = "Passwords do not match. Please re-enter both passwords.";
      confirmEl.focus();
      return;
    }

    // Save demo account in browser localStorage (with non-reversible demo hash)
    saveDemoAccount({
      name: fullName,
      email: email,
      role: acctRole,
      passToken: demoHash(pass),
      isDemo: true,
      createdAt: new Date().toISOString()
    });

    errEl.textContent = "";
    const signupForm = document.getElementById("f2l-signup-form");
    if (signupForm) signupForm.reset();
    setSignupRole(acctRole);

    // Direct Customer to Customer Dashboard and Farmer to Farmer Dashboard
    completeAuthSession({
      name: fullName + " (Demo)",
      role: acctRole,
      email: email,
      isDemo: true
    });
  }

  function startDemoLogin(roleCode) {
    if (homeEl && portalEl) {
      homeEl.hidden = true;
      portalEl.hidden = false;
    }
    const isFarmer = roleCode === "f" || roleCode === "farmer";
    completeAuthSession({
      name: isFarmer ? "Ramesh (Farmer Demo)" : "Anita (Customer Demo)",
      role: isFarmer ? "f" : "c",
      isDemo: true
    });
  }

  // --------------------------------------------------------------------------
  // 5. Public Website Helpers (Hero Images, Shop Preview, Page Router)
  // --------------------------------------------------------------------------
  function initHeroImages() {
    if (typeof IMG === "undefined") return;
    const mapping = [
      ["hero-img-tomato", 9],
      ["hero-img-pepper", 21],
      ["hero-img-carrot", 18],
      ["hero-img-coriander", 24]
    ];
    mapping.forEach(([id, imgKey]) => {
      const el = document.getElementById(id);
      if (el && IMG[imgKey]) {
        el.src = IMG[imgKey];
      }
    });
  }

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

  function openPortal(targetAction) {
    if (!homeEl || !portalEl) return;
    homeEl.hidden = true;
    portalEl.hidden = false;

    if (mobileNavEl) {
      mobileNavEl.hidden = true;
      if (menuBtnEl) menuBtnEl.setAttribute("aria-expanded", "false");
    }

    if (targetAction === "signup") {
      if (typeof S !== "undefined" && S.user) {
        S.user = null;
        if (typeof save === "function") save();
        if (typeof view === "function") view();
      }
      setAuthMode("signup", "c");
    } else if (targetAction === "farmer") {
      if (typeof S !== "undefined" && S.user && S.user.role !== "f") {
        S.user = null;
        if (typeof save === "function") save();
        if (typeof view === "function") view();
      }
      setAuthMode("login", "farmer");
    } else {
      if (typeof S !== "undefined" && S.user && S.user.role !== "c") {
        S.user = null;
        if (typeof save === "function") save();
        if (typeof view === "function") view();
      }
      setAuthMode("login", "customer");
    }

    updatePortalTopBar();
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

  // --------------------------------------------------------------------------
  // 6. Event Listeners
  // --------------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    // Switch between Login and Sign Up tabs
    const authTabTrigger = e.target.closest("[data-auth-mode]");
    if (authTabTrigger) {
      e.preventDefault();
      setAuthMode(authTabTrigger.getAttribute("data-auth-mode"));
      return;
    }

    // Switch Sign Up Account Type (Customer / Farmer)
    const suRoleTrigger = e.target.closest("[data-su-role]");
    if (suRoleTrigger) {
      e.preventDefault();
      setSignupRole(suRoleTrigger.getAttribute("data-su-role"));
      return;
    }

    // Instant Demo Login buttons (Customer Demo / Farmer Demo)
    const demoTrigger = e.target.closest("[data-demo-login]");
    if (demoTrigger) {
      e.preventDefault();
      startDemoLogin(demoTrigger.getAttribute("data-demo-login"));
      return;
    }

    // Logout button — returns cleanly to the Login screen
    const logoutTrigger = e.target.closest("[data-logout]");
    if (logoutTrigger) {
      setTimeout(function () {
        if (homeEl && portalEl) {
          homeEl.hidden = true;
          portalEl.hidden = false;
        }
        setAuthMode("login");
        updatePortalTopBar();
        const leEl = document.getElementById("le");
        if (leEl) {
          leEl.style.color = "#1f5a3a";
          leEl.textContent = "Logged out successfully. You have returned to the login screen.";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 10);
      return;
    }

    // Open portal from public website buttons
    const portalTrigger = e.target.closest("[data-open-portal]");
    if (portalTrigger) {
      e.preventDefault();
      openPortal(portalTrigger.getAttribute("data-open-portal"));
      return;
    }

    // Return to public website
    const backTrigger = e.target.closest("[data-back-home]");
    if (backTrigger) {
      e.preventDefault();
      backToHome();
      return;
    }

    // Public 4-page navigation
    const pageTrigger = e.target.closest("[data-page-link]");
    if (pageTrigger) {
      e.preventDefault();
      showPage(pageTrigger.getAttribute("data-page-link"), true);
      return;
    }
  });

  // Sign Up form submission
  const signupForm = document.getElementById("f2l-signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }

  // Enter key on login username input
  const luInput = document.getElementById("lu");
  if (luInput) {
    luInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && typeof window.login === "function") {
        window.login();
      }
    });
  }

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

  // Initialize
  ensureDemoFarmerListings();
  initHeroImages();
  renderShopPreview();
  updatePortalTopBar();
  const initialHash = (window.location.hash || "").replace(/^#/, "");
  showPage(PAGES.includes(initialHash) ? initialHash : "home", false);
})();
