import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CheckoutPage } from './CheckoutPage';
import { CheckoutHeader } from './CheckoutHeader';

vi.mock('axios');

describe('CheckoutPage', () => {
  const cartItems = [
    {
      productId: 'p1',
      quantity: 2,
      deliveryOptionId: 'delivery-1',
      product: {
        id: 'p1',
        name: 'Black and Gray Athletic Cotton Socks - 6 Pairs',
        image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
        priceCents: 1090,
      },
    },
  ];

  const deliveryOptions = [
    {
      id: 'delivery-1',
      priceCents: 0,
      estimatedDeliveryTimeMs: new Date('2026-10-18T00:00:00Z').getTime(),
    },
    {
      id: 'delivery-2',
      priceCents: 1500,
      estimatedDeliveryTimeMs: new Date('2026-10-21T00:00:00Z').getTime(),
    },
  ];

  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.removeItem('guestCart');

    axios.get.mockImplementation((url) => {
      if (url === '/api/cart-items?expand=product') {
        return Promise.resolve({ data: cartItems });
      }

      if (url === '/api/delivery-options?expand=estimatedDeliveryTime') {
        return Promise.resolve({ data: deliveryOptions });
      }

      if (url === '/api/payment-summary') {
        return Promise.resolve({
          data: {
            totalItems: 2,
            productCostCents: 2180,
            shippingCostCents: 0,
            totalCostBeforeTaxCents: 2180,
            taxCents: 218,
            totalCostCents: 2398,
          },
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('renders the checkout summary and payment details', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Review your order')).toBeInTheDocument();
    expect(await screen.findByText('Black and Gray Athletic Cotton Socks - 6 Pairs')).toBeInTheDocument();
    expect(await screen.findByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Items (2):')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place your order/i })).toBeInTheDocument();
  });

  it('shows the guest cart item count in checkout header without a login', () => {
    localStorage.removeItem('authToken');
    localStorage.setItem('guestCart', JSON.stringify({
      p1: { productId: 'p1', quantity: 2 },
      p2: { productId: 'p2', quantity: 1 },
    }));

    axios.get.mockResolvedValue({
      data: { totalItems: 0 },
    });

    render(
      <MemoryRouter>
        <CheckoutHeader />
      </MemoryRouter>
    );

    expect(screen.getByText(/3 items/i)).toBeInTheDocument();
  });

  it('uses the exact product name from the cart item when the record stores it under an alternate field', async () => {
    const altNameCartItems = [
      {
        productId: 'p1',
        quantity: 1,
        deliveryOptionId: 'delivery-1',
        product: {
          id: 'p1',
          productName: 'NorthPeak Towel Hook',
          image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
          priceCents: 1090,
        },
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === '/api/cart-items?expand=product') {
        return Promise.resolve({ data: altNameCartItems });
      }

      if (url === '/api/delivery-options?expand=estimatedDeliveryTime') {
        return Promise.resolve({ data: deliveryOptions });
      }

      if (url === '/api/payment-summary') {
        return Promise.resolve({
          data: {
            totalItems: 1,
            productCostCents: 1090,
            shippingCostCents: 0,
            totalCostBeforeTaxCents: 1090,
            taxCents: 109,
            totalCostCents: 1199,
          },
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('NorthPeak Towel Hook')).toBeInTheDocument();
  });

  it('navigates to the orders page when the order is placed', async () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<div>Orders page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const placeOrderButton = await screen.findByRole('button', { name: /place your order/i });
    await userEvent.click(placeOrderButton);

    expect(await screen.findByText('Orders page')).toBeInTheDocument();
  });
});
