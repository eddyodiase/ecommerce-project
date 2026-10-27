import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProductDetailPage } from './ProductDetailPage';

describe('ProductDetailPage', () => {
  it('loads a product when the route uses a base product id rather than the generated suffix id', () => {
    render(
      <MemoryRouter initialEntries={['/products/nexa-phone-1']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /nexa x9 pro 5g/i })).toBeInTheDocument();
    expect(screen.queryByText(/product not found/i)).not.toBeInTheDocument();
  });

  it('loads a product when the route uses a slugified product title', () => {
    render(
      <MemoryRouter initialEntries={['/products/nexa-x9-pro-5g']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /nexa x9 pro 5g/i })).toBeInTheDocument();
  });

  it('loads a product when the route matches a backend product UUID', async () => {
    const product = {
      id: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6',
      name: 'Black and Gray Athletic Cotton Socks - 6 Pairs',
      keywords: ['socks', 'sports', 'apparel'],
      image: '/images/products/athletic-cotton-socks-6-pairs.jpg',
      priceCents: 1090,
      rating: { stars: 4.5, count: 87 },
      brand: 'NorthPeak',
      category: 'Fashion',
      seller: 'NorthPeak Marketplace',
      deliveryType: 'Standard',
      cardType: 'Visa',
    };

    const { default: axios } = await import('axios');
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [product] });

    render(
      <MemoryRouter initialEntries={['/products/e43638ce-6aa0-4b85-b27f-e1d07eb678c6']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /black and gray athletic cotton socks - 6 pairs/i })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('hides Storage size for non-phone backend products', async () => {
    const product = {
      id: 'home-product-1',
      name: '2 Slot Toaster - White',
      keywords: ['toaster', 'kitchen', 'appliances'],
      image: '/images/products/2-slot-toaster-white.jpg',
      priceCents: 1899,
      rating: { stars: 5, count: 2197 },
      brand: 'NorthPeak',
      category: 'Home',
      seller: 'NorthPeak Marketplace',
      deliveryType: 'Standard',
      cardType: 'Visa',
    };

    const { default: axios } = await import('axios');
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [product] });

    render(
      <MemoryRouter initialEntries={['/products/home-product-1']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: /2 slot toaster - white/i });
    expect(screen.queryByText(/storage size/i)).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows Storage size for Smart Phones products', () => {
    render(
      <MemoryRouter initialEntries={['/products/nexa-phone-1']}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/storage size/i)).toBeInTheDocument();
    expect(screen.getByText(/ram/i)).toBeInTheDocument();
    expect(screen.getByText(/phone specifications/i)).toBeInTheDocument();
  });
});
