const fs = require('fs');
const path = require('path');

// Your CSV data as a multi-line string (copy from your message)
const csvData = `name	price	category	description	material	imageUrl	variants
Black Casual Loafer Boot	45000	Casual Boots	Comfortable handcrafted leather loafer boot perfect for daily wear around Buea. Breathable lining and durable rubber sole.	Genuine Leather	/images/black-casual-loafer-boot.jpg	39:black:8,40:black:12,41:black:10,42:black:7,43:black:5,44:black:3
Brown Casual Loafer Boot	45000	Casual Boots	Comfortable handcrafted leather loafer boot perfect for daily wear around Buea. Breathable lining and durable rubber sole.	Genuine Leather	/images/brown-casual-loafer-boot.jpg	39:brown:10,40:brown:14,41:brown:12,42:brown:9,43:brown:6,44:brown:4
...`; // (include all rows from your message – I've truncated here, but you must copy the full data)

function parseVariants(variantsStr, productName, basePrice) {
  if (!variantsStr) return [];
  const parts = variantsStr.split(',');
  return parts.map(part => {
    const [size, color, stock] = part.split(':');
    const sku = `${productName.replace(/\s/g, '-')}-${color}-${size}`.toUpperCase();
    return {
      size,
      color,
      stock: parseInt(stock, 10),
      sku,
      price: parseFloat(basePrice)   // variants can inherit product price
    };
  });
}

function main() {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split('\t');
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < headers.length) continue;

    const product = {
      name: values[0],
      price: parseFloat(values[1]),
      category: values[2],
      description: values[3],
      // material: values[4],   // not used in Product model – omit
      imageUrl: values[5],
      variants: parseVariants(values[6], values[0], values[1])
    };
    products.push(product);
  }

  const outputPath = path.join(__dirname, '..', 'products-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  console.log(`✅ Written ${products.length} products to ${outputPath}`);
}

main();