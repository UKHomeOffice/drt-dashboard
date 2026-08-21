import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NotFoundPage from '../../components/NotFoundPage';

describe('NotFoundPage', () => {
  it('renders heading, guidance text and team email link', async () => {
    render(<NotFoundPage />);

    await waitFor(() => {
      expect(document.title).toBe('Page not found - Dynamic Response Tool - Border Force');
    });

    expect(screen.getByRole('heading', { name: /Page not found/i })).toBeInTheDocument();
    expect(screen.getByText(/If you typed the web address, check it is correct\./i)).toBeInTheDocument();
    expect(screen.getByText(/If you pasted the web address, check you copied the entire address\./i)).toBeInTheDocument();

    const emailLink = screen.getByRole('link', { name: /drtpoiseteam@homeoffice.gov.uk/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:drtpoiseteam@homeoffice.gov.uk');
  });
});
