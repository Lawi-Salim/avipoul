import { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Text,
  VStack,
  HStack,
  Box,
  SimpleGrid,
  FormLabel,
  Card,
  CardBody,
  useClipboard,
  Tooltip,
} from '@chakra-ui/react';
import { FiCopy, FiRefreshCw } from 'react-icons/fi';

interface DrawerCalculateProps {
  isOpen: boolean;
  onClose: () => void;
}

function CalcField({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card bg="surface.2" borderRadius="md" border="1px solid" borderColor="border.1">
      <CardBody py={2} px={3}>
        <Text fontSize="xs" color="text.3">{label}</Text>
        <HStack spacing={1} align="baseline">
          <Text fontSize="lg" fontWeight="bold" color="text.1" fontFamily="Geist Mono, monospace">
            {value}
          </Text>
          {unit && <Text fontSize="xs" color="text.3">{unit}</Text>}
        </HStack>
      </CardBody>
    </Card>
  );
}

function CopyButton({ text }: { text: string }) {
  const { onCopy, hasCopied } = useClipboard(text);
  return (
    <Tooltip label={hasCopied ? 'Copie !' : 'Copier'}>
      <Button
        size="xs"
        variant="ghost"
        color="text.3"
        leftIcon={<FiCopy />}
        onClick={onCopy}
      >
        {hasCopied ? 'Copie' : 'Copier'}
      </Button>
    </Tooltip>
  );
}

function Interpretation({ text }: { text: string }) {
  return (
    <Text fontSize="xs" color="text.3" mt={1} fontStyle="italic">
      {text}
    </Text>
  );
}

