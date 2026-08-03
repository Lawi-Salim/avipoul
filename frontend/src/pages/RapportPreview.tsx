import { useEffect, useState, useRef, useCallback } from 'react';
import { downloadFile } from '../utils/downloadFile';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  HStack,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import { FiArrowLeft, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cyclesService, Cycle } from '../services/cycles.service';
import api from '../services/api';

export default function RapportPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [allCycles, setAllCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadHtml = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [htmlRes, c] = await Promise.all([
        api.get<string>(`/rapports/cycle/${id}/html`, { responseType: 'text' }),
        cyclesService.getById(id),
      ]);
      setHtmlContent(htmlRes.data);
      setCycle(c);
    } catch {
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadHtml(); }, [loadHtml]);

  useEffect(() => {
    cyclesService.getAll().then(setAllCycles).catch(() => {});
  }, []);

  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  const closedCycles = allCycles
    .filter((c) => c.statut === 'cloture')
    .sort((a, b) => Number(b.numero_cycle) - Number(a.numero_cycle));

  const currentIndex = closedCycles.findIndex((c) => c.id === id);
  const prevCycle = currentIndex < closedCycles.length - 1 ? closedCycles[currentIndex + 1] : null;
  const nextCycle = currentIndex > 0 ? closedCycles[currentIndex - 1] : null;

  const handleDownloadPdf = async () => {
    if (!id || !cycle) return;
    setPdfLoading(true);
    setError('');
    try {
      const response = await cyclesService.exportPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      await downloadFile(blob, `rapport-cycle-${cycle.numero_cycle || id}.pdf`);
    } catch {
      setError('Erreur lors du téléchargement du PDF. Vérifiez que le service PDF est actif.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {error && (
        <Alert bg="danger.1" color="white" borderRadius="md" size="sm" mb={3}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <HStack justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <HStack spacing={3}>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            color="text.2"
            onClick={() => navigate(id ? `/cycles/${id}` : '/cycles')}
            fontSize="sm"
            size="sm"
          >
            Retour au cycle
          </Button>
          <Heading size="md" color="text.1">
            Rapport Cycle #{cycle?.numero_cycle || '...'}
          </Heading>
        </HStack>

        <HStack spacing={2}>
          {prevCycle && (
            <Button
              size="sm"
              variant="outline"
              color="text.2"
              leftIcon={<FiChevronLeft />}
              onClick={() => navigate(`/cycles/${prevCycle.id}/rapport`)}
            >
              Cycle #{prevCycle.numero_cycle}
            </Button>
          )}
          {nextCycle && (
            <Button
              size="sm"
              variant="outline"
              color="text.2"
              rightIcon={<FiChevronRight />}
              onClick={() => navigate(`/cycles/${nextCycle.id}/rapport`)}
            >
              Cycle #{nextCycle.numero_cycle}
            </Button>
          )}
          <Button
            size="sm"
            bg="accent.1"
            color="gray.900"
            _hover={{ bg: 'accent.2' }}
            leftIcon={<FiDownload />}
            onClick={handleDownloadPdf}
            isLoading={pdfLoading}
            fontWeight="bold"
          >
            Télécharger PDF
          </Button>
        </HStack>
      </HStack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={20}>
          <Spinner size="xl" color="accent.1" />
        </Box>
      ) : !htmlContent ? (
        <Text color="text.3" fontSize="sm" textAlign="center" py={10}>Aucun contenu disponible</Text>
      ) : (
        <Box
          flex={1}
          border="1px solid"
          borderColor="border.1"
          borderRadius="md"
          overflow="hidden"
          bg="white"
        >
          <iframe
            ref={iframeRef}
            title="Aperçu du rapport"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '70vh',
            }}
          />
        </Box>
      )}

    </Box>
  );
}
