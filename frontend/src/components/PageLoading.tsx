import { Box, Spinner, Text } from '@chakra-ui/react';

interface PageLoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  py?: number | string;
  fullScreen?: boolean;
  fillHeight?: boolean;
}

export default function PageLoading({
  size = 'xl',
  label = "Chargement...",
  py = 20,
  fullScreen = false,
  fillHeight = false,
}: PageLoadingProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={fillHeight ? 0 : py}
      minH={fullScreen ? '100vh' : undefined}
      h={fillHeight ? '100%' : undefined}
      w={fillHeight ? '100%' : undefined}
    >
      <Spinner size={size} color="accent.1" />
      {label && (
        <Text mt={3} color="text.3" fontSize="sm" textAlign="center">
          {label}
        </Text>
      )}
    </Box>
  );
}
