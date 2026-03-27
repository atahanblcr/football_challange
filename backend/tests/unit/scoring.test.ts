import { ScoringService } from '../../src/modules/scoring/scoring.service';
import { Difficulty } from '@prisma/client';

describe('ScoringService Unit Tests', () => {
  describe('calculatePositionScores', () => {
    it('should calculate scores for a 10-answer question correctly (basePoints=100)', () => {
      const n = 10;
      const basePoints = 100;
      const scores = ScoringService.calculatePositionScores(n, basePoints);

      expect(scores.size).toBe(n);
      
      // weights: 9, 10, 11, 12, 13, 14, 15, 16, 17, 18. Σ = 135.
      // Rank 1: 9/135 * 100 = 6.666...
      // Rank 10: 18/135 * 100 = 13.333...
      expect(scores.get(1)).toBeCloseTo(6.66, 1);
      expect(scores.get(10)).toBeCloseTo(13.33, 1);

      // Toplam puan basePoints'e eşit olmalı
      let total = 0;
      scores.forEach(s => total += s);
      expect(total).toBeCloseTo(basePoints, 5);
    });

    it('should calculate scores for a 5-answer question correctly (basePoints=100)', () => {
      const n = 5;
      const basePoints = 100;
      const scores = ScoringService.calculatePositionScores(n, basePoints);

      expect(scores.size).toBe(n);
      
      let total = 0;
      scores.forEach(s => total += s);
      expect(total).toBeCloseTo(basePoints, 5);
      
      // Rank N her zaman Rank 1'den büyük olmalı
      expect(scores.get(5)).toBeGreaterThan(scores.get(1)!);
    });
  });

  describe('calculateFinalScore', () => {
    const defaultParams = {
      totalAnswers: 10,
      basePoints: 100,
      timeLimit: 60,
      remainingSeconds: 0,
      allSlotsFilled: false,
      difficulty: 'easy' as Difficulty,
      correctRanks: [],
    };

    it('should return 0 for no correct answers', () => {
      const result = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [],
      });

      expect(result.scoreBase).toBe(0);
      expect(result.scoreFinal).toBe(0);
    });

    it('should calculate base score for correct answers correctly', () => {
      // 10 cevaplıda Rank 1 ≈ 8.2, Rank 2 ≈ 9.0 (offset=8, totalWeight=125)
      // weight(1) = 9, weight(2) = 10 => 9/125*100 = 7.2, 10/125*100 = 8.0?
      // Re-calculating: offset = 10 * 0.8 = 8. Σ(1+8...10+8) = 9+10+11+12+13+14+15+16+17+18 = 135.
      // Rank 1: 9/135*100 = 6.66...
      // Rank 10: 18/135*100 = 13.33...
      const result = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
      });

      // (9+18)/135 * 100 = 27/135 * 100 = 0.2 * 100 = 20
      expect(result.scoreBase).toBe(20);
      expect(result.scoreFinal).toBe(20);
    });

    it('should apply time bonus correctly only when all slots are filled', () => {
      // 30 saniye kala bitirdi, 60 saniye limit. Bonus = floor(30/60 * 25) = 12
      const resultWithSlots = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
        remainingSeconds: 30,
        allSlotsFilled: true,
      });

      expect(resultWithSlots.scoreTimeBonus).toBe(12);
      expect(resultWithSlots.scoreFinal).toBe(20 + 12);

      const resultWithoutSlots = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
        remainingSeconds: 30,
        allSlotsFilled: false,
      });

      expect(resultWithoutSlots.scoreTimeBonus).toBe(0);
      expect(resultWithoutSlots.scoreFinal).toBe(20);
    });

    it('should apply difficulty multipliers correctly', () => {
      const basePoints = 100; // (correct ranks 1+10 = 20 points as calculated before)
      
      const mediumResult = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
        difficulty: 'medium' as Difficulty,
      });
      // 20 * 1.25 = 25
      expect(mediumResult.scoreFinal).toBe(25);

      const hardResult = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
        difficulty: 'hard' as Difficulty,
      });
      // 20 * 1.5 = 30
      expect(hardResult.scoreFinal).toBe(30);
    });

    it('should apply ad multiplier correctly (x1.5)', () => {
      const result = ScoringService.calculateFinalScore({
        ...defaultParams,
        correctRanks: [1, 10],
        isAdMultiplied: true,
      });
      // 20 * 1.5 = 30
      expect(result.scoreFinal).toBe(30);
    });

    it('should handle complex case (all bonuses)', () => {
      // 10 answers, base 100, hard difficulty, all slots filled, 45s remaining of 60s, ad watched
      // Position score: 1, 5, 10 => weight: 9, 13, 18 => (9+13+18)/135 * 100 = 40/135 * 100 = 29.629...
      // Base score (rounded): floor(29.629) = 29
      // Time bonus: 45/60 * 25 = 0.75 * 25 = 18.75 => floor(18.75) = 18
      // Sum: 29 + 18 = 47
      // Difficulty: 47 * 1.5 (hard) = 70.5 => floor = 70
      // Ad: 70 * 1.5 = 105 => floor = 105
      
      const result = ScoringService.calculateFinalScore({
        totalAnswers: 10,
        basePoints: 100,
        timeLimit: 60,
        remainingSeconds: 45,
        allSlotsFilled: true,
        difficulty: 'hard' as Difficulty,
        correctRanks: [1, 5, 10],
        isAdMultiplied: true,
      });

      expect(result.scoreBase).toBe(29);
      expect(result.scoreTimeBonus).toBe(18);
      expect(result.scoreDifficulty).toBe(70); 
      expect(result.scoreFinal).toBe(105); 
    });
  });
});
