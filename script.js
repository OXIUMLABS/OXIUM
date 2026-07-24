// ==========================================
// OXIUM LABS — CORE SYSTEM SCRIPT
// ==========================================
const GITHUB_OWNER = "OXIUMLABS";
const GITHUB_REPO = "OXIUM";
const PRODUCTS_FOLDER = "content/products";

let productsList = [];
let selectedProduct = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Cargar productos desde Decap CMS
  productsList = await fetchProductsFromCMS();
  
  // 2. Renderizar cuadrícula inicial
  renderCatalog(productsList);

  // 3. Inicializar eventos de interfaz de usuario
  setupNavigationAndModals();
});

// ==========================================
// LECTURA DINÁMICA DE DECAP CMS
// ==========================================
async function fetchProductsFromCMS() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCTS_FOLDER}`;
    const response = await fetch(url);
    
    if (!response.ok) return [];

    const files = await response.json();
    const loadedProducts = [];

    for (const file of files) {
      if (file.name.endsWith(".md")) {
        const fileRes = await fetch(file.download_url);
        const textContent = await fileRes.text();
        const parsedData = parseYAMLFrontmatter(textContent);

        if (parsedData && parsedData.id) {
          parsedData.price = parseFloat(parsedData.price) || 0;
          parsedData.category = (parsedData.category || "top").toLowerCase();
          
          if (parsedData.image) {
            parsedData.image = parsedData.image.replace(/^\//, '');
          }
          
          loadedProducts.push(parsedData);
        }
      }
    }

    return loadedProducts;
  } catch (error) {
    console.error("// ERROR DE CONEXIÓN CON MATRIX:", error);
    return [];
  }
}

// Extractor de campos YAML Frontmatter
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

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) return;

  productGrid.innerHTML = "";

  if (items.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--accent); font-family: 'JetBrains Mono', monospace;">
        <p>// NO HAY PROTOTIPOS REGISTRADOS EN EL SISTEMA.</p>
      </div>
    `;
    return;
  }

  items.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    card.setAttribute("data-category", product.category);

    const imageSrc = product.image || 'images/placeholder.jpg';

    card.innerHTML = `
      <div class="product-swatch">
        <img src="${imageSrc}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" onError="this.style.display='none';">
      </div>
      <div class="product-info">
        <span class="panel-label">${product.id}</span>
        <h3 class="product-title" style="margin: 0.3rem 0; font-size: 1rem;">${product.name}</h3>
        <p class="price" style="color: var(--accent); font-weight: 700;">$${product.price.toLocaleString("es-MX")} MXN</p>
      </div>
    `;

    // Asignar evento para abrir la vista detallada
    card.addEventListener("click", () => {
      openProductDetail(product);
    });

    productGrid.appendChild(card);
  });
}

// ==========================================
// INTERACTIVIDAD VISTA DETALLADA Y MODALES
// ==========================================
function openProductDetail(product) {
  selectedProduct = product;

  const catalogFront = document.getElementById("catalogFront");
  const productDetailView = document.getElementById("productDetailView");

  if (!productDetailView) return;

  // Llenar datos de la prenda en la vista interna
  document.getElementById("detailName").textContent = product.name;
  document.getElementById("detailPrice").textContent = `$${product.price.toLocaleString("es-MX")} MXN`;
  document.getElementById("detailDesc").textContent = product.desc || "Sin especificación técnica registrada.";

  const detailSwatch = document.getElementById("detailSwatch");
  if (detailSwatch) {
    detailSwatch.innerHTML = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
  }

  // Alternar vista de cuadrícula a vista detallada
  if (catalogFront) catalogFront.classList.add("hidden");
  productDetailView.classList.remove("hidden");

  // Desplazar la pantalla suavemente hacia la vista detallada
  productDetailView.scrollIntoView({ behavior: "smooth" });
}

function setupNavigationAndModals() {
  // Botón para volver al catálogo
  const backToCatalog = document.getElementById("backToCatalog");
  if (backToCatalog) {
    backToCatalog.addEventListener("click", () => {
      document.getElementById("productDetailView").classList.add("hidden");
      document.getElementById("catalogFront").classList.remove("hidden");
    });
  }

  // Selectores de talla
  const sizeOptions = document.querySelectorAll(".size-options span");
  sizeOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      sizeOptions.forEach((s) => s.classList.remove("active"));
      opt.classList.add("active");
    });
  });

  // Selectores de color
  const colorDots = document.querySelectorAll(".color-options .color-dot");
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      colorDots.forEach((c) => c.classList.remove("active"));
      dot.classList.add("active");
    });
  });

  // Abrir / Cerrar Modales (Sistema y Carrito)
  setupOverlay("openAccountBtn", "accountOverlay");
  setupOverlay("openCartBtn", "cartOverlay");

  const closeBtns = document.querySelectorAll(".close-btn");
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetOverlay = e.target.closest(".overlay");
      if (targetOverlay) targetOverlay.classList.add("hidden");
    });
  });
}

function setupOverlay(btnId, overlayId) {
  const btn = document.getElementById(btnId);
  const overlay = document.getElementById(overlayId);

  if (btn && overlay) {
    btn.addEventListener("click", () => {
      overlay.classList.remove("hidden");
    });
  }
}
