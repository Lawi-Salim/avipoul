import { Box, Button, HStack, VStack, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { UserAvatar } from '../utils/Avatars';
import { useNavigate } from 'react-router-dom';

interface ProfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfilModal({ isOpen, onClose, user }: ProfilModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }} isCentered>
      <ModalOverlay />
      <ModalContent bg="surface.1">
        <ModalHeader color="text.1" fontSize={{ base: "ms", md: "md" }}>Mon profil</ModalHeader>
        <ModalCloseButton color="text.2" _hover={{ color: 'text.1' }} />

        <ModalBody>
          <HStack align="center" mb={6}>
            <Box pointerEvents="auto">
              <UserAvatar name={`${user?.nom} ${user?.prenom || ''}`.trim()} size={64} src={user?.photo ?? null} />
            </Box>
            <Box ml={4}>
              <Text fontSize="lg" fontWeight="bold" color="text.1">
                {`${user?.nom} ${user?.prenom || ''}`.trim()}
              </Text>
              <Text fontSize="sm" color="text.3">
                {user?.role === 'admin' ? 'Administrateur' : user?.role === 'employe' ? 'Employé' : 'Comptable'}
              </Text>
            </Box>
          </HStack>

          <VStack spacing={4} align="stretch">
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.3" fontWeight="medium">Email</Text>
              <Text color="text.1" fontSize={{ base: "sm", md: "ms" }}>{user?.email}</Text>
            </Box>

            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.3" fontWeight="medium">Téléphone</Text>
              <Text color="text.1" fontSize={{ base: "sm", md: "ms" }}>{user?.telephone || '—'}</Text>
            </Box>

            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.3" fontWeight="medium">Adresse</Text>
              <Text color="text.1" fontSize={{ base: "sm", md: "ms" }}>{user?.adresse || '—'}</Text>
            </Box>

            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.3" fontWeight="medium">Créé le</Text>
              <Text color="text.2" fontSize={{ base: "sm", md: "ms" }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
              </Text>
            </Box>

            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.3" fontWeight="medium">Mis à jour le</Text>
              <Text color="text.2" fontSize={{ base: "sm", md: "ms" }}>
                {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : '—'}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          {user?.role === 'admin' && (
            <Button
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              fontWeight="bold"
              onClick={() => {
                onClose();
                navigate('/parametrage');
              }}
              size={{ base: "md", md: "sm" }}
              w={{ base: "100%", md: "auto" }}
            >
              Modifier mon profil
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
