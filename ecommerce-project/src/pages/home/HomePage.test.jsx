import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import { HomePage } from './HomePage';

vi.mock('axios');

describe('HomePage', () => {
  const products = [
    {
      id: 'p1',
      name: 'Black and Gray Athletic Cotton Socks - 6 Pairs',
      image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
      priceCents: 1000,
      rating: {
        stars: 4.5,
        count: 87,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('authToken', 'test-token');
  });

  it('renders the product list from the API', async () => {
    axios.get.mockResolvedValue({ data: products });

    render(
      <MemoryRouter>
        <HomePage quantityByProduct={{}} setQuantityByProduct={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Black and Gray Athletic Cotton Socks - 6 Pairs')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/products');
  });

  it('adds a product to the cart when the button is clicked', async () => {
    axios.get.mockResolvedValue({ data: products });
    axios.post.mockResolvedValue({});

    render(
      <MemoryRouter>
        <HomePage quantityByProduct={{}} setQuantityByProduct={vi.fn()} />
      </MemoryRouter>
    );

    const addButton = await screen.findByRole('button', { name: /add to cart/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/cart-items', {
        productId: 'p1',
        quantity: 1,
      }, {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });
});
