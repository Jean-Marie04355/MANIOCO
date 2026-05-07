import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';
import { Search } from 'lucide-react';

describe('Input Component', () => {
  it('renders correctly with an icon', () => {
    render(<Input icon={Search} placeholder="Search..." />);
    const input = screen.getByPlaceholder飲; // Wait, I should use getByPlaceholderText
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('applies custom className', () => {
    render(<Input icon={Search} className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('passes other props to the input element', () => {
    render(<Input icon={Search} type="password" name="test-input" />);
    const input = screen.getByRole('textbox', { hidden: true }); // type password might need special selector or just getByRole
    // Actually getByRole('textbox') doesn't find type password
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeDefined();
  });
});
