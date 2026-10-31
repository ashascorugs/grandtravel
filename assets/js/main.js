/* Grand Travel & Tours — plain JavaScript (no React, no libraries).
   Data (hero slides, packages, gallery) comes from content.js. */
(function () {
  "use strict";
  var D = window.GRAND_TRAVEL_CONTENT || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Scroll reveal + counters ---------- */
  function initReveal() {
    var items = $$("[data-reveal]");
    items.forEach(function (el) {
      var sibs = $$(":scope > [data-reveal]", el.parentNode);
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 0.09 + "s";
    });
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    /* mask lines sit fully clipped inside an overflow-hidden parent, so watch the parent */
    var map = new Map();
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (e.isIntersecting) { map.get(e.target).classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) {
      var t = el.dataset.reveal === "mask" ? el.parentNode : el;
      map.set(t, el); io.observe(t);
    });
  }

  function initCounters() {
    var els = $$("[data-count]");
    function run(el) {
      var end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 2500;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    });
    els.forEach(function (el) { el.textContent = "0" + (el.dataset.suffix || ""); io.observe(el); });
  }

  /* ---------- Header, progress bar, mobile menu ---------- */
  function initChrome() {
    var header = $("header"), bar = $("[data-progress]");
    var on = "py-2 backdrop-blur-md".split(" ");
    function onScroll() {
      var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      if (header) {
        header.classList.toggle("py-4", y <= 40);
        header.classList.toggle("is-scrolled", y > 40);
        on.forEach(function (c) { header.classList.toggle(c, y > 40); });
      }
      if (bar) bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var btn = $('button[aria-label="Open menu"]');
    if (!btn) return;
    var menu = document.createElement("div");
    menu.className = "gt-menu";
    menu.id = "gt-menu";
    menu.setAttribute("aria-hidden", "true");
    var progress = document.createElement("div");
    progress.className = "gt-menu-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = "<span></span>";
    var nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Mobile");
    $$("header nav a").forEach(function (a, index) {
      var link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.style.animationDelay = (0.09 + index * 0.085) + "s";
      if (a.hasAttribute("data-status")) link.classList.add("active");
      var number = document.createElement("span");
      number.className = "gt-menu-number";
      number.textContent = String(index + 1).padStart(2, "0");
      var label = document.createElement("span");
      label.className = "gt-menu-label";
      label.textContent = a.textContent.trim();
      var rule = document.createElement("span");
      rule.className = "gt-menu-rule";
      rule.setAttribute("aria-hidden", "true");
      link.appendChild(number);
      link.appendChild(label);
      link.appendChild(rule);
      nav.appendChild(link);
    });
    menu.appendChild(progress);
    menu.appendChild(nav);
    document.body.appendChild(menu);
    function set(open) {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      btn.setAttribute("aria-expanded", String(open));
      document.documentElement.classList.toggle("gt-menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) setTimeout(function () { var first = $("nav a", menu); if (first) first.focus(); }, 100);
      else if (menu.contains(document.activeElement)) btn.focus();
    }
    btn.setAttribute("aria-controls", menu.id);
    btn.addEventListener("click", function () { set(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) {
      if (e.target === menu || e.target.closest("a")) set(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* ---------- One-time brand intro ---------- */
  function initIntro() {
    var intro = $("[data-site-intro]");
    var root = document.documentElement;
    if (!intro) return;
    if (!root.classList.contains("gt-intro-pending") || reduce) {
      root.classList.remove("gt-intro-pending");
      intro.remove();
      return;
    }
    var start = Date.now(), finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      var delay = Math.max(250, 1350 - (Date.now() - start));
      setTimeout(function () {
        intro.classList.add("is-exiting");
        setTimeout(function () {
          intro.remove();
          root.classList.remove("gt-intro-pending");
        }, 850);
      }, delay);
    }
    var fallback = setTimeout(finish, 3200);
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
  }

  /* ---------- Hero slider ---------- */
  function initHero() {
    var hero = $('section[aria-roledescription="carousel"]'), S = D.heroSlides;
    if (!hero || !S || !S.length) return;
    var bgWrap = $("img", hero).parentNode, eyebrow = $("p", hero), h1 = $("h1 span", hero);
    var desc = $$("p", hero)[1], thumbs = $$('button[data-cursor="view"]', hero);
    var dots = $$('button[aria-label^="Go to"]', hero);
    var cur = 0, timer;
    var textEls = [eyebrow, h1, desc];
    function show(i) {
      cur = (i + S.length) % S.length;
      var s = S[cur], old = $("img", bgWrap), img = old.cloneNode();
      img.src = s.image; img.alt = s.title + " skyline"; img.style.opacity = 0;
      bgWrap.appendChild(img);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        img.style.transition = "opacity 1.2s ease"; img.style.opacity = 1;
      }); });
      setTimeout(function () { if (old.parentNode) old.remove(); }, 1300);
      textEls.forEach(function (el) { el.style.transition = "opacity .3s"; el.style.opacity = 0; });
      setTimeout(function () {
        eyebrow.lastChild.textContent = " " + s.eyebrow; h1.textContent = s.title.toUpperCase(); desc.textContent = s.text;
        textEls.forEach(function (el) { el.style.opacity = 1; });
      }, 300);
      var others = S.map(function (x, k) { return k; }).filter(function (k) { return k !== cur; }).slice(0, 3);
      thumbs.forEach(function (b, n) {
        var o = S[others[n]]; if (!o) return;
        b.dataset.index = others[n]; b.setAttribute("aria-label", "Show " + o.title);
        $("img", b).src = o.image; b.lastElementChild.textContent = o.title;
      });
      dots.forEach(function (d, k) {
        d.classList.toggle("w-6", k === cur); d.classList.toggle("bg-gold", k === cur);
        d.classList.toggle("w-1.5", k !== cur); d.classList.toggle("bg-foreground/50", k !== cur);
      });
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(function () { show(cur + 1); }, 6500);
    }
    thumbs.forEach(function (b) { b.addEventListener("click", function () { show(+b.dataset.index); }); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
    $('[aria-label="Previous slide"]', hero).addEventListener("click", function () { show(cur - 1); });
    $('[aria-label="Next slide"]', hero).addEventListener("click", function () { show(cur + 1); });
    thumbs.forEach(function (b, n) { b.dataset.index = (n + 1) % S.length; });
    show(0);
  }

  /* ---------- Lightbox + gallery (marquee and filter grid) ---------- */
  var lb;
  function openLightbox(items, i) {
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "gt-lb";
      lb.innerHTML = '<button class="gt-lb-x" aria-label="Close">&times;</button><button class="gt-lb-p" aria-label="Previous">&#8249;</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure><button class="gt-lb-n" aria-label="Next">&#8250;</button>';
      document.body.appendChild(lb);
      lb.addEventListener("click", function (e) {
        if (e.target === lb || e.target.closest(".gt-lb-x")) lb.close();
        else if (e.target.closest(".gt-lb-p")) lb.go(-1);
        else if (e.target.closest(".gt-lb-n")) lb.go(1);
      });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") lb.close();
        if (e.key === "ArrowRight") lb.go(1);
        if (e.key === "ArrowLeft") lb.go(-1);
      });
      lb.close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; };
      lb.go = function (d) { lb.show((lb.i + d + lb.items.length) % lb.items.length); };
      lb.show = function (n) {
        lb.i = n; var it = lb.items[n];
        $("img", lb).src = it.src; $("figcaption", lb).textContent = it.title;
      };
    }
    lb.items = items; lb.show(i); lb.classList.add("open"); document.body.style.overflow = "hidden";
  }

  function initGallery() {
    var cats = {};
    (D.gallery || []).forEach(function (g) { cats[g.title] = g.cat; });
    var btns = $$('button[aria-label^="Open "]').filter(function (b) { return $("img", b); });
    btns.forEach(function (b) {
      b.dataset.cat = cats[b.getAttribute("aria-label").slice(5)] || "";
    });
    function itemsOf(group) {
      return group.filter(function (b) { return !b.hidden; }).map(function (b) {
        var img = $("img", b); return { src: img.getAttribute("src"), title: img.alt };
      });
    }
    var groups = [];
    btns.forEach(function (b) {
      var p = b.parentNode, g = groups.filter(function (x) { return x.p === p; })[0];
      if (!g) groups.push(g = { p: p, list: [] });
      g.list.push(b);
    });
    groups.forEach(function (g) {
      g.list.forEach(function (b) {
        b.addEventListener("click", function () {
          var vis = g.list.filter(function (x) { return !x.hidden; });
          openLightbox(itemsOf(g.list), vis.indexOf(b));
        });
      });
      if (g.p.classList.contains("columns-1")) return; /* filter grid, not marquee */
      var x = 0, paused = false, sec = g.p.closest("section");
      g.p.style.willChange = "transform";
      g.p.parentNode.addEventListener("mouseenter", function () { paused = true; });
      g.p.parentNode.addEventListener("mouseleave", function () { paused = false; });
      function wrap() { var h = g.p.scrollWidth / 2; if (h) { while (x <= -h) x += h; while (x > 0) x -= h; } }
      var last = performance.now();
      (function loop(t) {
        var dt = t - last; last = t;
        if (!paused && !reduce && !(lb && lb.classList.contains("open"))) { x -= dt * 0.03; wrap(); g.p.style.transform = "translateX(" + x + "px)"; }
        requestAnimationFrame(loop);
      })(last);
      function step(d) { var w = g.list[0].offsetWidth || 260; x -= d * (w + 16); wrap(); g.p.style.transform = "translateX(" + x + "px)"; }
      $$("button", sec).forEach(function (b) {
        var l = (b.getAttribute("aria-label") || "").toLowerCase();
        if (l.indexOf("prev") === 0) b.addEventListener("click", function () { step(-1); });
        if (l.indexOf("next") === 0) b.addEventListener("click", function () { step(1); });
      });
    });

    /* gallery page filters */
    var filters = $$("button[aria-pressed]");
    if (!filters.length) return;
    var onC = "border-ink bg-ink text-gold".split(" "), offC = "border-ink/25 hover:border-ink".split(" ");
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        var c = f.textContent.trim();
        filters.forEach(function (o) {
          var a = o === f; o.setAttribute("aria-pressed", a);
          onC.forEach(function (k) { o.classList.toggle(k, a); });
          offC.forEach(function (k) { o.classList.toggle(k, !a); });
        });
        btns.forEach(function (b) { b.hidden = !(c === "All" || b.dataset.cat === c); });
      });
    });
  }

  /* ---------- Destination image quick view ---------- */
  function initDestinationQuickView() {
    var grid = $("[data-destination-grid]");
    if (grid) {
      var anchors = $$(":scope > div > a", grid);
      var images = anchors.map(function (a) { return $("img", a); });
      var items = images.map(function (img) {
        return { src: img.getAttribute("src"), title: img.alt };
      });
      anchors.forEach(function (anchor, index) {
        var details = document.createElement("a");
        details.href = anchor.getAttribute("href");
        details.className = "destination-details-link";
        details.textContent = "Explore destination ↗";
        details.setAttribute("aria-label", "Explore " + images[index].alt + " destination");

        var button = document.createElement("button");
        button.type = "button";
        button.className = anchor.className;
        button.innerHTML = anchor.innerHTML;
        button.dataset.quickView = "";
        button.dataset.cursor = "view";
        button.setAttribute("aria-label", "View " + images[index].alt + " image");
        button.addEventListener("click", function () { openLightbox(items, index); });
        anchor.replaceWith(button);
        button.parentNode.appendChild(details);
      });
    }

    var detailImages = $$("[data-destination-image]");
    if (detailImages.length) {
      var detailItems = detailImages.map(function (el) {
        var img = $("img", el);
        return { src: img.getAttribute("src"), title: img.alt };
      });
      detailImages.forEach(function (el, index) {
        el.setAttribute("role", "button");
        el.tabIndex = 0;
        el.dataset.cursor = "view";
        el.setAttribute("aria-label", "View " + detailItems[index].title + " image");
        el.addEventListener("click", function () { openLightbox(detailItems, index); });
        el.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLightbox(detailItems, index);
          }
        });
      });
    }
  }

  /* ---------- Gold cursor for mouse and trackpad ---------- */
  function initGoldCursor() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var cursor = document.createElement("div");
    cursor.className = "gold-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = "<span>View Image</span>";
    document.body.appendChild(cursor);
    document.body.classList.add("has-cursor");

    document.addEventListener("pointermove", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cursor.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0) translate(-50%,-50%)";
      cursor.classList.add("is-visible");
      var target = event.target.closest("[data-quick-view], [data-destination-image], button[aria-label^='Open '], a, button, [role='button']");
      var view = target && target.matches("[data-quick-view], [data-destination-image], button[aria-label^='Open ']");
      cursor.classList.toggle("is-view", !!view);
      cursor.classList.toggle("is-link", !!target && !view);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("is-visible"); });
    window.addEventListener("blur", function () { cursor.classList.remove("is-visible"); });
  }

  /* ---------- Package filter tabs ---------- */
  function initPackages() {
    var tabs = $$('[role="tab"]');
    if (!tabs.length) return;
    var cats = {};
    (D.packages || []).forEach(function (p) { cats[p.title] = p.categories || []; });
    var cards = $$("article").filter(function (a) { return $("h3", a) && cats[$("h3", a).textContent.trim()]; });
    var pill = $("span.absolute", tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0]);
    var onC = "border-gold text-primary-foreground".split(" "), offC = "border-foreground/20 text-foreground/75 hover:border-gold/60".split(" ");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var c = $("span.relative", t).textContent.trim();
        tabs.forEach(function (o) {
          var a = o === t; o.setAttribute("aria-selected", a);
          onC.forEach(function (k) { o.classList.toggle(k, a); });
          offC.forEach(function (k) { o.classList.toggle(k, !a); });
        });
        if (pill) t.insertBefore(pill, t.firstChild);
        cards.forEach(function (a) { a.hidden = !(c === "All" || cats[$("h3", a).textContent.trim()].indexOf(c) > -1); });
      });
    });
  }

  /* ---------- Forms (demo only — nothing is sent anywhere) ---------- */
  function initForms() {
    var f = $("form[novalidate]");
    if (f) {
      var rules = {
        name: [/\S/, "Please enter your full name."],
        phone: [/^[+\d\s-]{7,}$/, "Please enter a valid phone number."],
        email: [/^\S+@\S+\.\S+$/, "Please enter a valid email."],
        message: [/\S/, "Please tell us a little about your trip."]
      };
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var bad = 0;
        $$(".gt-err", f).forEach(function (n) { n.remove(); });
        Object.keys(rules).forEach(function (k) {
          var el = f.elements[k];
          if (!rules[k][0].test(el.value || "")) {
            bad++;
            var p = document.createElement("p");
            p.className = "gt-err"; p.textContent = rules[k][1];
            el.parentNode.appendChild(p);
          }
        });
        if (bad) return;
        var b = $("button", f); b.disabled = true; b.textContent = "Sending…";
        setTimeout(function () {
          f.innerHTML = '<div class="sm:col-span-2 gt-ok"><h3 class="font-display text-3xl">Thank you!</h3><p>Your inquiry has been received. Our team will contact you shortly.</p></div>';
        }, 900);
      });
    }
    var ff = $("footer form");
    if (ff) ff.addEventListener("submit", function (e) {
      e.preventDefault();
      ff.outerHTML = '<p class="gt-ok mt-6">Thank you! We will get back to you soon.</p>';
    });
  }

  /* ---------- Contact details and office map ---------- */
  function initContactDetails() {
    var contact = D.contact;
    if (!contact) return;
    var fields = $$('[data-contact-value]');
    fields.forEach(function (el) {
      var key = el.dataset.contactValue;
      if (contact[key]) el.textContent = contact[key];
    });
    $$('[data-contact-link="phone"]').forEach(function (el) {
      if (contact.phone) el.href = "tel:" + contact.phone.replace(/[^+\d]/g, "");
    });
    $$('[data-contact-link="whatsapp"]').forEach(function (el) {
      if (contact.whatsapp) el.href = "https://wa.me/" + contact.whatsapp.replace(/\D/g, "");
    });
    $$('[data-contact-link="email"]').forEach(function (el) {
      if (contact.email) el.href = "mailto:" + contact.email;
    });

    var mapQuery = contact.mapQuery || contact.address;
    var mapFrame = $("[data-map-frame]");
    var mapLink = $("[data-map-directions]");
    if (mapQuery && mapFrame) {
      mapFrame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(mapQuery) + "&output=embed";
      if (mapLink) mapLink.href = contact.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery);
    }
    $$('[data-contact-link="address"]').forEach(function (el) {
      if (mapQuery) el.href = contact.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery);
    });
  }

  function init() {
    [initIntro, initReveal, initCounters, initChrome, initHero, initGallery, initDestinationQuickView, initPackages, initForms, initContactDetails, initGoldCursor].forEach(function (fn) {
      try { fn(); } catch (err) { console.error(fn.name, err); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();


/* Continuous testimonial marquee */
(() => {
        const track = document.querySelector('[data-testimonial-track]');
        const originalSet = document.querySelector('[data-testimonial-set]');
        if (!track || !originalSet) return;

        const duplicateSet = originalSet.cloneNode(true);
        duplicateSet.removeAttribute('data-testimonial-set');
        duplicateSet.setAttribute('aria-hidden', 'true');
        duplicateSet.querySelectorAll('[data-reveal]').forEach((element) => {
          element.removeAttribute('data-reveal');
        });
        track.appendChild(duplicateSet);
      })();
