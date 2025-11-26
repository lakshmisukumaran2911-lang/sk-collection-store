// store.js

// ❗ Ungal WhatsApp number & UPI ID inga change pannunga
const whatsappNumber = "919999999999"; // 91 + un 10-digit number
const upiId = "yourupiid@okbank";      // e.g. skcollection@okaxis
const upiName = "SK Collection";

const productGrid = document.getElementById("productGrid");
const categoryChips = document.getElementById("categoryChips");
const sortFilter = document.getElementById("sortFilter");

let selectedCategory = "all";
let sortMode = "new";

// Modal elements (guard against missing elements)
const modal = document.getElementById("orderModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const orderProductNameEl = document.getElementById("orderProductName");
const custNameInput = document.getElementById("custName");
const custPhoneInput = document.getElementById("custPhone");
const custAddressInput = document.getElementById("custAddress");
const custSizeInput = document.getElementById("custSize");
const payUpiBtn = document.getElementById("payUpiBtn");
const custQtyInput = document.getElementById("custQty");
// set default quantity if element exists
if (custQtyInput) custQtyInput.value = 1;

let allProducts = [];
let currentProduct = null;

async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    allProducts = await res.json();
    renderProducts();
  } catch (err) {
    if (productGrid) productGrid.innerHTML = "<p>Error loading products.</p>";
    console.error("fetchProducts:", err);
  }
}

function renderProducts() {
  if (!productGrid) return;

  // normalize category selection
  const category = String(selectedCategory || "all").trim().toLowerCase();

  // filter (case-insensitive)
  let productsToShow =
    category === "all"
      ? allProducts.slice()
      : allProducts.filter(
          (p) => String(p.category || "").trim().toLowerCase() === category
        );

  // normalize numeric fields used for sorting
  productsToShow = productsToShow.map((p) => ({
    ...p,
    _priceNum: Number(p.price) || 0,
    _idNum: Number(p.id) || 0,
  }));

  // sort
  if (sortMode === "priceLow") {
    productsToShow.sort((a, b) => a._priceNum - b._priceNum);
  } else if (sortMode === "priceHigh") {
    productsToShow.sort((a, b) => b._priceNum - a._priceNum);
  } else {
    // "new" – newest first based on numeric id (fallback safe numeric)
    productsToShow.sort((a, b) => b._idNum - a._idNum);
  }

  if (!productsToShow.length) {
    productGrid.innerHTML = "<p>No products found.</p>";
    return;
  }

  productGrid.innerHTML = "";

  productsToShow.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card product-card";

    const imgDiv = document.createElement("div");
    imgDiv.className = "product-image";
    if (p.imageUrl) {
      imgDiv.style.backgroundImage = `url('${p.imageUrl}')`;
    }

    if (p.soldOut) {
      const badge = document.createElement("div");
      badge.className = "product-soldout-badge";
      badge.textContent = "Sold Out";
      imgDiv.appendChild(badge);
    }

    const nameDiv = document.createElement("div");
    nameDiv.className = "product-name";
    nameDiv.textContent = p.name;

    const catDiv = document.createElement("div");
    catDiv.className = "product-category";
    catDiv.textContent = p.category;

    const priceDiv = document.createElement("div");
    priceDiv.className = "product-price";

    const basePrice = Number(p.price) || 0;
    // clamp discount to sensible range
    const disc = Math.max(0, Math.min(90, Number(p.discountPercent) || 0));
    // final price rounded to 2 decimals
    const finalPrice = Math.round((basePrice * (100 - disc)) / 100 * 100) / 100;

    if (disc > 0) {
      priceDiv.innerHTML = `
        <span class="old-price">₹${basePrice.toFixed(2)}</span>
        <span class="new-price">₹${finalPrice.toFixed(2)}</span>
        <span style="font-size:0.75rem;color:#388e3c;"> (${disc}% OFF)</span>
      `;
    } else {
      priceDiv.textContent = `₹${basePrice.toFixed(2)}`;
    }

    const sizeDiv = document.createElement("div");
    sizeDiv.className = "product-size";
    sizeDiv.textContent = p.sizes ? `Sizes: ${p.sizes}` : " ";

    // ---- Buttons area ----
    const orderBtn = document.createElement("button");
    orderBtn.className = "product-btn btn-primary";

    if (p.soldOut) {
      orderBtn.textContent = "Sold Out";
      orderBtn.disabled = true;
    } else {
      orderBtn.textContent = "Order Now";
      orderBtn.addEventListener("click", () => openOrderModal(p));
    }

    const enquiryBtn = document.createElement("button");
    enquiryBtn.className = "product-btn btn-secondary";
    enquiryBtn.style.marginTop = "6px";
    enquiryBtn.textContent = "Enquiry on WhatsApp";
    enquiryBtn.addEventListener("click", () => openEnquiryWhatsApp(p));

    card.appendChild(imgDiv);
    card.appendChild(nameDiv);
    card.appendChild(catDiv);
    card.appendChild(priceDiv);
    card.appendChild(sizeDiv);
    card.appendChild(orderBtn);
    card.appendChild(enquiryBtn);

    productGrid.appendChild(card);
  });
}

