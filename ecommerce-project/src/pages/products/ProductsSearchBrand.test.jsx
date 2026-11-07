import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { ProductsSearchPage } from './ProductsSearchPage';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
    data: {
      products: [
        { id: 'test-product', name: 'Test product', priceCents: 1000 },
        { id: 'samsung-phone', name: 'Samsung Galaxy S24', priceCents: 100000 },
      ],
    },
  }),
  },
}));

vi.mock('../../utils/sellerListings', () => ({
  canDeleteListing: vi.fn(),
  deleteSellerListing: vi.fn(),
  syncSellerListings: vi.fn().mockResolvedValue(undefined),
}));

describe('Products search branding', () => {
  it('shows Zambba as the home link', async () => {
    render(
      <MemoryRouter>
        <ProductsSearchPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Zambba' })).toHaveAttribute('href', '/');
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/products', expect.any(Object)));
    await screen.findByText('Test product');
  });

  it('shows the requested brands and Smart Phones subcategories', async () => {
    render(
      <MemoryRouter>
        <ProductsSearchPage />
      </MemoryRouter>
    );

    for (const brand of ['CottageBiology', 'CB Farms Fresh', 'CB Livestocks', 'CB Engineered', 'Smart Phones', 'Cars', 'Buses']) {
      expect(screen.getByRole('checkbox', { name: brand })).toBeInTheDocument();
    }

    expect(screen.queryByRole('checkbox', { name: 'NorthPeak' })).not.toBeInTheDocument();

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/products', expect.any(Object)));
    fireEvent.click(screen.getByRole('button', { name: 'Smart Phones' }));

    expect(screen.getByRole('button', { name: 'Samsung' })).toBeInTheDocument();
  });

  it('finds a Smart Phone by the first keyword of its product name', async () => {
    render(
      <MemoryRouter>
        <ProductsSearchPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/products', expect.any(Object)));
    fireEvent.change(screen.getByPlaceholderText('Search for products, brands, and more'), {
      target: { value: 'Samsung' },
    });

    expect(await screen.findByText('Samsung Galaxy S24')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Smart Phones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Samsung' }));
    expect(await screen.findByText('Samsung Galaxy S24')).toBeInTheDocument();
  });
});
