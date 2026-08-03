import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiLock,
} from 'react-icons/fi';
import { cyclesService, VerificationCloture } from '../services/cycles.service';
import { useAuth } from '../contexts/AuthContext';
import { responsiveText } from '../theme/designTokens';

function CheckRow({
  label,
  sublabel,
  ok,
  linkLabel,
  linkPath,
  linkState,
  onLink,
}: {
  label: string;
  sublabel: string;
  ok: boolean;
  linkLabel?: string;
  linkPath?: string;
  linkState?: unknown;
  onLink?: (path: string, state?: unknown) => void;
}) {
  return (
    <HStack spacing={3} align="flex-start" w="full">
      <Icon
        as={ok ? FiCheckCircle : FiAlertTriangle}
        color={ok ? 'success.1' : 'danger.1'}
        boxSize={4}
        mt={0.5}
        flexShrink={0}
      />
      <VStack align="stretch" spacing={0} flex="1">
        <Text fontSize={responsiveText.sm} color="text.1" fontWeight="bold">{label}</Text>
        <Text fontSize={responsiveText.sm} color={ok ? 'text.3' : 'danger.1'}>{sublabel}</Text>
      </VStack>
      {!ok && linkLabel && linkPath && onLink && (
        <Button
          size="xs"
          variant="ghost"
          color="accent.1"
          rightIcon={<FiArrowRight />}
          onClick={() => onLink(linkPath, linkState)}
          flexShrink={0}
        >
          {linkLabel}
        </Button>
      )}
    </HStack>
  );
}

