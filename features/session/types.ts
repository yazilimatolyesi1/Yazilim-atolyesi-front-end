export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles?: string[];
  membership?: {
    status: MembershipStatus;
  };
}

export type SessionState =
  | { status: 'LOADING' }
  | { status: 'UNAUTHENTICATED' }
  | { status: 'AUTHENTICATED'; user: UserProfile }
  | { status: 'ERROR'; message: string };