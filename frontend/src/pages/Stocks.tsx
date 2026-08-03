import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Input,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { stocksService, Stock, CreateStockPayload } from '../services/stocks.service';
import ConfirmModal from '../components/ConfirmModal';
import { responsiveText } from '../theme/designTokens';
import { creatorLabel } from '../utils/creatorLabel';

const TYPE_LABELS: Record<string, string> = {
  aliment: 'Aliment',
  vaccin: 'Vaccin',
  litiere: 'Litière',
};

const TYPE_COLORS: Record<string, string> = {
  aliment: '#38A169',
  vaccin: '#3182CE',
  litiere: '#805AD5',
};

export default function Stocks() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCycleData, setSelectedCycleData] = useState<Cycle | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateStockPayload>({
    type_stock: 'aliment',
    sens: 'entree',
    quantite: 0,
    cout: 0,
    date: new Date().toISOString().slice(0, 10),
    fournisseur: '',
  });

  useEffect(() => {
    cyclesService.getAll()
      .then((c) => {
        setCycles(c);
        if (c.length > 0 && !selectedCycle) {
          const first = c[0]!;
          setSelectedCycle(first.id);
          setSelectedCycleData(first);
        }
      })
      .catch(() => setError('Erreur lors du chargement des cycles'))
      .finally(() => setLoading(false));
  }, []);

  const loadStocks = useCallback(async () => {
    if (!selectedCycle) return;
    try {
      const data = await stocksService.getByCycle(selectedCycle);
      setStocks(data);
    } catch {
      setError('Erreur lors du chargement des stocks');
    }
  }, [selectedCycle]);

  useEffect(() => { loadStocks(); }, [loadStocks]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;
    setSubmitting(true);
    setError('');
    try {
      await stocksService.create(selectedCycle, form);
      showSuccess('Mouvement de stock ajouté');
      setForm({
        type_stock: 'aliment',
        sens: 'entree',
        quantite: 0,
        cout: 0,
        date: new Date().toISOString().slice(0, 10),
        fournisseur: '',
      });
      await loadStocks();
    } catch {
      setError('Erreur lors de l\'ajout du mouvement');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await stocksService.remove(deleteTargetId);
      setStocks((prev) => prev.filter((s) => s.id !== deleteTargetId));
      showSuccess('Mouvement supprimé');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const stocksByType = stocks.reduce((acc, s) => {
    const key = s.type_stock;
    if (!acc[key]) acc[key] = { entree: 0, sortie: 0 };
    const qte = Number(s.quantite);
    if (s.sens === 'entree') acc[key].entree += qte;
    else acc[key].sortie += qte;
    return acc;
  }, {} as Record<string, { entree: number; sortie: number }>);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={20}><Text color="text.3">Chargement...</Text></Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size={{ base: "md", md: "lg" }} color="text.1">Stocks</Heading>

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

      <Box>
        <Text mb={1} fontSize={responsiveText.md} color="text.2">Sélectionner un cycle</Text>
        <Menu>
          <MenuButton
            as={Button}
            w={{ base: "100%", md: "400px" }}
            h={{ base: 10, md: 8 }}
            size={{ base: "md", md: "sm" }}
            bg="surface.1"
            borderColor="border.1"
            borderWidth="1px"
            borderRadius="md"
            rightIcon={<FiChevronDown />}
            textAlign="left"
            justifyContent="space-between"
          >
            {selectedCycle 
              ? `Cycle #${cycles.find(c => c.id === selectedCycle)?.numero_cycle} — ${new Date(cycles.find(c => c.id === selectedCycle)?.date_reception || '').toLocaleDateString('fr-FR')}`
              : 'Sélectionner un cycle'
            }
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1" maxH="300px" overflowY="auto">
            {cycles.map((c) => (
              <MenuItem
                key={c.id}
                onClick={() => {
                  setSelectedCycle(c.id);
                  setSelectedCycleData(c);
                }}
                bg="surface.1"
                _hover={{ bg: 'surface.2' }}
                color="text.1"
                fontSize={{ base: "md", md: "sm" }}
              >
                Cycle #{c.numero_cycle} — {new Date(c.date_reception).toLocaleDateString('fr-FR')}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>

      {Object.keys(stocksByType).length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {Object.entries(stocksByType).map(([type, data]) => (
            <Card key={type} bg="surface.1" borderColor={TYPE_COLORS[type] || 'border.1'} borderWidth="1px">
              <CardBody py={3} px={4}>
                <Text fontSize={responsiveText.xs} color="text.3">{TYPE_LABELS[type] || type}</Text>
                <HStack justify="space-between" mt={1}>
                  <Text fontSize={responsiveText.sm} color="success.1">Entrées: {data.entree.toLocaleString('fr-FR')}</Text>
                  <Text fontSize={responsiveText.sm} color="danger.1">Sorties: {data.sortie.toLocaleString('fr-FR')}</Text>
                </HStack>
                <Text fontSize={responsiveText.lg} fontWeight="bold" color="text.1" mt={1}>
                  Stock: {(data.entree - data.sortie).toLocaleString('fr-FR')}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {selectedCycleData?.statut === 'en_cours' && (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody>
            <Heading size="sm" color="text.1" mb={3}>Ajouter un mouvement</Heading>
            <Box as="form" onSubmit={handleSubmit}>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 6 }} spacing={3}>
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
                    {TYPE_LABELS[form.type_stock] || form.type_stock}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    <MenuItem
                      onClick={() => setForm({ ...form, type_stock: 'aliment' })}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                    >
                      Aliment
                    </MenuItem>
                    <MenuItem
                      onClick={() => setForm({ ...form, type_stock: 'vaccin' })}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                    >
                      Vaccin
                    </MenuItem>
                    <MenuItem
                      onClick={() => setForm({ ...form, type_stock: 'litiere' })}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                    >
                      Litière
                    </MenuItem>
                  </MenuList>
                </Menu>
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
                    {form.sens === 'entree' ? 'Entrée' : 'Sortie'}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    <MenuItem
                      onClick={() => setForm({ ...form, sens: 'entree' })}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                    >
                      Entrée
                    </MenuItem>
                    <MenuItem
                      onClick={() => setForm({ ...form, sens: 'sortie' })}
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                    >
                      Sortie
                    </MenuItem>
                  </MenuList>
                </Menu>
                <Input
                  type="number"
                  placeholder="Quantité"
                  value={form.quantite || ''}
                  onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
                  min={0}
                  required
                />
                <Input
                  type="number"
                  placeholder="Coût (KMF)"
                  value={form.cout || ''}
                  onChange={(e) => setForm({ ...form, cout: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
                  min={0}
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
                  required
                />
                <HStack>
                  <Input
                    placeholder="Fournisseur"
                    value={form.fournisseur || ''}
                    onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
                    bg="surface.2"
                    borderColor="border.1"
                    borderRadius="md"
                    size={{ base: "md", md: "sm" }}
                  />
                </HStack>
              </SimpleGrid>
              <HStack justify="flex-end" mt={3}>
                <Button
                  type="submit"
                  size={{ base: "md", md: "sm" }}
                  bg="accent.1"
                  color="gray.900"
                  _hover={{ bg: 'accent.2' }}
                  leftIcon={<FiPlus />}
                  isLoading={submitting}
                  fontWeight="bold"
                >
                  Ajouter
                </Button>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      )}

      {stocks.length === 0 ? (
        <Text color="text.3" textAlign="center" fontSize="sm" py={6}>Aucun mouvement de stock enregistré.</Text>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3">Date</Th>
                <Th color="text.3">Type</Th>
                <Th color="text.3">Sens</Th>
                <Th color="text.3">Quantité</Th>
                <Th color="text.3">Coût</Th>
                <Th color="text.3">Fournisseur</Th>
                <Th color="text.3">Enregistré par</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {stocks.map((s) => (
                <Tr key={s.id}>
                  <Td color="text.2">{new Date(s.date).toLocaleDateString('fr-FR')}</Td>
                  <Td>
                    <Box as="span" px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="medium" bg={TYPE_COLORS[s.type_stock] || 'surface.3'} color="white">
                      {TYPE_LABELS[s.type_stock] || s.type_stock}
                    </Box>
                  </Td>
                  <Td color={s.sens === 'entree' ? 'success.1' : 'danger.1'} fontWeight="medium">
                    {s.sens === 'entree' ? 'Entrée' : 'Sortie'}
                  </Td>
                  <Td color="text.2">{Number(s.quantite).toLocaleString('fr-FR')}</Td>
                  <Td color="text.2" minW={{ base: "100px", md: "auto" }}>{Number(s.cout).toLocaleString('fr-FR')} KMF</Td>
                  <Td color="text.2">{s.fournisseur || '—'}</Td>
                  <Td color="text.3" fontSize="xs">{creatorLabel(s.creator)}</Td>
                  <Td>
                    {selectedCycleData?.statut === 'en_cours' && (
                      <Tooltip label="Supprimer">
                        <IconButton
                          aria-label="Supprimer"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          color="danger.1"
                          onClick={() => setDeleteTargetId(s.id)}
                        />
                      </Tooltip>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer le mouvement"
        message="Êtes-vous sûr de vouloir supprimer ce mouvement de stock ?"
      />
    </VStack>
  );
}
