
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import NationSelector from './NationSelector';
import { useGameStore } from '../store/gameStore';

describe('NationSelector', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGameStore.getState().resetGame();
  });

  it('should render the nation and leader names', () => {
    useGameStore.getState().setNation('Test Nation');
    useGameStore.getState().setLeader('Test Leader');
    render(<NationSelector />);
    expect(screen.getByText('Test Nation')).toBeInTheDocument();
    expect(screen.getByText('Leader: Test Leader')).toBeInTheDocument();
  });

  it('should open the edit form when clicked', () => {
    render(<NationSelector />);
    fireEvent.click(screen.getByText('New Nation'));
    expect(screen.getByLabelText('Nation Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Leader Name')).toBeInTheDocument();
  });

  it('should update the nation and leader names when the form is submitted', () => {
    render(<NationSelector />);
    fireEvent.click(screen.getByText('New Nation'));

    const nationInput = screen.getByLabelText('Nation Name');
    const leaderInput = screen.getByLabelText('Leader Name');

    fireEvent.change(nationInput, { target: { value: 'Updated Nation' } });
    fireEvent.change(leaderInput, { target: { value: 'Updated Leader' } });

    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Updated Nation')).toBeInTheDocument();
    expect(screen.getByText('Leader: Updated Leader')).toBeInTheDocument();
  });
});
