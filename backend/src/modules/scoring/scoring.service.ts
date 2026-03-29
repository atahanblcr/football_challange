import { Difficulty } from '@prisma/client';

export interface ScoringConfig {
  adMultiplier: number;
  difficultyMediumMultiplier: number;
  difficultyHardMultiplier: number;
  maxTimeBonus: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  adMultiplier: 1.5,
  difficultyMediumMultiplier: 1.25,
  difficultyHardMultiplier: 1.5,
  maxTimeBonus: 25,
};

export class ScoringService {
  /**
   * Calculates the points for each rank based on the total number of answers and base points.
   * Rank 1 is easiest (least points), Rank N is hardest (most points).
   * Formula:
   * offset = N * 0.8
   * weight(rank) = rank + offset
   * total_weight = Σ weight(1..N)
   * normalized(rank) = weight(rank) / total_weight
   * position_score(rank) = normalized(rank) * base_points
   */
  public static calculatePositionScores(n: number, basePoints: number): Map<number, number> {
    const scores = new Map<number, number>();
    const offset = n * 0.8;
    
    let totalWeight = 0;
    for (let rank = 1; rank <= n; rank++) {
      totalWeight += rank + offset;
    }

    for (let rank = 1; rank <= n; rank++) {
      const weight = rank + offset;
      const normalized = weight / totalWeight;
      const score = normalized * basePoints;
      scores.set(rank, score);
    }

    return scores;
  }

  /**
   * Calculates the final score for a game session.
   */
  public static calculateFinalScore(params: {
    correctRanks: number[];
    totalAnswers: number;
    basePoints: number;
    timeLimit: number;
    remainingSeconds: number;
    allSlotsFilled: boolean;
    difficulty: Difficulty;
    isAdMultiplied?: boolean;
    config?: ScoringConfig;
  }): {
    scoreBase: number;
    scoreTimeBonus: number;
    scoreDifficulty: number;
    scoreFinal: number;
  } {
    const {
      correctRanks,
      totalAnswers,
      basePoints,
      timeLimit,
      remainingSeconds,
      allSlotsFilled,
      difficulty,
      isAdMultiplied = false,
      config: customConfig
    } = params;

    const config = customConfig || DEFAULT_CONFIG;

    // ADIM 1: Ham Puan (Position Scores)
    const positionScores = this.calculatePositionScores(totalAnswers, basePoints);
    let rawScoreBase = 0;
    correctRanks.forEach((rank) => {
      rawScoreBase += positionScores.get(rank) || 0;
    });
    
    // Veritabanı tutarlılığı için ham puanı tam sayıya yuvarla
    const scoreBase = Math.floor(rawScoreBase);

    // ADIM 2: Süre Bonusu (Yalnızca tüm slotlar doluysa)
    let scoreTimeBonus = 0;
    if (allSlotsFilled && remainingSeconds > 0) {
      scoreTimeBonus = Math.floor((remainingSeconds / timeLimit) * config.maxTimeBonus);
      if (scoreTimeBonus > config.maxTimeBonus) scoreTimeBonus = config.maxTimeBonus;
    }

    // ADIM 3: Zorluk Çarpanı
    const difficultyMultipliers: Record<Difficulty, number> = {
      easy: 1.0,
      medium: config.difficultyMediumMultiplier,
      hard: config.difficultyHardMultiplier,
    };
    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    const scoreDifficulty = Math.floor((scoreBase + scoreTimeBonus) * multiplier);

    // ADIM 4: Reklam Çarpanı
    const scoreFinal = isAdMultiplied ? Math.floor(scoreDifficulty * config.adMultiplier) : scoreDifficulty;

    return {
      scoreBase,
      scoreTimeBonus,
      scoreDifficulty,
      scoreFinal,
    };
  }
}
