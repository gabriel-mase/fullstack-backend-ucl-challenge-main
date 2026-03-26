import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders prev and next buttons with current page info', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('← Prev')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('disables Prev button on first page', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('← Prev')).toBeDisabled();
    expect(screen.getByText('Next →')).not.toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('Next →')).toBeDisabled();
    expect(screen.getByText('← Prev')).not.toBeDisabled();
  });

  it('calls onPageChange with page - 1 when Prev is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText('← Prev'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with page + 1 when Next is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText('Next →'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
