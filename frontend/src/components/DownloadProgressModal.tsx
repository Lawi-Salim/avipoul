import {
  Box,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiDownload, FiFile } from 'react-icons/fi';

interface DownloadProgressModalProps {
  isOpen: boolean;
  phase: 'generation' | 'telechargement';
  percent: number;
  fileName: string;
}

export default function DownloadProgressModal({
  isOpen,
  phase,
  percent,
  fileName,
}: DownloadProgressModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} isCentered closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent bg="surface.1" maxW="400px">
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <HStack spacing={3}>
              <Box as={FiDownload} boxSize="20px" color="accent.1" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" color="text.1">
                  Téléchargement en cours
                </Text>
                <HStack spacing={1}>
                  <Icon as={FiFile} boxSize="12px" color="text.3" />
                  <Text fontSize="xs" color="text.3" noOfLines={1}>
                    {fileName}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            {phase === 'generation' ? (
              <HStack spacing={3}>
                <Spinner size="sm" color="accent.1" />
                <Text fontSize="sm" color="text.2">Génération du fichier…</Text>
              </HStack>
            ) : (
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.2">Téléchargement…</Text>
                  <Text fontSize="sm" fontWeight="bold" color="accent.1">{percent}%</Text>
                </HStack>
                <Box w="full" h={2} bg="surface.3" borderRadius="full" overflow="hidden">
                  <Box
                    h="full"
                    bg="accent.1"
                    borderRadius="full"
                    transition="width 0.2s ease"
                    width={`${percent}%`}
                  />
                </Box>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
