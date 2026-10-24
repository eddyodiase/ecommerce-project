import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import axios from 'axios';
import { Header } from './Header';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [{ quantity: 2 }, { quantity: 1 }] })),
    post: vi.fn(),
  },
}));

describe('Header', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ name: 'Jane Smith', email: 'jane@example.com' }));
  });

  it('renders the cart count and order link', async () => {
    render(
      <MemoryRouter>
        <Header user={{ name: 'Jane Smith', email: 'jane@example.com' }} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/cart-items', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
