import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDownload } from '../contexts/DownloadContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  HStack,
  Heading,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import PageLoading from '../components/PageLoading';
import { FiArrowLeft, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ventesService } from '../services/ventes.service';
import { clientsService, Client } from '../services/clients.service';
import { cyclesService, Cycle } from '../services/cycles.service';

export default function FactureGroupeePreview() {
  const { clientId, cycleId } = useParams<{ clientId: string; cycleId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [clientCycles, setClientCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadHtml = useCallback(async () => {
    if (!clientId || !cycleId) return;
    setLoading(true);
    setError('');
    try {
      const [htmlRes, c, cy] = await Promise.all([
        ventesService.exportFactureGroupeeHtml(clientId, cycleId),
        clientsService.getById(clientId),
        cyclesService.getById(cycleId),
      ]);
      setHtmlContent(htmlRes.data as string);
      setClient(c);
      setCycle(cy);
    } catch {
      setError('Erreur lors du chargement de la facture groupée');
    } finally {
      setLoading(false);
    }
  }, [clientId, cycleId]);

  useEffect(() => { loadHtml(); }, [loadHtml]);

  useEffect(() => {
    if (!clientId) return;
    clientsService.getVentes(clientId).then((ventes) => {
      const cycleIds = [...new Set(ventes.map((v) => v.cycle?.id).filter(Boolean))];
      Promise.all(cycleIds.map((id) => cyclesService.getById(id!)))
        .then(setClientCycles)
        .catch(() => {});
    }).catch(() => {});
  }, [clientId]);

  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        const style = doc.createElement('style');
        style.textContent = `::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(144,205,244,0.7);border-radius:999px}::-webkit-scrollbar-thumb:hover{background:rgba(144,205,244,0.95)}*{scrollbar-width:thin;scrollbar-color:rgba(144,205,244,0.7) transparent}`;
        doc.head?.appendChild(style);
      }
    }
  }, [htmlContent]);

  const sortedCycles = useMemo(
    () => clientCycles.sort((a, b) => Number(b.numero_cycle) - Number(a.numero_cycle)),
    [clientCycles],
  );

  const currentIndex = sortedCycles.findIndex((c) => c.id === cycleId);
  const prevCycle = currentIndex < sortedCycles.length - 1 ? sortedCycles[currentIndex + 1] : null;
  const nextCycle = currentIndex > 0 ? sortedCycles[currentIndex - 1] : null;

  const { startDownload } = useDownload();

  const handleDownloadPdf = async () => {
    if (!clientId || !cycleId) return;
    setPdfLoading(true);
    setError('');
    try {
      await startDownload({
        fileName: `facture-groupee-${client?.nom || clientId}-cycle-${cycle?.numero_cycle || cycleId}.pdf`,
        fetch: (onProgress) =>
          ventesService.exportFactureGroupeePdf(clientId, cycleId, onProgress).then((r) =>
            new Blob([r.data], { type: 'application/pdf' })
          ),
      });
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
            onClick={() => navigate(`/clients/${clientId}`)}
            fontSize="sm"
            size="sm"
          >
            Retour au client
          </Button>
          <Heading size="md" color="text.1">
            {client?.nom || '...'} — Cycle #{cycle?.numero_cycle || '...'}
          </Heading>
        </HStack>

        <HStack spacing={2}>
          {prevCycle && (
            <Button
              size="sm"
              variant="outline"
              color="text.2"
              leftIcon={<FiChevronLeft />}
              onClick={() => navigate(`/clients/${clientId}/cycles/${prevCycle.id}/facture`)}
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
              onClick={() => navigate(`/clients/${clientId}/cycles/${nextCycle.id}/facture`)}
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
        <PageLoading />
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
            title="Aperçu de la facture groupée"
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
