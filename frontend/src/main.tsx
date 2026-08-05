import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import theme from './theme/ColorTheme';
import { AuthProvider } from './contexts/AuthContext';
import { DownloadProvider } from './contexts/DownloadContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <DownloadProvider>
            <App />
          </DownloadProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>
);
