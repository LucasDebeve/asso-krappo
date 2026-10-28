/*
 * Rendu du site Krappo à partir des fichiers JSON de /content.
 * Aucun contenu n'est écrit en dur ici : tout se modifie dans content/site.json
 * et content/statuts.json.
 */
(function () {
  "use strict";

  /* ---------- Utilitaires ---------- */

  // Crée un élément DOM. Les enfants peuvent être des chaînes (insérées comme texte)
  // ou des nœuds ; les valeurs null/false sont ignorées.
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false || child === "") continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Impossible de charger ${path} (${res.status})`);
    return res.json();
  }

  const isExternal = (href) => /^https?:\/\//.test(href);

  function link(item, className) {
    if (!item || !item.href) return null;
    return h("a", {
      class: className,
      href: item.href,
      target: isExternal(item.href) ? "_blank" : null,
      rel: isExternal(item.href) ? "noopener" : null,
    }, item.label);
  }

  function initials(name) {
    return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  /* ---------- Thème ---------- */

  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement.style;
    const vars = {
      "--primary-light": theme.primary,
      "--primary-dark": theme.primaryDark,
      "--accent-light": theme.accent,
      "--accent-dark": theme.accentDark,
    };
    for (const [name, value] of Object.entries(vars)) if (value) root.setProperty(name, value);

    const fonts = [theme.fontHeading, theme.fontBody].filter(Boolean);
    if (fonts.length) {
      const families = [...new Set(fonts)]
        .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
        .join("&");
      document.head.append(h("link", { rel: "stylesheet", href: `https://fonts.googleapis.com/css2?${families}&display=swap` }));
      if (theme.fontHeading) root.setProperty("--font-heading", `"${theme.fontHeading}"`);
      if (theme.fontBody) root.setProperty("--font-body", `"${theme.fontBody}"`);
    }
  }

  /* ---------- En-tête et pied de page ---------- */

  function renderHeader(site, page) {
    const header = document.getElementById("site-header");
    const home = page === "accueil" ? "" : "index.html";

    const brand = h("a", { class: "brand", href: home || "#top" },
      site.logo && site.logo.image
        ? h("img", { src: site.logo.image, alt: site.logo.alt || site.site.name, height: "40" })
        : [h("span", { class: "brand-mark", "aria-hidden": "true" }, site.site.name[0]), h("span", { class: "brand-name" }, site.site.name)]
    );

    const items = site.sections
      .filter((s) => s.navLabel && s.enabled !== false)
      .map((s) => ({ label: s.navLabel, href: `${home}#${s.id}` }));
    items.push({ label: "Statuts", href: "statuts.html", current: page === "statuts" });

    const list = h("ul", { class: "nav-list", id: "nav-list" },
      items.map((item) => h("li", {}, h("a", { href: item.href, "aria-current": item.current ? "page" : null }, item.label)))
    );

    const toggle = h("button", {
      class: "nav-toggle", type: "button", "aria-expanded": "false", "aria-controls": "nav-list",
      onclick: () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        header.classList.toggle("nav-open", !open);
      },
    }, h("span", { class: "visually-hidden" }, "Menu"), h("span", { class: "nav-toggle-bar", "aria-hidden": "true" }));

    list.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    header.append(h("div", { class: "container header-inner" }, brand, h("nav", { "aria-label": "Navigation principale" }, toggle, list)));
  }

  function renderFooter(site) {
    const footer = document.getElementById("site-footer");
    const f = site.footer || {};
    footer.append(h("div", { class: "container footer-inner" },
      h("div", {},
        h("p", { class: "footer-name" }, site.site.name),
        f.text && h("p", { class: "footer-text" }, f.text)
      ),
      f.links && f.links.length && h("ul", { class: "footer-links" }, f.links.map((l) => h("li", {}, link(l))))
    ));
  }

  /* ---------- Page d'accueil ---------- */

  function sectionShell(section, ...content) {
    return h("section", { class: `section section-${section.type}`, id: section.id, "aria-labelledby": `${section.id}-title` },
      h("div", { class: "container" },
        h("h2", { class: "section-title", id: `${section.id}-title` }, section.title),
        content
      )
    );
  }

  function intro(text) {
    return text ? h("p", { class: "section-intro" }, text) : null;
  }

  function renderHero(hero) {
    if (!hero) return null;
    return h("section", { class: "hero", id: "top" },
      h("div", { class: "container hero-inner" },
        h("div", { class: "hero-text" },
          hero.eyebrow && h("p", { class: "eyebrow" }, hero.eyebrow),
          h("h1", {}, hero.title),
          hero.text && h("p", { class: "hero-lead" }, hero.text),
          hero.actions && h("div", { class: "actions" }, hero.actions.map((a) => link(a, `btn btn-${a.style || "primary"}`)))
        ),
        h("div", { class: "hero-art", "aria-hidden": "true" },
          h("span", { class: "shape shape-1" }), h("span", { class: "shape shape-2" }), h("span", { class: "shape shape-3" })
        )
      )
    );
  }

  const renderers = {
    text(s) {
      return sectionShell(s,
        h("div", { class: "prose" }, (s.paragraphs || []).map((p) => h("p", {}, p))),
        s.action && h("div", { class: "actions" }, link(s.action, "btn btn-secondary"))
      );
    },

    app(s) {
      return sectionShell(s,
        intro(s.intro),
        h("ul", { class: "card-grid" }, (s.features || []).map((f, i) =>
          h("li", { class: "card" },
            h("span", { class: "card-index", "aria-hidden": "true" }, String(i + 1).padStart(2, "0")),
            h("h3", {}, f.title),
            h("p", {}, f.text)
          )
        )),
        (s.note || s.action) && h("div", { class: "callout" },
          s.note && h("p", {}, s.note),
          link(s.action, "btn btn-primary")
        )
      );
    },

    events(s) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = (s.events || [])
        .filter((e) => e.date && new Date(`${e.endDate || e.date}T00:00:00`) >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

      const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });
      const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
      const fullFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

      const list = upcoming.length
        ? h("ul", { class: "event-list" }, upcoming.map((e) => {
            const start = new Date(`${e.date}T00:00:00`);
            const when = e.endDate && e.endDate !== e.date
              ? `Du ${fullFmt.format(start)} au ${fullFmt.format(new Date(`${e.endDate}T00:00:00`))}`
              : fullFmt.format(start);
            return h("li", { class: "event" },
              h("time", { class: "event-date", datetime: e.date },
                h("span", { class: "event-day" }, dayFmt.format(start)),
                h("span", { class: "event-month" }, monthFmt.format(start).replace(".", ""))
              ),
              h("div", { class: "event-body" },
                h("h3", {}, e.title),
                h("p", { class: "event-meta" }, [when, e.time, e.location].filter(Boolean).join(" · ")),
                e.description && h("p", {}, e.description),
                e.link && link(e.link, "event-link")
              )
            );
          }))
        : h("p", { class: "empty" }, s.emptyText || "Aucun événement à venir.");

      return sectionShell(s, intro(s.intro), list);
    },

    team(s) {
      return sectionShell(s,
        intro(s.intro),
        h("ul", { class: "team-grid" }, (s.members || []).map((m) =>
          h("li", { class: "member" },
            m.photo
              ? h("img", { class: "avatar", src: m.photo, alt: "", loading: "lazy", width: "96", height: "96" })
              : h("span", { class: "avatar avatar-initials", "aria-hidden": "true" }, initials(m.name)),
            h("h3", {}, m.name),
            m.role && h("p", { class: "member-role" }, m.role),
            m.bio && h("p", { class: "member-bio" }, m.bio)
          )
        ))
      );
    },

    contact(s) {
      const hasForm = Boolean(s.formUrl);
      return sectionShell(s,
        h("div", { class: "contact-box" },
          s.text && h("p", { class: "section-intro" }, s.text),
          hasForm && !s.embed && h("div", { class: "actions" }, link({ label: s.formLabel || "Nous écrire", href: s.formUrl }, "btn btn-primary")),
          hasForm && s.embed && h("iframe", {
            class: "contact-embed", src: s.formUrl, title: s.title, loading: "lazy",
            style: `height:${Number(s.embedHeight) || 720}px`,
          }),
          !hasForm && h("p", { class: "empty" }, "Le formulaire de contact sera bientôt disponible.")
        )
      );
    },
  };

  function renderHome(site) {
    const main = document.getElementById("main");
    main.append(renderHero(site.hero));
    for (const section of site.sections) {
      if (section.enabled === false) continue;
      const render = renderers[section.type];
      if (render) main.append(render(section));
      else console.warn(`Type de section inconnu : ${section.type}`);
    }
  }

  /* ---------- Page Statuts ---------- */

  function fill(text, fields) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] || "");
  }

  // Met en gras le terme qui précède « : » en début d'élément de liste
  // (« Convocation : … », « membres actifs : … »).
  function listItem(text) {
    const match = text.match(/^([^:;]{1,40}) : (.*)$/s);
    return match ? h("li", {}, h("strong", {}, match[1]), ` : ${match[2]}`) : h("li", {}, text);
  }

  function renderBlocks(blocs, fields) {
    return blocs
      .filter((b) => !b.si || fields[b.si])
      .map((b) => {
        if (b.liste) return h("ul", {}, b.liste.map((t) => listItem(fill(t, fields))));
        if (b.tableau) {
          return h("div", { class: "table-wrap" }, h("table", {},
            h("thead", {}, h("tr", {}, b.tableau.entetes.map((c) => h("th", { scope: "col" }, c)))),
            h("tbody", {}, b.tableau.lignes.map((row) => h("tr", {}, row.map((c) => h("td", {}, c)))))
          ));
        }
        return h("p", {},
          b.label && h("span", { class: "point-label" }, `${b.label} `),
          b.sousTitre && h("strong", {}, `${b.sousTitre} `),
          fill(b.p || "", fields)
        );
      });
  }

  function renderStatuts(statuts) {
    const main = document.getElementById("main");
    const fields = statuts.fields || {};

    const toc = h("nav", { class: "toc", "aria-label": "Sommaire des statuts" },
      h("p", { class: "toc-title" }, "Sommaire"),
      h("ol", {},
        statuts.titres.map((t, i) => h("li", {},
          h("a", { href: `#titre-${i + 1}` }, t.titre),
          h("ol", {}, t.articles.map((a) => h("li", {}, h("a", { href: `#article-${a.numero}` }, `Art. ${a.numero} – ${a.titre}`))))
        )),
        (statuts.annexes || []).map((a) => h("li", {}, h("a", { href: `#${a.id}` }, a.titre)))
      )
    );

    const body = h("div", { class: "statuts-body" },
      statuts.titres.map((t, i) => h("section", { class: "statuts-titre", id: `titre-${i + 1}` },
        h("h2", {}, t.titre),
        t.articles.map((a) => h("article", { class: "statuts-article", id: `article-${a.numero}` },
          h("h3", {}, h("span", { class: "article-num" }, `Article ${a.numero}`), ` – ${a.titre}`),
          renderBlocks(a.blocs, fields)
        ))
      )),
      (statuts.annexes || []).map((a) => h("section", { class: "statuts-titre", id: a.id },
        h("h2", {}, a.titre),
        renderBlocks(a.blocs, fields)
      ))
    );

    main.append(
      h("div", { class: "page-head" },
        h("div", { class: "container" },
          h("p", { class: "eyebrow" }, "Documents"),
          h("h1", {}, statuts.title),
          statuts.intro && h("p", { class: "hero-lead" }, statuts.intro),
          h("div", { class: "actions" },
            fields.pdf && link({ label: "Télécharger en PDF", href: fields.pdf }, "btn btn-primary"),
            h("button", { class: "btn btn-secondary", type: "button", onclick: () => window.print() }, "Imprimer")
          )
        )
      ),
      h("div", { class: "container statuts-layout" }, toc, body)
    );
  }

  /* ---------- Démarrage ---------- */

  async function init() {
    const page = document.body.dataset.page;
    const main = document.getElementById("main");
    try {
      const site = await loadJSON("content/site.json");
      applyTheme(site.theme);
      renderHeader(site, page);
      renderFooter(site);

      if (page === "statuts") renderStatuts(await loadJSON("content/statuts.json"));
      else renderHome(site);

      // Le contenu est injecté après le chargement : on rejoue l'ancre éventuelle.
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView();
      }
    } catch (err) {
      console.error(err);
      main.append(h("p", { class: "container notice" }, "Le contenu du site n'a pas pu être chargé. Réessayez dans un instant."));
    }
  }

  init();
})();
