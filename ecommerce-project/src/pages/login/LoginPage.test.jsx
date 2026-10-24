import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import { LoginPage } from './LoginPage';

vi.mock('axios');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits email and password and calls onLogin with the user data', async () => {
    const onLogin = vi.fn();
    axios.post.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: 'u1', name: 'Demo User', email: 'demo@shop.com' },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage onLogin={onLogin} />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@shop.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/login', {
        email: 'demo@shop.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'demo@shop.com',
        }),
        'fake-token'
      );
    });
  });
});
