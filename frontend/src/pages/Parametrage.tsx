import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Flex,
  Alert,
  AlertIcon,
  SimpleGrid,
  Spinner,
  Center,
  Badge,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { parametragesService } from '../services/parametrages.service';
import type { Parametrage } from '../services/parametrages.service';
import { remisesService, RemiseTypeClient, RemiseVolume } from '../services/remises.service';
import { exportService } from '../services/export.service';
import { responsiveText } from '../theme/designTokens';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { utilisateursService } from '../services/utilisateurs.service';

const DEFAULTS = {
  cout_standard_poussin: 0,
  prix_vente_standard: 0,
  seuil_mortalite_critique_pct: 5,
  seuil_stock_bas_jours: 3,
};

const FIELDS = [
  { key: 'cout_standard_poussin' as const, label: 'Coût standard poussin (KMF)', desc: 'Coût d\'achat unitaire des poussins' },
  { key: 'prix_vente_standard' as const, label: 'Prix de vente standard (KMF)', desc: 'Prix de vente unitaire recommandé' },
  { key: 'seuil_mortalite_critique_pct' as const, label: 'Seuil mortalité critique (%)', desc: 'Pourcentage déclenchant une alerte criticité' },
  { key: 'seuil_stock_bas_jours' as const, label: 'Seuil stock bas (jours)', desc: 'Nombre de jours de stock restant déclenchant une alerte' },
];

