import { Review } from '../components/UserApp/index';

/**
 * Mock data for development and testing purposes
 * This file centralizes all hardcoded test data
 */

export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    user: 'Julia K.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia',
    rating: 5,
    date: '2 dni temu',
    text: 'Niesamowity plan! Te ukryte miejsca były puste, dokładnie tak jak obiecano. Warto każdej złotówki.',
  },
  {
    id: 2,
    user: 'Michał W.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michal',
    rating: 5,
    date: 'Tydzień temu',
    text: 'Genialna selekcja restauracji. Omijaliśmy pułapki turystyczne szerokim łukiem.',
  },
  {
    id: 3,
    user: 'Ania P.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ania',
    rating: 4,
    date: 'Miesiąc temu',
    text: 'Bardzo pomocne wskazówki logistyczne. Trochę dużo chodzenia, ale widoki wynagradzają wszystko.',
  },
];
