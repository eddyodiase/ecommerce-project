import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Product } from './Product';

describe('Product', () => {
  const product = {
    id: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6',
    image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
    name: 'Black and Gray Athletic Cotton Socks - 6 Pairs',
    priceCents: 1090,
    rating: {
      stars: 4.5,
      count: 87,
    },
  };

  it('renders product details correctly', () => {
    render(<Product product={product} />);

    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText('$10.90')).toBeInTheDocument();
    expect(screen.getByAltText(`${product.rating.stars} star rating`)).toBeInTheDocument();
    expect(screen.getByText(String(product.rating.count))).toBeInTheDocument();
    expect(screen.getByTestId('product-image')).toHaveAttribute('src', product.image);
    expect(screen.getByTestId('product-rating-stars')).toHaveAttribute('src', `/images/ratings/rating-${product.rating.stars * 10}.png`);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it("adds a product to the cart when the 'Add to Cart' button is clicked", async () => {
    const onAddToCart = vi.fn();

    render(<Product product={product} onAddToCart={onAddToCart} />);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    await userEvent.click(addToCartButton);

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith(product, 1);
  });
});