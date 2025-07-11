export type RotationMode = 
  | 'winner_stays'
  | 'loser_stays'
  | 'rotate_all'
  | 'winner_max';

export type CreateSessionBody = {
    session_name: string,
    description?: string, // Optional field
    sport: string,
    team_size: number,
    max_teams: number,
    starts_at: string, // ISO 8601 format
    rotation_mode: RotationMode
    winner_max_wins?: number,
    number_of_courts: number // Optional field, default to 1 if not provided
};