import { useEffect, useState, useRef, useCallback } from 'react';
import { useDownload } from '../contexts/DownloadContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { ventesService, Vente } from '../services/ventes.service';

export default function FacturePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCycle = searchParams.get('fromCycle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [vente, setVente] = useState<Vente | null>(null);
  const [allVentes, setAllVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadHtml = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [htmlRes, v] = await Promise.all([
        ventesService.exportFactureHtml(id),
        ventesService.getById(id),
      ]);
      setHtmlContent(htmlRes.data as string);
      setVente(v);
    } catch {
      setError('Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadHtml(); }, [loadHtml]);

  useEffect(() => {
    ventesService.getAll().then(setAllVentes).catch(() => {});
  }, []);

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

  const sortedVentes = allVentes
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentIndex = sortedVentes.findIndex((v) => v.id === id);
  const prevVente = currentIndex < sortedVentes.length - 1 ? sortedVentes[currentIndex + 1] : null;
  const nextVente = currentIndex > 0 ? sortedVentes[currentIndex - 1] : null;

  const { startDownload } = useDownload();

  const handleDownloadPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    setError('');
    try {
      await startDownload({
        fileName: `facture-${id}.pdf`,
        fetch: (onProgress) =>
          ventesService.exportFacturePdf(id, onProgress).then((r) =>
            new Blob([r.data], { type: 'application/pdf' })
          ),
      });
    } catch {
      setError('Erreur lors du téléchargement du PDF. Vérifiez que le service PDF est actif.');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getFactureNumero = (venteDate: string, venteId: string) => {
    const d = new Date(venteDate);
    const sameMonth = sortedVentes
      .filter((v) => {
        const vd = new Date(v.date);
        return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const seq = sameMonth.findIndex((v) => v.id === venteId) + 1;
    return `FAC-${String(seq).padStart(6, '0')}`;
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
            onClick={() => navigate(fromCycle ? `/ventes/${fromCycle}` : '/ventes')}
            fontSize="sm"
            size="sm"
          >
            Retour aux ventes
          </Button>
          <Heading size="md" color="text.1">
            Facture {vente ? `du ${formatDate(vente.date)}` : '...'}
          </Heading>
        </HStack>

        <HStack spacing={2}>
          {prevVente && (
            <Button
              size="sm"
              variant="outline"
              color="text.2"
              leftIcon={<FiChevronLeft />}
              onClick={() => navigate(`/ventes/${prevVente.id}/facture?fromCycle=${fromCycle || ''}`)}
            >
              {getFactureNumero(prevVente.date, prevVente.id)}
            </Button>
          )}
          {nextVente && (
            <Button
              size="sm"
              variant="outline"
              color="text.2"
              rightIcon={<FiChevronRight />}
              onClick={() => navigate(`/ventes/${nextVente.id}/facture?fromCycle=${fromCycle || ''}`)}
            >
              {getFactureNumero(nextVente.date, nextVente.id)}
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
            title="Aperçu de la facture"
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
