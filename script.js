/* ==========================================================
   OXIUM — lógica de tienda + cuentas avanzadas + Filtro Categorías
   ========================================================== */

const PRODUCTS = [
  { id: "p1", name: "Chaqueta Oxide Trench", desc: "Gabardina táctica con resistencia térmica avanzada e impermeabilidad molecular.", price: 1890, swatch: "#b5651d", category: "top", look: [{name:"Jeans Alloy", price:"1,290"}] },
  { id: "p2", name: "Pantalón Alloy Cargo", desc: "Corte técnico modular, bolsillos utilitarios integrados con solapas de seguridad.", price: 1290, swatch: "#7c93a3", category: "bottoms", look: [{name:"Patina Hoodie", price:"1,450"}] },
  { id: "p3", name: "Camiseta Raw Steel", desc: "Algodón ultra pesado de 240g optimizado para transpirabilidad urbana.", price: 590, swatch: "#9ca3a1", category: "top", look: [{name:"Oxide Trench", price:"1,890"}] },
  { id: "p4", name: "Sudadera Patina Hoodie", desc: "Interior afelpado de alta densidad con capucha ergonómica ajustable.", price: 1450, swatch: "#4c7a69", category: "top", look: [{name:"Alloy Cargo", price:"1,290"}] },
  { id: "p5", name: "Falda Titanium Pleat", desc: "Estructura plisada industrial con cinturón de ajuste de polímero técnico.", price: 1190, swatch: "#e8e6e1", category: "bottoms", look: [{name:"Raw Steel Tee", price:"590"}] },
  { id: "p6", name: "Chaleco Corrosión", desc: "Acolchado modular ligero con recubrimiento reflectante ante espectros de baja luz.", price: 1590, swatch: "#8a4a2a", category: "accessories", look: [{name:"Alloy Cargo", price:"1,290"}] },
  { id: "p7", name: "Anillo Catenaria Black", desc: "Anillo rotatorio de acero inoxidable pavonado con textura eslabonada.", price: 420, swatch: "#111111", category: "jewelry", look: [{name:"Gloves Operator", price:"680"}] },
  { id: "p8", name: "Mochila Exocapa V1", desc: "Capacidad expansiva de 35L con herrajes magnéticos de liberación rápida.", price: 2150, swatch: "#222222", category: "backpacks", look: [{name:"Oxide Trench", price:"1,890"}] }
];

const CATEGORY_META = {
  top: { title: "SEGMENTO / TOP", desc: "Prendas de torso superiores, capas impermeables y blindajes textiles ligeros." },
  bottoms: { title: "SEGMENTO / BOTTOMS", desc: "Pantalones utilitarios de alta movilidad y faldas plisadas con polímeros de grado industrial." },
  accessories: { title: "MÓDULOS / ACCESSORIES", desc: "Guantes de protección, cinturones magnéticos y chalecos utilitarios de acople rápido." },
  jewelry: { title: "MÓDULOS / JEWELRY", desc: "Anillos y joyería de titanio texturizado con acabados de oxidación controlada." },
  backpacks: { title: "CARGA / BACKPACKS", desc: "Sistemas de almacenamiento modular exocapa con resistencia al agua y cierres sellados." }
};

const JACKET_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#f2f2f0" stroke-width="1.2"><path d="M8 2l4 2 4-2 4 4-2 3v13H4V9L2 6l6-4z"/></svg>`;

// ---------- Gestión de Sesión y Rango ----------
const USERS_DATABASE_KEY = "oxium_global_users"; const SESSION_KEY = "oxium_active_session"; const CART_KEY = "oxium_cart";
function getGlobalUsers() { try { return JSON.parse(localStorage.getItem(USERS_DATABASE_KEY)) || []; } catch { return []; } }
function saveGlobalUsers(users) { localStorage.setItem(USERS_DATABASE_KEY, JSON.stringify(users)); }
let user = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let isLoginMode = false;

// ... (Conserva getLevelInfo, pointsFromAmount, showToast sin modificaciones) ...
function getLevelInfo(points) {
  let current = LEVELS[0], next = LEVELS[1] || null;
  for (const lvl of LEVELS) { if (points >= lvl.threshold) { current = lvl; next = LEVELS[LEVELS.indexOf(lvl) + 1] || null; } }
  const progress = next ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100)) : 100;
  return { current, next, progress };
}
function pointsFromAmount(amount) { return Math.round(amount / 10); }
function showToast(msg) { const el = document.getElementById("toast"); el.textContent = msg.toUpperCase(); el.classList.remove("hidden"); setTimeout(() => el.classList.add("hidden"), 2200); }

