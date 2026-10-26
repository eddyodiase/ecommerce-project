import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { PRODUCT_TAXONOMY } from '../products/ProductsSearchPage';
import { SellPage } from './SellPage';

describe('Sell flow', () => {
  beforeEach(() => {
    localStorage.removeItem('sellerListings');
  });

  it('renders the seller form for listing a product', () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /start selling on northpeak/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(PRODUCT_TAXONOMY);
  });

  it('stores a seller listing locally when published', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Coastal ceramic lamp' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(/seller name/i), {
      target: { value: 'NorthPeak Studio' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A handcrafted ceramic lamp for cozy spaces.' },
    });

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0]).toEqual(expect.objectContaining({
        productName: 'Coastal ceramic lamp',
        category: 'Home',
        price: 25000,
        description: 'A handcrafted ceramic lamp for cozy spaces.',
        sellerName: 'NorthPeak Studio',
        status: 'pending',
      }));
    });
  });
});
