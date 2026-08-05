import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  HStack,
  Box,
  Divider,
  Kbd,
  useMediaQuery,
} from '@chakra-ui/react';
import PageLoading from '../PageLoading';
import {
  FiSearch,
  FiUsers,
  FiGrid,
  FiPackage,
  FiUser,
  FiInbox,
  FiArrowRight,
  FiShoppingCart,
  FiArrowDownCircle,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuth } from '../../contexts/AuthContext';
import PoultryBackground from '../PoultryBackground';
import {
  rechercheService,
  RechercheClient,
  RechercheCycle,
  RechercheProduit,
  RechercheUtilisateur,
  RechercheVente,
  RechercheDepense,
  RechercheResultats,
} from '../../services/recherche.service';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  menage: 'Ménage',
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  boucherie: 'Boucherie',
  revendeur: 'Revendeur',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  employe: 'Employé',
  comptable: 'Comptable',
};

const PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  credit: 'Crédit',
};

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  paye: 'Payé',
  partiel: 'Partiel',
  impaye: 'Impayé',
};

const CATEGORIE_LABELS: Record<string, string> = {
  poulet_vif: 'Poulet vif',
  poulet_abattu: 'Poulet abattu',
  poulet_entier: 'Poulet entier',
  poulet_fermier: 'Poulet fermier',
  poulet_morceaux: 'Poulet en morceaux',
  poulet_cuisse: 'Cuisses',
  poulet_ailes: 'Ailes',
};

const DEPENSE_CATEGORIE_LABELS: Record<string, string> = {
  poussins: 'Poussins',
  aliments: 'Aliments',
  veterinaire: 'Vétérinaire',
  infrastructure: 'Infrastructure',
  imprevu: 'Imprévu',
};

interface SectionDef {
  key: 'clients' | 'cycles' | 'produits' | 'utilisateurs' | 'ventes' | 'depenses';
  label: string;
  icon: IconType;
  color: string;
  roles: string[];
}

const SECTIONS: SectionDef[] = [
  { key: 'clients', label: 'Clients', icon: FiUsers, color: 'accent.1', roles: ['admin', 'comptable'] },
  { key: 'cycles', label: 'Cycles', icon: FiGrid, color: 'success.1', roles: ['admin', 'employe', 'comptable'] },
  { key: 'produits', label: 'Produits vétérinaires', icon: FiPackage, color: 'warning.1', roles: ['admin', 'employe'] },
  { key: 'ventes', label: 'Ventes & factures', icon: FiShoppingCart, color: 'admin.1', roles: ['admin', 'employe', 'comptable'] },
  { key: 'depenses', label: 'Dépenses', icon: FiArrowDownCircle, color: 'danger.1', roles: ['admin', 'employe', 'comptable'] },
  { key: 'utilisateurs', label: 'Utilisateurs', icon: FiUser, color: 'text.2', roles: ['admin'] },
];

const highlight = (text: string, q: string): ReactNode => {
  const lowerText = text.toLowerCase();
  const lowerQ = q.trim().toLowerCase();
  if (!lowerQ || !lowerText.includes(lowerQ)) return text;
  const parts: ReactNode[] = [];
  let index = 0;
  let match = lowerText.indexOf(lowerQ);
  while (match !== -1) {
    if (match > index) parts.push(text.slice(index, match));
    parts.push(
      <Text
        key={`hl-${match}`}
        as="span"
        color="accent.1"
        fontWeight="bold"
      >
        {text.slice(match, match + lowerQ.length)}
      </Text>
    );
    index = match + lowerQ.length;
    match = lowerText.indexOf(lowerQ, index);
  }
  parts.push(text.slice(index));
  return parts;
};

