// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "products.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Helper: read products
function readProducts() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    return [];
  }
}

// Helper: write products
function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

// Get all products
app.get("/api/products", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// Add a product
app.post("/api/products", (req, res) => {
  const { name, category, price, sizes, imageUrl, discountPercent } = req.body;

  if (!name || !category || (price === undefined || price === null)) {
    return res.status(400).json({ message: "name, category, price required" });
  }

  const products = readProducts();
  const newProduct = {
    id: Date.now(), // simple unique id
    name,
    category,          // "Shirt" / "Pant" / "T-Shirt"
    price: Number(price),
    sizes: sizes || "",
    imageUrl: imageUrl || "",
    soldOut: false,
    discountPercent: Number(discountPercent) || 0 // NEW
  };

  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  let products = readProducts();
  const existingLength = products.length;

  products = products.filter((p) => p.id !== id);

  if (products.length === existingLength) {
    return res.status(404).json({ message: "Product not found" });
  }

  writeProducts(products);
  res.json({ message: "Deleted" });
});

// Mark as sold out / in stock
app.patch("/api/products/:id/soldout", (req, res) => {
  const id = Number(req.params.id);
  const { soldOut } = req.body; // true or false

  const products = readProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.soldOut = Boolean(soldOut);
  writeProducts(products);
  res.json(product);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
