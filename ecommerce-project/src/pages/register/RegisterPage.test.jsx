import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import { RegisterPage } from './RegisterPage';

vi.mock('axios');

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an account and calls onRegister with the user data', async () => {
    const onRegister = vi.fn();
    axios.post.mockResolvedValue({
      data: {
        token: 'new-token',
        user: { id: 'u2', name: 'Jane Smith', email: 'jane@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <RegisterPage onRegister={onRegister} />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Smith');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password456');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/register', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password456',
      });
    });

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
        }),
        'new-token'
      );
    });
  });
});
