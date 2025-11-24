// admin.js
const form = document.getElementById("productForm");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const discountInput = document.getElementById("discountPercent"); // ADDED
const sizesInput = document.getElementById("sizes");
const imageUrlInput = document.getElementById("imageUrl");
const formMessage = document.getElementById("formMessage");
const tableBody = document.getElementById("productTableBody");

async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const products = await res.json();
    renderTable(products);
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6">Error loading products</td></tr>`;
  }
}

function renderTable(products) {
  if (!products.length) {
    tableBody.innerHTML = `<tr><td colspan="6">No products yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";
  products.forEach((p) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₹${p.price}</td>
      <td>${p.sizes || ""}</td>
      <td>${p.soldOut ? "Sold Out" : "In Stock"}</td>
      <td>
        <div class="actions">
          <button class="product-btn btn-secondary" data-action="toggle" data-id="${p.id}">
            ${p.soldOut ? "Mark In Stock" : "Mark Sold Out"}
          </button>
          <button class="product-btn btn-danger" data-action="delete" data-id="${p.id}">
            Delete
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const rawPrice = (priceInput.value || "").trim();
  const parsedPrice = parseFloat(rawPrice);
  const price = Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) / 100 : 0;

  const rawDiscount = (discountInput.value || "").trim();
  let discountPercent = parseInt(rawDiscount, 10);
  if (!Number.isFinite(discountPercent) || discountPercent < 0) discountPercent = 0;
  if (discountPercent > 90) discountPercent = 90;

  const body = {
    name: nameInput.value.trim(),
    category: String(categoryInput.value || "").trim(),
    price,
    sizes: sizesInput.value.trim(),
    imageUrl: imageUrlInput.value.trim() || "",
    discountPercent
  };

  if (!body.name || !body.category || !body.price) {
    formMessage.textContent = "Please fill name, category & price.";
    return;
  }

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      formMessage.textContent = "Error adding product.";
      return;
    }

    formMessage.textContent = "Product added ✔";
    form.reset();
    categoryInput.value = "Shirt";
    loadProducts();
  } catch (err) {
    formMessage.textContent = "Network error.";
  }
});

// table actions: sold out toggle / delete
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  if (action === "delete") {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
  } else if (action === "toggle") {
    await toggleSoldOut(id, btn.textContent.includes("Sold Out"));
  }
});

async function deleteProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      alert("Error deleting product");
      return;
    }
    loadProducts();
  } catch (err) {
    alert("Network error");
  }
}

async function toggleSoldOut(id, makeSoldOut) {
  try {
    const res = await fetch(`/api/products/${id}/soldout`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soldOut: makeSoldOut })
    });
    if (!res.ok) {
      alert("Error updating status");
      return;
    }
    loadProducts();
  } catch (err) {
    alert("Network error");
  }
}

loadProducts();
