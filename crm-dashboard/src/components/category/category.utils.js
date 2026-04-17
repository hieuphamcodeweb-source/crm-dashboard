export function slugify(input = '') {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export function isDuplicateCategoryName(categories, value) {
  if (!value) return false;
  return categories.some((category) => category.name.toLowerCase() === value.trim().toLowerCase());
}

export function isDuplicateCategorySlug(categories, value) {
  if (!value) return false;
  return categories.some((category) => category.slug.toLowerCase() === value.toLowerCase());
}

export function filterAndSortCategories(categories, search, sortBy) {
  const matched = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'A-Z') {
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortBy === 'Oldest') {
    return [...matched].sort((a, b) =>
      a.created_at && b.created_at
        ? new Date(a.created_at) - new Date(b.created_at)
        : Number(a.id) - Number(b.id)
    );
  }

  return [...matched].sort((a, b) =>
    a.created_at && b.created_at
      ? new Date(b.created_at) - new Date(a.created_at)
      : Number(b.id) - Number(a.id)
  );
}

export function buildCategoryPayload(categories, values, now = new Date().toISOString()) {
  const maxId = categories.reduce((max, category) => Math.max(max, Number(category.id) || 0), 0);
  return {
    id: maxId + 1,
    name: values.name.trim(),
    slug: slugify(values.slug),
    created_at: now,
    updated_at: now,
  };
}
