import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../src/app/index';

test('identifies the assessment app and makes the incomplete foundation explicit', async () => {
  await render(<HomeScreen />);

  expect(screen.getByRole('header', { name: 'Aster Transfer' })).toBeOnTheScreen();
  expect(screen.getByText(/transfer features are not implemented yet/)).toBeOnTheScreen();
});
