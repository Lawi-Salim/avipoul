import { useEffect, useState, useCallback } from 'react';
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
  Textarea,
} from '@chakra-ui/react';
import PageLoading from '../components/PageLoading';
import { FiPlus, FiTrash2, FiEdit2, FiChevronDown } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { depensesService, Depense, CreateDepensePayload } from '../services/depenses.service';
import ConfirmModal from '../components/ConfirmModal';
import { creatorLabel } from '../utils/creatorLabel';

const CATEGORIE_LABELS: Record<string, string> = {
  poussins: 'Poussins',
  aliments: 'Aliments',
  veterinaire: 'Vétérinaire',
  infrastructure: 'Infrastructure',
  imprevu: 'Imprévu',
};

export default function Depenses() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCycleData, setSelectedCycleData] = useState<Cycle | null>(null);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateDepensePayload>({
    cycle_id: '',
    categorie: 'aliments',
    montant: 0,
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    cyclesService.getAll()
      .then((c) => {
        setCycles(c);
        if (c.length > 0 && !selectedCycle) {
          const first = c[0]!;
          setSelectedCycle(first.id);
          setSelectedCycleData(first);
          setForm((prev) => ({ ...prev, cycle_id: first.id }));
        }
      })
      .catch(() => setError('Erreur lors du chargement des cycles'))
      .finally(() => setLoading(false));
  }, []);

  const loadDepenses = useCallback(async () => {
    if (!selectedCycle) return;
    try {
      const data = await depensesService.getByCycle(selectedCycle);
      setDepenses(data);
    } catch {
      setError('Erreur lors du chargement des dépenses');
    }
  }, [selectedCycle]);

  useEffect(() => { loadDepenses(); }, [loadDepenses]);

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
      const payload = { ...form, cycle_id: selectedCycle };
      if (editingId) {
        await depensesService.update(editingId, payload);
        showSuccess('Dépense modifiée');
      } else {
        await depensesService.create(payload);
        showSuccess('Dépense ajoutée');
      }
      setEditingId(null);
      setForm({
        cycle_id: selectedCycle,
        categorie: 'aliments',
        montant: 0,
        date: new Date().toISOString().slice(0, 10),
        description: '',
      });
      await loadDepenses();
    } catch {
      setError(editingId ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (d: Depense) => {
    setEditingId(d.id);
    setForm({
      cycle_id: d.cycle_id,
      categorie: d.categorie,
      montant: d.montant,
      date: d.date,
      description: d.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      cycle_id: selectedCycle,
      categorie: 'aliments',
      montant: 0,
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await depensesService.remove(deleteTargetId);
      setDepenses((prev) => prev.filter((d) => d.id !== deleteTargetId));
      showSuccess('Dépense supprimée');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);

  if (loading) {
    return <PageLoading fillHeight />;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="text.1">Dépenses</Heading>

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

      {/* Sélecteur de cycle */}
      <Box>
        <Text mb={1} fontSize="sm" color="text.2">Sélectionner un cycle</Text>
        <Menu>
          <MenuButton
            as={Button}
            w="100%"
            maxW="400px"
            h={{ base: 10, md: 8 }}
            size={{ base: "md", md: "sm" }}
            bg="surface.2"
            borderColor="border.1"
            borderWidth="1px"
            borderRadius="md"
            rightIcon={<FiChevronDown />}
            textAlign="left"
            justifyContent="space-between"
            fontSize="sm"
          >
            {selectedCycleData
              ? `Cycle #${selectedCycleData.numero_cycle} — ${new Date(selectedCycleData.date_reception).toLocaleDateString('fr-FR')}`
              : 'Sélectionner un cycle'}
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1">
            {cycles.map((c) => (
              <MenuItem
                key={c.id}
                bg="surface.1"
                _hover={{ bg: 'surface.2' }}
                color="text.1"
                fontSize={{ base: "md", md: "sm" }}
                onClick={() => {
                  setSelectedCycle(c.id);
                  setSelectedCycleData(c);
                  setForm((prev) => ({ ...prev, cycle_id: c.id }));
                  setEditingId(null);
                }}
              >
                Cycle #{c.numero_cycle} — {new Date(c.date_reception).toLocaleDateString('fr-FR')}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>

      {/* Formulaire */}
      {selectedCycleData?.statut === 'en_cours' ? (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody>
            <Heading size="sm" color="text.1" mb={3}>
              {editingId ? 'Modifier la dépense' : 'Ajouter une dépense'}
            </Heading>
            <Box as="form" onSubmit={handleSubmit}>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
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
                    {CATEGORIE_LABELS[form.categorie] || form.categorie}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
                      <MenuItem
                        key={value}
                        bg="surface.1"
                        _hover={{ bg: 'surface.2' }}
                        color="text.1"
                        fontSize={{ base: "md", md: "sm" }}
                        onClick={() => setForm({ ...form, categorie: value as CreateDepensePayload['categorie'] })}
                      >
                        {label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
                <Input
                  type="number"
                  placeholder="Montant (KMF)"
                  value={form.montant || ''}
                  onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                  min={0}
                  required
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                  required
                />
                <Input
                  placeholder="Description (optionnel)"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                />
                <HStack>
                  <Button
                    type="submit"
                    size="sm"
                    bg="accent.1"
                    color="gray.900"
                    _hover={{ bg: 'accent.2' }}
                    leftIcon={<FiPlus />}
                    isLoading={submitting}
                    fontWeight="bold"
                    flex={1}
                  >
                    {editingId ? 'Modifier' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button
                      size="sm"
                      variant="ghost"
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
      ) : null}

      {/* Liste des dépenses */}
      {depenses.length === 0 ? (
        <Text color="text.3" fontSize="sm" textAlign="center" py={6}>Aucune dépense enregistrée.</Text>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3">Date</Th>
                <Th color="text.3">Catégorie</Th>
                <Th color="text.3">Montant</Th>
                <Th color="text.3">Description</Th>
                <Th color="text.3">Enregistré par</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {depenses.map((d) => (
                <Tr key={d.id}>
                  <Td color="text.2">{new Date(d.date).toLocaleDateString('fr-FR')}</Td>
                  <Td color="text.2">{CATEGORIE_LABELS[d.categorie] || d.categorie}</Td>
                  <Td color="text.2">{Number(d.montant).toLocaleString('fr-FR')} KMF</Td>
                  <Td color="text.2" maxW="200px" isTruncated>{d.description || '—'}</Td>
                  <Td color="text.3" fontSize="xs">{creatorLabel(d.creator)}</Td>
                  <Td>
                    {selectedCycleData?.statut === 'en_cours' && (
                      <HStack spacing={1}>
                        <Tooltip label="Modifier">
                          <IconButton
                            aria-label="Modifier"
                            icon={<FiEdit2 />}
                            size="xs"
                            variant="ghost"
                            color="accent.1"
                            onClick={() => handleEdit(d)}
                          />
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <IconButton
                            aria-label="Supprimer"
                            icon={<FiTrash2 />}
                            size="xs"
                            variant="ghost"
                            color="danger.1"
                            onClick={() => handleDelete(d.id)}
                          />
                        </Tooltip>
                      </HStack>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {depenses.length > 0 && (
        <HStack justify="flex-end">
          <Text fontSize="sm" color="text.3">
            Total: <strong color="text.1">{Math.round(totalDepenses).toLocaleString('fr-FR')} KMF</strong>
          </Text>
        </HStack>
      )}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer la dépense"
        message="Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible."
      />
    </VStack>
  );
}
