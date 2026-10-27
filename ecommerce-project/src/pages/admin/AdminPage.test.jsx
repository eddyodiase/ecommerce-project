import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { AdminPage } from './AdminPage';

describe('AdminPage', () => {
  beforeEach(() => {
    localStorage.setItem('sellerListings', JSON.stringify([
      {
        id: 'listing-1',
        productName: 'Coastal ceramic lamp',
        sellerName: 'NorthPeak Studio',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Home',
        price: 25000,
        description: 'Handcrafted ceramic lamp',
        originLocation: 'Ikeja, Lagos',
      },
    ]));
  });

  it('renders pending listings and approves one', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /pending seller listings/i })).toBeInTheDocument();
    expect(screen.getByText(/coastal ceramic lamp/i)).toBeInTheDocument();
    expect(screen.getByText(/origin: ikeja, lagos/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0]).toEqual(expect.objectContaining({
        id: 'listing-1',
        status: 'approved',
      }));
    });
  });
});
