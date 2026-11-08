import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import axios from 'axios';

import { LoginPage } from './LoginPage';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

function CurrentPath() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('displays the Zambba branding with a link to the home page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Zambba' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Welcome back to Zambba')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('submits email and password and calls onLogin with locally generated auth data', async () => {
    const onLogin = vi.fn();

    render(
      <MemoryRouter>
        <LoginPage onLogin={onLogin} />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@shop.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'demo',
          email: 'demo@shop.com',
        }),
        expect.stringMatching(/^local-/)
      );
    });
  });

  it('authenticates the configured admin email and opens the admin dashboard', async () => {
    axios.post.mockResolvedValue({ data: { adminApiKey: 'server-admin-key' } });
    const onLogin = vi.fn();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
          <Route path="/admin" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'eddyodiase@yahoo.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByTestId('current-path')).toHaveTextContent('/admin');
    expect(axios.post).toHaveBeenCalledWith('/api/admin/login', {
      email: 'eddyodiase@yahoo.com',
      password: 'admin-password',
    });
    expect(sessionStorage.getItem('adminApiKey')).toBe('server-admin-key');
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'eddyodiase@yahoo.com' }),
      expect.stringMatching(/^admin-session-/)
    );
  });
});
