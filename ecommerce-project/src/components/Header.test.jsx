import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import axios from 'axios';
import { Header } from './Header';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [{ quantity: 2 }, { quantity: 1 }] })),
  },
}));

describe('Header', () => {
  it('renders the cart count and order link', async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/cart-items');
  });
});
