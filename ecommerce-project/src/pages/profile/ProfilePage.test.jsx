import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import { ProfilePage } from './ProfilePage';

vi.mock('axios');

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('authUser', JSON.stringify({
      id: 'u1',
      name: 'Jane Smith',
      email: 'jane@example.com',
    }));
  });

  it('shows order summary and updates account settings', async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          id: 'o1',
          orderTimeMs: 1720000000000,
          totalCostCents: 5000,
          products: [{ productId: 'p1', quantity: 1 }],
        },
      ],
    });

    render(
      <MemoryRouter>
        <ProfilePage
          user={{ id: 'u1', name: 'Jane Smith', email: 'jane@example.com' }}
          onLogout={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/recent orders/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 order/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/full name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane Doe');

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'jane@new.com');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const savedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      expect(savedUser).toEqual(expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@new.com',
      }));
    });
  });
});
