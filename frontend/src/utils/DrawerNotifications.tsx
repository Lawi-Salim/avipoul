import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiBellOff,
  FiRefreshCw,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiAlertOctagon,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../services/notifications.service';

interface DrawerNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
}

const TYPE_META: Record<
  AppNotification['type'],
  { label: string; icon: IconType; color: string }
> = {
  phase_bloquee: { label: 'Phase bloquée', icon: FiAlertTriangle, color: 'warning.1' },
  age: { label: 'Âge du cycle', icon: FiCalendar, color: 'accent.1' },
  todo: { label: 'À faire', icon: FiCheckCircle, color: 'success.1' },
  alerte: { label: 'Alerte', icon: FiAlertOctagon, color: 'danger.1' },
};

export function DrawerNotifications({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}: DrawerNotificationsProps) {
  const navigate = useNavigate();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg="surface.1">
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor="border.1">
          <HStack spacing={2}>
            <Text fontSize="md" fontWeight="bold" color="text.1">Notifications</Text>
            {notifications.length > 0 && (
              <Badge
                bg="accent.1"
                color="gray.900"
                borderRadius="full"
                fontSize="11px"
                px={2}
              >
                {notifications.length}
              </Badge>
            )}
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          {notifications.length === 0 ? (
            <VStack
              spacing={3}
              pt={16}
              px={6}
              textAlign="center"
              color="text.3"
            >
              <FiBellOff size={36} color="text.3" />
              <Text fontSize="sm" fontWeight="bold" color="text.2">
                Aucune notification
              </Text>
              <Text fontSize="xs">
                Les rappels des cycles et les alertes apparaîtront ici dès qu'un
                cycle sera en cours.
              </Text>
            </VStack>
          ) : (
            <VStack spacing={1} align="stretch" p={2}>
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.alerte;
                const Icon = meta.icon;
                return (
                  <Tooltip key={n.id} label="Ouvrir" placement="top" hasArrow>
                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      h="auto"
                      px={3}
                      py={3}
                      whiteSpace="normal"
                      borderRadius="md"
                      bg="transparent"
                      _hover={{ bg: 'surface.2' }}
                      onClick={() => {
                        navigate(n.path);
                        onClose();
                      }}
                    >
                      <HStack spacing={3} align="flex-start" w="full">
                        <Box
                          mt={0.5}
                          p={1.5}
                          borderRadius="md"
                          bg={meta.color}
                          flexShrink={0}
                        >
                          <Icon size={14} color="white" />
                        </Box>
                        <VStack align="flex-start" spacing={0.5} minW={0}>
                          <Text fontSize="xs" fontWeight="bold" color={meta.color}>
                            {meta.label}
                          </Text>
                          <Text fontSize="sm" color="text.1">
                            {n.message}
                          </Text>
                        </VStack>
                      </HStack>
                    </Button>
                  </Tooltip>
                );
              })}
            </VStack>
          )}
        </DrawerBody>

        <DrawerFooter borderTop="1px solid" borderColor="border.1">
          <Button
            variant="ghost"
            size="sm"
            color="text.3"
            leftIcon={<FiRefreshCw />}
            onClick={onRefresh}
          >
            Actualiser
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
