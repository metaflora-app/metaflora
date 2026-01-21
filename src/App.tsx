import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { GlobalLoader } from './components/GlobalLoader';

function App() {
  return (
    <GlobalLoader>
      <RouterProvider router={router} />
    </GlobalLoader>
  );
}

export default App;
