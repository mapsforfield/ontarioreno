import { User } from './types';

export const users: User[] = [
  {
    id: 'sabah',
    name: 'Sabah',
    role: 'admin',
    email: 'sabahohs@gmail.com',
    avatarInitial: 'S',
    passwordHash: 'local-prototype:b250YXJpb3Jlbm86YWRtaW4xMjM=',
    active: true,
  },
  {
    id: 'oliver',
    name: 'Oliver',
    role: 'rep',
    email: 'David.galaxykitchenrenovation@gmail.com',
    avatarInitial: 'O',
    avatarUrl: '/images/oliverpp.png',
    passwordHash: 'local-prototype:b250YXJpb3Jlbm86b2xpdmVyMTIz',
    active: true,
  },
  {
    id: 'xavier',
    name: 'Xavier',
    role: 'rep',
    email: 'kb.live13@gmail.com',
    avatarInitial: 'X',
    avatarUrl: '/images/kevenpp.png',
    passwordHash: 'local-prototype:b250YXJpb3Jlbm86eGF2aWVyMTIz',
    active: true,
  },
];
