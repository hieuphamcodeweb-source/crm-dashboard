import { App } from 'antd';
import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { buildCategoryOptions, buildProductPayload, validateActiveStock, validateImageUrl } from './product.utils';
import ProductTable from './ProductTable';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('buildCategoryOptions', () => {
  it('returns unique category options by name', () => {
    const input = [
      { id: 1, name: 'Laptop' },
      { id: 2, name: 'Laptop' },
      { id: 3, name: 'Phone' },
    ];

    expect(buildCategoryOptions(input)).toEqual([
      { label: 'Laptop', value: 'Laptop' },
      { label: 'Phone', value: 'Phone' },
    ]);
  });

  it('returns empty array when input is invalid', () => {
    expect(buildCategoryOptions(null)).toEqual([]);
  });
});

describe('buildProductPayload', () => {
  it('uppercases sku and keeps stock for active status', () => {
    const product = { id: 1, createdAt: '2026-04-17' };
    const values = { sku: 'mba-m3-13', status: 'Active', stock: 5, name: 'MacBook Air M3' };

    expect(buildProductPayload(product, values)).toEqual({
      id: 1,
      createdAt: '2026-04-17',
      sku: 'MBA-M3-13',
      status: 'Active',
      stock: 5,
      name: 'MacBook Air M3',
    });
  });

  it('forces stock to zero for inactive status', () => {
    const product = { id: 1 };
    const values = { sku: 'sp-01', status: 'Inactive', stock: 10 };

    expect(buildProductPayload(product, values).stock).toBe(0);
  });
});

describe('validateImageUrl', () => {
  it('resolves for common image extension', async () => {
    await expect(validateImageUrl('https://example.com/a.webp')).resolves.toBeUndefined();
  });

  it('resolves for cloudinary-like url', async () => {
    await expect(validateImageUrl('https://res.cloudinary.com/demo/image/upload/v1/test')).resolves.toBeUndefined();
  });

  it('rejects for non-image url', async () => {
    await expect(validateImageUrl('https://example.com/file.pdf')).rejects.toThrow(
      'URL ảnh phải là định dạng ảnh phổ biến'
    );
  });
});

describe('validateActiveStock', () => {
  it('rejects when active and stock <= 0', async () => {
    await expect(validateActiveStock('Active', 0)).rejects.toThrow('Stock phải lớn hơn 0');
  });

  it('resolves when inactive with stock 0', async () => {
    await expect(validateActiveStock('Inactive', 0)).resolves.toBeUndefined();
  });
});

function renderWithApp(ui) {
  return render(createElement(App, null, ui));
}

afterEach(() => {
  vi.restoreAllMocks();
  mockNavigate.mockReset();
});

describe('ProductTable', () => {
  it('renders product list and supports search filter', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              name: 'MacBook Air M3',
              category: 'Laptop',
              sku: 'MBA-M3-13',
              price: 32990000,
              stock: 10,
              status: 'Active',
            },
            {
              id: 2,
              name: 'iPhone 15',
              category: 'Phone',
              sku: 'IP15-128',
              price: 20990000,
              stock: 8,
              status: 'Active',
            },
          ],
        });
      }

      if (String(url).includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ name: 'Laptop' }, { name: 'Phone' }],
        });
      }

      return Promise.reject(new Error('Unknown url'));
    });

    renderWithApp(createElement(ProductTable));

    expect(await screen.findByText('MacBook Air M3')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search');
    await userEvent.type(searchInput, 'macbook');

    await waitFor(() => {
      expect(screen.getByText('MacBook Air M3')).toBeInTheDocument();
      expect(screen.queryByText('iPhone 15')).not.toBeInTheDocument();
    });
  });

  it('shows error message when cannot load products', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/products')) {
        return Promise.resolve({
          ok: false,
          json: async () => [],
        });
      }

      if (String(url).includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }

      return Promise.reject(new Error('Unknown url'));
    });

    renderWithApp(createElement(ProductTable));

    expect(await screen.findByText('Cannot load product data')).toBeInTheDocument();
  });
});
