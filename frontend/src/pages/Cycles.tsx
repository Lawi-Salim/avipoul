import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiChevronDown } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../utils/Avatars';
import { responsiveText } from '../theme/designTokens';

const PHASE_LABELS: Record<string, string> = {
  preparation: 'Préparation',
  demarrage: 'Démarrage',
  croissance: 'Croissance',
  finition: 'Finition',
  commercialisation: 'Commercialisation',
  nettoyage: 'Nettoyage',
};

const STATUT_COLORS: Record<string, string> = {
  en_cours: 'success.1',
  cloture: 'text.3',
};

export default function Cycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('tous');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    cyclesService.getAll()
      .then(setCycles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'tous' ? cycles : cycles.filter((c) => c.statut === filter);

  if (loading) {
    return <Center><Spinner size="xl" color="accent.1" /></Center>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Cycles</Heading>
        {user?.role !== 'employe' && (
          <Button
            leftIcon={<FiPlus />}
            bg="accent.1"
            color="gray.900"
            _hover={{ bg: 'accent.2' }}
            fontWeight="bold"
            onClick={() => navigate('/cycles/nouveau')}
            fontSize={responsiveText.sm}
            size={{ base: "sm", md: "sm" }}
          >
            Nouveau cycle
          </Button>
        )}
      </HStack>

      <HStack>
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
            {filter === 'tous' ? 'Tous' : filter === 'en_cours' ? 'En cours' : 'Clôturé'}
          </MenuButton>
          <MenuList bg="surface.1" borderColor="border.1">
            <MenuItem onClick={() => setFilter('tous')} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
              Tous
            </MenuItem>
            <MenuItem onClick={() => setFilter('en_cours')} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
              En cours
            </MenuItem>
            <MenuItem onClick={() => setFilter('cloture')} bg="surface.1" _hover={{ bg: 'surface.2' }} color="text.1" fontSize={{ base: "md", md: "sm" }}>
              Clôturé
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {filtered.length === 0 ? (
        <Text color="text.3" textAlign="center" fontSize="sm" py={10}>Aucun cycle trouvé.</Text>
      ) : (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
          {filtered.map((cycle) => (
            <Card
              key={cycle.id}
              bg="surface.1"
              borderColor="border.1"
              borderWidth="1px"
              cursor="pointer"
              _hover={{ borderColor: 'accent.1', transform: 'translateY(-2px)' }}
              transition="all 0.15s"
              onClick={() => navigate(`/cycles/${cycle.id}`)}
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="text.1" fontSize={responsiveText.md}>
                      {cycle.numero_cycle}
                    </Text>
                    <Badge
                      bg={cycle.statut === 'en_cours' ? 'success.1' : 'surface.3'}
                      color={cycle.statut === 'en_cours' ? 'white' : 'text.2'}
                      borderRadius="full"
                      px={2}
                    >
                      {cycle.statut === 'en_cours' ? 'En cours' : 'Clôturé'}
                    </Badge>
                  </HStack>

                  <HStack spacing={3}>
                    {cycle.cree_par && (
                      <UserAvatar name={cycle.cree_par.nom} size={24} src={cycle.cree_par.photo ?? null} />
                    )}
                    <VStack align="start" spacing={0}>
                      <Text fontSize={responsiveText.xs} color="text.3">
                        {new Date(cycle.date_reception).toLocaleDateString('fr-FR')}
                      </Text>
                      <Text fontSize={responsiveText.xs} color="text.3">
                        Effectif: {cycle.effectif_initial}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize={responsiveText.sm} color="accent.1">
                      {PHASE_LABELS[cycle.phase_courante] || cycle.phase_courante}
                    </Text>
                    {cycle.taux_mortalite_pct !== undefined && (
                      <Text fontSize={responsiveText.xs} color={cycle.taux_mortalite_pct > 5 ? 'danger.1' : 'text.3'}>
                        Mortalité: {cycle.taux_mortalite_pct.toFixed(1)}%
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <Box display="flex" justifyContent="center" py={20}>{children}</Box>;
}
