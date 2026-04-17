export function buildCategoryOptions(categoryData) {
  if (!Array.isArray(categoryData)) {
    return [];
  }

  const seen = new Set();
  return categoryData
    .filter((category) => {
      const name = category?.name;
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((category) => ({ label: category.name, value: category.name }));
}

export function buildProductPayload(product, values) {
  const normalizedStock = values.status === 'Inactive' ? 0 : values.stock;

  return {
    ...product,
    ...values,
    stock: normalizedStock,
    sku: values.sku.toUpperCase(),
  };
}

export function validateImageUrl(value) {
  if (!value) return Promise.resolve();
  const hasImageExtension = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value);
  const isCloudinaryLike = /res\.cloudinary\.com/i.test(value);
  if (hasImageExtension || isCloudinaryLike) return Promise.resolve();
  return Promise.reject(new Error('URL ảnh phải là định dạng ảnh phổ biến (png, jpg, jpeg, webp, svg, gif)'));
}

export function validateActiveStock(status, value) {
  if (status === 'Active' && Number(value) <= 0) {
    return Promise.reject(new Error('Stock phải lớn hơn 0 khi trạng thái là Active'));
  }

  return Promise.resolve();
}
