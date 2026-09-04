/*
  Alumni table: filtering, multi-column sorting, grouping, and a table/cards
  view switch. Every row is already in the DOM (see _includes/alumni-table.html)
  and carries its values as data-* attributes, so this only reorders, shows and
  hides — nothing is fetched or re-rendered from scratch.
*/

{
  // columns the user can sort/group/filter by, and how each one compares
  const COLUMNS = {
    first: { label: "First", type: "text" },
    last: { label: "Last", type: "text" },
    major: { label: "Major", type: "text" },
    // levels sort by their academic rank, not alphabetically, so B.S. comes
    // before M.S. comes before Ph.D. — data-level-rank carries that rank
    level: { label: "Level", type: "rank", rankAttr: "levelRank" },
    // years read best newest-first, so that's the direction a click or a
    // group-by promotion starts from
    year: { label: "Year", type: "number", firstDir: "desc" },
    sponsor: { label: "Sponsor / Scholar", type: "text" },
    company: { label: "First Company", type: "text" },
  };

  const STORAGE_KEY = "draco-alumni-view";

  const value = (row, col) => (row.dataset[col] || "").trim();

  // Blank cells always sort last, whichever direction the column is going, so
  // "unknown" never masquerades as the smallest or largest value.
  const compare = (a, b, col, dir) => {
    const spec = COLUMNS[col];
    const av = value(a, col);
    const bv = value(b, col);
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;

    let result = 0;
    if (spec.type === "number") {
      result = Number(av) - Number(bv);
    } else if (spec.type === "rank") {
      result = Number(a.dataset[spec.rankAttr]) - Number(b.dataset[spec.rankAttr]);
    } else {
      result = av.localeCompare(bv, undefined, { sensitivity: "base" });
    }
    return dir === "desc" ? -result : result;
  };

  const setup = (view) => {
    const table = view.querySelector(".alumni-table");
    if (!table) return;

    const body = table.querySelector("tbody");
    const rows = [...body.querySelectorAll("tr[data-level]")];
    const columnCount = table.querySelectorAll("thead th").length;
    const noResults = view.querySelector(".alumni-noresults");
    const count = view.querySelector(".alumni-count");
    const chips = view.querySelector(".alumni-sortchips");
    const groupBy = view.querySelector(".alumni-groupby");
    const search = view.querySelector(".alumni-search");
    const facets = [...view.querySelectorAll(".alumni-facet")];

    // defaults come from the markup so the no-JS order and the JS order agree
    const parseSort = (text) =>
      (text || "")
        .split(",")
        .map((part) => part.split(":"))
        .filter(([col]) => COLUMNS[col])
        .map(([col, dir]) => ({ col, dir: dir === "desc" ? "desc" : "asc" }));

    const defaultSort = parseSort(table.dataset.sort);
    const defaultGroup = table.dataset.group || "";

    let sorts = defaultSort.map((s) => ({ ...s }));

    // fill each dropdown with the values actually present in the table
    for (const facet of facets) {
      const col = facet.dataset.filter;
      const seen = new Set();
      for (const row of rows) {
        const raw = value(row, col);
        if (!raw) continue;
        // a sponsor cell can list more than one designation
        for (const part of raw.split(",")) {
          const item = part.trim();
          if (item) seen.add(item);
        }
      }
      const sorted = [...seen].sort((a, b) =>
        col === "year" ? Number(b) - Number(a) : a.localeCompare(b)
      );
      for (const item of sorted) {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        facet.append(option);
      }
    }

    const matches = (row) => {
      const query = (search?.value || "").trim().toLowerCase();
      if (query) {
        const haystack = Object.keys(COLUMNS)
          .map((col) => value(row, col))
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      for (const facet of facets) {
        if (!facet.value) continue;
        const col = facet.dataset.filter;
        const parts = value(row, col)
          .split(",")
          .map((part) => part.trim());
        if (!parts.includes(facet.value)) return false;
      }
      return true;
    };

    const renderChips = () => {
      const group = groupBy.value;
      const chain = effectiveSorts();
      chips.replaceChildren();
      if (!chain.length) {
        const span = document.createElement("span");
        span.className = "alumni-chip alumni-chip-empty";
        span.textContent = "nothing";
        chips.append(span);
        return;
      }
      chain.forEach(({ col, dir }, index) => {
        const grouped = col === group;
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = grouped ? "alumni-chip alumni-chip-group" : "alumni-chip";
        chip.dataset.col = col;
        chip.textContent = `${index + 1}. ${grouped ? "grouped by " : ""}${
          COLUMNS[col].label
        } ${dir === "asc" ? "↑" : "↓"}`;
        chip.title = grouped
          ? `Stop grouping by ${COLUMNS[col].label}`
          : `Remove ${COLUMNS[col].label} from the sort`;
        chip.addEventListener("click", () => {
          if (grouped) groupBy.value = "";
          else sorts = sorts.filter((s) => s.col !== col);
          apply();
        });
        chips.append(chip);
      });
    };

    const renderHeaders = () => {
      const chain = effectiveSorts();
      for (const th of table.querySelectorAll("thead th[data-col]")) {
        const index = chain.findIndex((s) => s.col === th.dataset.col);
        const marker = th.querySelector(".alumni-sort-marker");
        if (index < 0) {
          th.setAttribute("aria-sort", "none");
          if (marker) marker.textContent = "";
        } else {
          const { dir } = chain[index];
          th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
          if (marker) {
            marker.textContent =
              (dir === "asc" ? "↑" : "↓") +
              (chain.length > 1 ? String(index + 1) : "");
          }
        }
      }
    };

    // A grouped table has to be ordered by its grouping column first, or the
    // groups interleave. The user's chain then breaks ties inside each group.
    const effectiveSorts = () => {
      const group = groupBy.value;
      if (!group || !COLUMNS[group]) return sorts;
      const existing = sorts.find((s) => s.col === group);
      const dir = existing ? existing.dir : COLUMNS[group].firstDir || "asc";
      return [{ col: group, dir }, ...sorts.filter((s) => s.col !== group)];
    };

    const apply = () => {
      const visible = rows.filter(matches);
      const chain = effectiveSorts();

      const ordered = [...visible].sort((a, b) => {
        for (const { col, dir } of chain) {
          const result = compare(a, b, col, dir);
          if (result) return result;
        }
        return 0;
      });

      // drop the previous grouping headers, then re-lay the rows out
      for (const header of body.querySelectorAll(".alumni-grouprow")) header.remove();
      for (const row of rows) row.hidden = true;

      const group = groupBy.value;
      let lastGroup = null;
      for (const row of ordered) {
        if (group) {
          const label = value(row, group) || "—";
          if (label !== lastGroup) {
            lastGroup = label;
            const tr = document.createElement("tr");
            tr.className = "alumni-grouprow";
            const th = document.createElement("th");
            th.colSpan = columnCount;
            th.scope = "colgroup";
            th.textContent = label;
            tr.append(th);
            body.append(tr);
          }
        }
        row.hidden = false;
        body.append(row);
      }

      const people = new Set(ordered.map((row) => `${value(row, "first")} ${value(row, "last")}`));
      noResults.hidden = ordered.length > 0;
      count.textContent = ordered.length
        ? `${ordered.length} degree${ordered.length === 1 ? "" : "s"} awarded to ${
            people.size
          } alum${people.size === 1 ? "" : "ni"}.`
        : "";

      renderChips();
      renderHeaders();
    };

    // click sorts by that column alone; shift-click adds it to the chain
    for (const th of table.querySelectorAll("thead th[data-col]")) {
      const button = th.querySelector(".alumni-sort");
      if (!button) continue;
      button.addEventListener("click", (event) => {
        const col = th.dataset.col;
        const first = COLUMNS[col].firstDir || "asc";
        const existing = effectiveSorts().find((s) => s.col === col);
        const flipped = existing && existing.dir === "asc" ? "desc" : "asc";
        if (event.shiftKey) {
          const inChain = sorts.find((s) => s.col === col);
          if (inChain) inChain.dir = flipped;
          else sorts.push({ col, dir: existing ? flipped : first });
        } else {
          sorts = [{ col, dir: existing ? flipped : first }];
        }
        apply();
      });
    }

    search?.addEventListener("input", apply);
    for (const facet of facets) facet.addEventListener("change", apply);
    groupBy.addEventListener("change", apply);

    view.querySelector(".alumni-reset")?.addEventListener("click", () => {
      if (search) search.value = "";
      for (const facet of facets) facet.value = "";
      groupBy.value = defaultGroup;
      sorts = defaultSort.map((s) => ({ ...s }));
      apply();
    });

    // view switch, remembered per browser
    const setView = (name, remember) => {
      view.dataset.view = name;
      for (const button of view.querySelectorAll("[data-view-btn]"))
        button.setAttribute("aria-pressed", String(button.dataset.viewBtn === name));
      for (const panel of view.querySelectorAll(".alumni-panel"))
        panel.hidden = panel.dataset.panel !== name;
      if (!remember) return;
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch (error) {
        // private windows and blocked site data - the view just won't persist
      }
    };

    for (const button of view.querySelectorAll("[data-view-btn]"))
      button.addEventListener("click", () => setView(button.dataset.viewBtn, true));

    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      saved = null;
    }
    setView(saved === "cards" ? "cards" : "table", false);

    groupBy.value = defaultGroup;
    apply();
  };

  window.addEventListener("load", () => {
    for (const view of document.querySelectorAll(".alumni-view")) setup(view);
  });
}
