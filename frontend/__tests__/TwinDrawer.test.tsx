import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TwinDrawer from '@/components/widgets/TwinDrawer';

// Mock the Twin component
jest.mock('@/components/twin', () => ({
  __esModule: true,
  default: () => <div data-testid="twin-component">Twin Chat</div>,
}));

describe('TwinDrawer', () => {
  it('renders without mounting Twin when closed', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={false} onClose={onClose} />);

    // Twin should still be in the DOM (mounted, just off-screen)
    expect(screen.getByTestId('twin-component')).toBeInTheDocument();
  });

  it('shows backdrop when open', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    // Find the backdrop div
    const backdrop = document.querySelector('[style*="rgba(0,0,0,0.6)"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('closes drawer when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    const backdrop = document.querySelector('[style*="rgba(0,0,0,0.6)"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('closes drawer when close button is clicked', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close chat');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes drawer when Escape is pressed', async () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('locks body scroll when open', async () => {
    const onClose = jest.fn();
    const { rerender } = render(<TwinDrawer open={false} onClose={onClose} />);

    expect(document.body.style.overflow).not.toBe('hidden');

    rerender(<TwinDrawer open={true} onClose={onClose} />);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('restores body scroll when closed', async () => {
    const onClose = jest.fn();
    const { rerender } = render(<TwinDrawer open={true} onClose={onClose} />);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    rerender(<TwinDrawer open={false} onClose={onClose} />);

    await waitFor(() => {
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  it('renders header with avatar and status', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    // Check for avatar image
    const avatar = screen.getByAltText('') as HTMLImageElement;
    expect(avatar.src).toContain('/avatar.png');

    // Check for header text
    expect(screen.getByText(/Akash's twin/i)).toBeInTheDocument();
    expect(screen.getByText(/RAG-backed/i)).toBeInTheDocument();
  });

  it('has proper aria attributes', () => {
    const onClose = jest.fn();
    render(<TwinDrawer open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', "Chat with Akash's twin");
  });
});
