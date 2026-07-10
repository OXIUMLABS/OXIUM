/* ==========================================================
   OXIUM — lógica de tienda + cuentas + niveles
   Todo se guarda en localStorage: funciona sin backend.
   ========================================================== */

// ---------- Datos del catálogo ----------
// swatch: color de fondo del "textil" ; icon: silueta SVG simple
const PRODUCTS = [
  { id: "p1", name: "Chaqueta Oxide Trench", desc: "Gabardina resistente al agua", price: 1890, swatch: "#b5651d" },
  { id: "p2", name: "Pantalón Alloy Cargo", desc: "Corte recto, bolsillos utilitarios", price: 1290, swatch: "#7c93a3" },
  { id: "p3", name: "Camiseta Raw Steel", desc: "Algodón pesado 240g", price: 590, swatch: "#9ca3a1" },
  { id: "p4", name: "Sudadera Patina Hoodie", desc: "Interior afelpado", price: 1450, swatch: "#4c7a69" },
  { id: "p5", name: "Falda Titanium Pleat", desc: "Plisado permanente", price: 1190, swatch: "#e8e6e1" },
  { id: "p6", name: "Chaleco Corrosión", desc: "Acolchado ligero", price: 1590, swatch: "#8a4a2a" },
];

const JACKET_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#f2f2f0" stroke-width="1.2"><path d="M8 2l4 2 4-2 4 4-2 3v13H4V9L2 6l6-4z"/></svg>`;

// ---------- Niveles (escala técnica, acentos en verde) ----------
const LEVELS = [
  { id: "base", name: "Base / 01", threshold: 0, color: "#2f4a38", desc: "Cuenta recién registrada." },
  { id: "field", name: "Field / 02", threshold: 100, color: "#3f6b4c", desc: "Primeras compras registradas." },
  { id: "tactical", name: "Tactical / 03", threshold: 300, color: "#4c8a5c", desc: "Cliente frecuente. Acceso a lanzamientos anticipados." },
  { id: "command", name: "Command / 04", threshold: 700, color: "#5fd97a", desc: "Alta fidelidad. Beneficios prioritarios en envíos." },
  { id: "prototype", name: "Prototype / 05", threshold: 1500, color: "#9cff9c", desc: "Nivel máximo. Acceso total a beneficios Oxium." },
];

function getLevelInfo(points) {
  let current = LEVELS[0], next = LEVELS[1] || null;
  for (const lvl of LEVELS) {
    if (points >= lvl.threshold) {
      current = lvl;
      next = LEVELS[LEVELS.indexOf(lvl) + 1] || null;
    }
  }
  const progress = next
    ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;
  return { current, next, progress };
}

// 1 punto por cada $10 MXN gastados
function pointsFromAmount(amount) {
  return Math.round(amount / 10);
}

// ---------- Estado (localStorage) ----------
const STORAGE_KEY = "oxium_user";
const CART_KEY = "oxium_cart";

function loadUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function saveUser(user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }
function clearUser() { localStorage.removeItem(STORAGE_KEY); }

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

let user = loadUser();
let cart = loadCart();

// ---------- Toast ----------
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2200);
}

// ---------- Render: catálogo ----------
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-swatch" style="background:${p.swatch}33">${JACKET_SVG}</div>
      <p class="product-name">${p.name}</p>
      <p class="product-desc">${p.desc}</p>
      <div class="product-row">
        <span class="price">$${p.price.toLocaleString("es-MX")} MXN</span>
        <button class="add-btn" data-id="${p.id}">Agregar</button>
      </div>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

// ---------- Carrito ----------
function addToCart(productId) {
  const existing = cart.find((i) => i.id === productId);
  if (existing) existing.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  saveCart(cart);
  renderCart();
  showToast("Agregado al carrito");
}

