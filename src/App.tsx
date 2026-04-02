import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { GlobalSelectionMagnifier } from './components/GlobalSelectionMagnifier';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <GlobalSelectionMagnifier />
    </>
  );
}

export default App;