// ---- WhatsApp Enquiry ----
function openEnquiryWhatsApp(product) {
  const text = encodeURIComponent(
    `Hi SK Collection, I have a doubt about this product:\n\n` +
      `Product: ${product.name}\n` +
      `Category: ${product.category}\n` +
      `Price: ₹${product.price}\n`
  );
  const url = `https://wa.me/${whatsappNumber}?text=${text}`;
  window.open(url, "_blank");
}

// ---- Order Modal + UPI Payment ----
function openOrderModal(product) {
  currentProduct = product;
  if (orderProductNameEl) orderProductNameEl.textContent = `${product.name} – ₹${product.price}`;
  if (custNameInput) custNameInput.value = "";
  if (custPhoneInput) custPhoneInput.value = "";
  if (custAddressInput) custAddressInput.value = "";
  if (custSizeInput) custSizeInput.value = "";
  // set default quantity
  if (custQtyInput) custQtyInput.value = 1;

  if (modal) modal.classList.add("show");
  if (modalBackdrop) modalBackdrop.classList.add("show");
}

function closeOrderModal() {
  if (modal) modal.classList.remove("show");
  if (modalBackdrop) modalBackdrop.classList.remove("show");
  currentProduct = null;
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeOrderModal);
if (modalBackdrop) modalBackdrop.addEventListener("click", closeOrderModal);

if (payUpiBtn) {
  payUpiBtn.addEventListener("click", () => {
    if (!currentProduct) return;

    const name = (custNameInput && custNameInput.value.trim()) || "";
    const phone = (custPhoneInput && custPhoneInput.value.trim()) || "";
    const address = (custAddressInput && custAddressInput.value.trim()) || "";
    const size = (custSizeInput && custSizeInput.value.trim()) || "";
    const qty = Math.max(
      1,
      parseInt((custQtyInput && custQtyInput.value) || "1", 10) || 1
    );

    if (!name || !phone || !address) {
      alert("Please fill name, phone and address.");
      return;
    }

    // compute final unit price after clamped discount, rounded to 2 decimals
    const basePrice = Number(currentProduct.price) || 0;
    const disc = Math.max(0, Math.min(90, Number(currentProduct.discountPercent) || 0));
    const singlePrice = Math.round((basePrice * (100 - disc) / 100) * 100) / 100;

    // total amount rounded to 2 decimals
    const totalAmount = Math.round(singlePrice * qty * 100) / 100;

    const tn = encodeURIComponent(
      `Order ${currentProduct.name} x${qty}` +
        (size ? ` (Size: ${size})` : "") +
        ` for ${name}`
    );

    const upiUrl =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(upiName)}` +
      `&am=${encodeURIComponent(totalAmount.toFixed(2))}` +
      `&cu=INR&tn=${tn}`;

    window.location.href = upiUrl;
  });
}

// wire up category chips + sort control (single safe setup)
if (categoryChips) {
  categoryChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;

    const newCategory = String(btn.dataset.category || "all").trim();
    if (!newCategory) return;

    selectedCategory = newCategory;

    // update active state and aria-selected
    categoryChips.querySelectorAll("button[data-category]").forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    renderProducts();
  });
}

if (sortFilter) {
  sortFilter.addEventListener("change", (e) => {
    sortMode = String(e.target.value || "new");
    renderProducts();
  });
}

fetchProducts();
