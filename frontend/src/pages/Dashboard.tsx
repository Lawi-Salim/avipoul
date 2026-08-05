import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDownload } from '../contexts/DownloadContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Alert,
  AlertIcon,
  HStack,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import PageLoading from '../components/PageLoading';
import { FiArrowUpRight, FiArrowDownRight, FiCheck, FiAlertTriangle, FiAlertCircle, FiInfo, FiDownload, FiChevronDown, FiCheckCircle, FiCircle, FiArrowRight } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cyclesService, Cycle } from '../services/cycles.service';
import { exportService } from '../services/export.service';
import { santeService, Mortalite } from '../services/sante.service';
import { ventesService, Vente } from '../services/ventes.service';
import { depensesService, Depense } from '../services/depenses.service';
import { alertesService, Alerte } from '../services/alertes.service';
import { stocksService, Stock } from '../services/stocks.service';
import { vaccinationsService, Vaccination } from '../services/vaccinations.service';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';

const TREND_THRESHOLD = 0.05;
const ITEMS_PER_PAGE = 10;

function TrendArrow({ value, invert }: { value: number; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0;
  if (Math.abs(value) < TREND_THRESHOLD) return null;
  return (
    <HStack spacing={0} color={isPositive ? 'success.1' : 'danger.1'} fontSize="xs" fontWeight="bold">
      {isPositive ? <FiArrowUpRight /> : <FiArrowDownRight />}
      <Text>{Math.abs(value).toFixed(1)}%</Text>
    </HStack>
  );
}

function JournalItem({ done, label, path }: { done: boolean; label: string; path: string }) {
  const navigate = useNavigate();
  return (
    <HStack
      as="button"
      w="100%"
      justifyContent="space-between"
      px={3}
      py={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.1"
      bg="surface.2"
      _hover={{ bg: 'surface.3' }}
      onClick={() => navigate(path)}
      textAlign="left"
    >
      <HStack spacing={2}>
        <Box color={done ? 'success.1' : 'text.3'}>
          {done ? <FiCheckCircle /> : <FiCircle />}
        </Box>
        <Text fontSize={{ base: "sm", md: "ms" }} color={done ? 'text.1' : 'text.3'} fontWeight={done ? 'medium' : 'normal'}>
          {label}
        </Text>
      </HStack>
      <FiArrowRight color="text.3" />
    </HStack>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role !== 'employe';
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);

  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [mortalites, setMortalites] = useState<Mortalite[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [closedCycles, setClosedCycles] = useState<Cycle[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allCycles, alertesData] = await Promise.all([
        cyclesService.getAll(),
        alertesService.getNonResolues(),
      ]);
      setCycles(allCycles);
      setAlertes(alertesData);

      const enCoursCycles = allCycles.filter((c) => c.statut === 'en_cours');
      const enCours = enCoursCycles.length > 0 ? enCoursCycles[0] : undefined;
      const clotures = allCycles.filter((c) => c.statut === 'cloture');
      setClosedCycles(clotures);

      if (enCoursCycles.length > 0) {
        setCurrentCycle(enCours ?? null);
        const results = await Promise.all(
          enCoursCycles.map((cy) =>
            Promise.all([
              santeService.getByCycle(cy.id),
              ventesService.getByCycle(cy.id),
              depensesService.getByCycle(cy.id),
              stocksService.getByCycle(cy.id),
              vaccinationsService.getByCycle(cy.id),
            ])
          )
        );
        const [m, v, d, st, vac] = results.reduce(
          (acc, [m, v, d, st, vac]) => [
            [...acc[0], ...m],
            [...acc[1], ...v],
            [...acc[2], ...d],
            [...acc[3], ...st],
            [...acc[4], ...vac],
          ],
          [[], [], [], [], []] as [Mortalite[], Vente[], Depense[], Stock[], Vaccination[]]
        );
        setMortalites(m);
        setVentes(v);
        setDepenses(d);
        setStocks(st);
        setVaccinations(vac);
      }
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredClosedCycles = useMemo(() => {
    let result = period === 0 ? closedCycles : (() => {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - period);
      return closedCycles.filter((c) => new Date(c.date_reception) >= cutoff);
    })();
    result = [...result].sort((a, b) => Number(b.numero_cycle) - Number(a.numero_cycle));
    return result;
  }, [closedCycles, period]);

  const totalPages = Math.ceil(filteredClosedCycles.length / ITEMS_PER_PAGE);
  const paginatedClosedCycles = filteredClosedCycles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [period]);

  const totalMortalite = mortalites.reduce((sum, m) => sum + Number(m.nombre), 0);
  const effectifVivant = currentCycle
    ? currentCycle.effectif_initial - totalMortalite
    : 0;
  const tauxMortalite = currentCycle && currentCycle.effectif_initial > 0
    ? (totalMortalite / currentCycle.effectif_initial) * 100
    : 0;

  const totalVentesCycle = ventes
    .filter((v) => v.statut_paiement !== 'impaye')
    .reduce((sum, v) => sum + Number(v.quantite) * Number(v.prix_unitaire) - Number(v.remise || 0), 0);

  const totalDepensesCycle = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
  const tresorerie = totalVentesCycle - totalDepensesCycle;
  const margeEstimee = totalVentesCycle - (totalDepensesCycle + (currentCycle
    ? Number(currentCycle.cout_achat_poussins) * currentCycle.effectif_initial
    : 0));

  const chartData = useMemo(() => {
    return [...filteredClosedCycles].slice(0, 10).reverse().map((c) => ({
      name: `C#${c.numero_cycle}`,
      marge: c.bilan_marge ?? 0,
      recettes: c.bilan_recettes ?? 0,
      couts: c.bilan_cout_total ?? 0,
    }));
  }, [filteredClosedCycles]);

  const prevMarge = filteredClosedCycles.length >= 2
    ? filteredClosedCycles[1]?.bilan_marge ?? 0
    : 0;
  const currMarge = filteredClosedCycles.length >= 1
    ? filteredClosedCycles[0]?.bilan_marge ?? 0
    : 0;
  const margeTrend = prevMarge !== 0 ? ((currMarge - prevMarge) / Math.abs(prevMarge)) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);
  const journal = {
    mortalite: mortalites.some((m) => m.date === today),
    vaccination: (() => {
      const dues = vaccinations.filter((x) => x.date_prevue === today);
      return dues.length === 0 || dues.every((x) => x.date_realisee);
    })(),
    stock: stocks.some((s) => s.date === today),
    vente: ventes.some((v) => v.date === today),
  };

  const handleResolveAlerte = async (id: string) => {
    try {
      await alertesService.markAsResolue(id);
      setAlertes((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  };

  const { startDownload } = useDownload();

  const handleExportCyclesCsv = async () => {
    setExporting(true);
    try {
      await startDownload({
        fileName: 'cycles-export.csv',
        fetch: (onProgress) =>
          exportService.exportCycles(period > 0 ? period : undefined, onProgress).then((r) =>
            new Blob([r.data], { type: 'text/csv;charset=utf-8' })
          ),
      });
    } catch {
      setError('Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
    }
  };

  const getAlerteIcon = (niveau: string) => {
    switch (niveau) {
      case 'critical': return <FiAlertCircle />;
      case 'warning': return <FiAlertTriangle />;
      default: return <FiInfo />;
    }
  };

  const getAlerteColor = (niveau: string) => {
    switch (niveau) {
      case 'critical': return 'danger.1';
      case 'warning': return 'orange.400';
      default: return 'blue.400';
    }
  };

  const getAlerteBg = (niveau: string) => {
    switch (niveau) {
      case 'critical': return 'rgba(229,62,62,0.12)';
      case 'warning': return 'rgba(237,137,54,0.12)';
      default: return 'rgba(66,153,225,0.12)';
    }
  };

  if (loading) {
    return <PageLoading fillHeight />;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="text.1">Vue d'ensemble</Heading>

      {user?.role === 'employe' && (
        <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
          <CardBody py={4} px={5}>
            <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
              <Heading size="md" color="text.1">Mon journal</Heading>
              <Badge bg="accent.1" color="gray.900" px={2} py={1} borderRadius="full" textTransform="capitalize">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Badge>
            </HStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
              <JournalItem done={journal.mortalite} label="Mortalité du jour saisie" path="/sante" />
              <JournalItem done={journal.vaccination} label="Vaccination réalisée" path="/sante" />
              <JournalItem done={journal.stock} label="Stock mis à jour" path="/stocks" />
              <JournalItem done={journal.vente} label="Ventes encaissées" path="/ventes" />
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {alertes.length > 0 && (
        <Box>
          <HStack justify="space-between" mb={3}>
            <Heading size="md" color="text.1">Alertes actives</Heading>
            <Badge bg="danger.1" color="white" borderRadius="full" px={2}>
              {alertes.length}
            </Badge>
          </HStack>
          <VStack spacing={2} align="stretch">
            {alertes.map((alerte) => (
              <Card
                key={alerte.id}
                bg={getAlerteBg(alerte.niveau)}
                borderColor={getAlerteColor(alerte.niveau)}
                borderWidth="1px"
                size="sm"
              >
                <CardBody py={2} px={3}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2} flex={1}>
                      <Box color={getAlerteColor(alerte.niveau)}>
                        {getAlerteIcon(alerte.niveau)}
                      </Box>
                      <Text fontSize="sm" color="text.1" flex={1}>{alerte.message}</Text>
                      <Badge fontSize="xs" colorScheme={alerte.niveau === 'critical' ? 'red' : alerte.niveau === 'warning' ? 'orange' : 'blue'}>
                        {alerte.type_alerte === 'stock_bas' ? 'Stock' : alerte.type_alerte === 'mortalite_anormale' ? 'Mortalité' : alerte.type_alerte === 'peremption_produit' ? 'Péremption' : 'Risque'}
                      </Badge>
                    </HStack>
                    <HStack spacing={1}>
                      {alerte.type_alerte === 'risque' && (
                        <Button
                          size="xs"
                          variant="ghost"
                          color="accent.1"
                          onClick={() => navigate('/risques')}
                        >
                          Voir risques
                        </Button>
                      )}
                      {canManage && (
                        <IconButton
                          aria-label="Marquer comme résolue"
                          icon={<FiCheck />}
                          size="xs"
                          variant="ghost"
                          color="success.1"
                          onClick={() => handleResolveAlerte(alerte.id)}
                        />
                      )}
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>
      )}

      <Box>
        <Heading size="md" color="text.1" mb={4}>Cycle en cours</Heading>
        {currentCycle ? (
          <>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize={{ base: "ms", md: "xs" }} color="text.3">Effectif vivant</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="text.1">
                    {effectifVivant}
                  </Text>
                  <Text fontSize={{ base: "sm", md: "xs" }} color="text.3">
                    sur {currentCycle.effectif_initial} initial
                  </Text>
                </CardBody>
              </Card>
              <Card bg="surface.1" borderColor={tauxMortalite > 5 ? 'danger.1' : 'border.1'} borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize={{ base: "ms", md: "xs" }} color="text.3">Mortalité cumulée</Text>
                  <HStack align="baseline" spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold" color={tauxMortalite > 5 ? 'danger.1' : 'text.1'}>
                      {totalMortalite}
                    </Text>
                  </HStack>
                  <Text fontSize={{ base: "sm", md: "xs" }} color={tauxMortalite > 5 ? 'danger.1' : 'text.3'}>
                    {tauxMortalite.toFixed(1)}%
                  </Text>
                </CardBody>
              </Card>
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize={{ base: "ms", md: "xs" }} color="text.3">Trésorerie</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={tresorerie >= 0 ? 'success.1' : 'danger.1'}>
                    {tresorerie >= 0 ? '+' : ''}{Math.round(tresorerie).toLocaleString('fr-FR')} KMF
                  </Text>
                  <Text fontSize={{ base: "sm", md: "xs" }} color="text.3">
                    Ventes: {Math.round(totalVentesCycle).toLocaleString('fr-FR')} | Dépenses: {Math.round(totalDepensesCycle).toLocaleString('fr-FR')}
                  </Text>
                </CardBody>
              </Card>
              <Card bg="surface.1" borderColor={margeEstimee >= 0 ? 'border.1' : 'danger.1'} borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize={{ base: "ms", md: "xs" }} color="text.3">Marge estimée</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={margeEstimee >= 0 ? 'success.1' : 'danger.1'}>
                    {margeEstimee >= 0 ? '+' : ''}{Math.round(margeEstimee).toLocaleString('fr-FR')} KMF
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </>
        ) : (
          <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
            <CardBody>
              <Text color="text.3" textAlign="center" fontSize="sm" py={4}>Aucun cycle en cours.</Text>
            </CardBody>
          </Card>
        )}
      </Box>

      <Box>
        <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
          <HStack spacing={3} align="baseline">
            <Heading size="md" color="text.1">Comparatif des cycles clôturés</Heading>
            <TrendArrow value={margeTrend} />
          </HStack>
          <HStack spacing="2">
            <Menu>
              <MenuButton
                as={Button}
                w={{ base: "100%", md: "auto" }}
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
                {period === 3 ? '3 derniers mois' : period === 6 ? '6 derniers mois' : period === 12 ? '12 derniers mois' : 'Tout afficher'}
              </MenuButton>
              <MenuList bg="surface.1" borderColor="border.1">
                <MenuItem onClick={() => setPeriod(3)} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                  3 derniers mois
                </MenuItem>
                <MenuItem onClick={() => setPeriod(6)} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                  6 derniers mois
                </MenuItem>
                <MenuItem onClick={() => setPeriod(12)} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                  12 derniers mois
                </MenuItem>
                <MenuItem onClick={() => setPeriod(0)} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
                  Tout afficher
                </MenuItem>
              </MenuList>
            </Menu>
            <Button
              size="sm"
              variant="outline"
              borderColor="border.1"
              color="text.2"
              bg="surface.1"
              leftIcon={<FiDownload />}
              onClick={handleExportCyclesCsv}
              isLoading={exporting}
              loadingText="Export..."
              fontSize="sm"
              borderRadius="md"
              flexShrink={0}
            >
              Exporter CSV
            </Button>
          </HStack>
        </HStack>

        {chartData.length > 0 && (
          <Card bg="surface.1" borderColor="border.1" borderWidth="1px" mb={4}>
            <CardBody py={4}>
              <Text fontSize="sm" fontWeight="medium" color="text.2" mb={3}>Évolution des marges</Text>
              <Box h="250px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} KMF`]}
                      contentStyle={{ backgroundColor: '#a5a7ab', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    />
                    <Bar dataKey="marge" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.marge >= 0 ? '#38A169' : '#E53E3E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        )}

        {filteredClosedCycles.length === 0 ? (
          <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
            <CardBody>
              <Text color="text.3" fontSize="sm" textAlign="center" py={4}>Aucun cycle clôturé sur cette période.</Text>
            </CardBody>
          </Card>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th color="text.3" minW={{ base: "100px", md: "auto" }}>Cycle</Th>
                  <Th color="text.3">Date réception</Th>
                  <Th color="text.3">Effectif initial</Th>
                  <Th color="text.3" minW={{ base: "135px", md: "auto" }}>Coût total</Th>
                  <Th color="text.3" minW={{ base: "135px", md: "auto" }}>Recettes</Th>
                  <Th color="text.3" minW={{ base: "150px", md: "auto" }}>Marge</Th>
                  <Th color="text.3">Taux mortalité</Th>
                  <Th color="text.3">Détails</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedClosedCycles.map((c) => {
                  const mortalitePct = c.effectif_initial > 0 && c.bilan_mortalite_cumulee != null
                    ? ((c.bilan_mortalite_cumulee / c.effectif_initial) * 100)
                    : 0;
                  return (
                    <Tr key={c.id}>
                      <Td color="text.2" fontWeight="medium">Cycle #{c.numero_cycle}</Td>
                      <Td color="text.2">{new Date(c.date_reception).toLocaleDateString('fr-FR')}</Td>
                      <Td color="text.2">{c.effectif_initial}</Td>
                      <Td color="text.2">{(Number(c.bilan_cout_total) ?? 0).toLocaleString('fr-FR')} KMF</Td>
                      <Td color="text.2">{(Number(c.bilan_recettes) ?? 0).toLocaleString('fr-FR')} KMF</Td>
                      <Td>
                        <Text
                          fontWeight="bold"
                          color={(c.bilan_marge ?? 0) >= 0 ? 'success.1' : 'danger.1'}
                          fontSize="sm"
                        >
                          {(c.bilan_marge ?? 0) >= 0 ? '+' : ''}{(Number(c.bilan_marge) ?? 0).toLocaleString('fr-FR')} KMF
                        </Text>
                      </Td>
                      <Td>
                        <Text
                          color={mortalitePct > 5 ? 'danger.1' : 'text.2'}
                          fontSize="sm"
                        >
                          {mortalitePct.toFixed(1)}%
                        </Text>
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          variant="ghost"
                          color="accent.1"
                          onClick={() => navigate(`/cycles/${c.id}`)}
                        >
                          Voir détails
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
        {filteredClosedCycles.length > 0 && (
          <Box mt={4}>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </Box>
        )}
      </Box>
    </VStack>
  );
}
