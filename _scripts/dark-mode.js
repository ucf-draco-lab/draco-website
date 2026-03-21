/*
  manages color theme selection.
*/

{
  const themes = [
    { id: "deep-space", label: "Deep Space" },
    { id: "nebula", label: "Nebula" },
    { id: "aurora", label: "Aurora" },
    { id: "solar-flare", label: "Solar Flare" },
    { id: "ucf-knight", label: "UCF Knight" },
    { id: "lunar-surface", label: "Lunar" },
  ];

  // immediately load saved (or default) theme before page renders
  const saved = window.localStorage.getItem("color-theme") || "deep-space";
  document.documentElement.dataset.theme = saved;
  // keep data-dark true for all themes (all are dark)
  document.documentElement.dataset.dark = "true";

  const onLoad = () => {
    // build the theme picker dots
    const picker = document.querySelector(".theme-picker");
    if (!picker) return;

    themes.forEach((t) => {
      const dot = document.createElement("button");
      dot.className = "theme-dot";
      dot.dataset.theme = t.id;
      dot.setAttribute("aria-label", t.label + " theme");
      dot.setAttribute("data-tooltip", t.label);
      if (t.id === saved) dot.classList.add("active");
      dot.addEventListener("click", () => selectTheme(t.id));
      picker.appendChild(dot);
    });
  };

  const selectTheme = (id) => {
    document.documentElement.dataset.theme = id;
    window.localStorage.setItem("color-theme", id);
    document.querySelectorAll(".theme-dot").forEach((d) => {
      d.classList.toggle("active", d.dataset.theme === id);
    });
  };

  // expose for inline use
  window.selectTheme = selectTheme;

  window.addEventListener("load", onLoad);
}
