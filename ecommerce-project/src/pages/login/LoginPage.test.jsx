import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