export function Search({ isOpen, onClose }: SearchProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const visibleSections = SECTIONS.filter((s) => !role || s.roles.includes(role));
  const [isMobile] = useMediaQuery('(max-width: 991px)');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RechercheResultats>({
    clients: [],
    cycles: [],
    produits: [],
    utilisateurs: [],
    ventes: [],
    depenses: [],
  });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const terme = q.trim();
    if (!terme) {
      setResults({ clients: [], cycles: [], produits: [], utilisateurs: [], ventes: [], depenses: [] });
      setTouched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await rechercheService.rechercher(terme);
      setResults(data);
    } catch {
      setResults({ clients: [], cycles: [], produits: [], utilisateurs: [], ventes: [], depenses: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults({ clients: [], cycles: [], produits: [], utilisateurs: [], ventes: [], depenses: [] });
    setTouched(false);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setTouched(true);
      runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, runSearch]);

  const hasAnyResult = visibleSections.some((s) => results[s.key].length > 0);

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const renderRow = (
    key: string,
    title: string,
    path: string,
    subtitle?: string
  ) => (
    <Box
      key={key}
      as="button"
      w="full"
      textAlign="left"
      px={3}
      py={2}
      borderRadius="md"
      _hover={{ bg: 'surface.2' }}
      onClick={() => goTo(path)}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={3}
    >
      <VStack align="flex-start" spacing={0} minW={0}>
        <Text fontSize="sm" fontWeight="bold" color="text.1" noOfLines={1}>
          {highlight(title, query)}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="text.3" noOfLines={1}>
            {highlight(subtitle, query)}
          </Text>
        )}
      </VStack>
      <Box flexShrink={0}>
        <FiArrowRight size={14} color="text.3" />
      </Box>
    </Box>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered={!isMobile}
      motionPreset={isMobile ? 'slideInBottom' : 'scale'}
    >
      <ModalOverlay />
      <ModalContent
        w="100%"
        maxW={{ base: '100%', lg: '1000px' }}
        h={{ base: '75%', lg: '650px' }}
        position={{ base: 'absolute', lg: 'relative' }}
        bottom={{ base: 0, lg: 'auto' }}
        left={{ base: 0, lg: 'auto' }}
        right={{ base: 0, lg: 'auto' }}
        m="0"
        borderRadius="lg"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        bg="surface.1"
      >
        <ModalBody p={0} bg="surface.1" display="flex" flexDirection="column" flex="1" overflow="hidden">
          <Box borderBottom="1px solid" borderColor="border.1" px={4} py={3}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="text.3" />
              </InputLeftElement>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
                placeholder="Rechercher un client, un cycle, un produit..."
                fontSize="sm"
                bg="transparent"
                border="none"
                _focus={{ boxShadow: 'none' }}
                _placeholder={{ color: 'text.3' }}
              />
            </InputGroup>
          </Box>

          <Box
            flex="1"
            overflowY="auto"
            p={2}
            position="relative"
            display={touched && !loading && hasAnyResult ? 'block' : 'flex'}
            alignItems="center"
            justifyContent="center"
          >
            <PoultryBackground />
            {touched && !loading && hasAnyResult ? (
              <VStack spacing={1} align="stretch" w="full">
                {visibleSections.map((section) => {
                  if (results[section.key].length === 0) return null;
                  const Icon = section.icon;
                  return (
                    <Box key={section.key}>
                      <HStack spacing={2} px={3} pt={2} pb={1}>
                        <Icon size={13} color={section.color} />
                        <Text fontSize="xs" fontWeight="bold" color={section.color} textTransform="uppercase">
                          {section.label}
                        </Text>
                      </HStack>
                      {section.key === 'clients' &&
                        results.clients.map((c) =>
                          renderRow(
                            `client-${c.id}`,
                            c.nom,
                            `/clients/${c.id}`,
                            `${TYPE_LABELS[c.type_client] || c.type_client}${c.adresse ? ` · ${c.adresse}` : ''}${c.contact ? ` · ${c.contact}` : ''}`
                          )
                        )}
                      {section.key === 'cycles' &&
                        results.cycles.map((c) =>
                          renderRow(
                            `cycle-${c.id}`,
                            `Cycle n°${c.numero_cycle}`,
                            `/cycles/${c.id}`,
                            c.statut === 'en_cours' ? 'En cours' : 'Clôturé'
                          )
                        )}
                      {section.key === 'produits' &&
                        results.produits.map((p) =>
                          renderRow(
                            `produit-${p.id}`,
                            p.nom,
                            '/produits-veterinaires',
                            `${p.type_produit} · ${p.quantite_stock} ${p.unite}`
                          )
                        )}
                      {section.key === 'ventes' &&
                        results.ventes.map((v) =>
                          renderRow(
                            `vente-${v.id}`,
                            v.client ? v.client.nom : 'Client inconnu',
                            `/ventes/${v.id}/facture`,
                            `Cycle #${v.cycle?.numero_cycle ?? '—'} · ${new Date(v.date).toLocaleDateString('fr-FR')} · ${(
                              Number(v.quantite) * Number(v.prix_unitaire) -
                              Number(v.remise || 0)
                            ).toLocaleString('fr-FR')} KMF · ${STATUT_PAIEMENT_LABELS[v.statut_paiement] || v.statut_paiement}`
                          )
                        )}
                      {section.key === 'depenses' &&
                        results.depenses.map((d) =>
                          renderRow(
                            `depense-${d.id}`,
                            DEPENSE_CATEGORIE_LABELS[d.categorie] || d.categorie,
                            '/depenses',
                            `Cycle #${d.cycle?.numero_cycle ?? '—'} · ${new Date(d.date).toLocaleDateString('fr-FR')} · ${Number(d.montant).toLocaleString('fr-FR')} KMF${d.description ? ` · ${d.description}` : ''}`
                          )
                        )}
                      {section.key === 'utilisateurs' &&
                        results.utilisateurs.map((u) =>
                          renderRow(
                            `utilisateur-${u.id}`,
                            `${u.nom}${u.prenom ? ` ${u.prenom}` : ''}`,
                            '/utilisateurs',
                            ROLE_LABELS[u.role] || u.role
                          )
                        )}
                      <Divider my={1} borderColor="border.1" />
                    </Box>
                  );
                })}
              </VStack>
            ) : (
              <VStack spacing={1} color="text.3" textAlign="center">
                {!touched ? (
                  <>
                    <FiSearch size={28} />
                    <Text fontSize="sm" color="text.2">
                      Tapez votre recherche pour retrouver rapidement
                      <br />un client, un cycle ou un produit.
                    </Text>
                    {!isMobile && (
                      <HStack spacing={1} mt={2} color="text.3">
                        <Text fontSize="xs">Astuce :</Text>
                        <Kbd fontSize="xs">Ctrl</Kbd>
                        <Text fontSize="xs">+</Text>
                        <Kbd fontSize="xs">K</Kbd>
                        <Text fontSize="xs">pour ouvrir la recherche</Text>
                      </HStack>
                    )}
                  </>
                ) : loading ? (
                  <PageLoading size="lg" py={0} />
                ) : (
                  <>
                    <FiInbox size={28} />
                    <Text fontSize="sm" color="text.2">
                      Aucun résultat pour « {query.trim()} »
                    </Text>
                  </>
                )}
              </VStack>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
