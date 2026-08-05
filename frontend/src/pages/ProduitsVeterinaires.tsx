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
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Tooltip,
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
import { FiPlus, FiTrash2, FiEdit2, FiAlertTriangle, FiChevronDown } from 'react-icons/fi';
import { produitsService, ProduitVeterinaire, CreateProduitPayload } from '../services/produits.service';
import ConfirmModal from '../components/ConfirmModal';

const TYPE_LABELS: Record<string, string> = {
  vaccin: 'Vaccin',
  antibiotique: 'Antibiotique',
  vitamine: 'Vitamine',
  autre: 'Autre',
};

const ITEMS_PER_PAGE = 10;

export default function ProduitsVeterinaires() {
  const [produits, setProduits] = useState<ProduitVeterinaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [form, setForm] = useState<CreateProduitPayload>({
    nom: '',
    type_produit: 'vaccin',
    quantite_stock: 0,
    unite: 'dose',
    seuil_alerte: 0,
    date_peremption: '',
  });

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = () => {
    produitsService.getAll()
      .then(setProduits)
      .catch(() => setError('Erreur lors du chargement des produits'))
      .finally(() => setLoading(false));
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ nom: '', type_produit: 'vaccin', quantite_stock: 0, unite: 'dose', seuil_alerte: 0, date_peremption: '' });
    onOpen();
  };

  const openEdit = (p: ProduitVeterinaire) => {
    setEditingId(p.id);
    setForm({
      nom: p.nom,
      type_produit: p.type_produit,
      quantite_stock: p.quantite_stock,
      unite: p.unite,
      seuil_alerte: p.seuil_alerte,
      date_peremption: p.date_peremption || '',
    });
    onOpen();
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await produitsService.update(editingId, form);
        showSuccess('Produit modifié');
      } else {
        await produitsService.create(form);
        showSuccess('Produit ajouté');
      }
      onClose();
      loadProduits();
    } catch {
      setError(editingId ? 'Erreur lors de la modification' : "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await produitsService.remove(deleteTargetId);
      setProduits((prev) => prev.filter((p) => p.id !== deleteTargetId));
      showSuccess('Produit supprimé');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const filteredProduits = useMemo(() => {
    if (filterType === 'tous') return produits;
    return produits.filter((p) => p.type_produit === filterType);
  }, [produits, filterType]);

  const totalPages = Math.ceil(filteredProduits.length / ITEMS_PER_PAGE);
  const paginatedProduits = filteredProduits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [filterType]);

  if (loading) {
    return <PageLoading fillHeight />;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Heading size="lg" color="text.1">Produits vétérinaires</Heading>
        <Button
          leftIcon={<FiPlus />}
          bg="accent.1"
          color="gray.900"
          _hover={{ bg: 'accent.2' }}
          fontWeight="bold"
          size="sm"
          onClick={openCreate}
        >
          Nouveau produit
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
        <Button size="xs" variant={filterType === 'tous' ? 'solid' : 'ghost'} bg={filterType === 'tous' ? 'accent.1' : 'transparent'} color={filterType === 'tous' ? 'gray.900' : 'text.2'} onClick={() => setFilterType('tous')}>Tous</Button>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <Button key={key} size="xs" variant={filterType === key ? 'solid' : 'ghost'} bg={filterType === key ? 'accent.1' : 'transparent'} color={filterType === key ? 'gray.900' : 'text.2'} onClick={() => setFilterType(key)}>{label}</Button>
        ))}
      </HStack>

      {filteredProduits.length === 0 ? (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody>
            <Text color="text.3" fontSize="sm" textAlign="center" py={6}>Aucun produit enregistré.</Text>
          </CardBody>
        </Card>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3">Nom</Th>
                <Th color="text.3">Type</Th>
                <Th color="text.3">Stock</Th>
                <Th color="text.3">Seuil alerte</Th>
                <Th color="text.3">Péremption</Th>
                <Th color="text.3">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedProduits.map((p) => {
                const stockBas = parseFloat(String(p.quantite_stock)) <= parseFloat(String(p.seuil_alerte)) && parseFloat(String(p.seuil_alerte)) > 0;
                const peremptionSoon = p.date_peremption && (new Date(p.date_peremption).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000 && (new Date(p.date_peremption).getTime() - Date.now()) > 0;
                const expire = p.date_peremption && new Date(p.date_peremption).getTime() < Date.now();
                return (
                  <Tr key={p.id}>
                    <Td color="text.1" fontWeight="medium">
                      <HStack spacing={1}>
                        {stockBas && <FiAlertTriangle color="var(--chakra-colors-orange-400)" size={14} />}
                        <Text as="span">{p.nom}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge fontSize="xs" colorScheme={p.type_produit === 'vaccin' ? 'blue' : p.type_produit === 'antibiotique' ? 'red' : p.type_produit === 'vitamine' ? 'green' : 'gray'}>
                        {TYPE_LABELS[p.type_produit] || p.type_produit}
                      </Badge>
                    </Td>
                    <Td color={stockBas ? 'danger.1' : 'text.2'} fontWeight={stockBas ? 'bold' : 'normal'}>
                      {parseFloat(String(p.quantite_stock)).toLocaleString('fr-FR')} {p.unite}
                    </Td>
                    <Td color="text.2">{parseFloat(String(p.seuil_alerte)).toLocaleString('fr-FR')} {p.unite}</Td>
                    <Td>
                      {p.date_peremption ? (
                        <Text fontSize="sm" color={expire ? 'danger.1' : peremptionSoon ? 'orange.400' : 'text.2'}>
                          {new Date(p.date_peremption).toLocaleDateString('fr-FR')}
                          {expire && ' (expiré)'}
                          {peremptionSoon && ' (bientôt)'}
                        </Text>
                      ) : (
                        <Text color="text.3">—</Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Tooltip label="Modifier">
                          <IconButton aria-label="Modifier" icon={<FiEdit2 />} size="xs" variant="ghost" color="accent.1" onClick={() => openEdit(p)} />
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size="xs" variant="ghost" color="danger.1" onClick={() => setDeleteTargetId(p.id)} />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="surface.1" mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">{editingId ? 'Modifier le produit' : 'Nouveau produit'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="100%">
                <Text mb={1} fontSize="sm" color="text.2">Nom</Text>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} bg="surface.2" borderColor="border.1" size="sm" />
              </Box>
              <SimpleGrid columns={2} w="100%" spacing={4}>
                <Box>
                  <Text mb={1} fontSize="sm" color="text.2">Type</Text>
                  <Menu>
                    <MenuButton as={Button} w="100%" h={{ base: 10, md: 8 }} size={{ base: "md", md: "sm" }} bg="surface.2" borderColor="border.1" borderWidth="1px" borderRadius="md" rightIcon={<FiChevronDown />} textAlign="left" justifyContent="space-between">
                      {form.type_produit === 'vaccin' ? 'Vaccin' : form.type_produit === 'antibiotique' ? 'Antibiotique' : form.type_produit === 'vitamine' ? 'Vitamine' : 'Autre'}
                    </MenuButton>
                    <MenuList bg="surface.1" borderColor="border.1">
                      <MenuItem onClick={() => setForm({ ...form, type_produit: 'vaccin' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>Vaccin</MenuItem>
                      <MenuItem onClick={() => setForm({ ...form, type_produit: 'antibiotique' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>Antibiotique</MenuItem>
                      <MenuItem onClick={() => setForm({ ...form, type_produit: 'vitamine' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>Vitamine</MenuItem>
                      <MenuItem onClick={() => setForm({ ...form, type_produit: 'autre' })} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>Autre</MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" color="text.2">Unité</Text>
                  <Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} bg="surface.2" borderColor="border.1" size="sm" />
                </Box>
              </SimpleGrid>
              <SimpleGrid columns={2} w="100%" spacing={4}>
                <Box>
                  <Text mb={1} fontSize="sm" color="text.2">Quantité en stock</Text>
                  <Input type="number" value={form.quantite_stock || ''} onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })} bg="surface.2" borderColor="border.1" size="sm" min={0} />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" color="text.2">Seuil d'alerte</Text>
                  <Input type="number" value={form.seuil_alerte || ''} onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })} bg="surface.2" borderColor="border.1" size="sm" min={0} />
                </Box>
              </SimpleGrid>
              <Box w="100%">
                <Text mb={1} fontSize="sm" color="text.2">Date de péremption</Text>
                <Input type="date" value={form.date_peremption || ''} onChange={(e) => setForm({ ...form, date_peremption: e.target.value })} bg="surface.2" borderColor="border.1" size="sm" />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button fontSize="sm" size="sm" variant="outline" color="text.2" mr={3} onClick={onClose}>Annuler</Button>
            <Button fontSize="sm" size="sm" bg="accent.1" color="gray.900" _hover={{ bg: 'accent.2' }} fontWeight="bold" onClick={handleSave} isLoading={submitting} isDisabled={!form.nom}>{editingId ? 'Modifier' : 'Créer'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ?"
      />
    </VStack>
  );
}
