import { Difficulty, QuestionStatus, QuestionModule } from '@prisma/client';
import { prisma } from '../../src/config/database';
import { ScoringService, ScoringConfig } from '../../src/modules/scoring/scoring.service';

describe('Dynamic Scoring Unit Test', () => {
  const defaultParams = {
    correctRanks: [10, 9],
    totalAnswers: 10,
    basePoints: 100,
    timeLimit: 60,
    remainingSeconds: 30,
    allSlotsFilled: true,
    difficulty: Difficulty.hard,
    isAdMultiplied: false,
  };

  it('should use default values when config is not provided', () => {
    const score = ScoringService.calculateFinalScore(defaultParams);
    
    // Base: 10+8 + 9+8 = 35. Total weight = sum(1..10 + 8) = 135.
    // Normalized: 10+8/135 * 100 = 13.33, 9+8/135 * 100 = 12.59 => total ~25.9
    // Math.floor(25.9) = 25
    // Time Bonus: 30/60 * 25 = 12.5 => floor(12) = 12
    // Multiplier (Hard): 1.5
    // Total: floor((25 + 12) * 1.5) = floor(37 * 1.5) = 55
    expect(score.scoreFinal).toBe(55);
  });

  it('should apply dynamic multipliers from config', () => {
    const customConfig: ScoringConfig = {
      adMultiplier: 2.0, // x2 instead of x1.5
      difficultyMediumMultiplier: 1.25,
      difficultyHardMultiplier: 2.0, // x2 instead of x1.5
      maxTimeBonus: 50, // 50 instead of 25
    };

    const score = ScoringService.calculateFinalScore({
      ...defaultParams,
      config: customConfig,
      isAdMultiplied: true
    });

    // scoreBase: 25 (same)
    // scoreTimeBonus: 30/60 * 50 = 25
    // scoreDifficulty: floor((25 + 25) * 2.0) = 100
    // scoreFinal: floor(100 * 2.0) = 200
    expect(score.scoreTimeBonus).toBe(25);
    expect(score.scoreFinal).toBe(200);
  });

  it('should cap time bonus to maxTimeBonus', () => {
    const config: ScoringConfig = {
      adMultiplier: 1.5,
      difficultyMediumMultiplier: 1.25,
      difficultyHardMultiplier: 1.5,
      maxTimeBonus: 10,
    };

    const score = ScoringService.calculateFinalScore({
      ...defaultParams,
      remainingSeconds: 60, // Full time remaining
      config
    });

    expect(score.scoreTimeBonus).toBe(10); // Capped at 10
  });
});
