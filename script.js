// ==========================================
// OXIUM LABS — CORE SYSTEM SCRIPT
// ==========================================
const GITHUB_OWNER = "OXIUMLABS";
const GITHUB_REPO = "OXIUM";
const PRODUCTS_FOLDER = "content/products";

let productsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Cargar productos desde Decap CMS
  productsList = await fetchProductsFromCMS();
  
  // Renderizar catálogo sobre tu grid original
  renderCatalog(productsList);
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
    console.error("Error al conectar con el servidor de productos:", error);
    return [];
  }
}

// Extraer metadatos de Markdown
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
// RENDERIZADO EN PRODUCTGRID (ESTÉTIKA OK)
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

    productGrid.appendChild(card);
  });
}
