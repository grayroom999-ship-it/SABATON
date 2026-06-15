const fs = require('fs');
const path = require('path');

// Read CSV file
const csv = fs.readFileSync(path.join(__dirname, '../products.csv'), 'utf-8');
const lines = csv.split('\n');
const headers = lines[0].split(',');

const products = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  if (values.length < 5) continue;
  
  const product = {};
  headers.forEach((header, idx) => {
    product[header.trim()] = values[idx]?.trim();
  });
  
  // Parse variants
  if (product.variants) {
    const variantParts = product.variants.split(',');
    product.variants = variantParts.map(part => {
      const [size, color, stock] = part.split(':');
      return { size: parseInt(size), color, stock: parseInt(stock) };
    });
  }
  
  products.push(product);
}

// Write JSON file
fs.writeFileSync(
  path.join(__dirname, '../products-data.json'),
  JSON.stringify(products, null, 2)
);
console.log(`✅ Converted ${products.length} products to products-data.json`);