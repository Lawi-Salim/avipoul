import { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Image,
  IconButton,
  Badge,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import {
  FiHome,
  FiSettings,
  FiUsers,
  FiGrid,
  FiPackage,
  FiHeart,
  FiDollarSign,
  FiShoppingBag,
  FiUser,
  FiFileText,
  FiLogOut,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../theme/ThemeMode';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from '../../utils/Avatars';
import logo from '../../assets/img/logo.png';
import { cyclesService } from '../../services/cycles.service';
import { ventesService } from '../../services/ventes.service';
import { responsiveText } from '../../theme/designTokens';
import ConfirmModal from '../ConfirmModal';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, path, isActive, onClick }: NavItemProps) {
  return (
    <Box
      as="button"
      w="100%"
      display="flex"
      alignItems="center"
      gap={3}
      px={3}
      py={2}
      borderRadius="md"
      fontSize={responsiveText.sm}
      fontWeight={isActive ? 'medium' : 'normal'}
      color={isActive ? 'sidebar.textActive' : 'sidebar.text'}
      bg={isActive ? 'sidebar.bgActive' : 'transparent'}
      borderLeft={isActive ? '3px solid' : '3px solid transparent'}
      borderColor={isActive ? 'sidebar.textActive' : 'transparent'}
      transition="all 0.15s ease"
      _hover={{
        bg: 'sidebar.bgHover',
        color: 'sidebar.textHover',
      }}
      onClick={onClick}
      textAlign="left"
    >
      <Box as="span" display="flex" alignItems="center" fontSize="16px">
        {icon}
      </Box>
      <Text noOfLines={1}>{label}</Text>
    </Box>
  );
}

function SidebarHeader() {
  const { colorMode } = useThemeMode();
  return (
    <HStack justify="space-between" borderBottom="1px solid" borderColor="sidebar.userBorder" px={5} py="9.5px">
      <HStack spacing={2}>
        <Image
          // src={colorMode === 'light' ? logoLight : logoDark}
          src={logo}
          alt="AVIPOUL"
          h={{ base: '32px', sm: '36px', md: '40px' }}
        />

        {/* <Box
          as="button"
          w="24px"
          h="24px"
          borderRadius="6px"
          borderWidth="1px"
          borderColor="border.1"
          color="text.3"
          fontSize="12px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          transition="all 0.18s"
          _hover={{ borderColor: 'accent.bdr', color: 'accent.1', bg: 'accent.bg' }}
          bg="transparent"
          flexShrink={0}
        >
          <FiSidebar />
        </Box> */}
      </HStack>
    </HStack>
  );
}

