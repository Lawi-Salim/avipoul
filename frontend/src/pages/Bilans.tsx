import { useEffect, useState, useCallback } from 'react';
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
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { depensesService, Depense } from '../services/depenses.service';
import { ventesService, Vente } from '../services/ventes.service';
import { santeService, Mortalite } from '../services/sante.service';

const CATEGORIE_LABELS: Record<string, string> = {
  poussins: 'Poussins',
  aliments: 'Aliments',
  veterinaire: 'Vétérinaire',
  infrastructure: 'Infrastructure',
  imprevu: 'Imprévu',
};

interface FinancesData {
  cycle_id: string;
  cout_total: number;
  total_ventes: number;
  marge: number;
  cout_revient_par_poulet: number;
  seuil_rentabilite: number;
  effectif_vivant: number;
}

export default function Bilans() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedCycleData, setSelectedCycleData] = useState<Cycle | null>(null);
  const [finances, setFinances] = useState<FinancesData | null>(null);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [mortalites, setMortalites] = useState<Mortalite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const loadData = useCallback(async () => {
    if (!selectedCycle) return;
    try {
      const [f, d, v, m] = await Promise.all([
        cyclesService.getFinances(selectedCycle),
        depensesService.getByCycle(selectedCycle),
        ventesService.getByCycle(selectedCycle),
        santeService.getByCycle(selectedCycle),
      ]);
      setFinances(f);
      setDepenses(d);
      setVentes(v);
      setMortalites(m);
    } catch {
      setError('Erreur lors du chargement des données');
    }
  }, [selectedCycle]);

  useEffect(() => { loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const depensesByCategorie = depenses.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + Number(d.montant);
    return acc;
  }, {} as Record<string, number>);

  const totalMortalite = mortalites.reduce((sum, m) => sum + Number(m.nombre), 0);
  const tauxMortalite = (selectedCycleData?.effectif_initial || 0) > 0
    ? ((totalMortalite / (selectedCycleData?.effectif_initial || 1)) * 100).toFixed(1)
    : '0';

  if (loading) {
    return <Center py={20}><Spinner size="xl" color="accent.1" /></Center>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="text.1">Bilans</Heading>

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
        <Text mb={1} fontSize="sm" color="text.2">Sélectionner un cycle</Text>
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
              ? `Cycle #${cycles.find(c => c.id === selectedCycle)?.numero_cycle} — ${new Date(cycles.find(c => c.id === selectedCycle)?.date_reception || '').toLocaleDateString('fr-FR')} (${cycles.find(c => c.id === selectedCycle)?.statut === 'cloture' ? 'Clôturé' : 'En cours'})`
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
                Cycle #{c.numero_cycle} — {new Date(c.date_reception).toLocaleDateString('fr-FR')} ({c.statut === 'cloture' ? 'Clôturé' : 'En cours'})
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>

      {selectedCycleData && (
        <>
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Badge colorScheme={selectedCycleData.statut === 'cloture' ? 'green' : 'orange'} fontSize="sm" px={3} py={1}>
              {selectedCycleData.statut === 'cloture' ? 'Clôturé' : 'En cours'}
            </Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
              <CardBody py={3} px={4}>
                <Text fontSize="xs" color="text.3">Coût total</Text>
                <Text fontSize="xl" fontWeight="bold" color="danger.1">
                  {Number(finances?.cout_total || 0).toLocaleString('fr-FR')} KMF
                </Text>
              </CardBody>
            </Card>
            <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
              <CardBody py={3} px={4}>
                <Text fontSize="xs" color="text.3">Recettes</Text>
                <Text fontSize="xl" fontWeight="bold" color="success.1">
                  {Number(finances?.total_ventes || 0).toLocaleString('fr-FR')} KMF
                </Text>
              </CardBody>
            </Card>
            <Card bg="surface.1" borderColor={(finances?.marge || 0) >= 0 ? 'border.1' : 'danger.1'} borderWidth="1px">
              <CardBody py={3} px={4}>
                <Text fontSize="xs" color="text.3">Marge</Text>
                <Text fontSize="xl" fontWeight="bold" color={(finances?.marge || 0) >= 0 ? 'success.1' : 'danger.1'}>
                  {Number(finances?.marge || 0).toLocaleString('fr-FR')} KMF
                </Text>
              </CardBody>
            </Card>
            <Card bg="surface.1" borderColor={Number(tauxMortalite) > 5 ? 'danger.1' : 'border.1'} borderWidth="1px">
              <CardBody py={3} px={4}>
                <Text fontSize="xs" color="text.3">Mortalité</Text>
                <Text fontSize="xl" fontWeight="bold" color={Number(tauxMortalite) > 5 ? 'danger.1' : 'text.1'}>
                  {tauxMortalite}%
                </Text>
                <Text fontSize="xs" color="text.3">{totalMortalite} morts</Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {finances && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize="xs" color="text.3">Coût de revient par poulet</Text>
                  <Text fontSize="lg" fontWeight="bold" color="text.1">
                    {Number(finances.cout_revient_par_poulet || 0).toLocaleString('fr-FR')} KMF
                  </Text>
                </CardBody>
              </Card>
              <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
                <CardBody py={3} px={4}>
                  <Text fontSize="xs" color="text.3">Seuil de rentabilité</Text>
                  <Text fontSize="lg" fontWeight="bold" color="text.1">
                    {Number(finances.seuil_rentabilite || 0).toLocaleString('fr-FR')} poulets
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          <Heading size="md" color="text.1">Détail des coûts par catégorie</Heading>
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th color="text.3">Catégorie</Th>
                  <Th color="text.3">Montant</Th>
                  <Th color="text.3">%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(depensesByCategorie).map(([cat, montant]) => {
                  const total = Number(finances?.cout_total || 1);
                  const pct = ((montant / total) * 100).toFixed(1);
                  return (
                    <Tr key={cat}>
                      <Td color="text.2">{CATEGORIE_LABELS[cat] || cat}</Td>
                      <Td color="text.2">{montant.toLocaleString('fr-FR')} KMF</Td>
                      <Td color="text.3">{pct}%</Td>
                    </Tr>
                  );
                })}
                {Object.keys(depensesByCategorie).length === 0 && (
                  <Tr><Td color="text.3" fontSize="sm" colSpan={3} textAlign="center">Aucune dépense enregistrée</Td></Tr>
                )}
              </Tbody>
            </Table>
          </Box>

          <Heading size="md" color="text.1">Détail des ventes</Heading>
          {ventes.length === 0 ? (
            <Text color="text.3" fontSize="sm" textAlign="center" py={4}>Aucune vente enregistrée.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="text.3">Date</Th>
                    <Th color="text.3">Quantité</Th>
                    <Th color="text.3">Prix unitaire</Th>
                    <Th color="text.3">Montant total</Th>
                    <Th color="text.3">Statut</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {ventes.map((v) => (
                    <Tr key={v.id}>
                      <Td color="text.2">{new Date(v.date).toLocaleDateString('fr-FR')}</Td>
                      <Td color="text.2">{v.quantite}</Td>
                      <Td color="text.2">{Number(v.prix_unitaire).toLocaleString('fr-FR')} KMF</Td>
                      <Td color="text.2" fontWeight="bold">{(Number(v.quantite) * Number(v.prix_unitaire) - Number(v.remise || 0)).toLocaleString('fr-FR')} KMF</Td>
                      <Td>
                        <Badge fontSize="xs" colorScheme={v.statut_paiement === 'paye' ? 'green' : v.statut_paiement === 'partiel' ? 'orange' : 'red'}>
                          {v.statut_paiement === 'paye' ? 'Payé' : v.statut_paiement === 'partiel' ? 'Partiel' : 'Impayé'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}
    </VStack>
  );
}
