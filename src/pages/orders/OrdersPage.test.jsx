import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrdersPage } from './OrdersPage';

vi.mock('axios');

describe('OrdersPage', () => {
  const orders = [
    {
      id: 'order-1',
      orderTimeMs: new Date('2026-10-01T00:00:00Z').getTime(),
      totalCostCents: 3990,
      products: [
        {
          productId: 'p1',
          quantity: 1,
          estimatedDeliveryTimeMs: new Date('2026-10-18T00:00:00Z').getTime(),
          product: {
            id: 'p1',
            name: 'Black and Gray Athletic Cotton Socks - 6 Pairs',
            image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/orders?expand=products') {
        return Promise.resolve({ data: orders });
      }

      if (url === '/api/cart-items') {
        return Promise.resolve({ data: [{ quantity: 1 }] });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('renders the orders list and action buttons', async () => {
    render(
      <MemoryRouter>
        <OrdersPage quantityByProduct={{}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Your Orders')).toBeInTheDocument();
    expect(await screen.findByText('Black and Gray Athletic Cotton Socks - 6 Pairs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /track package/i })).toBeInTheDocument();
  });

  it('navigates to the tracking page when track package is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/orders" element={<OrdersPage quantityByProduct={{}} />} />
          <Route path="/tracking" element={<div>Tracking page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const trackPackageButton = await screen.findByRole('button', { name: /track package/i });
    await userEvent.click(trackPackageButton);

    expect(await screen.findByText('Tracking page')).toBeInTheDocument();
  });
});
