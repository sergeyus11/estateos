import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingPage from '@/app/(marketing)/page';

describe('LandingPage', () => {
  it('renders EstateOS heading', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'EstateOS' })).toBeInTheDocument();
  });

  it('renders Войти CTA', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('cta-login')).toHaveAttribute('href', '/login');
  });

  it('mentions agency target', () => {
    render(<LandingPage />);
    expect(screen.getByText(/агентств недвижимости/i)).toBeInTheDocument();
  });
});
