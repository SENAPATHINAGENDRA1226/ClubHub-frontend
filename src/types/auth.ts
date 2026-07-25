export type UserRole = 'student' | 'admin' | 'committee';

export interface StudentProfile {
  id: string;
  full_name: string;
  branch: string;
  section: string;
  phone_number: string;
  academic_year: string;
  cgpa?: number | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  instagram_url?: string | null;
  profile_photo_url?: string | null;
  onboarding_completed: boolean;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  designation: string;
  profile_photo_url?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_first_login: boolean;
  profile?: any | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_first_login?: boolean;
  onboarding_completed?: boolean;
  committee_ids?: string[];
}