function removeFromCart(productId) {
  cart = cart.filter((i) => i.id !== productId);
  saveCart(cart);
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = PRODUCTS.find((p) => p.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function renderCart() {
  const list = document.getElementById("cartList");
  const countEl = document.getElementById("cartCount");
  list.innerHTML = "";
  let totalQty = 0;

  if (cart.length === 0) {
    list.innerHTML = `<li style="justify-content:center">Tu carrito está vacío.</li>`;
  }

  cart.forEach((item) => {
    const p = PRODUCTS.find((p) => p.id === item.id);
    if (!p) return;
    totalQty += item.qty;
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="cart-item-name">
        <span>${p.name}</span>
        <small>x${item.qty} — $${(p.price * item.qty).toLocaleString("es-MX")} MXN</small>
      </div>
      <button class="remove-btn" data-id="${item.id}" aria-label="Quitar">&times;</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });

  document.getElementById("cartTotal").textContent = `$${cartTotal().toLocaleString("es-MX")} MXN`;
  countEl.textContent = totalQty;
}

function checkout() {
  if (cart.length === 0) { showToast("Tu carrito está vacío"); return; }
  if (!user) { showToast("Inicia sesión para acumular puntos"); openOverlay("accountOverlay"); return; }

  const total = cartTotal();
  const earned = pointsFromAmount(total);
  user.points += earned;
  user.history.push({ label: `Compra ($${total.toLocaleString("es-MX")} MXN)`, points: earned });
  saveUser(user);

  cart = [];
  saveCart(cart);
  renderCart();
  renderProfile();
  showToast(`Compra realizada. +${earned} pts`);
  closeOverlay("cartOverlay");
}

// ---------- Cuenta ----------
function login(name, email) {
  user = loadUser() && loadUser().email === email
    ? loadUser()
    : { name, email, points: 0, history: [] };
  saveUser(user);
  renderProfile();
}

function logout() {
  user = null;
  clearUser();
  document.getElementById("navUserLabel").textContent = "Cuenta";
  document.getElementById("authView").classList.remove("hidden");
  document.getElementById("profileView").classList.add("hidden");
}

function renderProfile() {
  if (!user) return;
  document.getElementById("navUserLabel").textContent = user.name.split(" ")[0];
  document.getElementById("authView").classList.add("hidden");
  document.getElementById("profileView").classList.remove("hidden");

  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;

  const { current, next, progress } = getLevelInfo(user.points);
  document.getElementById("levelBadge").style.background = current.color + "33";
  document.getElementById("levelBadge").style.borderColor = current.color;
  document.getElementById("levelName").textContent = `${current.name} · ${user.points} pts`;
  document.getElementById("levelNext").textContent = next ? `${next.threshold - user.points} pts → ${next.name}` : "Nivel máximo";
  document.getElementById("levelBarFill").style.width = progress + "%";
  document.getElementById("levelBarFill").style.background = current.color;
  document.getElementById("levelDesc").textContent = current.desc;

  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  if (user.history.length === 0) {
    historyList.innerHTML = `<li>Sin movimientos todavía.</li>`;
  } else {
    user.history.slice().reverse().forEach((h) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${h.label}</span><span>+${h.points} pts</span>`;
      historyList.appendChild(li);
    });
  }
}

function subscribe() {
  if (!user) { showToast("Inicia sesión primero"); openOverlay("accountOverlay"); return; }
  user.points += 300;
  user.history.push({ label: "Suscripción Club Oxium", points: 300 });
  saveUser(user);
  renderProfile();
  showToast("¡Bienvenido al Club Oxium! +300 pts");
}

// ---------- Overlays ----------
function openOverlay(id) { document.getElementById(id).classList.remove("hidden"); }
function closeOverlay(id) { document.getElementById(id).classList.add("hidden"); }

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  if (user) renderProfile();

  document.getElementById("openAccountBtn").addEventListener("click", () => openOverlay("accountOverlay"));
  document.getElementById("openCartBtn").addEventListener("click", () => openOverlay("cartOverlay"));
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeOverlay(btn.dataset.close));
  });

  document.getElementById("authSubmit").addEventListener("click", () => {
    const name = document.getElementById("authName").value.trim();
    const email = document.getElementById("authEmail").value.trim();
    if (!name || !email) { showToast("Completa nombre y correo"); return; }
    login(name, email);
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("checkoutBtn").addEventListener("click", checkout);
  document.getElementById("subscribeBtn").addEventListener("click", subscribe);
});
