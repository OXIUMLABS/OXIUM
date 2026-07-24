// ==========================================
// CONFIGURACIÓN DE TU TIENDA OXIUM
// ==========================================
const GITHUB_OWNER = "OXIUMLABS";
const GITHUB_REPO = "OXIUM";
const PRODUCTS_FOLDER = "content/products";

let productsList = [];

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Cargar productos creados desde Decap CMS
  productsList = await fetchProductsFromCMS();
  
  // Mostrar productos en la web
  renderCatalog(productsList);
  setupCategoryFilters();
});

// ==========================================
// LECTURA DESDE DECAP CMS (content/products)
// ==========================================
async function fetchProductsFromCMS() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCTS_FOLDER}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn("Buscando productos en la carpeta content/products...");
      return [];
    }

    const files = await response.json();
    const loadedProducts = [];

    for (const file of files) {
      // Ignorar archivos del sistema como .gitkeep
      if (file.name.endsWith(".md")) {
        const fileRes = await fetch(file.download_url);
        const textContent = await fileRes.text();
        const parsedData = parseYAMLFrontmatter(textContent);

        if (parsedData && parsedData.id) {
          parsedData.price = parseFloat(parsedData.price) || 0;
          parsedData.category = (parsedData.category || "top").toLowerCase();
          
          // Corrección automática de ruta de imagen
          if (parsedData.image) {
            parsedData.image = parsedData.image.replace(/^\//, '');
          }
          
          loadedProducts.push(parsedData);
        }
      }
    }

    return loadedProducts;
  } catch (error) {
    console.error("Error al cargar productos del CMS:", error);
    return [];
  }
}

// Extrae los datos del archivo guardado por Decap CMS
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
// RENDERIZADO DEL CATÁLOGO
// ==========================================
function renderCatalog(items) {
  const catalogContainer = document.getElementById("catalog-container") || document.querySelector(".products-grid");
  if (!catalogContainer) return;

  catalogContainer.innerHTML = "";

  if (items.length === 0) {
    catalogContainer.innerHTML = `
      <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #888;">
        <p>No hay prendas disponibles por el momento.</p>
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
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" onError="this.src='https://via.placeholder.com/300x300?text=OXIUM';">
      </div>
      <div class="product-info">
        <span class="product-id">${product.id}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-price">$${product.price.toLocaleString("es-MX")} MXN</p>
        <button class="btn-add-cart">AGREGAR AL CARRITO</button>
      </div>
    `;

    catalogContainer.appendChild(card);
  });
}

// ==========================================
// FILTROS DE CATEGORÍA
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