function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [impayeCount, setImpayeCount] = useState(0);

  useEffect(() => {
    const fetchImpayeCount = async () => {
      try {
        const allCycles = await cyclesService.getAll();
        const enCours = allCycles.find((c) => c.statut === 'en_cours');
        if (!enCours) return;
        const ventes = await ventesService.getByCycle(enCours.id);
        const count = ventes.filter((v) => v.statut_paiement === 'impaye').length;
        setImpayeCount(count);
      } catch {
        // silent fail for badge count
      }
    };
    fetchImpayeCount();
  }, []);

  const role = user?.role;

  const sections = [
    {
      label: 'ADMINISTRATION',
      items: [
        { icon: <FiHome />, label: 'Vue d\'ensemble', path: '/dashboard', roles: ['admin', 'employe', 'comptable'] },
        { icon: <FiSettings />, label: 'Paramètres', path: '/parametrage', roles: ['admin'] },
        { icon: <FiUsers />, label: 'Utilisateurs', path: '/utilisateurs', roles: ['admin'] },
      ],
    },
    {
      label: 'GESTION',
      items: [
        { icon: <FiGrid />, label: 'Cycles', path: '/cycles', roles: ['admin', 'employe', 'comptable'] },
        { icon: <FiPackage />, label: 'Stocks', path: '/stocks', roles: ['admin', 'employe'] },
        { icon: <FiPackage />, label: 'Produits vétérinaires', path: '/produits-veterinaires', roles: ['admin', 'employe'] },
        { icon: <FiHeart />, label: 'Santé', path: '/sante', roles: ['admin', 'employe'] },
        { icon: <FiDollarSign />, label: 'Finances', path: '/depenses', roles: ['admin', 'comptable'] },
        { icon: <FiShoppingBag />, label: 'Ventes', path: '/ventes', roles: ['admin', 'employe', 'comptable'] },
        { icon: <FiUser />, label: 'Clients', path: '/clients', roles: ['admin', 'comptable'] },
      ],
    },
    {
      label: 'RAPPORTS',
      items: [
        { icon: <FiAlertTriangle />, label: 'Risques', path: '/risques', roles: ['admin', 'employe'] },
        { icon: <FiFileText />, label: 'Bilans', path: '/bilans', roles: ['admin', 'comptable'] },
      ],
    },
  ];

  return (
    <VStack spacing={0} align="stretch" flex={1} overflowY="auto" px={2} py={2}>
      {sections.map((section, sIdx) => {
        const visibleItems = section.items.filter((item: any) => !role || item.roles.includes(role));
        if (visibleItems.length === 0) return null;
        return (
        <Box key={section.label}>
          {sIdx > 0 && <Divider borderColor="sidebar.divider" my={3} />}
          <Text
            fontSize={responsiveText.xs}
            fontWeight="semibold"
            color="sidebar.section"
            letterSpacing="wider"
            px={3}
            mb={2}
            mt={sIdx === 0 ? 0 : 1}
          >
            {section.label}
          </Text>
          <VStack spacing={0.5} align="stretch">
            {visibleItems.map((item: any) => (
              <Box key={item.path + item.label} position="relative">
                <NavItem
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                  onClick={() => navigate(item.path)}
                />
                {item.path === '/ventes' && impayeCount > 0 && (
                  <Badge
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                    bg="danger.1"
                    color="white"
                    fontSize={responsiveText.xs}
                    borderRadius="full"
                    px={1.5}
                    minW="18px"
                    textAlign="center"
                  >
                    {impayeCount}
                  </Badge>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
        );
      })}
    </VStack>
  );
}

function SidebarUser() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <HStack
      px={4}
      py={3}
      spacing={3}
      borderTop="1px solid"
      borderColor="sidebar.userBorder"
    >
      <UserAvatar
        name={`${user?.nom} ${user?.prenom || ''}`.trim()}
        size={36}
        src={user?.photo ?? null}
      />
      <VStack spacing={0} align="start" flex={1} minW={0}>
        <Text fontSize={responsiveText.sm} fontWeight="medium" color="text.1" noOfLines={1}>
          {user?.nom || 'Utilisateur'}
        </Text>
        <Text fontSize={responsiveText.xs} color="sidebar.text" noOfLines={1}>
          {user?.email || 'email@avipoul.com'}
        </Text>
      </VStack>
      <Tooltip label="Déconnexion" placement="top">
        <IconButton
          aria-label="Déconnexion"
          icon={<FiLogOut />}
          size="sm"
          variant="ghost"
          color="sidebar.text"
          _hover={{ color: 'red.300', bg: 'sidebar.bgHover' }}
          onClick={() => setShowLogoutConfirm(true)}
        />
      </Tooltip>
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Déconnexion"
      />
    </HStack>
  );
}

export default function SidebarMobile() {
  return (
    <Flex
      w="250px"
      minW="250px"
      h="100vh"
      bg="sidebar.bg"
      borderRight="1px solid"
      borderColor="sidebar.border"
      boxShadow="sidebar.shadow"
      flexDirection="column"
    >
      {/* Bloc 1: Header */}
      <SidebarHeader />

      {/* Bloc 2: Navigation */}
      <SidebarNav />

      {/* Bloc 3: User info */}
      <SidebarUser />
    </Flex>
  );
}
