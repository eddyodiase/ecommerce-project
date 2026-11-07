import axios from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { AdminPage } from './AdminPage';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('AdminPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('adminApiKey', 'test-admin-key');
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
    axios.get.mockImplementation((url) => Promise.resolve({
      data: url === '/api/listings'
        ? [{
          id: 'listing-1',
          productName: 'Coastal ceramic lamp',
          sellerName: 'NorthPeak Studio',
          status: 'pending',
          createdAt: new Date().toISOString(),
          category: 'Home',
          price: 25000,
          description: 'Handcrafted ceramic lamp',
          originLocation: 'Ikeja, Lagos',
        }]
        : [],
    }));
    axios.patch.mockResolvedValue({ data: { status: 'approved' } });
  });

  it('renders pending listings and approves one', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /load admin data/i }));
    expect(await screen.findByRole('heading', { name: /pending seller listings/i })).toBeInTheDocument();
    expect(await screen.findByText(/coastal ceramic lamp/i)).toBeInTheDocument();
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
