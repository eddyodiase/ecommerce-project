import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Product } from './Product';

describe('Product', () => {
  it('renders product details correctly', () => {
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

    render(<Product product={product} />);

    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText('$10.90')).toBeInTheDocument();
    expect(screen.getByAltText(`${product.rating.stars} star rating`)).toBeInTheDocument();
    expect(screen.getByText(product.rating.count)).toBeInTheDocument();
    expect(screen.getByTestId('product-image')).toHaveAttribute('src', product.image);
    expect(screen.getByTestId('product-rating-stars')).toHaveAttribute('src', `/images/ratings/rating-${product.rating.stars * 10}.png`);
  });
});