/* ==========================================================
   OXIUM — lógica de tienda + cuentas + niveles + SPA de detalle
   Todo se guarda en localStorage: funciona sin backend.
   ========================================================== */

// ---------- Datos del catálogo Expandidos ----------
const PRODUCTS = [
  { id: "p1", name: "Chaqueta Oxide Trench", desc: "Gabardina táctica de corte extendido con resistencia térmica avanzada e impermeabilidad molecular.", price: 1890, swatch: "#b5651d", look: [{name:"Jeans Alloy", price:"1,290"}, {name:"Raw Steel Tee", price:"590"}] },
  { id: "p2", name: "Pantalón Alloy Cargo", desc: "Corte técnico modular, bolsillos utilitarios integrados con solapas de seguridad militar.", price: 1290, swatch: "#7c93a3", look: [{name:"Patina Hoodie", price:"1,450"}] },
  { id: "p3", name: "Camiseta Raw Steel", desc: "Algodón ultra pesado de 240g optimizado para transpirabilidad y durabilidad urbana.", price: 590, swatch: "#9ca3a1", look: [{name:"Oxide Trench", price:"1,890"}, {name:"Chaleco Corrosión", price:"1,590"}] },
  { id: "p4", name: "Sudadera Patina Hoodie", desc: "Interior afelpado de alta densidad con capucha ergonómica ajustable ante ráfagas frías.", price: 1450, swatch: "#4c7a69", look: [{name:"Alloy Cargo", price:"1,290"}] },
  { id: "p5", name: "Falda Titanium Pleat", desc: "Estructura plisada de permanencia industrial con cinturón de ajuste de polímero técnico.", price: 1190, swatch: "#e8e6e1", look: [{name:"Raw Steel Tee", price:"590"}] },
  { id: "p6", name: "Chaleco Corrosión", desc: "Acolchado modular ligero con recubrimiento reflectante ante espectros de baja luz.", price: 1590, swatch: "#8a4a2a", look: [{name:"Raw Steel Tee", price:"590"}, {name:"Alloy Cargo", price:"1,290"}] },
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

// ---------- Render: catálogo principal ----------
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div class="product-swatch" style="background:${p.swatch}33">${JACKET_SVG}</div>
      <p class="product-name">${p.name}</p>
      <p class="product-desc">${p.desc.substring(0, 45)}...</p>
      <div class="product-row">
        <span class="price">$${p.price.toLocaleString("es-MX")} MXN</span>
        <button class="add-btn" data-id="${p.id}">Especificar</button>
      </div>
    `;
    
    // Clic en la tarjeta abre la ficha técnica
    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains('add-btn')) openProductDetail(p.id);
    });
    card.querySelector(".add-btn").addEventListener("click", () => openProductDetail(p.id));

    grid.appendChild(card);
  });
}

// ---------- Lógica SPA de Detalle de Producto ----------
function openProductDetail(productId) {
  const p = PRODUCTS.find(item => item.id === productId);
  if (!p) return;

  // Intercambiar visibilidad de bloques
  document.getElementById("catalogFront").classList.add("hidden");
  document.getElementById("productDetailView").classList.remove("hidden");

  // Inyectar Bloque 1 (Info Central)
  document.getElementById("detailName").textContent = p.name.toUpperCase();
  document.getElementById("detailPrice").textContent = `$${p.price.toLocaleString("es-MX")} MXN`;
  document.getElementById("detailDesc").textContent = p.desc;
  
  const detailSwatch = document.getElementById("detailSwatch");
  detailSwatch.style.background = p.swatch + "33";
  detailSwatch.innerHTML = JACKET_SVG;

  document.getElementById("detailAddBtn").onclick = () => addToCart(p.id);

  // Inyectar Bloque 2: Complete the Look (Nodos flotantes)
  const tagsContainer = document.getElementById("lookTagsContainer");
  tagsContainer.innerHTML = "";
  
  p.look.forEach((item, index) => {
    const tag = document.createElement("div");
    tag.className = "look-tag";
    tag.style.top = `${25 + (index * 30)}%`;
    tag.style.left = index % 2 === 0 ? "12%" : "68%";
    tag.innerHTML = `
      <div class="look-tag-dot"></div>
      <div class="look-tag-card">
        <p>${item.name.toUpperCase()}</p>
        <span>$${item.price} MXN</span>
      </div>
    `;
    tagsContainer.appendChild(tag);
  });

  // Inyectar Bloque 3: Sugerencias Relacionadas con mismos iconos de mira
  const suggestionsGrid = document.getElementById("suggestionsGrid");
  suggestionsGrid.innerHTML = "";
  const filtered = PRODUCTS.filter(item => item.id !== p.id).slice(0, 3);

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div class="product-swatch" style="background:${item.swatch}33">${JACKET_SVG}</div>
      <p class="product-name">${item.name}</p>
      <div class="product-row">
        <span class="price">$${item.price.toLocaleString("es-MX")} MXN</span>
        <button class="add-btn" data-id="${item.id}">Ver</button>
      </div>
    `;
    
    // Navegación instantánea interna entre productos recomendados
    const triggers = [card, card.querySelector(".add-btn")];
    triggers.forEach(t => t.addEventListener("click", (e) => {
      if (t === card && e.target.classList.contains('add-btn')) return;
      openProductDetail(item.id);
      window.scrollTo({ top: document.getElementById("catalogo").offsetTop, behavior: 'smooth' });
    }));

    suggestionsGrid.appendChild(card);
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
  countEl.textContent = `[${totalQty}]`;
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
  const existingUser = loadUser();
  user = existingUser && existingUser.email === email
    ? existingUser
    : { name, email, points: 0, history: [] };
  saveUser(user);
  renderProfile();
  showToast(`Terminal enlazada: ${user.name}`);
}

function logout() {
  user = null;
  clearUser();
  document.getElementById("navUserLabel").textContent = "Entrar";
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

  document.getElementById("backToCatalog").addEventListener("click", () => {
    document.getElementById("productDetailView").classList.add("hidden");
    document.getElementById("catalogFront").classList.remove("hidden");
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("checkoutBtn").addEventListener("click", checkout);
  document.getElementById("subscribeBtn").addEventListener("click", subscribe);
});