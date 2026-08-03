import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Input,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Switch,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { risquesService, Risque, CreateRisquePayload } from '../services/risques.service';
import { creatorLabel } from '../utils/creatorLabel';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { responsiveText } from '../theme/designTokens';

const CATEGORIES = [
  { value: 'sanitaire', label: 'Sanitaire' },
  { value: 'financier', label: 'Financier' },
  { value: 'marche', label: 'Marché' },
  { value: 'approvisionnement', label: 'Approvisionnement' },
];

const CATEGORY_COLORS: Record<string, string> = {
  sanitaire: 'red.400',
  financier: 'blue.400',
  marche: 'purple.400',
  approvisionnement: 'orange.400',
};

export default function Risques() {
  const { user } = useAuth();
  const canManage = user?.role !== 'employe';
  const [risques, setRisques] = useState<Risque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('tous');
  const [editingRisque, setEditingRisque] = useState<Risque | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Risque | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [form, setForm] = useState<CreateRisquePayload>({
    categorie: 'sanitaire',
    description: '',
    mesure_preventive: '',
    seuil_alerte: '',
    actif: true,
  });

  const loadData = useCallback(async () => {
    try {
      const data = await risquesService.getAll();
      setRisques(data);
    } catch {
      setError('Erreur lors du chargement des risques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRisques = useMemo(() => {
    if (filter === 'tous') return risques;
    return risques.filter((r) => r.categorie === filter);
  }, [risques, filter]);

  const openCreate = () => {
    setEditingRisque(null);
    setForm({ categorie: 'sanitaire', description: '', mesure_preventive: '', seuil_alerte: '', actif: true });
    onOpen();
  };

  const openEdit = (risque: Risque) => {
    setEditingRisque(risque);
    setForm({
      categorie: risque.categorie,
      description: risque.description,
      mesure_preventive: risque.mesure_preventive || '',
      seuil_alerte: risque.seuil_alerte || '',
      actif: risque.actif,
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingRisque) {
        await risquesService.update(editingRisque.id, form);
        setSuccess('Risque modifié avec succès');
      } else {
        await risquesService.create(form);
        setSuccess('Risque créé avec succès');
      }
      onClose();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await risquesService.remove(deleteTarget.id);
      setSuccess('Risque supprimé');
      onDeleteClose();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const toggleActif = async (risque: Risque) => {
    try {
      await risquesService.update(risque.id, { actif: !risque.actif });
      loadData();
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <Center py={20}><Spinner size="xl" color="accent.1" /></Center>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Risques</Heading>
        <Button
          leftIcon={<FiPlus />}
          bg="accent.1"
          color="gray.900"
          _hover={{ bg: 'accent.2' }}
          fontWeight="bold"
          size={{ base: "md", md: "sm" }}
          onClick={openCreate}
        >
          Nouveau risque
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

      <HStack spacing={2} flexWrap="wrap">
        <Button
          size={{ base: "sm", md: "xs" }}
          variant={filter === 'tous' ? 'solid' : 'ghost'}
          bg={filter === 'tous' ? 'accent.1' : 'transparent'}
          color={filter === 'tous' ? 'gray.900' : 'text.2'}
          onClick={() => setFilter('tous')}
        >
          Tous
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            size={{ base: "sm", md: "xs" }}
            variant={filter === cat.value ? 'solid' : 'ghost'}
            bg={filter === cat.value ? 'accent.1' : 'transparent'}
            color={filter === cat.value ? 'gray.900' : 'text.2'}
            onClick={() => setFilter(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </HStack>

      {filteredRisques.length === 0 ? (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody>
            <Text color="text.3" fontSize={{ base: "sm", md: "ms" }} textAlign="center" py={6}>Aucun risque enregistré.</Text>
          </CardBody>
        </Card>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3" minW={{ base: "100px", md: "auto" }}>Catégorie</Th>
                <Th color="text.3" minW={{ base: "150px", md: "auto" }}>Description</Th>
                <Th color="text.3" minW={{ base: "150px", md: "auto" }}>Mesure préventive</Th>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Seuil alerte</Th>
                <Th color="text.3" minW={{ base: "80px", md: "auto" }}>Actif</Th>
                <Th color="text.3">Enregistré par</Th>
                {canManage && <Th color="text.3">Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filteredRisques.map((risque) => (
                <Tr key={risque.id}>
                  <Td minW={{ base: "100px", md: "auto" }}>
                    <Badge colorScheme={risque.categorie === 'sanitaire' ? 'red' : risque.categorie === 'financier' ? 'blue' : risque.categorie === 'marche' ? 'purple' : 'orange'} fontSize={responsiveText.xs}>
                      {CATEGORIES.find((c) => c.value === risque.categorie)?.label || risque.categorie}
                    </Badge>
                  </Td>
                  <Td color="text.2" maxW="300px" minW={{ base: "150px", md: "auto" }}>{risque.description}</Td>
                  <Td color="text.2" maxW="250px" minW={{ base: "150px", md: "auto" }}>{risque.mesure_preventive || '-'}</Td>
                  <Td color="text.2" minW={{ base: "120px", md: "auto" }}>{risque.seuil_alerte || '-'}</Td>
                  <Td minW={{ base: "80px", md: "auto" }}>
                    {canManage ? (
                      <Switch
                        size={{ base: "md", md: "sm" }}
                        isChecked={risque.actif}
                        onChange={() => toggleActif(risque)}
                        colorScheme="green"
                      />
                    ) : (
                      <Badge bg={risque.actif ? 'success.1' : 'text.3'} color="white" fontSize={responsiveText.xs}>
                        {risque.actif ? 'Actif' : 'Résolu'}
                      </Badge>
                    )}
                  </Td>
                  <Td color="text.3" fontSize="xs" minW={{ base: "120px", md: "auto" }}>{creatorLabel(risque.creator)}</Td>
                  {canManage && (
                  <Td>
                    <HStack spacing={1}>
                      <Button size={{ base: "sm", md: "xs" }} variant="ghost" color="accent.1" onClick={() => openEdit(risque)}>
                        <FiEdit2 />
                      </Button>
                      <Button size={{ base: "sm", md: "xs" }} variant="ghost" color="danger.1" onClick={() => { setDeleteTarget(risque); onDeleteOpen(); }}>
                        <FiTrash2 />
                      </Button>
                    </HStack>
                  </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="surface.1" mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">{editingRisque ? 'Modifier le risque' : 'Nouveau risque'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Catégorie</Text>
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
                    {CATEGORIES.find(c => c.value === form.categorie)?.label || 'Sélectionner'}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    {CATEGORIES.map((cat) => (
                      <MenuItem
                        key={cat.value}
                        bg="surface.1"
                        _hover={{ bg: 'surface.2' }}
                        color="text.1"
                        fontSize={{ base: "md", md: "sm" }}
                        onClick={() => setForm({ ...form, categorie: cat.value })}
                      >
                        {cat.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Description</Text>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  size={{ base: "md", md: "sm" }}
                  rows={3}
                />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Mesure préventive</Text>
                <Textarea
                  value={form.mesure_preventive || ''}
                  onChange={(e) => setForm({ ...form, mesure_preventive: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  size={{ base: "md", md: "sm" }}
                  rows={2}
                />
              </Box>
              <Box w="100%">
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2">Seuil d'alerte</Text>
                <Input
                  value={form.seuil_alerte || ''}
                  onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  size={{ base: "md", md: "sm" }}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" fontSize={responsiveText.sm} size={{ base: "md", md: "sm" }} color="text.2" mr={3} onClick={onClose}>Annuler</Button>
            <Button
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              fontWeight="bold"
              onClick={handleSave}
              isDisabled={!form.description}
              fontSize={responsiveText.sm}
              size={{ base: "md", md: "sm" }}
            >
              {editingRisque ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Supprimer le risque"
        message={`Êtes-vous sûr de vouloir supprimer ce risque ?`}
        confirmLabel="Supprimer"
      />
    </VStack>
  );
}
