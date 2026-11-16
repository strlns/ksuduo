// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {NextHintButton} from '../src/components/App/NextHintButton';
afterEach(() => {cleanup(); vi.useRealTimers();});
it('requires a full hold, cancels releases, and does not duplicate the trailing click', () => {
  vi.useFakeTimers();
  const hold = vi.fn(), click = vi.fn();
  render(<NextHintButton guarded disabled={false} onHint={click} onHold={hold}/>);
  const button = screen.getByRole('button');
  fireEvent.pointerDown(button);
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.pointerUp(button);
  fireEvent.click(button, {detail: 1});
  expect(screen.getByRole('status').textContent).toBe('Hold for 2 seconds');
  expect(hold).not.toHaveBeenCalled();
  fireEvent.pointerDown(button);
  act(() => vi.advanceTimersByTime(2000));
  fireEvent.pointerUp(button);
  fireEvent.click(button, {detail: 1});
  expect(hold).toHaveBeenCalledTimes(1);
  expect(click).not.toHaveBeenCalled();
});
it('allows unguarded and keyboard activation without a hold', () => {
  const click = vi.fn();
  const {rerender} = render(<NextHintButton guarded disabled={false} onHint={click} onHold={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button'), {detail: 0});
  rerender(<NextHintButton guarded={false} disabled={false} onHint={click} onHold={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button'), {detail: 1});
  expect(click).toHaveBeenCalledTimes(2);
});
