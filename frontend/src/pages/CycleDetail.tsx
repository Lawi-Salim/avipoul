import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FiArrowLeft, FiPlus, FiTrash2, FiCheck, FiEdit2, FiDownload, FiEye, FiChevronDown, FiArrowRight } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { stocksService, Stock, CreateStockPayload } from '../services/stocks.service';
import { santeService, Mortalite, CreateMortalitePayload } from '../services/sante.service';
import { FinancesData } from '../services/ventes.service';
import { useAuth } from '../contexts/AuthContext';
import { creatorLabel } from '../utils/creatorLabel';
import ConfirmModal from '../components/ConfirmModal';
import StepperPhase from '../components/StepperPhase';

const PHASES = [
  { value: 'preparation', label: 'Préparation', abbr: 'Pré' },
  { value: 'demarrage', label: 'Démarrage', abbr: 'Dém' },
  { value: 'croissance', label: 'Croissance', abbr: 'Cro' },
  { value: 'finition', label: 'Finition', abbr: 'Fin' },
  { value: 'commercialisation', label: 'Commercialisation', abbr: 'Com' },
  { value: 'nettoyage', label: 'Nettoyage', abbr: 'Net' },
];

const TYPE_STOCK_LABELS: Record<string, string> = {
  aliment: 'Aliment',
  vaccin: 'Vaccin',
  litiere: 'Litière',
};

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [mortalites, setMortalites] = useState<Mortalite[]>([]);
  const [finances, setFinances] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPhase, setNewPhase] = useState('');
  const [deleteStockTargetId, setDeleteStockTargetId] = useState<string | null>(null);
  const [deleteMortTargetId, setDeleteMortTargetId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date_reception: '',
    effectif_initial: 0,
    cout_achat_poussins: 0,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Stock form
  const [stockForm, setStockForm] = useState<CreateStockPayload>({
    type_stock: 'aliment',
    sens: 'entree',
    quantite: 0,
    cout: 0,
    date: new Date().toISOString().slice(0, 10),
    fournisseur: '',
  });
  const [stockLoading, setStockLoading] = useState(false);

  // Mortalité form
  const [mortForm, setMortForm] = useState<CreateMortalitePayload>({
    date: new Date().toISOString().slice(0, 10),
    nombre: 0,
    cause: '',
  });
  const [mortLoading, setMortLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [c, s, m, f] = await Promise.all([
        cyclesService.getById(id),
        stocksService.getByCycle(id),
        santeService.getByCycle(id),
        cyclesService.getFinances(id),
      ]);
      setCycle(c);
      setStocks(s);
      setMortalites(m);
      setFinances(f);
      setNewPhase(c.phase_courante);
    } catch {
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangePhase = async () => {
    if (!id || !newPhase) return;
    setError('');
    try {
      const updated = await cyclesService.changePhase(id, newPhase);
      setCycle(updated);
      setNewPhase(updated.phase_courante);
      showSuccess('Phase mise à jour');
    } catch {
      setError('Erreur lors du changement de phase');
    }
  };

  const phaseIndex = cycle ? PHASES.findIndex((p) => p.value === cycle.phase_courante) : -1;
  const nextPhase = phaseIndex >= 0 && phaseIndex < PHASES.length - 1 ? PHASES[phaseIndex + 1] : null;
  const canManagePhase = user?.role === 'admin' || user?.role === 'comptable';

  const handleNextPhase = async () => {
    if (!id || !nextPhase) return;
    setError('');
    try {
      const updated = await cyclesService.changePhase(id, nextPhase.value);
      setCycle(updated);
      setNewPhase(updated.phase_courante);
      showSuccess(`Phase passée à « ${nextPhase.label} »`);
    } catch {
      setError('Erreur lors du changement de phase');
    }
  };

  const handleClotureClick = () => {
    if (!id) return;
    navigate(`/cycles/${id}/cloture`);
  };

  const handleEditClick = () => {
    if (!cycle) return;
    setEditForm({
      date_reception: cycle.date_reception?.split('T')[0] || '',
      effectif_initial: cycle.effectif_initial,
      cout_achat_poussins: cycle.cout_achat_poussins || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!id) return;
    setEditLoading(true);
    setError('');
    try {
      const updated = await cyclesService.update(id, editForm);
      setCycle(updated);
      setShowEditModal(false);
      showSuccess('Cycle modifié avec succès');
    } catch {
      setError('Erreur lors de la modification du cycle');
    } finally {
      setEditLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    setError('');
    try {
      const response = await cyclesService.exportPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-cycle-${cycle?.numero_cycle || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de la génération du PDF. Vérifiez que le service PDF est actif.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setStockLoading(true);
    setError('');
    try {
      await stocksService.create(id, stockForm);
      const s = await stocksService.getByCycle(id);
      setStocks(s);
      setStockForm({
        type_stock: 'aliment',
        sens: 'entree',
        quantite: 0,
        cout: 0,
        date: new Date().toISOString().slice(0, 10),
        fournisseur: '',
      });
      showSuccess('Mouvement de stock ajouté');
    } catch {
      setError('Erreur lors de l\'ajout du stock');
    } finally {
      setStockLoading(false);
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    setDeleteStockTargetId(stockId);
  };

  const confirmDeleteStock = async () => {
    if (!deleteStockTargetId || !id) return;
    try {
      await stocksService.remove(deleteStockTargetId);
      setStocks((prev) => prev.filter((s) => s.id !== deleteStockTargetId));
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteStockTargetId(null);
    }
  };

  const handleAddMortalite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMortLoading(true);
    setError('');
    try {
      await santeService.create(id, mortForm);
      const m = await santeService.getByCycle(id);
      setMortalites(m);
      setMortForm({
        date: new Date().toISOString().slice(0, 10),
        nombre: 0,
        cause: '',
      });
      showSuccess('Mortalité enregistrée');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || '';
      if (msg.includes('unique') || msg.includes('dupliquée')) {
        setError('Une mortalité existe déjà pour cette date. Modifiez la date ou la journée précédente.');
      } else {
        setError('Erreur lors de l\'enregistrement');
      }
    } finally {
      setMortLoading(false);
    }
  };

  const handleDeleteMortalite = async (mortId: string) => {
    setDeleteMortTargetId(mortId);
  };

  const confirmDeleteMortalite = async () => {
    if (!deleteMortTargetId || !id) return;
    try {
      await santeService.remove(deleteMortTargetId);
      setMortalites((prev) => prev.filter((m) => m.id !== deleteMortTargetId));
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteMortTargetId(null);
    }
  };

  const totalMortalite = (mortalites || []).reduce((sum, m) => sum + Number(m.nombre), 0);
  const tauxMortalite = cycle && cycle.effectif_initial > 0
    ? ((totalMortalite / cycle.effectif_initial) * 100)
    : 0;
  const totalStockCout = (stocks || []).reduce((sum, s) => sum + Number(s.cout), 0);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={20}><Spinner size="xl" color="accent.1" /></Box>;
  }

  if (!cycle) {
    return (
      <Alert bg="danger.1" color="white" borderRadius="md">
        <AlertIcon />
        Cycle non trouvé.
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
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

      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <HStack>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            color="text.2"
            onClick={() => navigate('/cycles')}
            fontSize="sm"
            size="sm"
          >
            Retour
          </Button>
          <Heading size="lg" color="text.1">{cycle.numero_cycle}</Heading>
          {cycle.statut === 'en_cours' && (
            <Tooltip label="Modifier le cycle">
              <IconButton
                aria-label="Modifier le cycle"
                icon={<FiEdit2 />}
                size="xs"
                variant="ghost"
                color="accent.1"
                onClick={handleEditClick}
              />
            </Tooltip>
          )}
          <Badge
            bg={cycle.statut === 'en_cours' ? 'success.1' : 'surface.3'}
            color={cycle.statut === 'en_cours' ? 'white' : 'text.2'}
            borderRadius="full"
            px={2}
          >
            {cycle.statut === 'en_cours' ? 'En cours' : 'Clôturé'}
          </Badge>
          {cycle.statut === 'cloture' && (
            <>
              <Tooltip label="Voir le rapport">
                <IconButton
                  aria-label="Voir le rapport"
                  icon={<FiEye />}
                  size="xs"
                  variant="ghost"
                  color="accent.1"
                  onClick={() => navigate(`/cycles/${id}/rapport`)}
                />
              </Tooltip>
              <Tooltip label="Exporter le rapport PDF">
                <IconButton
                  aria-label="Exporter PDF"
                  icon={<FiDownload />}
                  size="xs"
                  variant="ghost"
                  color="accent.1"
                  onClick={handleExportPdf}
                  isLoading={pdfLoading}
                />
              </Tooltip>
            </>
          )}
        </HStack>

        {cycle.statut === 'en_cours' && canManagePhase && (
          <HStack>
            <Menu>
              <MenuButton
                as={Button}
                w="auto"
                minW={{ base: "200px", md: "160px" }}
                h={{ base: 10, md: 8 }}
                size={{ base: "md", md: "sm" }}
                bg="surface.2"
                borderColor="border.1"
                borderWidth="1px"
                borderRadius="md"
                rightIcon={<FiChevronDown />}
                textAlign="left"
                justifyContent="space-between"
                flexShrink={0}
              >
                {PHASES.find((p) => p.value === newPhase)?.label || 'Sélectionner'}
              </MenuButton>
              <MenuList bg="surface.1" borderColor="border.1">
                {PHASES.map((p) => (
                  <MenuItem
                    key={p.value}
                    bg="surface.1"
                    _hover={{ bg: 'surface.2' }}
                    color="text.1"
                    fontSize={{ base: "md", md: "sm" }}
                    onClick={() => setNewPhase(p.value as string)}
                  >
                    {p.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <Button
              size="sm"
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              leftIcon={<FiCheck />}
              onClick={handleChangePhase}
              fontWeight="bold"
              flexShrink={0}
            >
              Appliquer
            </Button>
            {nextPhase && (
              <Button
                size="sm"
                bg="accent.1"
                color="gray.900"
                _hover={{ bg: 'accent.2' }}
                leftIcon={<FiArrowRight />}
                onClick={handleNextPhase}
                fontWeight="bold"
                flexShrink={0}
              >
                Phase suivante
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button
                size="sm"
                bg="danger.1"
                color="white"
                _hover={{ opacity: 0.8 }}
                onClick={handleClotureClick}
                fontWeight="bold"
                flexShrink={0}
              >
                Clôturer
              </Button>
            )}
          </HStack>
        )}
      </HStack>

      {/* Stepper des phases */}
      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody py={4}>
          <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="text.3">Phases du cycle</Text>
            <Badge bg="accent.1" color="gray.900" borderRadius="full" px={2}>
              {PHASES.find((p) => p.value === cycle.phase_courante)?.label || cycle.phase_courante}
            </Badge>
          </HStack>
          <StepperPhase
            phases={PHASES}
            current={cycle.phase_courante}
            completed={cycle.statut === 'cloture'}
          />
        </CardBody>
      </Card>

      {/* Infos du cycle */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        {[
          { label: 'Date réception', value: new Date(cycle.date_reception).toLocaleDateString('fr-FR') },
          { label: 'Effectif initial', value: cycle.effectif_initial.toString() },
          { label: 'Phase', value: PHASES.find((p) => p.value === cycle.phase_courante)?.label || cycle.phase_courante },
          { label: 'Coût total', value: `${Math.round(finances?.cout_total ?? ((Number(cycle.effectif_initial) * Number(cycle.cout_achat_poussins)) + totalStockCout)).toLocaleString('fr-FR')} KMF` },
        ].map(({ label, value }) => (
          <Card key={label} bg="surface.1" borderColor="border.1" borderWidth="1px">
            <CardBody py={3} px={4}>
              <Text fontSize="xs" color="text.3">{label}</Text>
              <Text fontSize="md" fontWeight="bold" color="text.1">{value}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Bilan mortalité */}
      {cycle.statut === 'cloture' && (
        <Card bg="surface.1" borderColor="danger.1" borderWidth="1px">
          <CardBody>
            <Text fontSize="sm" color="text.3">Bilan clôture — Mortalité cumulée</Text>
            <Text fontSize="2xl" fontWeight="bold" color={tauxMortalite > 5 ? 'danger.1' : 'text.1'}>
              {totalMortalite} morts ({tauxMortalite.toFixed(1)}%)
            </Text>
          </CardBody>
        </Card>
      )}

      {/* Onglets Stocks / Mortalité */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList w={{ base: "100%", md: "auto" }}>
          <Tab fontSize="sm" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3" flex={{ base: 1, md: 'auto' }}>
            Stocks ({stocks.length})
          </Tab>
          <Tab fontSize="sm" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3" flex={{ base: 1, md: 'auto' }}>
            Mortalite ({mortalites.length})
          </Tab>
          <Tab fontSize="sm" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3" flex={{ base: 1, md: 'auto' }}>
            Bilan financier
          </Tab>
        </TabList>

        <TabPanels>
          {/* --- ONGLET STOCKS --- */}
          <TabPanel px={0} pt={4}>
            {cycle.statut === 'en_cours' && (
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px" mb={4}>
                <CardBody>
                  <Heading size="sm" color="text.1" mb={3}>Ajouter un mouvement</Heading>
                  <Box as="form" onSubmit={handleAddStock}>
                    <SimpleGrid columns={{ base: 2, md: 6 }} spacing={3}>
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
                          {TYPE_STOCK_LABELS[stockForm.type_stock] || stockForm.type_stock}
                        </MenuButton>
                        <MenuList bg="surface.1" borderColor="border.1">
                          {[
                            { value: 'aliment', label: 'Aliment' },
                            { value: 'vaccin', label: 'Vaccin' },
                            { value: 'litiere', label: 'Litière' },
                          ].map((opt) => (
                            <MenuItem
                              key={opt.value}
                              bg="surface.1"
                              _hover={{ bg: 'surface.2' }}
                              color="text.1"
                              fontSize={{ base: "md", md: "sm" }}
                              onClick={() => setStockForm({ ...stockForm, type_stock: opt.value as CreateStockPayload['type_stock'] })}
                            >
                              {opt.label}
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
                          bg="surface.2"
                          borderColor="border.1"
                          borderWidth="1px"
                          borderRadius="md"
                          rightIcon={<FiChevronDown />}
                          textAlign="left"
                          justifyContent="space-between"
                        >
                          {stockForm.sens === 'entree' ? 'Entrée' : 'Sortie'}
                        </MenuButton>
                        <MenuList bg="surface.1" borderColor="border.1">
                          {[
                            { value: 'entree', label: 'Entrée' },
                            { value: 'sortie', label: 'Sortie' },
                          ].map((opt) => (
                            <MenuItem
                              key={opt.value}
                              bg="surface.1"
                              _hover={{ bg: 'surface.2' }}
                              color="text.1"
                              fontSize={{ base: "md", md: "sm" }}
                              onClick={() => setStockForm({ ...stockForm, sens: opt.value as CreateStockPayload['sens'] })}
                            >
                              {opt.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                      <Input
                        type="number"
                        placeholder="Quantité"
                        value={stockForm.quantite || ''}
                        onChange={(e) => setStockForm({ ...stockForm, quantite: Number(e.target.value) })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        min={0}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Coût (KMF)"
                        value={stockForm.cout || ''}
                        onChange={(e) => setStockForm({ ...stockForm, cout: Number(e.target.value) })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        min={0}
                        required
                      />
                      <Input
                        type="date"
                        value={stockForm.date}
                        onChange={(e) => setStockForm({ ...stockForm, date: e.target.value })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        required
                      />
                      <Input
                        placeholder="Fournisseur"
                        value={stockForm.fournisseur}
                        onChange={(e) => setStockForm({ ...stockForm, fournisseur: e.target.value })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        required
                      />
                    </SimpleGrid>
                    <Button
                      type="submit"
                      mt={3}
                      size="sm"
                      bg="accent.1"
                      color="gray.900"
                      _hover={{ bg: 'accent.2' }}
                      leftIcon={<FiPlus />}
                      isLoading={stockLoading}
                      fontWeight="bold"
                    >
                      Ajouter
                    </Button>
                  </Box>
                </CardBody>
              </Card>
            )}

            {stocks.length === 0 ? (
              <Text color="text.3" textAlign="center" fontSize="sm" py={6}>Aucun mouvement de stock.</Text>
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
                        <Td color="text.2">{TYPE_STOCK_LABELS[s.type_stock] || s.type_stock}</Td>
                        <Td>
                          <Badge bg={s.sens === 'entree' ? 'success.1' : 'warning.1'} color="white" fontSize="xs">
                            {s.sens === 'entree' ? 'Entrée' : 'Sortie'}
                          </Badge>
                        </Td>
                        <Td color="text.2">{Math.round(s.quantite)}</Td>
                        <Td color="text.2">{Math.round(s.cout).toLocaleString('fr-FR')} KMF</Td>
                        <Td color="text.2">{s.fournisseur}</Td>
                        <Td color="text.3" fontSize="xs">{creatorLabel(s.creator)}</Td>
                        <Td>
                          {cycle.statut === 'en_cours' && (
                            <Tooltip label="Supprimer">
                              <IconButton
                                aria-label="Supprimer"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                color="danger.1"
                                onClick={() => handleDeleteStock(s.id)}
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

            {stocks.length > 0 && (
              <HStack justify="flex-end" mt={3}>
                <Text fontSize="sm" color="text.3">
                  Total coût: <strong color="text.1">{Math.round(totalStockCout).toLocaleString('fr-FR')} KMF</strong>
                </Text>
              </HStack>
            )}
          </TabPanel>

          {/* --- ONGLET MORTALITÉ --- */}
          <TabPanel px={0} pt={4}>
            {cycle.statut === 'en_cours' && (
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px" mb={4}>
                <CardBody>
                  <Heading size="sm" color="text.1" mb={3}>Enregistrer une mortalité</Heading>
                  <Box as="form" onSubmit={handleAddMortalite}>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                      <Input
                        type="date"
                        value={mortForm.date}
                        onChange={(e) => setMortForm({ ...mortForm, date: e.target.value })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Nombre"
                        value={mortForm.nombre || ''}
                        onChange={(e) => setMortForm({ ...mortForm, nombre: Number(e.target.value) })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        min={1}
                        required
                      />
                      <Input
                        placeholder="Cause"
                        value={mortForm.cause}
                        onChange={(e) => setMortForm({ ...mortForm, cause: e.target.value })}
                        bg="surface.2"
                        borderColor="border.1"
                        size="sm"
                        borderRadius="md"
                        required
                      />
                      <Button
                        type="submit"
                        size="sm"
                        bg="accent.1"
                        color="gray.900"
                        _hover={{ bg: 'accent.2' }}
                        leftIcon={<FiPlus />}
                        isLoading={mortLoading}
                        fontWeight="bold"
                      >
                        Ajouter
                      </Button>
                    </SimpleGrid>
                  </Box>
                </CardBody>
              </Card>
            )}

            {/* Résumé mortalité */}
            <Card bg="surface.1" borderColor="border.1" borderWidth="1px" mb={4}>
              <CardBody py={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.3">Total mortalité</Text>
                  <Text fontSize="md" fontWeight="bold" color={tauxMortalite > 5 ? 'danger.1' : 'text.1'}>
                    {totalMortalite} / {cycle.effectif_initial} ({tauxMortalite.toFixed(1)}%)
                  </Text>
                </HStack>
                <Box bg="surface.3" borderRadius="full" h={2} mt={2}>
                  <Box
                    bg={tauxMortalite > 10 ? 'danger.1' : tauxMortalite > 5 ? 'warning.1' : 'success.1'}
                    h={2}
                    borderRadius="full"
                    w={`${Math.min(tauxMortalite, 100)}%`}
                  />
                </Box>
              </CardBody>
            </Card>

            {mortalites.length === 0 ? (
              <Text color="text.3" fontSize="sm" textAlign="center" py={6}>Aucune mortalité enregistrée.</Text>
            ) : (
              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th color="text.3">Date</Th>
                      <Th color="text.3">Nombre</Th>
                      <Th color="text.3">Cause</Th>
                      <Th color="text.3">Enregistré par</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {mortalites.map((m) => (
                      <Tr key={m.id}>
                        <Td color="text.2">{new Date(m.date).toLocaleDateString('fr-FR')}</Td>
                        <Td color="text.2">{m.nombre}</Td>
                        <Td color="text.2">{m.cause}</Td>
                        <Td color="text.3" fontSize="xs">{creatorLabel(m.creator)}</Td>
                        <Td>
                          {cycle.statut === 'en_cours' && (
                            <Tooltip label="Supprimer">
                              <IconButton
                                aria-label="Supprimer"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                color="danger.1"
                                onClick={() => handleDeleteMortalite(m.id)}
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
          </TabPanel>

          {/* --- ONGLET BILAN FINANCIER --- */}
          <TabPanel px={0} pt={4}>
            {finances ? (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Cout total</Text>
                      <Text fontSize="lg" fontWeight="bold" color="text.1">
                        {Math.round(finances.cout_total).toLocaleString('fr-FR')} KMF
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Recettes totales</Text>
                      <Text fontSize="lg" fontWeight="bold" color="text.1">
                        {Math.round(finances.total_ventes).toLocaleString('fr-FR')} KMF
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg="surface.1" borderColor={finances.marge >= 0 ? 'success.1' : 'danger.1'} borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Marge</Text>
                      <Text fontSize="lg" fontWeight="bold" color={finances.marge >= 0 ? 'success.1' : 'danger.1'}>
                        {finances.marge >= 0 ? '+' : ''}{Math.round(finances.marge).toLocaleString('fr-FR')} KMF
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Cout revient / poulet</Text>
                      <Text fontSize="lg" fontWeight="bold" color="text.1">
                        {finances.cout_revient_par_poulet.toLocaleString('fr-FR')} KMF
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Seuil rentabilite</Text>
                      <Text fontSize="lg" fontWeight="bold" color="text.1">
                        {finances.seuil_rentabilite} poulets
                      </Text>
                    </CardBody>
                  </Card>
                  <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                    <CardBody py={3} px={4}>
                      <Text fontSize="xs" color="text.3">Effectif vivant</Text>
                      <Text fontSize="lg" fontWeight="bold" color="text.1">
                        {finances.effectif_vivant}
                      </Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            ) : (
              <Text color="text.3" textAlign="center" py={6}>Chargement des donnees financieres...</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <ConfirmModal
        isOpen={deleteStockTargetId !== null}
        onClose={() => setDeleteStockTargetId(null)}
        onConfirm={confirmDeleteStock}
        title="Supprimer le mouvement"
        message="Êtes-vous sûr de vouloir supprimer ce mouvement de stock ? Cette action est irréversible."
      />
      <ConfirmModal
        isOpen={deleteMortTargetId !== null}
        onClose={() => setDeleteMortTargetId(null)}
        onConfirm={confirmDeleteMortalite}
        title="Supprimer la mortalité"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement de mortalité ? Cette action est irréversible."
      />
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="md" isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">Modifier le cycle #{cycle?.numero_cycle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Box w="full">
                <Text fontSize="sm" color="text.3" mb={1}>Date de réception</Text>
                <Input
                  type="date"
                  value={editForm.date_reception}
                  onChange={(e) => setEditForm({ ...editForm, date_reception: e.target.value })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                />
              </Box>
              <Box w="full">
                <Text fontSize="sm" color="text.3" mb={1}>Effectif initial</Text>
                <Input
                  type="number"
                  value={editForm.effectif_initial}
                  onChange={(e) => setEditForm({ ...editForm, effectif_initial: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                  min={1}
                />
              </Box>
              <Box w="full">
                <Text fontSize="sm" color="text.3" mb={1}>Coût d'achat des poussins (KMF)</Text>
                <Input
                  type="number"
                  value={editForm.cout_achat_poussins}
                  onChange={(e) => setEditForm({ ...editForm, cout_achat_poussins: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size="sm"
                  min={0}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              isLoading={editLoading}
              fontWeight="bold"
              onClick={handleEditSubmit}
            >
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
