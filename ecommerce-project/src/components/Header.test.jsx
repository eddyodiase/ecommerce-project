import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import axios from 'axios';
import { Header } from './Header';

function CurrentPath() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

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

    expect(screen.getByRole('link', { name: /zambba/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/cart-items');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shows LOGIN for authenticated users and opens the shared login page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Header user={{ name: 'Jane Smith' }} />} />
          <Route path="/login" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.queryByText(/hi, jane/i)).not.toBeInTheDocument();
  });
});
