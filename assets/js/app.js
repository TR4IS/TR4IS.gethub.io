/*
  ================== app.js ==================
  WHAT THIS DOES
  - Simple "router" that shows exactly one <section> based on the URL hash.
  - Updates the top-left brand label when the page changes.
  - Highlights the active nav link.

  HOW TO ADD A NEW PAGE
  1) Add a new <section id="newpage">...</section> in index.html
  2) Add "newpage" to SECTIONS below
  3) Add a <a href="#newpage"> link in the header
*/

const SECTIONS = ["home", "is", "projects", "contact"]; // add ids here if you create more pages

const brandText = document.getElementById("brandText");
const navLinks = [...document.querySelectorAll(".navlink")];

// show one section and hide the rest
function setActive(hash) {
  SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    const on = id === hash;
    el.classList.toggle("hidden", !on);
    el.setAttribute("aria-hidden", String(!on));
  });

  // update the brand text on the top-left
  const label = hash === "home" ? "reachflow.home()" : `reachflow.${hash}()`;
  brandText.textContent = label;

  // update active state in the top-right nav
  navLinks.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + hash);
  });

  // small mobile nicety: snap to top on change
  window.scrollTo({ top: 0, behavior: "instant" });
}

function route() {
  const hash = (location.hash || "#home").replace("#", "");
  if (!SECTIONS.includes(hash)) {
    location.hash = "#home"; // unknown hash → go home
    return;
  }
  setActive(hash);
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#home"; // default if no hash
  route();
  // footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