// ---------- Render Automatizado Inteligente por URL ----------
function resolveAndRenderCatalog() {
  const params = new URLSearchParams(window.location.search);
  const targetCategory = params.get("cat");
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  // Si estamos en la página de categoría independiente
  if (targetCategory && CATEGORY_META[targetCategory]) {
    document.getElementById("categoryTitle").innerHTML = `${CATEGORY_META[targetCategory].title} <span>/ INDEX</span>`;
    document.getElementById("categoryDescription").textContent = CATEGORY_META[targetCategory].desc;
    if(document.getElementById("categoryTerminalPath")) {
      document.getElementById("categoryTerminalPath").textContent = `HTTPS://OXIUM.LABS / CATEGORY / ${targetCategory.toUpperCase()}`;
    }
    
    const filtered = PRODUCTS.filter(p => p.category === targetCategory);
    renderGrid(filtered);
  } else {
    // Si estamos en el home, muestra destacados (primeros 4)
    renderGrid(PRODUCTS.slice(0, 4));
  }
}

function renderGrid(productsList) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  if(productsList.length === 0) {
    grid.innerHTML = `<div style="padding: 2rem; color: var(--text-faint); font-family: var(--font-mono);">[ ALERTA: STOCK AGOTADO EN ESTE SEGMENTO ]</div>`;
    return;
  }
  productsList.forEach((p) => {
    const card = document.createElement("div"); card.className = "product-card"; card.style.cursor = "pointer";
    card.innerHTML = `<div class="product-swatch" style="background:${p.swatch}33">${JACKET_SVG}</div><p class="product-name">${p.name}</p><p class="product-desc">${p.desc.substring(0, 45)}...</p><div class="product-row"><span class="price">$${p.price.toLocaleString("es-MX")} MXN</span><button class="add-btn" data-id="${p.id}">Especificar</button></div>`;
    card.addEventListener("click", (e) => { if (!e.target.classList.contains('add-btn')) openProductDetail(p.id); });
    card.querySelector(".add-btn").addEventListener("click", () => openProductDetail(p.id));
    grid.appendChild(card);
  });
}

function openProductDetail(productId) {
  const p = PRODUCTS.find(item => item.id === productId); if (!p) return;
  document.getElementById("catalogFront").classList.add("hidden");
  document.getElementById("productDetailView").classList.remove("hidden");
  document.getElementById("detailName").textContent = p.name.toUpperCase();
  document.getElementById("detailPrice").textContent = `$${p.price.toLocaleString("es-MX")} MXN`;
  document.getElementById("detailDesc").textContent = p.desc;
  const detailSwatch = document.getElementById("detailSwatch"); detailSwatch.style.background = p.swatch + "33"; detailSwatch.innerHTML = JACKET_SVG;
  document.getElementById("detailAddBtn").onclick = () => addToCart(p.id);

  const tagsContainer = document.getElementById("lookTagsContainer"); tagsContainer.innerHTML = "";
  p.look.forEach((item, index) => {
    const tag = document.createElement("div"); tag.className = "look-tag"; tag.style.top = `${25 + (index * 30)}%`; tag.style.left = index % 2 === 0 ? "12%" : "68%";
    tag.innerHTML = `<div class="look-tag-dot"></div><div class="look-tag-card"><p>${item.name.toUpperCase()}</p><span>$${item.price} MXN</span></div>`;
    tagsContainer.appendChild(tag);
  });

  const suggestionsGrid = document.getElementById("suggestionsGrid"); suggestionsGrid.innerHTML = "";
  PRODUCTS.filter(item => item.id !== p.id).slice(0, 3).forEach((item) => {
    const card = document.createElement("div"); card.className = "product-card"; card.style.cursor = "pointer";
    card.innerHTML = `<div class="product-swatch" style="background:${item.swatch}33">${JACKET_SVG}</div><p class="product-name">${item.name}</p><div class="product-row"><span class="price">$${item.price.toLocaleString("es-MX")} MXN</span><button class="add-btn">Ver</button></div>`;
    const triggers = [card, card.querySelector(".add-btn")]; suggestionsGrid.appendChild(card);
    triggers.forEach(t => t.addEventListener("click", (e) => {
      if (t === card && e.target.classList.contains('add-btn')) return;
      openProductDetail(item.id); window.scrollTo({ top: document.getElementById("catalogo").offsetTop, behavior: 'smooth' });
    }));
  });
}

