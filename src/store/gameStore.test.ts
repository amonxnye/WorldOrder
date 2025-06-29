
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGameStore.getState().resetGame();
  });

  it('should have a default state', () => {
    const state = useGameStore.getState();
    expect(state.year).toBe(1925);
    expect(state.nationName).toBe('New Nation');
    expect(state.leaderName).toBe('Anonymous Leader');
  });

  it('should set the nation and leader names', () => {
    const state = useGameStore.getState();
    state.setNation('Test Nation');
    state.setLeader('Test Leader');
    expect(useGameStore.getState().nationName).toBe('Test Nation');
    expect(useGameStore.getState().leaderName).toBe('Test Leader');
  });

  it('should advance the month and year', () => {
    const state = useGameStore.getState();
    state.advanceMonth();
    expect(useGameStore.getState().month).toBe(2);
    for (let i = 0; i < 11; i++) {
      state.advanceMonth();
    }
    expect(useGameStore.getState().year).toBe(1925);
    expect(useGameStore.getState().month).toBe(12);
    state.advanceMonth();
    expect(useGameStore.getState().year).toBe(1925); // Year does not advance if objectives are not met
  });

  it('should select a technology', () => {
    const state = useGameStore.getState();
    state.selectTech('gov_colonial_resistance');
    expect(useGameStore.getState().unlockedTechs).toContain('gov_colonial_resistance');
  });
});
