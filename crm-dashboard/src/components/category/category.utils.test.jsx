import { App } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CategoryTable from './CategoryTable';
import {
  buildCategoryPayload,
  filterAndSortCategories,
  isDuplicateCategoryName,
  isDuplicateCategorySlug,
  slugify,
} from './category.utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithApp(ui) {
  return render(<App>{ui}</App>);
}

afterEach(() => {
  vi.restoreAllMocks();
  mockNavigate.mockReset();
});

describe('category utils', () => {
  it('slugify removes accent and special characters', () => {
    expect(slugify('Điện thoại Cao Cấp!!!')).toBe('dien-thoai-cao-cap');
  });

  it('buildCategoryPayload creates normalized payload', () => {
    const categories = [{ id: 2 }, { id: '10' }];
    const payload = buildCategoryPayload(categories, { name: '  Tablet  ', slug: 'Máy Tính Bảng' }, '2026-04-17T00:00:00.000Z');

    expect(payload).toEqual({
      id: 11,
      name: 'Tablet',
      slug: 'may-tinh-bang',
      created_at: '2026-04-17T00:00:00.000Z',
      updated_at: '2026-04-17T00:00:00.000Z',
    });
  });

  it('detects duplicate name and slug', () => {
    const categories = [{ name: 'Laptop', slug: 'laptop' }];
    expect(isDuplicateCategoryName(categories, ' laptop ')).toBe(true);
    expect(isDuplicateCategorySlug(categories, 'LAPTOP')).toBe(true);
  });

  it('filters and sorts by name', () => {
    const categories = [
      { id: 1, name: 'Phone', slug: 'phone' },
      { id: 2, name: 'Laptop', slug: 'laptop' },
    ];
    const result = filterAndSortCategories(categories, '', 'A-Z');
    expect(result.map((item) => item.name)).toEqual(['Laptop', 'Phone']);
  });
});

describe('CategoryTable', () => {
  it('renders categories and applies search', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          { id: 1, name: 'Laptop', slug: 'laptop', created_at: '2026-04-17T00:00:00.000Z', updated_at: '2026-04-17T00:00:00.000Z' },
          { id: 2, name: 'Phone', slug: 'phone', created_at: '2026-04-17T00:00:00.000Z', updated_at: '2026-04-17T00:00:00.000Z' },
        ],
      })
    );

    renderWithApp(<CategoryTable />);

    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Search'), 'laptop');

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    });
  });

  it('shows error state when api returns failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => [],
      })
    );

    renderWithApp(<CategoryTable />);
    expect(await screen.findByText(/Không thể tải danh mục/i)).toBeInTheDocument();
  });
});