// ---------- Carrito ----------
function addToCart(productId) {
  const existing = cart.find((i) => i.id === productId); if (existing) existing.qty += 1; else cart.push({ id: productId, qty: 1 });
  localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); showToast("Agregado al carrito");
}
function removeFromCart(productId) { cart = cart.filter((i) => i.id !== productId); localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }
function cartTotal() { return cart.reduce((sum, item) => { const p = PRODUCTS.find((p) => p.id === item.id); return sum + (p ? p.price * item.qty : 0); }, 0); }
function renderCart() {
  const list = document.getElementById("cartList"); const countEl = document.getElementById("cartCount"); list.innerHTML = ""; let totalQty = 0;
  if (cart.length === 0) list.innerHTML = `<li style="justify-content:center">Tu carrito está vacío.</li>`;
  cart.forEach((item) => {
    const p = PRODUCTS.find((p) => p.id === item.id); if (!p) return; totalQty += item.qty;
    const li = document.createElement("li"); li.innerHTML = `<div class="cart-item-name"><span>${p.name}</span><small>x${item.qty} — $${(p.price * item.qty).toLocaleString("es-MX")} MXN</small></div><button class="remove-btn" data-id="${item.id}">&times;</button>`;
    list.appendChild(li);
  });
  if(list.querySelectorAll(".remove-btn").length > 0) {
    list.querySelectorAll(".remove-btn").forEach(btn => btn.addEventListener("click", () => removeFromCart(btn.dataset.id)));
  }
  document.getElementById("cartTotal").textContent = `$${cartTotal().toLocaleString("es-MX")} MXN`;
  countEl.textContent = totalQty;
}

function checkout() {
  if (cart.length === 0) { showToast("Tu carrito está vacío"); return; }
  if (!user) { showToast("Sincroniza terminal para acumular"); openOverlay("accountOverlay"); return; }
  const total = cartTotal(); const earned = pointsFromAmount(total); user.points += earned;
  user.history.push({ label: `Compra ($${total.toLocaleString("es-MX")} MXN)`, points: earned });
  saveActiveSession(user); cart = []; localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); renderProfile(); showToast(`Procesado. +${earned} PTS`); closeOverlay("cartOverlay");
}