export default function Parametrage() {
  const [data, setData] = useState<Parametrage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [remisesTypeClient, setRemisesTypeClient] = useState<RemiseTypeClient>({});
  const [remisesVolume, setRemisesVolume] = useState<RemiseVolume[]>([]);
  const [loadingRemises, setLoadingRemises] = useState(true);
  const [savingRemises, setSavingRemises] = useState(false);
  const [remiseMode, setRemiseMode] = useState<'type_client' | 'volume' | 'aucun'>('type_client');
  const [exporting, setExporting] = useState(false);

  const { user, refreshProfile } = useAuth();
  const [profilForm, setProfilForm] = useState({ 
    nom: user?.nom || '', 
    prenom: user?.prenom || '', 
    email: user?.email || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
  });
  const [passwordForm, setPasswordForm] = useState({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '', confirmation: '' });
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profilError, setProfilError] = useState('');
  const [profilSuccess, setProfilSuccess] = useState('');

  useEffect(() => {
    parametragesService.getCurrent()
      .then((res) => setData(res))
      .catch(() => setError('Erreur lors du chargement du paramétrage'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      remisesService.getRemiseMode(),
      remisesService.getRemisesByTypeClient(),
      remisesService.getRemisesByVolume(),
    ])
      .then(([mode, typeClient, volume]) => {
        setRemiseMode(mode);
        setRemisesTypeClient(typeClient);
        setRemisesVolume(volume);
      })
      .catch(() => {})
      .finally(() => setLoadingRemises(false));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await parametragesService.updateCurrent({
        cout_standard_poussin: data.cout_standard_poussin,
        prix_vente_standard: data.prix_vente_standard,
        seuil_mortalite_critique_pct: data.seuil_mortalite_critique_pct,
        seuil_stock_bas_jours: data.seuil_stock_bas_jours,
      });
      setData(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDonneesBrutes = async () => {
    setExporting(true);
    try {
      const response = await exportService.exportDonneesBrutes();
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'donnees-brutes-export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de l\'export des données brutes');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProfil = async () => {
    if (!user) return;
    setSavingProfil(true);
    setProfilError('');
    setProfilSuccess('');
    try {
      await utilisateursService.update(user.id, { 
        nom: profilForm.nom,
        prenom: profilForm.prenom,
        email: profilForm.email,
        telephone: profilForm.telephone,
        adresse: profilForm.adresse,
      });
      setProfilSuccess('Profil mis à jour avec succès');
      await refreshProfile();
    } catch {
      setProfilError('Erreur lors de la mise à jour du profil');
    } finally {
      setSavingProfil(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.nouveau_mot_de_passe !== passwordForm.confirmation) {
      setProfilError('La confirmation ne correspond pas au nouveau mot de passe');
      return;
    }
    if (passwordForm.nouveau_mot_de_passe.length < 6) {
      setProfilError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSavingPassword(true);
    setProfilError('');
    setProfilSuccess('');
    try {
      await authService.changePassword({
        mot_de_passe_actuel: passwordForm.mot_de_passe_actuel,
        nouveau_mot_de_passe: passwordForm.nouveau_mot_de_passe,
      });
      setProfilSuccess('Mot de passe modifié avec succès');
      setPasswordForm({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '', confirmation: '' });
    } catch {
      setProfilError('Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <Center py={20}><Spinner size="xl" color="accent.1" /></Center>;
  }

  const form = data || DEFAULTS;

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Heading size={{ base: "md", md: "lg" }} color="text.1">Paramétrage</Heading>
        <Badge bg="accent.1" color="gray.900" borderRadius="full" px={3} py={1} fontSize={responsiveText.xs}>
          Configuration globale
        </Badge>
      </HStack>

      {!data && (
        <Alert bg="warning.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          Aucun paramétrage actif. Définissez les valeurs par défaut ci-dessous.
        </Alert>
      )}

      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {success && (
        <Alert bg="success.1" color="white" borderRadius="md" size="sm">
          <AlertIcon />
          Paramétrage sauvegardé avec succès.
        </Alert>
      )}

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {FIELDS.map(({ key, label, desc }) => (
              <Box key={key}>
                <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">{label}</Text>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={(e) => setData({ ...form, [key]: Number(e.target.value) } as Parametrage)}
                  bg="surface.2"
                  borderColor="border.1"
                  borderRadius="md"
                  size={{ base: "md", md: "sm" }}
                  _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                />
                <Text mt={1} fontSize={{ base: "sm", md: "xs" }} color="text.3">{desc}</Text>
              </Box>
            ))}
          </SimpleGrid>

          <HStack justify="flex-end" mt={6}>
            <Button
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              onClick={handleSave}
              isLoading={saving}
              fontWeight="bold"
              size={{ base: "md", md: "sm" }}
            >
              {data ? 'Sauvegarder' : 'Créer le paramétrage'}
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Mode de remise</Heading>
          <Text mb={4} fontSize={{ base: "sm", md: "ms" }} color="text.3">
            Choisissez le type de remise à appliquer automatiquement lors des ventes.
          </Text>
          <RadioGroup value={remiseMode} onChange={(value) => setRemiseMode(value as 'type_client' | 'volume' | 'aucun')}>
            <Stack direction="row" spacing={6}>
              <Radio value="type_client" colorScheme="green">
                <Text fontSize={{ base: "sm", md: "ms" }} color="text.1">Par type de client</Text>
              </Radio>
              <Radio value="volume" colorScheme="green">
                <Text fontSize={{ base: "sm", md: "ms" }} color="text.1">Par volume</Text>
              </Radio>
              <Radio value="aucun" colorScheme="green">
                <Text fontSize={{ base: "sm", md: "ms" }} color="text.1">Aucune remise</Text>
              </Radio>
            </Stack>
          </RadioGroup>
        </CardBody>
      </Card>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody opacity={remiseMode !== 'aucun' ? 1 : 0.5} pointerEvents={remiseMode !== 'aucun' ? 'auto' : 'none'}>
          <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Remises par type de client</Heading>
          {loadingRemises ? (
            <Center py={6}><Spinner size="md" color="accent.1" /></Center>
          ) : (
            <>
              <Box opacity={remiseMode === 'type_client' ? 1 : 0.5} pointerEvents={remiseMode === 'type_client' ? 'auto' : 'none'}>
                <SimpleGrid columns={{ base: 2, sm: 2, md: 2 }} spacing={4} mb={6}>
                  {[
                    { type: 'menage', label: 'Ménage' },
                    { type: 'restaurant', label: 'Restaurant' },
                    { type: 'hotel', label: 'Hôtel' },
                    { type: 'boucherie', label: 'Boucherie' },
                    { type: 'revendeur', label: 'Revendeur' },
                  ].map(({ type, label }) => (
                    <Box key={type}>
                      <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">{label}</Text>
                      <HStack>
                        <Input
                          type="number"
                          value={remisesTypeClient[type] ?? 0}
                          onChange={(e) => setRemisesTypeClient({ ...remisesTypeClient, [type]: Number(e.target.value) })}
                          bg="surface.2"
                          borderColor="border.1"
                          borderRadius="md"
                          size={{ base: "md", md: "sm" }}
                          min={0}
                          max={100}
                          width="80px"
                          _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                        />
                        <Text fontSize={{ base: "sm", md: "ms" }} color="text.3">%</Text>
                      </HStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>

              <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Remises par volume</Heading>
              <Box opacity={remiseMode === 'volume' ? 1 : 0.5} pointerEvents={remiseMode === 'volume' ? 'auto' : 'none'}>
                <SimpleGrid columns={{ base: 2, sm: 2, md: 3 }} spacing={4} mb={6}>
                  {remisesVolume.map((remise, index) => (
                    <Box key={index}>
                      <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">
                        {remise.seuil_max ? `${remise.seuil_min} - ${remise.seuil_max} poulets` : `${remise.seuil_min}+ poulets`}
                      </Text>
                      <HStack>
                        <Input
                          type="number"
                          value={remise.remise_pct}
                          onChange={(e) => {
                            const updated = remisesVolume.map((r, i) =>
                              i === index ? { ...r, remise_pct: Number(e.target.value) } : r
                            );
                            setRemisesVolume(updated);
                          }}
                          bg="surface.2"
                          borderColor="border.1"
                          borderRadius="md"
                          size={{ base: "md", md: "sm" }}
                          min={0}
                          max={100}
                          width="80px"
                          _focus={{ borderColor: 'accent.1', boxShadow: '0 0 0 1px var(--chakra-colors-accent-1)' }}
                        />
                        <Text fontSize={{ base: "sm", md: "ms" }} color="text.3">%</Text>
                      </HStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>

              <HStack justify="flex-end">
                <Button
                  bg="accent.1"
                  color="gray.900"
                  _hover={{ bg: 'accent.2' }}
                  onClick={async () => {
                    setSavingRemises(true);
                    try {
                      await remisesService.setRemiseMode(remiseMode);
                      await Promise.all([
                        ...Object.entries(remisesTypeClient).map(([type, pct]) =>
                          remisesService.updateRemiseTypeClient(type, pct)
                        ),
                        ...remisesVolume.map((r) =>
                          remisesService.updateRemiseVolume(r.seuil_min, r.seuil_max, r.remise_pct)
                        ),
                      ]);
                      setSuccess(true);
                      setTimeout(() => setSuccess(false), 3000);
                    } catch {
                      setError('Erreur lors de la sauvegarde des remises');
                    } finally {
                      setSavingRemises(false);
                    }
                  }}
                  isLoading={savingRemises}
                  fontWeight="bold"
                  size={{ base: "md", md: "sm" }}
                >
                  Sauvegarder les remises
                </Button>
              </HStack>
            </>
          )}
        </CardBody>
      </Card>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Mon profil</Heading>
          
          {profilError && (
            <Alert bg="danger.1" color="white" borderRadius="md" size="sm" mb={4}>
              <AlertIcon />
              {profilError}
            </Alert>
          )}
          
          {profilSuccess && (
            <Alert bg="success.1" color="white" borderRadius="md" size="sm" mb={4}>
              <AlertIcon />
              {profilSuccess}
            </Alert>
          )}
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Nom</Text>
              <Input
                value={profilForm.nom}
                onChange={(e) => setProfilForm({ ...profilForm, nom: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Prénom</Text>
              <Input
                value={profilForm.prenom}
                onChange={(e) => setProfilForm({ ...profilForm, prenom: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Email</Text>
              <Input
                type="email"
                value={profilForm.email}
                onChange={(e) => setProfilForm({ ...profilForm, email: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Téléphone</Text>
              <Input
                type="tel"
                value={profilForm.telephone}
                onChange={(e) => setProfilForm({ ...profilForm, telephone: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Adresse</Text>
              <Input
                value={profilForm.adresse}
                onChange={(e) => setProfilForm({ ...profilForm, adresse: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Rôle</Text>
              <Input
                value={user?.role === 'admin' ? 'Administrateur' : user?.role === 'employe' ? 'Employé' : 'Comptable'}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
                isReadOnly
                color="text.1"
                _disabled={{ opacity: 1, cursor: 'default' }}
              />
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Créé le</Text>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
                isReadOnly
                color="text.1"
                _disabled={{ opacity: 1, cursor: 'default' }}
              />
            </Box>

            <Box>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Mis à jour le</Text>
              <Input
                value={user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : '—'}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
                isReadOnly
                color="text.1"
                _disabled={{ opacity: 1, cursor: 'default' }}
              />
            </Box>
          </SimpleGrid>
          
          <Flex mt={4} justify={{ base: "stretch", md: "flex-end" }}>
            <Button
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              fontWeight="bold"
              onClick={handleSaveProfil}
              isLoading={savingProfil}
              size={{ base: "md", md: "sm" }}
              w={{ base: "100%", md: "auto" }}
            >
              Mettre à jour le profil
            </Button>
          </Flex>
        </CardBody>
      </Card>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Changer le mot de passe</Heading>
          
          <Flex gap={4} align={{ base: "stretch", md: "flex-end" }} direction={{ base: "column", md: "row" }}>
            <Box flex={{ base: "1 1 100%", md: "1 1 0" }} minW={0}>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Mot de passe actuel</Text>
              <Input
                type="password"
                value={passwordForm.mot_de_passe_actuel}
                onChange={(e) => setPasswordForm({ ...passwordForm, mot_de_passe_actuel: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box flex={{ base: "1 1 100%", md: "1 1 0" }} minW={0}>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Nouveau mot de passe</Text>
              <Input
                type="password"
                value={passwordForm.nouveau_mot_de_passe}
                onChange={(e) => setPasswordForm({ ...passwordForm, nouveau_mot_de_passe: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
            
            <Box flex={{ base: "1 1 100%", md: "1 1 0" }} minW={0}>
              <Text mb={1} fontSize={{ base: "sm", md: "ms" }} color="text.2" fontWeight="medium">Confirmer le mot de passe</Text>
              <Input
                type="password"
                value={passwordForm.confirmation}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmation: e.target.value })}
                bg="surface.2"
                borderColor="border.1"
                borderRadius="md"
                size={{ base: "md", md: "sm" }}
              />
            </Box>
          </Flex>

          <Flex mt={4} justify={{ base: "stretch", md: "flex-end" }}>
            <Button
              bg="accent.1"
              color="gray.900"
              _hover={{ bg: 'accent.2' }}
              fontWeight="bold"
              onClick={handleChangePassword}
              isLoading={savingPassword}
              size={{ base: "md", md: "sm" }}
              w={{ base: "100%", md: "auto" }}
            >
              Changer le mot de passe
            </Button>
          </Flex>
        </CardBody>
      </Card>

      <Card bg="surface.1" borderColor="border.1" borderWidth="1px">
        <CardBody>
          <Heading size="md" color="text.1" mb={4} fontSize={{ base: "ms", md: "md" }}>Administration</Heading>
          <Text mb={4} fontSize={{ base: "sm", md: "ms" }} color="text.3">
            Export complet des données de l'application (cycles, mortalités, ventes, dépenses, clients). Réservé aux administrateurs.
          </Text>
          <Button
            size={{ base: "md", md: "sm" }}
            variant="outline"
            borderColor="border.1"
            color="text.2"
            bg="surface.1"
            leftIcon={<FiDownload />}
            onClick={handleExportDonneesBrutes}
            isLoading={exporting}
            loadingText="Export..."
            fontSize={responsiveText.sm}
            borderRadius="md"
          >
            Exporter données brutes
          </Button>
        </CardBody>
      </Card>

    </VStack>
  );
}
