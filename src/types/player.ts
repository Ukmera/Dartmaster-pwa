export type AvatarType = 'emoji' | 'image' | 'badge';

export interface Player {
  id: string;
  name: string;
  avatar: string;         // Emoji, image base64, or badge id
  avatarType?: AvatarType;
  color: string;
  isOwner?: boolean;       // Device owner profile
  isGuest?: boolean;       // Temporary guest profile
  pinCode?: string;       // Optional 4-digit security PIN
  createdAt: string;
}

export interface PlayerStats {
  playerId: string;
  totalGames: number;
  totalWins: number;
  
  // 501 / 301 specific stats
  x01Games: number;
  x01Wins: number;
  x01TotalDarts: number;
  x01TotalScore: number;
  x01BestAverage: number;
  x01Count180: number;
  x01Count140Plus: number;
  x01Count100Plus: number;
  x01HighestCheckout: number;

  // Cricket specific stats
  cricketGames: number;
  cricketWins: number;
  cricketTotalMarks: number;
  cricketTotalRounds: number;
  cricketBestMPR: number;

  // King specific stats
  kingGames: number;
  kingWins: number;
  kingTotalEliminations: number;
}