export function DrawerCalculate({ isOpen, onClose }: DrawerCalculateProps) {
  // === Rentabilité ===
  const [coutTotal, setCoutTotal] = useState('');
  const [effectifVivant, setEffectifVivant] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [quantiteVendue, setQuantiteVendue] = useState('');
  const [mortalite, setMortalite] = useState('');
  const [effectifInitial, setEffectifInitial] = useState('');
  const [prixVenteStandard, setPrixVenteStandard] = useState('');

  // === Conversion ===
  const [kgAliment, setKgAliment] = useState('');
  const [kgViande, setKgViande] = useState('');
  const [poidsFinal, setPoidsFinal] = useState('');
  const [poidsInitial, setPoidsInitial] = useState('');
  const [effectifDensite, setEffectifDensite] = useState('');
  const [surfacePoulailler, setSurfacePoulailler] = useState('');

  // === Financier ===
  const [depensesAliments, setDepensesAliments] = useState('');
  const [depensesVeterinaire, setDepensesVeterinaire] = useState('');
  const [depensesInfrastructure, setDepensesInfrastructure] = useState('');
  const [depensesAutres, setDepensesAutres] = useState('');
  const [ventesQuantite, setVentesQuantite] = useState('');
  const [ventesPrixUnitaire, setVentesPrixUnitaire] = useState('');

  // === Prix de vente ===
  const [pvrCoutRevient, setPvrCoutRevient] = useState('');
  const [pvrMargeType, setPvrMargeType] = useState<'pourcentage' | 'kmf'>('pourcentage');
  const [pvrMarge, setPvrMarge] = useState('');

  const toNum = (v: string) => parseFloat(v) || 0;

  // --- Fonctions d'interpretation ---
  const getMortaliteInterpretation = (taux: number) => {
    if (taux === 0) return 'Aucune mortalité enregistrée';
    if (taux < 5) return 'Excellent - taux de mortalité très faible';
    if (taux < 10) return 'Acceptable - dans les normes standards';
    if (taux < 15) return 'Élevé - à surveiller';
    return 'Très élevé - action corrective nécessaire';
  };

  const getConversionInterpretation = (ratio: number) => {
    if (ratio === 0) return 'Renseignez les poids pour calculer';
    if (ratio < 2) return 'Excellent - très bonne efficacité alimentaire';
    if (ratio < 2.5) return 'Bon - efficacité satisfaisante';
    if (ratio < 3) return 'Moyen - peut être amélioré';
    return 'Faible - optimisation de l\'alimentation nécessaire';
  };

  const getDensiteInterpretation = (densite: number) => {
    if (densite === 0) return 'Renseignez les données pour calculer';
    if (densite < 5) return 'Faible - espace sous-utilisé';
    if (densite < 10) return 'Standard - densité optimale';
    if (densite < 15) return 'Élevée - risque de surpopulation';
    return 'Très élevée - risque sanitaire important';
  };

  const getMargeInterpretation = (marge: number) => {
    if (marge > 0) return 'Profit généré sur ce cycle';
    if (marge === 0) return "Point d'équilibre - ni profit ni perte";
    return 'Perte enregistrée sur ce cycle';
  };

  // --- Calculs Rentabilité ---
  const coutRevientParPoulet = toNum(effectifVivant) > 0
    ? toNum(coutTotal) / toNum(effectifVivant)
    : 0;
  const margeEstimee = (toNum(prixVente) * toNum(quantiteVendue)) - toNum(coutTotal);
  const seuilRentabilite = toNum(prixVenteStandard) > 0
    ? toNum(coutTotal) / toNum(prixVenteStandard)
    : 0;
  const tauxMortalite = toNum(effectifInitial) > 0
    ? (toNum(mortalite) / toNum(effectifInitial)) * 100
    : 0;

  // --- Calculs Conversion ---
  const conversionAliment = toNum(kgViande) > 0
    ? toNum(kgAliment) / toNum(kgViande)
    : 0;
  const ratioCroissance = toNum(poidsInitial) > 0
    ? toNum(poidsFinal) / toNum(poidsInitial)
    : 0;
  const densite = toNum(surfacePoulailler) > 0
    ? toNum(effectifDensite) / toNum(surfacePoulailler)
    : 0;

  // --- Calculs Financier ---
  const totalDepenses = toNum(depensesAliments) + toNum(depensesVeterinaire)
    + toNum(depensesInfrastructure) + toNum(depensesAutres);
  const totalVentesFinancier = toNum(ventesQuantite) * toNum(ventesPrixUnitaire);
  const bilanFinancier = totalVentesFinancier - totalDepenses;

  // --- Calcul Prix de vente ---
  const prixVenteRecommande = pvrMargeType === 'pourcentage'
    ? toNum(pvrCoutRevient) * (1 + toNum(pvrMarge) / 100)
    : toNum(pvrCoutRevient) + toNum(pvrMarge);

  const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  const handleReset = () => {
    setCoutTotal(''); setEffectifVivant(''); setPrixVente('');
    setQuantiteVendue(''); setMortalite(''); setEffectifInitial('');
    setPrixVenteStandard('');
    setKgAliment(''); setKgViande(''); setPoidsFinal('');
    setPoidsInitial(''); setEffectifDensite(''); setSurfacePoulailler('');
    setDepensesAliments(''); setDepensesVeterinaire('');
    setDepensesInfrastructure(''); setDepensesAutres('');
    setVentesQuantite(''); setVentesPrixUnitaire('');
    setPvrCoutRevient(''); setPvrMarge('');
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg="surface.1">
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor="border.1">
          <HStack spacing={2}>
            <Text fontSize="md" fontWeight="bold" color="text.1">Calculatrice avipoul</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          <Tabs variant="enclosed" colorScheme="blue" size="sm" h="100%" display="flex" flexDirection="column">
            <TabList px={4} pt={3} flexShrink={0}>
              <Tab fontSize="xs" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3">
                Rentabilité
              </Tab>
              <Tab fontSize="xs" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3">
                Conversion
              </Tab>
              <Tab fontSize="xs" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3">
                Financier
              </Tab>
              <Tab fontSize="xs" _selected={{ bg: 'surface.2', color: 'accent.1' }} color="text.3">
                Prix de vente
              </Tab>
            </TabList>

            <TabPanels flex={1} overflowY="auto" pb={4}>
              {/* === ONGLET RENTABILITE === */}
              <TabPanel px={4} pt={4}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Coût total (KMF)</FormLabel>
                    <Input size="sm" type="number" value={coutTotal} onChange={(e) => setCoutTotal(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Effectif vivant</FormLabel>
                    <Input size="sm" type="number" value={effectifVivant} onChange={(e) => setEffectifVivant(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Prix de vente unitaire (KMF)</FormLabel>
                    <Input size="sm" type="number" value={prixVente} onChange={(e) => setPrixVente(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Quantité vendue</FormLabel>
                    <Input size="sm" type="number" value={quantiteVendue} onChange={(e) => setQuantiteVendue(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <CalcField label="Coût revient / poulet" value={fmt(coutRevientParPoulet)} unit="KMF" />
                      <Interpretation text="Coût pour produire un poulet jusqu'à la vente" />
                    </Box>
                    <Box>
                      <CalcField label="Marge estimée" value={fmt(margeEstimee)} unit="KMF" />
                      <Interpretation text={getMargeInterpretation(margeEstimee)} />
                    </Box>
                  </SimpleGrid>

                  <Box pt={2} borderTop="1px solid" borderColor="border.1">
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Effectif initial</FormLabel>
                    <Input size="sm" type="number" value={effectifInitial} onChange={(e) => setEffectifInitial(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Mortalité cumulée</FormLabel>
                    <Input size="sm" type="number" value={mortalite} onChange={(e) => setMortalite(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Prix vente standard (KMF)</FormLabel>
                    <Input size="sm" type="number" value={prixVenteStandard} onChange={(e) => setPrixVenteStandard(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <CalcField label="Seuil de rentabilite" value={fmt(seuilRentabilite)} unit="poulets" />
                      <Interpretation text="Nombre minimum de poulets a vendre pour couvrir les couts" />
                    </Box>
                    <Box>
                      <CalcField label="Taux de mortalité" value={fmt(tauxMortalite)} unit="%" />
                      <Interpretation text={getMortaliteInterpretation(tauxMortalite)} />
                    </Box>
                  </SimpleGrid>

                  <CopyButton text={`Coût revient: ${fmt(coutRevientParPoulet)} KMF | Marge: ${fmt(margeEstimee)} KMF | Seuil: ${fmt(seuilRentabilite)} poulets | Mortalité: ${fmt(tauxMortalite)}%`} />
                </VStack>
              </TabPanel>

              {/* === ONGLET CONVERSION === */}
              <TabPanel px={4} pt={4}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Kg d'aliment consommés</FormLabel>
                    <Input size="sm" type="number" value={kgAliment} onChange={(e) => setKgAliment(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Kg de viande produits</FormLabel>
                    <Input size="sm" type="number" value={kgViande} onChange={(e) => setKgViande(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <Box>
                    <CalcField label="Conversion alimentaire" value={fmt(conversionAliment)} unit="kg aliment / kg viande" />
                    <Interpretation text={getConversionInterpretation(conversionAliment)} />
                  </Box>
                  <CopyButton text={`Conversion alimentaire: ${fmt(conversionAliment)} kg aliment / kg viande`} />

                  <Box pt={2} borderTop="1px solid" borderColor="border.1">
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Poids initial (kg)</FormLabel>
                    <Input size="sm" type="number" value={poidsInitial} onChange={(e) => setPoidsInitial(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Poids final (kg)</FormLabel>
                    <Input size="sm" type="number" value={poidsFinal} onChange={(e) => setPoidsFinal(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <Box>
                    <CalcField label="Ratio de croissance" value={fmt(ratioCroissance)} />
                    <Interpretation text="Multiplication du poids depuis l'éclosion" />
                  </Box>
                  <CopyButton text={`Ratio de croissance: ${fmt(ratioCroissance)}x`} />

                  <Box pt={2} borderTop="1px solid" borderColor="border.1">
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Effectif</FormLabel>
                    <Input size="sm" type="number" value={effectifDensite} onChange={(e) => setEffectifDensite(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Surface du poulailler (m²)</FormLabel>
                    <Input size="sm" type="number" value={surfacePoulailler} onChange={(e) => setSurfacePoulailler(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <Box>
                    <CalcField label="Densité" value={fmt(densite)} unit="poulets / m²" />
                    <Interpretation text={getDensiteInterpretation(densite)} />
                  </Box>
                  <CopyButton text={`Densité: ${fmt(densite)} poulets/m²`} />
                </VStack>
              </TabPanel>

              {/* === ONGLET FINANCIER === */}
              <TabPanel px={4} pt={4}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Dépenses aliments (KMF)</FormLabel>
                    <Input size="sm" type="number" value={depensesAliments} onChange={(e) => setDepensesAliments(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Dépenses vétérinaire (KMF)</FormLabel>
                    <Input size="sm" type="number" value={depensesVeterinaire} onChange={(e) => setDepensesVeterinaire(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Dépenses infrastructure (KMF)</FormLabel>
                    <Input size="sm" type="number" value={depensesInfrastructure} onChange={(e) => setDepensesInfrastructure(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Dépenses autres (KMF)</FormLabel>
                    <Input size="sm" type="number" value={depensesAutres} onChange={(e) => setDepensesAutres(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <CalcField label="Total des dépenses" value={fmt(totalDepenses)} unit="KMF" />

                  <Box pt={2} borderTop="1px solid" borderColor="border.1">
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Quantité vendue</FormLabel>
                    <Input size="sm" type="number" value={ventesQuantite} onChange={(e) => setVentesQuantite(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Prix unitaire (KMF)</FormLabel>
                    <Input size="sm" type="number" value={ventesPrixUnitaire} onChange={(e) => setVentesPrixUnitaire(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <CalcField label="Total des ventes" value={fmt(totalVentesFinancier)} unit="KMF" />

                  <Box>
                    <Card bg={bilanFinancier >= 0 ? 'success.1' : 'danger.1'} borderRadius="md">
                      <CardBody py={2} px={3}>
                        <Text fontSize="xs" color="white">Bilan</Text>
                        <Text fontSize="xl" fontWeight="bold" color="white" fontFamily="Geist Mono, monospace">
                          {bilanFinancier >= 0 ? '+' : ''}{fmt(bilanFinancier)} KMF
                        </Text>
                      </CardBody>
                    </Card>
                    <Interpretation text={getMargeInterpretation(bilanFinancier)} />
                  </Box>

                  <CopyButton text={`Dépenses: ${fmt(totalDepenses)} KMF | Ventes: ${fmt(totalVentesFinancier)} KMF | Bilan: ${fmt(bilanFinancier)} KMF`} />
                </VStack>
              </TabPanel>

              {/* === ONGLET PRIX DE VENTE === */}
              <TabPanel px={4} pt={4}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Coût de revient par poulet (KMF)</FormLabel>
                    <Input size="sm" type="number" value={pvrCoutRevient} onChange={(e) => setPvrCoutRevient(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>Type de marge</FormLabel>
                    <HStack spacing={2}>
                      <Button size="xs" variant={pvrMargeType === 'pourcentage' ? 'solid' : 'ghost'}
                        bg={pvrMargeType === 'pourcentage' ? 'accent.1' : undefined}
                        color={pvrMargeType === 'pourcentage' ? 'gray.900' : 'text.3'}
                        onClick={() => setPvrMargeType('pourcentage')}>
                        Pourcentage (%)
                      </Button>
                      <Button size="xs" variant={pvrMargeType === 'kmf' ? 'solid' : 'ghost'}
                        bg={pvrMargeType === 'kmf' ? 'accent.1' : undefined}
                        color={pvrMargeType === 'kmf' ? 'gray.900' : 'text.3'}
                        onClick={() => setPvrMargeType('kmf')}>
                        Montant (KMF)
                      </Button>
                    </HStack>
                  </Box>

                  <Box>
                    <FormLabel fontSize="xs" color="text.3" mb={1}>
                      Marge souhaitée {pvrMargeType === 'pourcentage' ? '(%)' : '(KMF)'}
                    </FormLabel>
                    <Input size="sm" type="number" value={pvrMarge} onChange={(e) => setPvrMarge(e.target.value)}
                      bg="surface.2" borderColor="border.1" borderRadius="md" placeholder="0" />
                  </Box>

                  <Box>
                    <Card bg="accent.1" borderRadius="md">
                      <CardBody py={3} px={3}>
                        <Text fontSize="xs" color="gray.900">Prix de vente recommandé</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="gray.900" fontFamily="Geist Mono, monospace">
                          {fmt(prixVenteRecommande)} KMF
                        </Text>
                      </CardBody>
                    </Card>
                    <Interpretation text="Prix pour atteindre la marge souhaitée" />
                  </Box>

                  <CopyButton text={`Prix de vente recommandé: ${fmt(prixVenteRecommande)} KMF`} />
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>

        <DrawerFooter borderTop="1px solid" borderColor="border.1">
          <Button variant="ghost" size="sm" color="text.3" leftIcon={<FiRefreshCw />} onClick={handleReset}>
            Réinitialiser
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
