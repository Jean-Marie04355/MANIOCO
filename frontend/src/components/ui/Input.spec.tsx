import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';
import { Search } from 'lucide-react';

describe('Input Component', () => {
  it('renders correctly with an icon', () => {
    render(<Input icon={Search} placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeDefined();
  });

  it('applies custom className to the input element', () => {
    render(<Input icon={Search} className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('passes other props (type, name) to the input element', () => {
    const { container } = render(<Input icon={Search} type="password" name="test-input" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).not.toBeNull();
  });

  it('renders the wrapper div with relative class', () => {
    const { container } = render(<Input icon={Search} />);
    const wrapper = container.querySelector('div.relative');
    expect(wrapper).not.toBeNull();
  });
});
