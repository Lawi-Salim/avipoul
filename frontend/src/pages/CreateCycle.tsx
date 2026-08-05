import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  AlertIcon,
  HStack,
} from '@chakra-ui/react';
import PageLoading from '../components/PageLoading';
import { FiArrowLeft } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { responsiveText } from '../theme/designTokens';

export default function CreateCycle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [enCoursCycle, setEnCoursCycle] = useState<Cycle | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    numero_cycle: '',
    date_reception: new Date().toISOString().slice(0, 10),
    effectif_initial: 0,
    cout_achat_poussins: 0,
  });

  useEffect(() => {
    cyclesService
      .getAll()
      .then((c) => setEnCoursCycle(c.find((cy) => cy.statut === 'en_cours') || null))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await cyclesService.create(form);
      navigate('/cycles');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <PageLoading fillHeight />;
  }

  return (
    <VStack spacing={2} align="stretch" maxW={{ base: "100%", md: "600px" }} mx="auto" px={{ base: 4, md: 0 }}>
      <HStack>
        <Button
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          color="text.2"
          onClick={() => navigate('/cycles')}
          pl={0}
          h={8}
        >
          Retour
        </Button>
      </HStack>

      <Heading size={{ base: "sm", md: "lg" }} color="text.1">Nouveau cycle</Heading>

      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {enCoursCycle && (
        <Alert
          bg="orange.400"
          color="white"
          borderRadius="md"
          size="sm"
          alignItems="flex-start"
        >
          <AlertIcon />
          <Box flex="1">
            <Text fontSize="sm" fontWeight="bold">
              Un cycle est déjà en cours (#{enCoursCycle.numero_cycle})
            </Text>
            <Text fontSize="sm">
              Clôturez-le avant de créer un nouveau cycle.
            </Text>
            <Button
              size="xs"
              mt={2}
              bg="white"
              color="orange.600"
              fontWeight="bold"
              onClick={() => navigate('/bilans')}
            >
              Clôturer le cycle en cours
            </Button>
          </Box>
        </Alert>
      )}

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <VStack as="form" onSubmit={handleSubmit} spacing={{ base: 4, md: 5 }}>
            <Box w="full">
              <Text mb={1} fontSize={responsiveText.sm} color="text.2">Numéro de cycle</Text>
              <Input
                value={form.numero_cycle}
                onChange={(e) => setForm({ ...form, numero_cycle: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                placeholder="Ex: CYC-2026-001"
                required
                h={{ base: 8, md: 8 }}
                fontSize={responsiveText.sm}
              />
            </Box>

            <Box w="full">
              <Text mb={1} fontSize={responsiveText.sm} color="text.2">Date de réception</Text>
              <Input
                type="date"
                value={form.date_reception}
                onChange={(e) => setForm({ ...form, date_reception: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                required
                h={{ base: 8, md: 8 }}
                fontSize={responsiveText.sm}
              />
            </Box>

            <Box w="full">
              <Text mb={1} fontSize={responsiveText.sm} color="text.2">Effectif initial</Text>
              <Input
                type="number"
                value={form.effectif_initial || ''}
                onChange={(e) => setForm({ ...form, effectif_initial: Number(e.target.value) })}
                bg="surface.2"
                borderColor="border.1"
                _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                placeholder="Nombre de poussins"
                min={0}
                required
                h={{ base: 8, md: 8 }}
                fontSize={responsiveText.sm}
              />
            </Box>

            <Box w="full">
              <Text mb={1} fontSize={responsiveText.sm} color="text.2">Coût unitaire poussin (KMF)</Text>
              <Input
                type="number"
                value={form.cout_achat_poussins || ''}
                onChange={(e) => setForm({ ...form, cout_achat_poussins: Number(e.target.value) })}
                bg="surface.2"
                borderColor="border.1"
                _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                placeholder="Coût par poussin"
                min={0}
                required
                h={{ base: 8, md: 8 }}
                fontSize={responsiveText.sm}
              />
            </Box>

            <Button
              type="submit"
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              w="full"
              isLoading={loading}
              isDisabled={enCoursCycle !== null}
              fontWeight="bold"
              size={{ base: "sm", md: "sm" }}
            >
              {enCoursCycle ? 'Clôturez d\'abord le cycle en cours' : 'Créer le cycle'}
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
