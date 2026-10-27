import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { PRODUCT_TAXONOMY } from '../products/ProductsSearchPage';
import { SellPage } from './SellPage';

describe('Sell flow', () => {
  const originalFileReader = globalThis.FileReader;

  beforeEach(() => {
    localStorage.removeItem('sellerListings');

    class FileReaderMock {
      readAsDataURL(file) {
        if (this.onload) {
          this.result = `data:image/jpeg;base64,${file.name}`;
          this.onload();
        }
      }
    }

    globalThis.FileReader = FileReaderMock;
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
  });

  it('renders the seller form for listing a product', () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /start selling on northpeak/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(PRODUCT_TAXONOMY);
  });

  it('requires a product photo before publishing a listing', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/product images/i)).toBeRequired();
    fireEvent.submit(document.querySelector('form'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /upload at least one product photo/i
    );
    expect(localStorage.getItem('sellerListings')).toBeNull();
  });

  it('adds photos across selections, caps at 10, and lets sellers remove photos', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    const makeFiles = (start, count) => Array.from({ length: count }, (_, i) => (
      new File(['image-data'], `photo-${start + i}.jpg`, { type: 'image/jpeg' })
    ));

    fireEvent.change(screen.getByLabelText(/product images/i), { target: { files: makeFiles(1, 6) } });
    await waitFor(() => expect(screen.getByText(/uploaded: 6 photo\(s\)/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/product images/i), { target: { files: makeFiles(7, 6) } });
    await waitFor(() => expect(screen.getByText(/uploaded: 10 photo\(s\)/i)).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/up to 10 photos/i);

    fireEvent.click(screen.getByRole('button', { name: /remove photo 1$/i }));
    await waitFor(() => expect(screen.getByText(/uploaded: 9 photo\(s\)/i)).toBeInTheDocument());
  });

  it('stores a seller listing locally when published', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Coastal ceramic lamp' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(/seller name/i), {
      target: { value: 'NorthPeak Studio' },
    });
    fireEvent.change(screen.getByLabelText(/origin location/i), {
      target: { value: 'Ikeja, Lagos' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A handcrafted ceramic lamp for cozy spaces.' },
    });
    const fileInput = screen.getByLabelText(/product image/i);
    const file = new File(['image-data'], 'lamp.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploaded: 1 photo\(s\)/i)).toBeInTheDocument();
    });

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0]).toEqual(expect.objectContaining({
        productName: 'Coastal ceramic lamp',
        category: 'Home',
        price: 25000,
        description: 'A handcrafted ceramic lamp for cozy spaces.',
        sellerName: 'NorthPeak Studio',
        originLocation: 'Ikeja, Lagos',
        imageDataUrl: 'data:image/jpeg;base64,lamp.jpg',
        imageDataUrls: ['data:image/jpeg;base64,lamp.jpg'],
        imageNames: ['lamp.jpg'],
        status: 'pending',
      }));
    });
  });

  it('shows Smart Phones spec fields and saves RAM/storage options for phone listings', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'Smart Phones' },
    });

    expect(screen.getByLabelText(/ram options/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/storage options/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'vivo B2 Pro' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '214900' },
    });
    fireEvent.change(screen.getByLabelText(/seller name/i), {
      target: { value: 'vivo Official' },
    });
    fireEvent.change(screen.getByLabelText(/origin location/i), {
      target: { value: 'Yaba, Lagos' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Fast 5G smartphone with excellent display.' },
    });
    fireEvent.change(screen.getByLabelText(/brand/i), {
      target: { value: 'vivo' },
    });
    fireEvent.change(screen.getByLabelText(/operating system/i), {
      target: { value: 'Android 15' },
    });
    fireEvent.change(screen.getByLabelText(/ram options/i), {
      target: { value: '8, 12' },
    });
    fireEvent.change(screen.getByLabelText(/storage options/i), {
      target: { value: '128, 256' },
    });
    const fileInput = screen.getByLabelText(/product image/i);
    const file = new File(['image-data'], 'vivo-b2-pro.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploaded: 1 photo\(s\)/i)).toBeInTheDocument();
    });

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0]).toEqual(expect.objectContaining({
        productName: 'vivo B2 Pro',
        category: 'Smart Phones',
        sellerName: 'vivo Official',
        originLocation: 'Yaba, Lagos',
        imageDataUrl: 'data:image/jpeg;base64,vivo-b2-pro.jpg',
        imageDataUrls: ['data:image/jpeg;base64,vivo-b2-pro.jpg'],
        phoneSpecs: expect.objectContaining({
          brand: 'vivo',
          os: 'Android 15',
          ramOptionsGb: [8, 12],
          storageOptionsGb: [128, 256],
        }),
      }));
    });
  });

  it('accepts up to 10 photos and persists only the first 10', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Gallery heavy product' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '12000' },
    });
    fireEvent.change(screen.getByLabelText(/seller name/i), {
      target: { value: 'Studio Lens' },
    });
    fireEvent.change(screen.getByLabelText(/origin location/i), {
      target: { value: 'Wuse, Abuja' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Product with many photos' },
    });

    const fileInput = screen.getByLabelText(/product images/i);
    const files = Array.from({ length: 11 }, (_, index) => new File(['image-data'], `photo-${index + 1}.jpg`, { type: 'image/jpeg' }));
    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/uploaded: 10 photo\(s\)/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/up to 10 photos/i);
    });

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0].imageDataUrls).toHaveLength(10);
      expect(listings[0].imageNames).toHaveLength(10);
      expect(listings[0].imageName).toBe('photo-1.jpg');
      expect(listings[0].imageNames[9]).toBe('photo-10.jpg');
    });
  });

  it('reorders uploaded photos by drag-and-drop and persists first photo as primary', async () => {
    render(
      <MemoryRouter>
        <SellPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Reorder test phone' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '180000' },
    });
    fireEvent.change(screen.getByLabelText(/seller name/i), {
      target: { value: 'Test Seller' },
    });
    fireEvent.change(screen.getByLabelText(/origin location/i), {
      target: { value: 'Surulere, Lagos' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Testing reorder behavior' },
    });

    const fileInput = screen.getByLabelText(/product images/i);
    const files = [
      new File(['image-data'], 'photo-1.jpg', { type: 'image/jpeg' }),
      new File(['image-data'], 'photo-2.jpg', { type: 'image/jpeg' }),
      new File(['image-data'], 'photo-3.jpg', { type: 'image/jpeg' }),
    ];
    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/uploaded: 3 photo\(s\)/i)).toBeInTheDocument();
    });

    const firstTile = screen.getByText('Primary • photo-1.jpg').closest('figure');
    const thirdTile = screen.getByText('photo-3.jpg').closest('figure');

    fireEvent.dragStart(firstTile);
    fireEvent.dragOver(thirdTile);
    fireEvent.drop(thirdTile);

    await waitFor(() => {
      expect(screen.getByText('Primary • photo-2.jpg')).toBeInTheDocument();
    });

    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
      expect(listings[0].imageName).toBe('photo-2.jpg');
      expect(listings[0].imageNames).toEqual(['photo-2.jpg', 'photo-3.jpg', 'photo-1.jpg']);
    });
  });
});
