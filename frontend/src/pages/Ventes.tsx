import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Badge,
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
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiExternalLink, FiCheckCircle, FiDownload, FiEye, FiChevronDown } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { ventesService, Vente, CreateVentePayload, CATEGORIE_PRODUIT_LABELS, CategorieProduit } from '../services/ventes.service';
import { santeService, Mortalite } from '../services/sante.service';
import { clientsService, Client } from '../services/clients.service';
import { exportService } from '../services/export.service';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { responsiveText } from '../theme/designTokens';
import { creatorLabel } from '../utils/creatorLabel';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
  virement: 'Virement',
  credit: 'Crédit',
};

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  paye: 'Payé',
  partiel: 'Partiel',
  impaye: 'Impayé',
};

const STATUT_COLORS: Record<string, string> = {
  paye: 'success.1',
  partiel: 'warning.1',
  impaye: 'danger.1',
};

const ITEMS_PER_PAGE = 10;

export default function Ventes() {
  const navigate = useNavigate();
  const { cycleId: urlCycleId } = useParams<{ cycleId?: string }>();
  const { user } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCycleData, setSelectedCycleData] = useState<Cycle | null>(null);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [mortalites, setMortalites] = useState<Mortalite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [searchClient, setSearchClient] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState<CreateVentePayload>({
    cycle_id: '',
    client_id: '',
    quantite: 0,
    prix_unitaire: 0,
    date: new Date().toISOString().slice(0, 10),
    mode_paiement: 'especes',
    statut_paiement: 'paye',
    categorie_produit: 'poulet_vif',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      cyclesService.getAll(),
      clientsService.getAll(),
    ])
      .then(([c, cl]) => {
        setCycles(c);
        setClients(cl);
        if (c.length > 0 && !selectedCycle) {
          const sorted = [...c].sort((a, b) => Number(b.numero_cycle) - Number(a.numero_cycle));
          let target: Cycle;
          if (urlCycleId) {
            target = c.find((cy) => cy.id === urlCycleId) || sorted[0]!;
          } else {
            const enCours = sorted.filter((cy) => cy.statut === 'en_cours');
            target = enCours.length > 0 ? enCours[0]! : sorted[0]!;
          }
          setSelectedCycle(target.id);
          setSelectedCycleData(target);
          setForm((prev) => ({ ...prev, cycle_id: target.id }));
        }
      })
      .catch(() => setError('Erreur lors du chargement des données'))
      .finally(() => setLoading(false));
  }, []);

  const loadVentes = useCallback(async () => {
    if (!selectedCycle) return;
    try {
      const data = await ventesService.getByCycle(selectedCycle);
      setVentes(data);
    } catch {
      setError('Erreur lors du chargement des ventes');
    }
  }, [selectedCycle]);

  useEffect(() => { loadVentes(); }, [loadVentes]);

  useEffect(() => {
    if (!selectedCycle) return;
    santeService.getByCycle(selectedCycle)
      .then((m) => setMortalites(m))
      .catch(() => setMortalites([]));
  }, [selectedCycle]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;

    if (form.quantite > resteDisponible) {
      setErrorMessage(
        `Quantité invalide : Il ne reste que ${resteDisponible} poulets vivants disponibles à la vente. ` +
        `Effectif vivant : ${effectifVivant}, Déjà vendu : ${totalDejaVendu}.`
      );
      setShowErrorModal(true);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form, cycle_id: selectedCycle };
      if (editingId) {
        await ventesService.update(editingId, payload);
        showSuccess('Vente modifiée');
      } else {
        await ventesService.create(payload);
        showSuccess('Vente ajoutée');
      }
      setEditingId(null);
      setForm({
        cycle_id: selectedCycle,
        client_id: '',
        quantite: 0,
        prix_unitaire: 0,
        date: new Date().toISOString().slice(0, 10),
        mode_paiement: 'especes',
        statut_paiement: 'paye',
        categorie_produit: 'poulet_vif',
      });
      await loadVentes();
    } catch (err: unknown) {
      console.error('Erreur création vente:', (err as any)?.response?.data);
      setError(editingId ? 'Erreur lors de la modification' : "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (v: Vente) => {
    setEditingId(v.id);
    setForm({
      cycle_id: v.cycle_id,
      client_id: v.client_id || '',
      quantite: v.quantite,
      prix_unitaire: v.prix_unitaire,
      date: v.date,
      mode_paiement: v.mode_paiement,
      statut_paiement: v.statut_paiement,
      categorie_produit: v.categorie_produit || 'poulet_vif',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      cycle_id: selectedCycle,
      client_id: '',
      quantite: 0,
      prix_unitaire: 0,
      date: new Date().toISOString().slice(0, 10),
      mode_paiement: 'especes',
      statut_paiement: 'paye',
      categorie_produit: 'poulet_vif',
    });
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await ventesService.remove(deleteTargetId);
      setVentes((prev) => prev.filter((v) => v.id !== deleteTargetId));
      showSuccess('Vente supprimée');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await ventesService.update(id, { statut_paiement: 'paye' });
      setVentes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, statut_paiement: 'paye' as const } : v))
      );
      showSuccess('Vente marquée comme payée');
    } catch {
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleExportFacture = async (venteId: string) => {
    setPdfLoadingId(venteId);
    try {
      const response = await ventesService.exportFacturePdf(venteId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${venteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de la génération de la facture. Vérifiez que le service PDF est actif.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleExportVentesCsv = async () => {
    setExporting(true);
    try {
      const response = await exportService.exportVentes(
        selectedCycle || undefined,
        filterStatut !== 'tous' ? filterStatut : undefined,
      );
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ventes-export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
    }
  };

  const filteredVentes = useMemo(() => {
    let result = [...ventes];
    if (searchClient) {
      const q = searchClient.toLowerCase();
      result = result.filter((v) =>
        v.client?.nom.toLowerCase().includes(q)
      );
    }
    if (filterStatut !== 'tous') {
      result = result.filter((v) => v.statut_paiement === filterStatut);
    }
    return result;
  }, [ventes, searchClient, filterStatut]);

  const totalPages = Math.ceil(filteredVentes.length / ITEMS_PER_PAGE);
  const paginatedVentes = filteredVentes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchClient, filterStatut]);

  const totalVentesFiltered = filteredVentes
    .filter((v) => v.statut_paiement !== 'impaye')
    .reduce((sum, v) => sum + Number(v.quantite) * Number(v.prix_unitaire) - Number(v.remise || 0), 0);

  const totalQuantiteFiltered = filteredVentes
    .filter((v) => v.statut_paiement !== 'impaye')
    .reduce((sum, v) => sum + Number(v.quantite), 0);

  const effectifVivant = selectedCycleData
    ? selectedCycleData.effectif_initial - mortalites.reduce((sum, m) => sum + Number(m.nombre), 0)
    : 0;

  const totalDejaVendu = ventes
    .filter((v) => v.statut_paiement !== 'impaye' && v.id !== editingId)
    .reduce((sum, v) => sum + Number(v.quantite), 0);

  const resteDisponible = effectifVivant - totalDejaVendu;

  const totalImpayeCycle = ventes
    .filter((v) => v.statut_paiement === 'impaye' && v.id !== editingId)
    .reduce((sum, v) => sum + Number(v.quantite), 0);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={20}><Text color="text.3">Chargement...</Text></Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Ventes</Heading>
        <Button
          size={{ base: "md", md: "sm" }}
          variant="outline"
          borderColor="border.1"
          color="text.2"
          bg="surface.1"
          leftIcon={<FiDownload />}
          onClick={handleExportVentesCsv}
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
            fontSize={responsiveText.sm}
          >
            {selectedCycle
              ? `Cycle #${cycles.find(c => c.id === selectedCycle)?.numero_cycle} - ${new Date(cycles.find(c => c.id === selectedCycle)?.date_reception || '').toLocaleDateString('fr-FR')}`
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
                  navigate(`/ventes/${c.id}`, { replace: true });
                  setSelectedCycleData(c);
                  setForm((prev) => ({ ...prev, cycle_id: c.id }));
                  setEditingId(null);
                  setSearchClient('');
                  setFilterStatut('tous');
                }}
              >
                Cycle #{c.numero_cycle} - {new Date(c.date_reception).toLocaleDateString('fr-FR')}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>

      {selectedCycleData?.statut === 'en_cours' ? (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody>
            <Heading size="sm" color="text.1" mb={3}>
              {editingId ? 'Modifier la vente' : 'Ajouter une vente'}
            </Heading>
            <Box as="form" onSubmit={handleSubmit}>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 7 }} spacing={3}>
                <Input
                  type="number"
                  placeholder="Quantité"
                  value={form.quantite || ''}
                  onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
                  min={1}
                  required
                />
                <Input
                  type="number"
                  placeholder="Prix unitaire (KMF)"
                  value={form.prix_unitaire || ''}
                  onChange={(e) => setForm({ ...form, prix_unitaire: Number(e.target.value) })}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
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
                  >
                    {MODE_PAIEMENT_LABELS[form.mode_paiement] || form.mode_paiement}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    {Object.entries(MODE_PAIEMENT_LABELS)
                      .filter(([value]) => user?.role !== 'employe' || value === 'especes')
                      .map(([value, label]) => (
                        <MenuItem
                          key={value}
                          bg="surface.1"
                          _hover={{ bg: 'surface.2' }}
                          color="text.1"
                          fontSize={{ base: "md", md: "sm" }}
                          onClick={() => setForm({ ...form, mode_paiement: value as CreateVentePayload['mode_paiement'] })}
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
                    bg="surface.2"
                    borderColor="border.1"
                    borderWidth="1px"
                    borderRadius="md"
                    rightIcon={<FiChevronDown />}
                    textAlign="left"
                    justifyContent="space-between"
                  >
                    {STATUT_PAIEMENT_LABELS[form.statut_paiement] || form.statut_paiement}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    {Object.entries(STATUT_PAIEMENT_LABELS)
                      .filter(([value]) => user?.role !== 'employe' || value === 'paye')
                      .map(([value, label]) => (
                        <MenuItem
                          key={value}
                          bg="surface.1"
                          _hover={{ bg: 'surface.2' }}
                          color="text.1"
                          fontSize={{ base: "md", md: "sm" }}
                          onClick={() => setForm({ ...form, statut_paiement: value as CreateVentePayload['statut_paiement'] })}
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
                    bg="surface.2"
                    borderColor="border.1"
                    borderWidth="1px"
                    borderRadius="md"
                    rightIcon={<FiChevronDown />}
                    textAlign="left"
                    justifyContent="space-between"
                  >
                    <Text
                      as="span"
                      noOfLines={1}
                      flex={1}
                      minW={0}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {form.client_id ? clients.find(cl => cl.id === form.client_id)?.nom || 'Client inconnu' : 'Choisir un client'}
                    </Text>
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    <MenuItem
                      bg="surface.1"
                      _hover={{ bg: 'surface.2' }}
                      color="text.1"
                      fontSize={{ base: "md", md: "sm" }}
                      onClick={() => setForm({ ...form, client_id: undefined })}
                    >
                      Choisir un client
                    </MenuItem>
                    {clients.map((cl) => (
                      <MenuItem
                        key={cl.id}
                        bg="surface.1"
                        _hover={{ bg: 'surface.2' }}
                        color="text.1"
                        fontSize={{ base: "md", md: "sm" }}
                        onClick={() => setForm({ ...form, client_id: cl.id })}
                      >
                        {cl.nom}
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
                    {CATEGORIE_PRODUIT_LABELS[form.categorie_produit] || form.categorie_produit}
                  </MenuButton>
                  <MenuList bg="surface.1" borderColor="border.1">
                    {Object.entries(CATEGORIE_PRODUIT_LABELS).map(([value, label]) => (
                      <MenuItem
                        key={value}
                        bg="surface.1"
                        _hover={{ bg: 'surface.2' }}
                        color="text.1"
                        fontSize={{ base: "md", md: "sm" }}
                        onClick={() => setForm({ ...form, categorie_produit: value as CategorieProduit })}
                      >
                        {label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </SimpleGrid>
              <HStack justifyContent="space-between">
                <>
                  {selectedCycle && (
                    <Text fontSize="xs" color="text.3" mt={2}>
                      {totalImpayeCycle > 0
                        ? `Disponible : ${resteDisponible} poulets, ${totalImpayeCycle} impayés sur ${effectifVivant} vivants`
                        : `Disponible : ${resteDisponible} poulets sur ${effectifVivant} vivants`}
                    </Text>
                  )}
                </>

                <HStack justifyContent="flex-end" mt={3}>
                <Button
                  type="submit"
                  size="sm"
                  bg="accent.1"
                  color="gray.900"
                  _hover={{ bg: 'accent.2' }}
                  leftIcon={editingId ? <FiEdit2 /> : <FiPlus />}
                  isLoading={submitting}
                  fontWeight="bold"
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
                {editingId && (
                  <Button
                    size="sm"
                    variant="outline"
                    color="text.3"
                    onClick={handleCancelEdit}
                  >
                    Annuler
                  </Button>
                )}
              </HStack>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      ) : null}

      <HStack spacing={3} flexWrap="wrap" position="relative" zIndex={1}>
        <InputGroup maxW="250px" size="sm">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher client..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            bg="surface.1"
            borderColor="border.1"
            borderRadius="md"
            fontSize="sm"
          />
        </InputGroup>
        <Menu>
          <MenuButton
            as={Button}
            w="auto"
            h={{ base: 10, md: 8 }}
            size={{ base: "md", md: "sm" }}
            bg="surface.1"
            borderColor="border.1"
            borderWidth="1px"
            borderRadius="md"
            rightIcon={<FiChevronDown />}
            textAlign="left"
            justifyContent="space-between"
            fontSize="sm"
          >
            {STATUT_PAIEMENT_LABELS[filterStatut] || 'Tous les statuts'}
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1">
            <MenuItem
              bg="surface.1"
              _hover={{ bg: 'surface.2' }}
              color="text.1"
              fontSize={{ base: "md", md: "sm" }}
              onClick={() => setFilterStatut('tous')}
            >
              Tous les statuts
            </MenuItem>
            {Object.entries(STATUT_PAIEMENT_LABELS).map(([value, label]) => (
              <MenuItem
                key={value}
                bg="surface.1"
                _hover={{ bg: 'surface.2' }}
                color="text.1"
                fontSize={{ base: "md", md: "sm" }}
                onClick={() => setFilterStatut(value)}
              >
                {label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </HStack>

      {filteredVentes.length === 0 ? (
        <Text color="text.3" fontSize="sm" textAlign="center" py={6}>
          {ventes.length === 0 ? 'Aucune vente enregistrée.' : 'Aucune vente ne correspond aux filtres.'}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th color="text.3">Date</Th>
                <Th color="text.3">Client</Th>
                <Th color="text.3">Catégorie</Th>
                <Th color="text.3">Quantité</Th>
                <Th color="text.3">Prix unitaire</Th>
                <Th color="text.3">Remise</Th>
                <Th color="text.3">Total</Th>
                <Th color="text.3">Mode paiement</Th>
                <Th color="text.3">Statut</Th>
                <Th color="text.3">Enregistré par</Th>
                {user?.role !== 'employe' && <Th color="text.3">Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {paginatedVentes.map((v) => (
                <Tr key={v.id}>
                  <Td color="text.2">{new Date(v.date).toLocaleDateString('fr-FR')}</Td>
                  <Td>
                    {v.client ? (
                      <HStack spacing={1}>
                        <Text color="accent.1" fontSize="sm">{v.client.nom}</Text>
                        <Tooltip label="Voir le client">
                          <IconButton
                            aria-label="Voir le client"
                            icon={<FiExternalLink />}
                            size="xs"
                            variant="ghost"
                            color="accent.1"
                            onClick={() => navigate(`/clients/${v.client!.id}`)}
                          />
                        </Tooltip>
                      </HStack>
                    ) : (
                      <Text color="text.3" fontSize="sm">—</Text>
                    )}
                  </Td>
                  <Td color="text.2" fontSize="sm">{CATEGORIE_PRODUIT_LABELS[v.categorie_produit] || '—'}</Td>
                  <Td color="text.2">{v.quantite}</Td>
                  <Td color="text.2">{Number(v.prix_unitaire).toLocaleString('fr-FR')} KMF</Td>
                  <Td color="text.2">
                    {Number(v.remise) > 0 ? (
                      <Text fontSize="sm" color="orange.300">-{Number(v.remise).toLocaleString('fr-FR')} KMF</Text>
                    ) : (
                      <Text fontSize="sm" color="text.3">—</Text>
                    )}
                  </Td>
                  <Td color="text.2">{(Number(v.quantite) * Number(v.prix_unitaire) - Number(v.remise || 0)).toLocaleString('fr-FR')} KMF</Td>
                  <Td color="text.2">{MODE_PAIEMENT_LABELS[v.mode_paiement] || v.mode_paiement}</Td>
                  <Td>
                    <Badge bg={STATUT_COLORS[v.statut_paiement] || 'surface.3'} color="white" fontSize="xs">
                      {STATUT_PAIEMENT_LABELS[v.statut_paiement] || v.statut_paiement}
                    </Badge>
                  </Td>
                  <Td color="text.3" fontSize="xs">{creatorLabel(v.creator)}</Td>
                  <Td>
                    {user?.role !== 'employe' && (
                    <HStack spacing={1}>
                      <Tooltip label="Générer facture">
                        <IconButton
                          aria-label="Générer facture"
                          icon={<FiDownload />}
                          size="xs"
                          variant="ghost"
                          color="blue.400"
                          isLoading={pdfLoadingId === v.id}
                          onClick={() => handleExportFacture(v.id)}
                        />
                      </Tooltip>
                      <Tooltip label="Aperçu facture">
                        <IconButton
                          aria-label="Aperçu facture"
                          icon={<FiEye />}
                          size="xs"
                          variant="ghost"
                          color="blue.300"
                          onClick={() => navigate(`/ventes/${v.id}/facture?fromCycle=${selectedCycle}`)}
                        />
                      </Tooltip>
                      {(v.statut_paiement === 'impaye' || v.statut_paiement === 'partiel') && (
                        <Tooltip label="Marquer comme payé">
                          <IconButton
                            aria-label="Marquer comme payé"
                            icon={<FiCheckCircle />}
                            size="xs"
                            variant="ghost"
                            color="green.400"
                            onClick={() => handleMarkAsPaid(v.id)}
                          />
                        </Tooltip>
                      )}
                      {selectedCycleData?.statut === 'en_cours' && (
                        <>
                          <Tooltip label="Modifier">
                            <IconButton
                              aria-label="Modifier"
                              icon={<FiEdit2 />}
                              size="xs"
                              variant="ghost"
                              color="accent.1"
                              onClick={() => handleEdit(v)}
                            />
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <IconButton
                              aria-label="Supprimer"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              color="danger.1"
                              onClick={() => handleDelete(v.id)}
                            />
                          </Tooltip>
                        </>
                      )}
                    </HStack>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {filteredVentes.length > 0 && (
        <HStack justify="space-between" borderTop="1px solid" borderColor="border.1" spacing={6} pt={4}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          <Text fontSize="sm" color="text.3">
            {filteredVentes.length !== ventes.length && `${filteredVentes.length} sur ${ventes.length} — `}
            Total: <strong color="text.1">{totalQuantiteFiltered} plts — {Math.round(totalVentesFiltered).toLocaleString('fr-FR')} KMF</strong>
          </Text>
        </HStack>
      )}

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader color="text.1">Erreur de validation</ModalHeader>
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
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Supprimer la vente"
        message="Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible."
      />
    </VStack>
  );
}
