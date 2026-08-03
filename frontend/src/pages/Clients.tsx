import { useEffect, useState, useMemo } from 'react';
import { downloadFile } from '../utils/downloadFile';
import { useNavigate } from 'react-router-dom';
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
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiUser, FiDownload, FiChevronDown } from 'react-icons/fi';
import { clientsService, Client, CreateClientPayload } from '../services/clients.service';
import { exportService } from '../services/export.service';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { responsiveText } from '../theme/designTokens';

const TYPE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  boucherie: 'Boucherie',
  revendeur: 'Revendeur',
};

const TYPE_COLORS: Record<string, string> = {
  menage: '#3182CE',
  restaurant: '#DD6B20',
  hotel: '#805AD5',
  boucherie: '#3c6396',
  revendeur: '#38A169 ',
};

const ITEMS_PER_PAGE = 10;

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('tous');
  const [sortBy, setSortBy] = useState('nom');
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState<CreateClientPayload>({
    nom: '',
    type_client: 'menage',
    contact: '',
    email: '',
    adresse: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    clientsService.getAll()
      .then(setClients)
      .catch(() => setError('Erreur lors du chargement des clients'))
      .finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await clientsService.update(editingId, form);
        showSuccess('Client modifié');
      } else {
        await clientsService.create(form);
        showSuccess('Client ajouté');
      }
      setEditingId(null);
      setForm({ nom: '', type_client: 'menage', contact: '', email: '', adresse: '' });
      const updated = await clientsService.getAll();
      setClients(updated);
    } catch {
      setError(editingId ? 'Erreur lors de la modification' : "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({ nom: c.nom, type_client: c.type_client, contact: c.contact || '', email: c.email || '', adresse: c.adresse || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ nom: '', type_client: 'menage', contact: '', email: '', adresse: '' });
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
  };

  const handleExportClientsCsv = async () => {
    setExporting(true);
    try {
      const response = await exportService.exportClients();
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      await downloadFile(blob, 'clients-export.csv');
    } catch {
      setError('Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await clientsService.remove(deleteTargetId);
      setClients((prev) => prev.filter((c) => c.id !== deleteTargetId));
      showSuccess('Client supprimé');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Erreur lors de la suppression';
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.nom.toLowerCase().includes(q));
    }

    if (filterType !== 'tous') {
      result = result.filter((c) => c.type_client === filterType);
    }

    if (sortBy === 'nom') {
      result.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    } else if (sortBy === 'type') {
      result.sort((a, b) => a.type_client.localeCompare(b.type_client));
    }

    return result;
  }, [clients, search, filterType, sortBy]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterType, sortBy]);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={20}><Text color="text.3">Chargement...</Text></Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Clients</Heading>
        <Button
          size={{ base: "md", md: "sm" }}
          variant="outline"
          borderColor="border.1"
          color="text.2"
          bg="surface.1"
          leftIcon={<FiDownload />}
          onClick={handleExportClientsCsv}
          isLoading={exporting}
          loadingText="Export..."
          fontSize={responsiveText.sm}
          borderRadius="md"
        >
          Exporter CSV
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

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="sm" color="text.1" mb={3} fontSize={{ base: "sm", md: "ms" }}>
            {editingId ? 'Modifier le client' : 'Ajouter un client'}
          </Heading>
          <Box as="form" onSubmit={handleSubmit}>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={3}>
              <Input
                placeholder="Nom du client"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
                required
              />
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
                  fontWeight="normal"
                >
                  {TYPE_LABELS[form.type_client] || form.type_client}
                </MenuButton>
                <MenuList bg="surface.1" borderColor="border.1">
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <MenuItem
                      key={value}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                      onClick={() => setForm({ ...form, type_client: value as CreateClientPayload['type_client'] })}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Input
                placeholder="Contact (tél.)"
                value={form.contact || ''}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
              <Input
                placeholder="Adresse"
                value={form.adresse || ''}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
              <HStack>
                <Button
                  type="submit"
                  size={{ base: "md", md: "sm" }}
                  bg="accent.1"
                  color="gray.900"
                  _hover={{ bg: 'accent.2' }}
                  leftIcon={editingId ? <FiEdit2 /> : <FiPlus />}
                  isLoading={submitting}
                  fontWeight="bold"
                  flex={1}
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
                {editingId && (
                  <Button
                    size={{ base: "md", md: "sm" }}
                    variant="outline"
                    color="text.3"
                    onClick={handleCancelEdit}
                  >
                    Annuler
                  </Button>
                )}
              </HStack>
            </SimpleGrid>
          </Box>
        </CardBody>
      </Card>

      <HStack spacing={3} flexWrap="wrap">
        <InputGroup maxW="300px" size={{ base: "md", md: "sm" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="surface.1"
            borderColor="border.1"
            borderRadius="md"
            fontSize={responsiveText.sm}
          />
        </InputGroup>
        <Menu>
          <MenuButton
            as={Button}
            w="100%"
            h={{ base: 10, md: 8 }}
            size={{ base: "md", md: "sm" }}
            bg="surface.1"
            borderColor="border.1"
            borderWidth="1px"
            borderRadius="md"
            rightIcon={<FiChevronDown />}
            textAlign="left"
            justifyContent="space-between"
            fontWeight="normal"
          >
            {filterType === 'tous' ? 'Tous les types' : TYPE_LABELS[filterType] || filterType}
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1">
            <MenuItem
              bg="surface.1"
              _hover={{ bg: 'surface.2' }}
              color="text.1"
              fontSize={{ base: "md", md: "sm" }}
              onClick={() => setFilterType('tous')}
            >
              Tous les types
            </MenuItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <MenuItem
                key={value}
                bg="surface.1"
                _hover={{ bg: 'surface.2' }}
                color="text.1"
                fontSize={{ base: "md", md: "sm" }}
                onClick={() => setFilterType(value)}
              >
                {label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            w="100%"
            h={{ base: 10, md: 8 }}
            size={{ base: "md", md: "sm" }}
            bg="surface.1"
            borderColor="border.1"
            borderWidth="1px"
            borderRadius="md"
            rightIcon={<FiChevronDown />}
            textAlign="left"
            justifyContent="space-between"
            fontWeight="normal"
          >
            {sortBy === 'nom' ? 'Trier par nom' : 'Trier par type'}
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1">
            <MenuItem
              bg="surface.1"
              _hover={{ bg: 'surface.2' }}
              color="text.1"
              fontSize={{ base: "md", md: "sm" }}
              onClick={() => setSortBy('nom')}
            >
              Trier par nom
            </MenuItem>
            <MenuItem
              bg="surface.1"
              _hover={{ bg: 'surface.2' }}
              color="text.1"
              fontSize={{ base: "md", md: "sm" }}
              onClick={() => setSortBy('type')}
            >
              Trier par type
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {filteredClients.length === 0 ? (
        <Text color="text.3" fontSize="sm" textAlign="center" py={6}>
          {clients.length === 0 ? 'Aucun client enregistré.' : 'Aucun client ne correspond aux filtres.'}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Nom</Th>
                <Th color="text.3" minW={{ base: "100px", md: "auto" }}>Type</Th>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Contact</Th>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Email</Th>
                <Th color="text.3" minW={{ base: "120px", md: "auto" }}>Adresse</Th>
                <Th color="text.3">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedClients.map((c) => (
                <Tr
                  key={c.id}
                  cursor="pointer"
                  _hover={{ bg: 'surface.2' }}
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <Td color="text.2" fontWeight="medium" minW={{ base: "140px", md: "auto" }}>{c.nom}</Td>
                  <Td minW={{ base: "100px", md: "auto" }}>
                    <Box
                      as="span"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="medium"
                      bg={TYPE_COLORS[c.type_client] || 'surface.3'}
                      color={['surface.3'].includes(TYPE_COLORS[c.type_client] || '') ? 'text.2' : 'white'}
                    >
                      {TYPE_LABELS[c.type_client] || c.type_client}
                    </Box>
                  </Td>
                  <Td color="text.2" minW={{ base: "135px", md: "auto" }}>{c.contact || '—'}</Td>
                  <Td color="text.2" minW={{ base: "120px", md: "auto" }}>{c.email || '—'}</Td>
                  <Td color="text.2" minW={{ base: "140px", md: "auto" }}>{c.adresse || '—'}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <HStack spacing={1}>
                      <Tooltip label="Voir">
                        <IconButton
                          aria-label="Voir"
                          icon={<FiUser />}
                          size="xs"
                          variant="ghost"
                          color="text.3"
                          onClick={() => navigate(`/clients/${c.id}`)}
                        />
                      </Tooltip>
                      <Tooltip label="Modifier">
                        <IconButton
                          aria-label="Modifier"
                          icon={<FiEdit2 />}
                          size="xs"
                          variant="ghost"
                          color="accent.1"
                          onClick={() => handleEdit(c)}
                        />
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <IconButton
                          aria-label="Supprimer"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          color="danger.1"
                          onClick={() => handleDelete(c.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {filteredClients.length > 0 && (
        <HStack justify="space-between" borderTop="1px solid" borderColor="border.1" pt={4}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          <Text fontSize="sm" color="text.3">
            {filteredClients.length !== clients.length && `${filteredClients.length} sur `}
            Total: <strong color="text.1">{clients.length} client{clients.length > 1 ? 's' : ''}</strong>
          </Text>
        </HStack>
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer le client"
        message="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
      />
      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">Erreur de suppression</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm">{errorMessage}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" size="sm" onClick={() => setShowErrorModal(false)}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
