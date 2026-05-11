import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CitadelLayout from './CitadelLayout';
import { Lock } from 'lucide-react';

// Mock Next/Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('CitadelLayout', () => {
  const defaultProps = {
    title: "Test Title",
    subtitle: "Test Subtitle",
    backUrl: "/back",
    backLabel: "Go Back",
    icon: <Lock data-testid="lock-icon" />,
    children: <div data-testid="child-content">Child Content</div>
  };

  it('devrait afficher le titre et le sous-titre', () => {
    render(<CitadelLayout {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it('devrait afficher l\'icône et le contenu enfant', () => {
    render(<CitadelLayout {...defaultProps} />);
    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it('devrait afficher le lien de retour avec le bon label', () => {
    render(<CitadelLayout {...defaultProps} />);
    const backLink = screen.getByText("Go Back");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/back');
  });
});