export default function Cloture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<VerificationCloture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cloturing, setCloturing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const s = await cyclesService.verificationCloture(id);
      setSummary(s);
    } catch {
      setError('Erreur lors du chargement du résumé du cycle');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCloture = async () => {
    if (!id) return;
    setCloturing(true);
    setError('');
    try {
      await cyclesService.cloture(id);
      navigate('/bilans');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erreur lors de la clôture du cycle');
    } finally {
      setCloturing(false);
    }
  };

  const goTo = (path: string, state?: unknown) => navigate(path, { state });

  if (loading) {
    return <Center py={20}><Spinner size="xl" color="accent.1" /></Center>;
  }

  if (user?.role !== 'admin') {
    return (
      <VStack spacing={4} align="center" py={16}>
        <Icon as={FiLock} color="danger.1" boxSize={10} />
        <Text color="text.2" fontSize={responsiveText.sm}>
          Cette action est réservée à l'administrateur.
        </Text>
        <Button size="sm" variant="ghost" color="text.2" onClick={() => goTo('/bilans')}>
          Retour aux bilans
        </Button>
      </VStack>
    );
  }

  if (!summary) {
    return (
      <VStack spacing={4} align="center" py={16}>
        <Text color="text.2" fontSize={responsiveText.sm}>Cycle introuvable.</Text>
        <Button size="sm" variant="ghost" color="text.2" onClick={() => goTo('/bilans')}>
          Retour aux bilans
        </Button>
      </VStack>
    );
  }

  const v = summary.ventes;
  const s = summary.sorties_stock;
  const m = summary.mortalites;
  const f = summary.finances;

  const ventesOk = v.non_validees === 0 && v.impayees === 0;
  const sortiesOk = s.non_validees === 0;
  const mortalitesOk = m.non_validees === 0;

  const ventesSub = ventesOk
    ? `${v.validees}/${v.total} ventes validées`
    : [
        v.non_validees > 0 ? `${v.non_validees} non validée(s)` : '',
        v.impayees > 0 ? `${v.impayees} impayée(s)` : '',
      ]
        .filter(Boolean)
        .join(' · ');

  const sortiesSub = sortiesOk
    ? `${s.validees}/${s.total} sorties de stock validées`
    : `${s.non_validees} sortie(s) non validée(s)`;

  const mortalitesSub = mortalitesOk
    ? `${m.validees}/${m.total} enregistrements validés`
    : `${m.non_validees} enregistrement(s) non validé(s)`;

  return (
    <VStack spacing={5} align="stretch" maxW={{ base: '100%', md: '900px' }} mx="auto" px={{ base: 4, md: 0 }}>
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <HStack>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            color="text.2"
            onClick={() => goTo(`/cycles/${summary.cycle_id}`)}
            pl={0}
            h={8}
          >
            Retour
          </Button>
          <Heading size={{ base: 'md', md: 'lg' }} color="text.1">
            Clôture du cycle #{summary.numero_cycle}
          </Heading>
        </HStack>
        <Badge colorScheme={summary.statut === 'cloture' ? 'green' : 'orange'} fontSize={responsiveText.xs} px={3} py={1}>
          {summary.statut === 'cloture' ? 'Clôturé' : 'En cours'}
        </Badge>
      </HStack>

      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {summary.statut === 'cloture' && (
        <Alert bg="success.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          Ce cycle est déjà clôturé. Consultez son bilan dans la page Bilans.
        </Alert>
      )}

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        {[
          { label: 'Effectif initial', value: summary.effectif.initial.toString(), color: 'text.1' },
          {
            label: 'Mortalité',
            value: `${summary.effectif.morts} morts (${summary.effectif.taux_mortalite_pct}%)`,
            color: summary.effectif.taux_mortalite_pct > 5 ? 'danger.1' : 'text.1',
          },
          { label: 'Effectif vivant', value: summary.effectif.vivant.toString(), color: 'text.1' },
          { label: 'Coût total', value: `${Number(f.cout_total).toLocaleString('fr-FR')} KMF`, color: 'danger.1' },
          { label: 'Recettes', value: `${Number(f.total_ventes).toLocaleString('fr-FR')} KMF`, color: 'success.1' },
          { label: 'Marge', value: `${Number(f.marge).toLocaleString('fr-FR')} KMF`, color: Number(f.marge) >= 0 ? 'success.1' : 'danger.1' },
          { label: 'Coût revient / poulet', value: `${Number(f.cout_revient_par_poulet).toLocaleString('fr-FR')} KMF`, color: 'text.1' },
          { label: 'Seuil de rentabilité', value: `${Number(f.seuil_rentabilite).toLocaleString('fr-FR')} poulets`, color: 'text.1' },
        ].map(({ label, value, color }) => (
          <Card key={label} bg="surface.1" borderColor="border.1" borderWidth="1px">
            <CardBody py={3} px={4}>
              <Text fontSize={responsiveText.xs} color="text.3">{label}</Text>
              <Text fontSize={responsiveText.lg} fontWeight="bold" color={color}>{value}</Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="sm" color="text.1" mb={3}>
            Ce qui est fait / ce qui manque
          </Heading>
          <VStack spacing={4} align="stretch">
            <CheckRow
              label="Ventes"
              sublabel={ventesSub}
              ok={ventesOk}
              linkLabel="Régler"
              linkPath="/a-valider"
              linkState={{ focus: 'ventes', cycleId: summary.cycle_id }}
              onLink={goTo}
            />
            <CheckRow
              label="Sorties de stock"
              sublabel={sortiesSub}
              ok={sortiesOk}
              linkLabel="Régler"
              linkPath="/a-valider"
              linkState={{ focus: 'stocks', cycleId: summary.cycle_id }}
              onLink={goTo}
            />
            <CheckRow
              label="Mortalités"
              sublabel={mortalitesSub}
              ok={mortalitesOk}
              linkLabel="Régler"
              linkPath="/a-valider"
              linkState={{ focus: 'mortalites', cycleId: summary.cycle_id }}
              onLink={goTo}
            />
          </VStack>
        </CardBody>
      </Card>

      {summary.recommandations.length > 0 && summary.statut === 'en_cours' && (
        <Card bg="surface.1" borderColor="warning.1" borderWidth="1px">
          <CardBody>
            <Heading size="sm" color="text.1" mb={2}>
              Idéal avant clôture
            </Heading>
            <Text fontSize={responsiveText.sm} color="text.2" mb={3}>
              Non bloquant, mais idéalement tout doit être à zéro avant de clôturer et de démarrer le cycle suivant.
            </Text>
            <VStack spacing={2} align="stretch">
              {summary.recommandations.map((r) => (
                <HStack key={r.code} spacing={3}>
                  <Icon as={FiAlertTriangle} color="warning.1" boxSize={5} flexShrink={0} />
                  <Text fontSize={responsiveText.sm} color="text.1">
                    {r.count} {r.label}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {summary.cloturable && summary.statut === 'en_cours' ? (
        <Alert bg="success.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          Tout est en ordre — ce cycle peut être clôturé.
        </Alert>
      ) : summary.statut === 'en_cours' ? (
        <Alert
          bg="danger.1"
          color="white"
          borderRadius="md"
          size="sm"
          alignItems="flex-start"
        >
          <AlertIcon />
          <Box flex="1">
            <Text fontSize={responsiveText.sm} fontWeight="bold">Clôture impossible</Text>
            {summary.en_attente.map((item) => (
              <Text key={item.code} fontSize={responsiveText.sm}>
                • {item.count} {item.label}
              </Text>
            ))}
          </Box>
        </Alert>
      ) : null}

      {summary.statut === 'en_cours' && (
        <HStack justify="flex-end">
          {summary.cloturable ? (
            <Button
              size="sm"
              bg="danger.1"
              color="white"
              _hover={{ opacity: 0.8 }}
              onClick={handleCloture}
              isLoading={cloturing}
              fontWeight="bold"
            >
              Clôturer le cycle
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              color="accent.1"
              rightIcon={<FiArrowRight />}
              onClick={() => goTo('/a-valider', { focus: 'all', cycleId: summary.cycle_id })}
            >
              Voir les validations
            </Button>
          )}
        </HStack>
      )}
    </VStack>
  );
}