// ---------- Autenticación ----------
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById("authTitle").textContent = isLoginMode ? "Acceder a Terminal" : "Establecer terminal";
  document.getElementById("authSubmit").textContent = isLoginMode ? "Iniciar Enlace" : "Ejecutar Enlace";
  document.getElementById("registerOnlyFields").classList.toggle("hidden", isLoginMode);
  document.getElementById("toggleAuthMode").textContent = isLoginMode ? "¿No posees cuenta? Registrar nueva terminal." : "¿Ya posees una terminal activa? Acceder.";
}
function handleAuth() {
  const email = document.getElementById("authEmail").value.trim().toLowerCase(); const password = document.getElementById("authPassword").value.trim(); const name = document.getElementById("authName").value.trim(); let usersList = getGlobalUsers();
  if (!email || !password) { showToast("Completa los campos base"); return; }
  if (isLoginMode) {
    const found = usersList.find(u => u.email === email && u.password === password); if (!found) { showToast("Credenciales inválidas"); return; } user = found;
  } else {
    if (!name) { showToast("Asigna un nombre de operador"); return; } if (usersList.some(u => u.email === email)) { showToast("ID de correo ya registrado"); return; }
    user = { name, email, password, points: 0, history: [], preferences: { size: "M", color: "#2f4a38" } }; usersList.push(user); saveGlobalUsers(usersList);
  }
  saveActiveSession(user); renderProfile(); showToast(`Enlace Exitoso: ${user.name}`);
  document.getElementById("authEmail").value = ""; document.getElementById("authPassword").value = ""; document.getElementById("authName").value = "";
}
function saveActiveSession(updatedUser) { user = updatedUser; localStorage.setItem(SESSION_KEY, JSON.stringify(user)); let usersList = getGlobalUsers(); const index = usersList.findIndex(u => u.email === user.email); if (index !== -1) { usersList[index] = user; saveGlobalUsers(usersList); } }
function logout() { user = null; localStorage.removeItem(SESSION_KEY); document.getElementById("navUserLabel").textContent = "ENTRAR"; document.getElementById("authView").classList.remove("hidden"); document.getElementById("profileView").classList.add("hidden"); showToast("Terminal desconectada"); }
function savePreferences() { if (!user) return; user.preferences = { size: document.getElementById("prefSize").value, color: document.getElementById("prefColor").value }; saveActiveSession(user); showToast("Parámetros actualizados"); }
function updateAccountCredentials() {
  if (!user) return; const newEmail = document.getElementById("updateEmail").value.trim().toLowerCase(); const newPass = document.getElementById("updatePassword").value.trim(); let usersList = getGlobalUsers(); if (!newEmail && !newPass) { showToast("Digita algún cambio"); return; }
  if (newEmail && newEmail !== user.email) { if (usersList.some(u => u.email === newEmail)) { showToast("Ese correo ya está ocupado"); return; } usersList = usersList.filter(u => u.email !== user.email); user.email = newEmail; }
  if (newPass) user.password = newPass; const idx = usersList.findIndex(u => u.email === user.email); if (idx !== -1) usersList[idx] = user; else usersList.push(user); saveGlobalUsers(usersList); localStorage.setItem(SESSION_KEY, JSON.stringify(user)); document.getElementById("updateEmail").value = ""; document.getElementById("updatePassword").value = ""; renderProfile(); showToast("Credenciales sincronizadas");
}
function renderProfile() {
  if (!user) return; document.getElementById("navUserLabel").textContent = user.name.split(" ")[0].toUpperCase(); document.getElementById("authView").classList.add("hidden"); document.getElementById("profileView").classList.remove("hidden"); document.getElementById("profileName").textContent = user.name.toUpperCase(); document.getElementById("profileEmail").textContent = user.email;
  if (user.preferences) { document.getElementById("prefSize").value = user.preferences.size || "M"; document.getElementById("prefColor").value = user.preferences.color || "#2f4a38"; }
  const { current, next, progress } = getLevelInfo(user.points); document.getElementById("levelBadge").style.background = current.color + "33"; document.getElementById("levelBadge").style.borderColor = current.color; document.getElementById("levelName").textContent = `${current.name} · ${user.points} pts`; document.getElementById("levelNext").textContent = next ? `${next.threshold - user.points} pts → ${next.name}` : "Nivel máximo"; document.getElementById("levelBarFill").style.width = progress + "%"; document.getElementById("levelBarFill").style.background = current.color; document.getElementById("levelDesc").textContent = current.desc;
  const historyList = document.getElementById("historyList"); historyList.innerHTML = "";
  if (user.history.length === 0) { historyList.innerHTML = `<li>Sin movimientos todavía.</li>`; } else { user.history.slice().reverse().forEach((h) => { const li = document.createElement("li"); li.innerHTML = `<span>${h.label}</span><span>+${h.points} pts</span>`; historyList.appendChild(li); }); }
}
function subscribe() { if (!user) { showToast("Sincroniza terminal primero"); openOverlay("accountOverlay"); return; } user.points += 300; user.history.push({ label: "Suscripción Club Oxium", points: 300 }); saveActiveSession(user); renderProfile(); showToast("¡Club Activado! +300 pts"); }
function openOverlay(id) { document.getElementById(id).classList.remove("hidden"); }
function closeOverlay(id) { document.getElementById(id).classList.add("hidden"); }

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  resolveAndRenderCatalog(); renderCart(); if (user) renderProfile();
  if(document.querySelector(".hero-stock-counter")) {
    document.querySelector(".hero-stock-counter").textContent = `[${PRODUCTS.length}] UNIDADES DISPONIBLES`;
  }
  document.getElementById("openAccountBtn").addEventListener("click", () => openOverlay("accountOverlay"));
  document.getElementById("openCartBtn").addEventListener("click", () => openOverlay("cartOverlay"));
  document.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => closeOverlay(btn.dataset.close)));
  document.getElementById("toggleAuthMode").addEventListener("click", toggleAuthMode);
  document.getElementById("authSubmit").addEventListener("click", handleAuth);
  document.getElementById("savePrefsBtn").addEventListener("click", savePreferences);
  document.getElementById("updateAccountBtn").addEventListener("click", updateAccountCredentials);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("checkoutBtn").addEventListener("click", checkout);
  document.getElementById("subscribeBtn").addEventListener("click", subscribe);
  document.getElementById("backToCatalog").addEventListener("click", () => { document.getElementById("productDetailView").classList.add("hidden"); document.getElementById("catalogFront").classList.remove("hidden"); });

  const promoOverlay = document.getElementById("promoOverlay");
  if (promoOverlay && !user) {
    setTimeout(() => { promoOverlay.classList.remove("hidden"); }, 2000);
    document.getElementById("closePromoBtn").addEventListener("click", () => promoOverlay.classList.add("hidden"));
    document.getElementById("promoLoginBtn").addEventListener("click", () => { promoOverlay.classList.add("hidden"); isLoginMode = true; toggleAuthMode(); openOverlay("accountOverlay"); });
    document.getElementById("promoRegBtn").addEventListener("click", () => { promoOverlay.classList.add("hidden"); isLoginMode = false; toggleAuthMode(); openOverlay("accountOverlay"); });
  }
});