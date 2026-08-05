import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Tooltip,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import PageLoading from '../components/PageLoading';
import { FiPlus, FiTrash2, FiEdit2, FiChevronDown } from 'react-icons/fi';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { utilisateursService, Utilisateur, CreateUtilisateurPayload } from '../services/utilisateurs.service';
import ConfirmModal from '../components/ConfirmModal';
import { responsiveText } from '../theme/designTokens';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  employe: 'Employé',
  comptable: 'Comptable',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#E53E3E',
  employe: '#3182CE',
  comptable: '#38A169',
};

export default function Utilisateurs() {
  const { user } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [form, setForm] = useState<CreateUtilisateurPayload>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    mot_de_passe: '',
    role: 'employe',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUtilisateurs();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return <Navigate to="/cycles" replace />;
  }

  const loadUtilisateurs = () => {
    utilisateursService.getAll()
      .then(setUtilisateurs)
      .catch(() => setError('Erreur lors du chargement des utilisateurs'))
      .finally(() => setLoading(false));
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ nom: '', prenom: '', email: '', telephone: '', adresse: '', mot_de_passe: '', role: 'employe' });
    onOpen();
  };

  const openEdit = (u: Utilisateur) => {
    setEditingId(u.id);
    setForm({
      nom: u.nom,
      prenom: u.prenom || '',
      email: u.email,
      telephone: u.telephone || '',
      adresse: u.adresse || '',
      mot_de_passe: '',
      role: u.role,
    });
    onOpen();
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          adresse: form.adresse,
          role: form.role,
        };
        await utilisateursService.update(editingId, payload);
        showSuccess('Utilisateur modifié');
      } else {
        await utilisateursService.create(form);
        showSuccess('Utilisateur créé');
      }
      onClose();
      loadUtilisateurs();
    } catch {
      setError(editingId ? 'Erreur lors de la modification' : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await utilisateursService.remove(deleteTargetId);
      setUtilisateurs((prev) => prev.filter((u) => u.id !== deleteTargetId));
      showSuccess('Utilisateur supprimé');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleToggleActif = async (u: Utilisateur) => {
    try {
      await utilisateursService.toggleActif(u.id);
      setUtilisateurs((prev) => prev.map((p) => p.id === u.id ? { ...p, actif: !p.actif } : p));
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <PageLoading fillHeight />;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Utilisateurs</Heading>
        <Button leftIcon={<FiPlus />} bg="accent.1" color="gray.900" _hover={{ bg: 'accent.2' }} fontWeight="bold" size={{ base: "md", md: "sm" }} onClick={openCreate}>
          Nouvel utilisateur
        </Button>
      </HStack>

      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {success && (
        <Alert bg="success.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {success}
        </Alert>
      )}

      {utilisateurs.length === 0 ? (
        <Text color="text.3" textAlign="center" py={6}>Aucun utilisateur enregistré.</Text>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Nom</Th>
                <Th color="text.3" minW={{ base: "150px", md: "auto" }}>Email</Th>
                <Th color="text.3" minW={{ base: "140px", md: "auto" }}>Téléphone</Th>
                <Th color="text.3" minW={{ base: "140px", md: "auto" }}>Adresse</Th>
                <Th color="text.3" minW={{ base: "100px", md: "auto" }}>Rôle</Th>
                <Th color="text.3" minW={{ base: "80px", md: "auto" }}>Actif</Th>
                <Th color="text.3">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {utilisateurs.map((u) => (
                <Tr key={u.id}>
                  <Td color="text.2" fontWeight="medium" minW={{ base: "120px", md: "auto" }}>{u.nom}</Td>
                  <Td color="text.2" minW={{ base: "150px", md: "auto" }}>{u.email}</Td>
                  <Td color="text.2" minW={{ base: "140px", md: "auto" }}>{u.telephone || '—'}</Td>
                  <Td color="text.2" minW={{ base: "140px", md: "auto" }}>{u.adresse || '—'}</Td>
                  <Td minW={{ base: "100px", md: "auto" }}>
                    <Box as="span" px={2} py={0.5} borderRadius="full" fontSize={responsiveText.xs} fontWeight="medium" bg={ROLE_COLORS[u.role] || 'surface.3'} color="white">
                      {ROLE_LABELS[u.role] || u.role}
                    </Box>
                  </Td>
                  <Td minW={{ base: "80px", md: "auto" }}>
                    <Switch size={{ base: "md", md: "sm" }} isChecked={u.actif} onChange={() => handleToggleActif(u)} colorScheme="green" />
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Tooltip label="Modifier">
                        <IconButton aria-label="Modifier" icon={<FiEdit2 />} size={{ base: "sm", md: "xs" }} variant="ghost" color="accent.1" onClick={() => openEdit(u)} />
                      </Tooltip>
                      {u.role !== 'admin' && (
                        <Tooltip label="Supprimer">
                          <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size={{ base: "sm", md: "xs" }} variant="ghost" color="danger.1" onClick={() => setDeleteTargetId(u.id)} />
                        </Tooltip>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="surface.1" mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">{editingId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Nom</Text>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Prénom</Text>
                <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Email</Text>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Téléphone</Text>
                <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} placeholder="Ex : +269 434 00 04" />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Adresse</Text>
                <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} placeholder="Ex : Médina rue 13x18" />
              </Box>
              {!editingId && (
                <Box w="100%">
                  <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Mot de passe</Text>
                  <Input type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} bg="surface.2" borderColor="border.1" size={{ base: "md", md: "sm" }} />
                </Box>
              )}
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Rôle</Text>
                <Menu>
                  <MenuButton
                    as={Button}
                    w="100%"
                    h={{ base: 10, md: 8 }}
                    size={{ base: "md", md: "sm" }}
                    bg="surface.2"
                    borderColor="border.1"
                    borderWidth="1px"
                    borderRadius="md"
                    rightIcon={<FiChevronDown />}
                    textAlign="left"
                    justifyContent="space-between"
                  >
                    {form.role === 'admin' ? 'Administrateur' : form.role === 'employe' ? 'Employé' : 'Comptable'}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    <MenuItem onClick={() => setForm({ ...form, role: 'admin' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                      Administrateur
                    </MenuItem>
                    <MenuItem onClick={() => setForm({ ...form, role: 'employe' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                      Employé
                    </MenuItem>
                    <MenuItem onClick={() => setForm({ ...form, role: 'comptable' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                      Comptable
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" fontSize={responsiveText.sm} size={{ base: "md", md: "sm" }} color="text.2" mr={3} onClick={onClose}>Annuler</Button>
            <Button bg="accent.1" fontSize={responsiveText.sm} size={{ base: "md", md: "sm" }} color="gray.900" _hover={{ bg: 'accent.2' }} fontWeight="bold" onClick={handleSave} isLoading={submitting} isDisabled={!form.nom || !form.email || (!editingId && !form.mot_de_passe)}>
              {editingId ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer l'utilisateur"
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
      />
    </VStack>
  );
}
