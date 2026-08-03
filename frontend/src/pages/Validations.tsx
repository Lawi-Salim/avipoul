import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
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
  Spinner,
  Center,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { FiCheckCircle, FiXCircle, FiDollarSign, FiCheck } from 'react-icons/fi';
import {
  validationsService,
  AVaiderData,
  ValidationVente,
} from '../services/validations.service';
import { risquesService, Risque } from '../services/risques.service';
import { ventesService } from '../services/ventes.service';
import { creatorLabel } from '../utils/creatorLabel';
import ConfirmModal from '../components/ConfirmModal';
import { responsiveText } from '../theme/designTokens';

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

const TYPE_STOCK_LABELS: Record<string, string> = {
  aliment: 'Aliment',
  vaccin: 'Vaccin',
  litiere: 'Litière',
};

const RISQUE_CATEGORIES: Record<string, string> = {
  sanitaire: 'Sanitaire',
  financier: 'Financier',
  marche: 'Marché',
  approvisionnement: 'Approvisionnement',
};

const formatMontant = (v: number) =>
  Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function Validations() {
  const location = useLocation();
  const locationState = location.state as { focus?: string; cycleId?: string } | null;

  const [data, setData] = useState<AVaiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<{ ventes: string[]; stocks: string[]; mortalites: string[]; risques: string[] }>({
    ventes: [],
    stocks: [],
    mortalites: [],
    risques: [],
  });
  const [focus, setFocus] = useState<string | null>(locationState?.focus ?? null);
  const [focusCycleId, setFocusCycleId] = useState<string | null>(locationState?.cycleId ?? null);
  const [encaisserTarget, setEncaisserTarget] = useState<ValidationVente | null>(null);
  const { isOpen: isEncaisserOpen, onOpen: onEncaisserOpen, onClose: onEncaisserClose } = useDisclosure();

  const ventesRef = useRef<HTMLDivElement>(null);
  const stocksRef = useRef<HTMLDivElement>(null);
  const mortalitesRef = useRef<HTMLDivElement>(null);
  const risquesRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const d = await validationsService.getAVaider();
      setData(d);
    } catch {
      setError('Erreur lors du chargement des opérations à valider');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const isFocused = (section: string) => focus === section || focus === 'all';
  const isRowTargeted = (rowCycleId?: string) =>
    !focusCycleId || rowCycleId === focusCycleId;

  useEffect(() => {
    if (loading || !focus) return;
    const match = (id?: string) => !focusCycleId || id === focusCycleId;
    const hasVentes = (data?.ventes || []).some((v) => !ignored.ventes.includes(v.id) && match(v.cycle_id));
    const hasStocks = (data?.stocks || []).some((s) => !ignored.stocks.includes(s.id) && match(s.cycle_id));
    const hasMortalites = (data?.mortalites || []).some((m) => !ignored.mortalites.includes(m.id) && match(m.cycle_id));
    const hasRisques = (data?.risques || []).length > 0;
    const ref =
      focus === 'ventes' ? ventesRef
      : focus === 'stocks' ? stocksRef
      : focus === 'mortalites' ? mortalitesRef
      : focus === 'risques' ? risquesRef
      : focus === 'all'
        ? (hasVentes ? ventesRef : hasStocks ? stocksRef : hasMortalites ? mortalitesRef : hasRisques ? risquesRef : null)
        : null;
    if (ref) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, focus, focusCycleId, data, ignored]);

  useEffect(() => {
    if (loading || !data || !focus) return;
    const match = (id?: string) => !focusCycleId || id === focusCycleId;
    let remaining = 0;
    if (focus === 'all' || focus === 'ventes') {
      remaining += (data?.ventes || []).filter((v) => !ignored.ventes.includes(v.id) && match(v.cycle_id)).length;
    }
    if (focus === 'all' || focus === 'stocks') {
      remaining += (data?.stocks || []).filter((s) => !ignored.stocks.includes(s.id) && match(s.cycle_id)).length;
    }
    if (focus === 'all' || focus === 'mortalites') {
      remaining += (data?.mortalites || []).filter((m) => !ignored.mortalites.includes(m.id) && match(m.cycle_id)).length;
    }
    if (focus === 'all') {
      remaining += (data?.risques || []).filter((r) => !ignored.risques.includes(r.id)).length;
    }
    if (remaining === 0) setFocus(null);
  }, [focus, focusCycleId, data, ignored]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const ignore = (type: 'ventes' | 'stocks' | 'mortalites' | 'risques', id: string) => {
    setIgnored((prev) => ({ ...prev, [type]: [...prev[type], id] }));
  };

  const run = async (promise: Promise<unknown>, msg: string) => {
    try {
      await promise;
      showSuccess(msg);
      loadData();
    } catch {
      setError('Erreur lors de l\'opération');
    } finally {
      setBusyId(null);
    }
  };

  const handleValiderVente = (id: string) => {
    setBusyId(id);
    run(validationsService.validerVente(id), 'Vente validée');
  };

  const handleValiderStock = (id: string) => {
    setBusyId(id);
    run(validationsService.validerStock(id), 'Sortie de stock validée');
  };

  const handleValiderMortalite = (id: string) => {
    setBusyId(id);
    run(validationsService.validerMortalite(id), 'Mortalité validée');
  };

  const handleEncaisser = () => {
    if (!encaisserTarget) return;
    setBusyId(encaisserTarget.id);
    onEncaisserClose();
    run(
      ventesService.update(encaisserTarget.id, { statut_paiement: 'paye' }),
      'Vente encaissée et validée',
    );
  };

  const handleResoudreRisque = (risque: Risque) => {
    setBusyId(risque.id);
    run(risquesService.update(risque.id, { actif: false }), 'Risque résolu');
  };

  if (loading) {
    return <Center py={20}><Spinner size="xl" color="accent.1" /></Center>;
  }

  const ventes = (data?.ventes || []).filter((v) => !ignored.ventes.includes(v.id));
  const stocks = (data?.stocks || []).filter((s) => !ignored.stocks.includes(s.id));
  const mortalites = (data?.mortalites || []).filter((m) => !ignored.mortalites.includes(m.id));
  const risques = (data?.risques || []).filter((r) => !ignored.risques.includes(r.id));

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} color="text.1">À valider</Heading>
          <Text fontSize={responsiveText.xs} color="text.3" mt={1}>
            Opérations saisies sur le terrain à contrôler et valider
          </Text>
        </Box>
        <HStack spacing={2} flexWrap="wrap">
          <Badge bg="accent.1" color="gray.900" px={3} py={1} borderRadius="full">{ventes.length} ventes</Badge>
          <Badge bg="blue.400" color="white" px={3} py={1} borderRadius="full">{stocks.length} stocks</Badge>
          <Badge bg="orange.400" color="gray.900" px={3} py={1} borderRadius="full">{mortalites.length} mortalités</Badge>
          <Badge bg="danger.1" color="white" px={3} py={1} borderRadius="full">{risques.length} risques</Badge>
        </HStack>
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

      <Card
        bg="surface.1"
        borderColor={isFocused('ventes') ? 'accent.1' : 'border.1'}
        borderWidth="1px"
        ref={ventesRef}
      >
        <CardBody p={4}>
          <Heading size="sm" color="text.1" mb={3}>
            Ventes à valider
            {isFocused('ventes') && (
              <Badge ml={2} bg="accent.1" color="gray.900" borderRadius="full" fontSize={responsiveText.xs} px={2} py={0.5}>
                Prioritaire
              </Badge>
            )}
          </Heading>
          {ventes.length === 0 ? (
            <Text color="text.3" fontSize={{ base: "sm", md: "ms" }} textAlign="center" py={4}>Aucune vente en attente.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="text.3">Client</Th>
                    <Th color="text.3">Cycle</Th>
                    <Th color="text.3">Qté</Th>
                    <Th color="text.3">Prix unit.</Th>
                    <Th color="text.3">Montant</Th>
                    <Th color="text.3">Statut</Th>
                    <Th color="text.3">Date</Th>
                    <Th color="text.3">Enregistré par</Th>
                    <Th color="text.3">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {ventes.map((v) => (
                    <Tr
                      key={v.id}
                      bg={isFocused('ventes') && isRowTargeted(v.cycle_id) ? 'accent.bg' : undefined}
                    >
                      <Td color="text.2">{v.client?.nom || '—'}</Td>
                      <Td color="text.2">#{v.cycle?.numero_cycle ?? ''}</Td>
                      <Td color="text.2">{v.quantite}</Td>
                      <Td color="text.2">{formatMontant(v.prix_unitaire)}</Td>
                      <Td color="text.1" fontWeight="medium">{formatMontant(v.quantite * v.prix_unitaire - (v.remise || 0))}</Td>
                      <Td>
                        <Badge bg={STATUT_COLORS[v.statut_paiement] || 'text.3'} color="white" fontSize={responsiveText.xs}>
                          {STATUT_PAIEMENT_LABELS[v.statut_paiement] || v.statut_paiement}
                        </Badge>
                      </Td>
                      <Td color="text.2">{formatDate(v.date)}</Td>
                      <Td color="text.3" fontSize="xs">{creatorLabel(v.creator)}</Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          {v.statut_paiement !== 'paye' && (
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              bg="success.1"
                              color="white"
                              _hover={{ bg: 'success.2' }}
                              leftIcon={<FiDollarSign />}
                              isLoading={busyId === v.id}
                              onClick={() => { setEncaisserTarget(v); onEncaisserOpen(); }}
                            >
                              Encaisser
                            </Button>
                          )}
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            bg="accent.1"
                            color="gray.900"
                            _hover={{ bg: 'accent.2' }}
                            leftIcon={<FiCheck />}
                            isLoading={busyId === v.id}
                            onClick={() => handleValiderVente(v.id)}
                          >
                            Valider
                          </Button>
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            variant="ghost"
                            color="text.3"
                            leftIcon={<FiXCircle />}
                            onClick={() => ignore('ventes', v.id)}
                          >
                            Ignorer
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Card
        bg="surface.1"
        borderColor={isFocused('stocks') ? 'accent.1' : 'border.1'}
        borderWidth="1px"
        ref={stocksRef}
      >
        <CardBody p={4}>
          <Heading size="sm" color="text.1" mb={3}>
            Sorties de stock à valider
            {isFocused('stocks') && (
              <Badge ml={2} bg="accent.1" color="gray.900" borderRadius="full" fontSize={responsiveText.xs} px={2} py={0.5}>
                Prioritaire
              </Badge>
            )}
          </Heading>
          {stocks.length === 0 ? (
            <Text color="text.3" fontSize={{ base: "sm", md: "ms" }} textAlign="center" py={4}>Aucune sortie de stock en attente.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="text.3">Type</Th>
                    <Th color="text.3">Quantité</Th>
                    <Th color="text.3">Cycle</Th>
                    <Th color="text.3">Date</Th>
                    <Th color="text.3">Notes</Th>
                    <Th color="text.3">Enregistré par</Th>
                    <Th color="text.3">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stocks.map((s) => (
                    <Tr
                      key={s.id}
                      bg={isFocused('stocks') && isRowTargeted(s.cycle_id) ? 'accent.bg' : undefined}
                    >
                      <Td color="text.2">
                        <Badge bg="blue.400" color="white" fontSize={responsiveText.xs}>
                          {TYPE_STOCK_LABELS[s.type_stock] || s.type_stock}
                        </Badge>
                      </Td>
                      <Td color="text.2">{s.quantite} {s.unite}</Td>
                      <Td color="text.2">#{s.cycle?.numero_cycle ?? ''}</Td>
                      <Td color="text.2">{formatDate(s.date)}</Td>
                      <Td color="text.3" maxW="250px">{s.notes || '—'}</Td>
                      <Td color="text.3" fontSize="xs">{creatorLabel(s.creator)}</Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            bg="accent.1"
                            color="gray.900"
                            _hover={{ bg: 'accent.2' }}
                            leftIcon={<FiCheck />}
                            isLoading={busyId === s.id}
                            onClick={() => handleValiderStock(s.id)}
                          >
                            Valider
                          </Button>
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            variant="ghost"
                            color="text.3"
                            leftIcon={<FiXCircle />}
                            onClick={() => ignore('stocks', s.id)}
                          >
                            Ignorer
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Card
        bg="surface.1"
        borderColor={isFocused('mortalites') ? 'accent.1' : 'border.1'}
        borderWidth="1px"
        ref={mortalitesRef}
      >
        <CardBody p={4}>
          <Heading size="sm" color="text.1" mb={3}>
            Mortalités à valider
            {isFocused('mortalites') && (
              <Badge ml={2} bg="accent.1" color="gray.900" borderRadius="full" fontSize={responsiveText.xs} px={2} py={0.5}>
                Prioritaire
              </Badge>
            )}
          </Heading>
          {mortalites.length === 0 ? (
            <Text color="text.3" fontSize={{ base: "sm", md: "ms" }} textAlign="center" py={4}>Aucune mortalité en attente.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="text.3">Date</Th>
                    <Th color="text.3">Nombre</Th>
                    <Th color="text.3">Cause</Th>
                    <Th color="text.3">Cycle</Th>
                    <Th color="text.3">Enregistré par</Th>
                    <Th color="text.3">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mortalites.map((m) => (
                    <Tr
                      key={m.id}
                      bg={isFocused('mortalites') && isRowTargeted(m.cycle_id) ? 'accent.bg' : undefined}
                    >
                      <Td color="text.2">{formatDate(m.date)}</Td>
                      <Td color="text.2" fontWeight="medium">{m.nombre}</Td>
                      <Td color="text.3" maxW="250px">{m.cause || '—'}</Td>
                      <Td color="text.2">#{m.cycle?.numero_cycle ?? ''}</Td>
                      <Td color="text.3" fontSize="xs">{creatorLabel(m.creator)}</Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            bg="accent.1"
                            color="gray.900"
                            _hover={{ bg: 'accent.2' }}
                            leftIcon={<FiCheck />}
                            isLoading={busyId === m.id}
                            onClick={() => handleValiderMortalite(m.id)}
                          >
                            Valider
                          </Button>
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            variant="ghost"
                            color="text.3"
                            leftIcon={<FiXCircle />}
                            onClick={() => ignore('mortalites', m.id)}
                          >
                            Ignorer
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Card
        bg="surface.1"
        borderColor={isFocused('risques') ? 'accent.1' : 'border.1'}
        borderWidth="1px"
        ref={risquesRef}
      >
        <CardBody p={4}>
          <Heading size="sm" color="text.1" mb={3}>
            Risques signalés
            {isFocused('risques') && (
              <Badge ml={2} bg="accent.1" color="gray.900" borderRadius="full" fontSize={responsiveText.xs} px={2} py={0.5}>
                Prioritaire
              </Badge>
            )}
          </Heading>
          {risques.length === 0 ? (
            <Text color="text.3" fontSize={{ base: "sm", md: "ms" }} textAlign="center" py={4}>Aucun risque signalé.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="text.3">Catégorie</Th>
                    <Th color="text.3">Description</Th>
                    <Th color="text.3">Signalé le</Th>
                    <Th color="text.3">Enregistré par</Th>
                    <Th color="text.3">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {risques.map((r) => (
                    <Tr
                      key={r.id}
                      bg={isFocused('risques') ? 'accent.bg' : undefined}
                    >
                      <Td color="text.2">
                        <Badge bg="danger.1" color="white" fontSize={responsiveText.xs}>
                          {RISQUE_CATEGORIES[r.categorie] || r.categorie}
                        </Badge>
                      </Td>
                      <Td color="text.2" maxW="300px">{r.description}</Td>
                      <Td color="text.2">{formatDate(r.created_at)}</Td>
                      <Td color="text.3" fontSize="xs">{creatorLabel(r.creator)}</Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            bg="success.1"
                            color="white"
                            _hover={{ bg: 'success.2' }}
                            leftIcon={<FiCheckCircle />}
                            isLoading={busyId === r.id}
                            onClick={() => handleResoudreRisque(r)}
                          >
                            Résoudre
                          </Button>
                          <Button
                            size={{ base: "sm", md: "xs" }}
                            variant="ghost"
                            color="text.3"
                            leftIcon={<FiXCircle />}
                            onClick={() => ignore('risques', r.id)}
                          >
                            Ignorer
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={isEncaisserOpen}
        onClose={onEncaisserClose}
        onConfirm={handleEncaisser}
        title="Encaisser la vente"
        message={`Encaisser cette vente de ${encaisserTarget?.quantite} poulet(s) pour ${encaisserTarget?.client?.nom || 'client inconnu'} ? Le statut passera à « Payé » et la vente sera validée.`}
        confirmLabel="Encaisser"
      />
    </VStack>
  );
}
