// ==========================================
// CONFIGURACIÓN Y ESTADO DE LA TIENDA
// ==========================================
const GITHUB_OWNER = "OXIUMLABS";
const GITHUB_REPO = "OXIUM";
const PRODUCTS_FOLDER = "content/products";

let productsList = [];
let cart = [];

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Cargar productos desde Decap CMS
  productsList = await fetchProductsFromCMS();
  
  // Renderizar la tienda
  renderCatalog(productsList);
  setupCategoryFilters();
  setupSearch();
  setupCartUI();
});

// ==========================================
// LECTURA DINÁMICA DE PRODUCTOS (DECAP CMS)
// ==========================================
async function fetchProductsFromCMS() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCTS_FOLDER}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn("No se pudo conectar a la carpeta de productos en GitHub.");
      return [];
    }

    const files = await response.json();
    const loadedProducts = [];

    for (const file of files) {
      if (file.name.endsWith(".md") || file.name.endsWith(".html")) {
        const fileRes = await fetch(file.download_url);
        const textContent = await fileRes.text();
        const parsedData = parseYAMLFrontmatter(textContent);

        if (parsedData && parsedData.id) {
          // Normalización de tipos de datos
          parsedData.price = parseFloat(parsedData.price) || 0;
          parsedData.category = (parsedData.category || "top").toLowerCase();
          loadedProducts.push(parsedData);
        }
      }
    }

    return loadedProducts;
  } catch (error) {
    console.error("Error al cargar productos desde el CMS:", error);
    return [];
  }
}

// Parser ligero para extraer Frontmatter de Markdown (.md)
function parseYAMLFrontmatter(text) {
  const lines = text.split("\n");
  const data = {};
  let insideFrontmatter = false;

  for (let line of lines) {
    line = line.trim();
    if (line === "---") {
      insideFrontmatter = !insideFrontmatter;
      continue;
    }
    if (insideFrontmatter && line.includes(":")) {
      const colonIndex = line.indexOf(":");
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Limpiar comillas si existen
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  }
  return data;
}

// ==========================================
// RENDERIZADO DEL CATÁLOGO DE PRODUCTOS
// ==========================================
function renderCatalog(items) {
  const catalogContainer = document.getElementById("catalog-container") || document.querySelector(".products-grid");
  if (!catalogContainer) return;

  catalogContainer.innerHTML = "";

  if (items.length === 0) {
    catalogContainer.innerHTML = `
      <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #888;">
        <p>No hay prendas cargadas en esta categoría.</p>
      </div>
    `;
    return;
  }

  items.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-category", product.category);

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onError="this.src='images/placeholder.jpg';">
      </div>
      <div class="product-info">
        <span class="product-id">${product.id}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">$${product.price.toLocaleString("es-MX")} MXN</p>
        <button class="btn-add-cart" onclick="addToCart('${product.id}')">AGREGAR AL CARRITO</button>
      </div>
    `;

    // Evento para abrir modal de detalle si existe la función
    card.querySelector(".product-image-container").addEventListener("click", () => {
      openProductModal(product);
    });

    catalogContainer.appendChild(card);
  });
}

// ==========================================
// FILTROS Y BÚSQUEDA
// ==========================================
function setupCategoryFilters() {
  const categoryButtons = document.querySelectorAll("[data-filter]");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      const selectedCategory = e.target.getAttribute("data-filter").toLowerCase();
      if (selectedCategory === "all") {
        renderCatalog(productsList);
      } else {
        const filtered = productsList.filter((p) => p.category === selectedCategory);
        renderCatalog(filtered);
      }
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        (p.desc && p.desc.toLowerCase().includes(query))
    );
    renderCatalog(filtered);
  });
}

// ==========================================
// GESTIÓN DEL CARRITO
// ==========================================
function addToCart(productId) {
  const product = productsList.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartCount) cartCount.textContent = totalQuantity;
  if (cartTotal) cartTotal.textContent = `$${totalPrice.toLocaleString("es-MX")} MXN`;
}

function setupCartUI() {
  const cartToggleBtn = document.getElementById("cart-toggle");
  const cartModal = document.getElementById("cart-modal");

  if (cartToggleBtn && cartModal) {
    cartToggleBtn.addEventListener("click", () => {
      cartModal.classList.toggle("active");
    });
  }
}

// ==========================================
// DETALLE DEL PRODUCTO (MODAL)
// ==========================================
function openProductModal(product) {
  const modal = document.getElementById("product-detail-modal");
  if (!modal) return;

  document.getElementById("modal-img").src = product.image;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-id").textContent = product.id;
  document.getElementById("modal-price").textContent = `$${product.price.toLocaleString("es-MX")} MXN`;
  document.getElementById("modal-desc").textContent = product.desc || "Sin descripción disponible.";

  modal.classList.add("active");
}
