let products = [];

// Cluster mode support - callback to notify when data changes
let onChangeCallback = null;

export function setOnChange(callback) {
  onChangeCallback = callback;
}

// Replace all products with synced data from another worker
export function setProducts(newProducts) {
  products = newProducts;
}

export function getAllProducts() {
  return products;
}

// .find() returns the first matching item or undefined if not found
export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function createProduct(product) {
  products.push(product);
  if (onChangeCallback) onChangeCallback([...products]);
  return product;
}

// Returns updated product or null if not found
export function updateProduct(id, newData) {
  // .findIndex() returns position in array, or -1 if not found
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  products[index] = {
    id,
    name: newData.name,
    description: newData.description,
    price: newData.price,
    category: newData.category,
    inStock: newData.inStock,
  };

  if (onChangeCallback) onChangeCallback([...products]);
  return products[index];
}

// Returns true if deleted, false if not found
export function deleteProduct(id) {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return false;

  // .splice(index, 1) removes 1 element at that position
  products.splice(index, 1);

  if (onChangeCallback) onChangeCallback([...products]);
  return true;
}
