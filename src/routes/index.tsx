import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { HomePage } from '../pages/HomePage';
import { WordGamePage } from '../pages/WordGamePage';
import { PatternDrillPage } from '../pages/PatternDrillPage';
import { CalendarPage } from '../pages/CalendarPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RadicalPracticePage } from '../pages/RadicalPracticePage';
import { Auth } from '../components/Auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'word-game',
        element: <WordGamePage />,
      },
      {
        path: 'pattern-drill',
        element: <PatternDrillPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'radical-practice',
        element: <RadicalPracticePage />,
      },
    ],
  },
  {
    path: '/login',
    element: <Auth />,
  },
]);
