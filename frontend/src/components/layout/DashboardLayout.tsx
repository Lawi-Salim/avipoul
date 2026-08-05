import { useState, useEffect, useCallback, useRef } from 'react';
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Kbd,
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
  FiSearch,
  FiBell,
  FiSun,
  FiSidebar,
  FiMoon,
  FiLogOut,
  FiAlertTriangle,
  FiMenu,
  FiCheckCircle,
} from 'react-icons/fi';
import { MdOutlineCalculate } from "react-icons/md";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../theme/ThemeMode';
import { useAuth } from '../../contexts/AuthContext';
import { DrawerCalculate } from '../../utils/DrawerCalculate';
import { DrawerNotifications } from '../../utils/DrawerNotifications';
import { UserAvatar } from '../../utils/Avatars';
import ScrollBar from '../../utils/Scrollbar';
import logoDark from '../../assets/img/logo-png-3x.png';
import logoLight from '../../assets/img/logo-png--3x.png';
import logo from '../../assets/img/logo.png';
import { cyclesService } from '../../services/cycles.service';
import { ventesService } from '../../services/ventes.service';
import { notificationsService, AppNotification } from '../../services/notifications.service';
import SidebarMobile from './SidebarMobile';
import { responsiveText } from '../../theme/designTokens';
import ConfirmModal from '../ConfirmModal';
import { Search } from '../search/Search';
import ProfilModal from '../ProfilModal';

interface NavItemProps {
  icon: React.ReactNode;
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

function SidebarNav({ onClose }: { onClose?: () => void }) {
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
        { icon: <FiCheckCircle />, label: 'À valider', path: '/a-valider', roles: ['admin', 'comptable'] },
        { icon: <FiAlertTriangle />, label: 'Risques', path: '/risques', roles: ['admin', 'employe'] },
        { icon: <FiFileText />, label: 'Bilans', path: '/bilans', roles: ['admin', 'comptable'] },
      ],
    },
  ];

  const navRef = useRef<HTMLDivElement>(null);

  return (
    <Box position="relative" flex={1} minH={0}>
      <VStack
        ref={navRef}
        spacing={0}
        align="stretch"
        overflowY="auto"
        px={2}
        py={2}
        h="100%"
        sx={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '::-webkit-scrollbar': { display: 'none' },
        }}
      >
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
                  onClick={() => { navigate(item.path); onClose?.(); }}
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
      <ScrollBar
        scrollRef={navRef}
        orientation="y"
        top={0}
        bottom={0}
        right={0}
        thumbCrossSize={4}
        thumbColor="accent.60"
      />
    </Box>
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

function Navbar({ onCalculatorOpen, onMobileMenuOpen, isMobileSidebarOpen }: { onCalculatorOpen: () => void; onMobileMenuOpen: () => void; isMobileSidebarOpen: boolean }) {
  const { colorMode, toggleThemeMode } = useThemeMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getAll();
      setNotifications(data);
    } catch {
      // Ignorer : la cloche reste vide si le service est indisponible.
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Flex
      as="nav"
      h="60px"
      bg="surface.1"
      borderBottom="1px solid"
      borderColor="border.1"
      px={{ base: 3, lg: 6 }}
      align="center"
      justify="space-between"
      flexShrink={0}
    >
      {/* Gauche : Hamburger (mobile) + Recherche complète (desktop) */}
      <HStack spacing={2}>
        <IconButton
          display={{ base: isMobileSidebarOpen ? 'none' : 'flex', lg: 'none' }}
          aria-label="Menu"
          icon={<FiMenu />}
          onClick={onMobileMenuOpen}
          variant="ghost"
          size="sm"
          color="text.2"
        />
        <Button
          display={{ base: 'none', lg: 'flex' }}
          size="sm"
          variant="ghost"
          justifyContent="space-between"
          w="200px"
          px={3}
          bg="surface.2"
          color="text.3"
          border="1px solid"
          borderColor="border.1"
          borderRadius="lg"
          _hover={{ bg: 'surface.3', borderColor: 'border.2' }}
          onClick={() => setShowSearch(true)}
        >
          <HStack spacing={2}>
            <FiSearch size={14} />
            <Text fontSize="xs">Rechercher...</Text>
          </HStack>
          <Kbd fontSize="10px">Ctrl + K</Kbd>
        </Button>
      </HStack>

      {/* Droite : Recherche icône (mobile) + Notifications + Calculatrice (desktop) + Thème + Avatar */}
      <HStack spacing={3}>
        <IconButton
          display={{ base: 'flex', lg: 'none' }}
          aria-label="Recherche"
          icon={<FiSearch />}
          variant="ghost"
          size="sm"
          color="text.2"
          onClick={() => setShowSearch(true)}
        />
        <Tooltip label="Notifications" placement="bottom">
          <Box
            position="relative"
            cursor="pointer"
            p={1}
            borderRadius="md"
            _hover={{ bg: 'surface.2' }}
            onClick={() => setShowNotifications(true)}
          >
            <IconButton
              aria-label="Notifications"
              icon={<FiBell size={18} />}
              size="sm"
              variant="ghost"
              color="text.2"
              pointerEvents="none"
            />
            {notifications.length > 0 && (
              <Badge
                position="absolute"
                top={0}
                right={0}
                bg="red.400"
                color="white"
                borderRadius="full"
                fontSize="10px"
                minW="18px"
                h="18px"
                px={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="2px solid"
                borderColor="surface.1"
              >
                {notifications.length}
              </Badge>
            )}
          </Box>
        </Tooltip>
        <Tooltip label="Calculatrice" placement="bottom">
          <Box position="relative" display={{ base: 'none', lg: 'flex' }}>
            <IconButton
              aria-label="Calculatrice"
              icon={<MdOutlineCalculate size={18} />}
              size="sm"
              variant="ghost"
              color="text.2"
              onClick={onCalculatorOpen}
            />
          </Box>
        </Tooltip>
        <IconButton
          display={{ base: 'none', lg: 'flex' }}
          aria-label="Changer de thème"
          icon={colorMode === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          size="sm"
          variant="ghost"
          color="text.2"
          onClick={toggleThemeMode}
        />
        {user && (
          <Menu>
            <MenuButton as={HStack} spacing={2} cursor="pointer" p={1} borderRadius="md" _hover={{ bg: 'surface.2' }}>
              <Box pointerEvents="auto">
                <UserAvatar name={`${user.nom} ${user.prenom || ''}`.trim()} size={28} src={user.photo ?? null} />
              </Box>
            </MenuButton>
            <MenuList bg="surface.1" borderColor="border.1">
              <MenuItem
                bg="transparent"
                _hover={{ bg: 'surface.2' }}
                icon={<FiUser />}
                onClick={() => setShowProfilModal(true)}
                fontSize={{ base: "md", md: "sm" }}
              >
                Profil
              </MenuItem>

              <MenuItem
                bg="transparent"
                _hover={{ bg: 'surface.2' }}
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                onClick={toggleThemeMode}
                display={{ base: 'flex', lg: 'none' }}
                fontSize={{ base: "md", md: "sm" }}
              >
                {colorMode === 'light' ? 'Mode sombre' : 'Mode clair'}
              </MenuItem>

              <MenuItem
                bg="transparent"
                _hover={{ bg: 'surface.2' }}
                icon={<FiLogOut />}
                color="danger.1"
                onClick={() => setShowLogoutConfirm(true)}
                fontSize={{ base: "md", md: "sm" }}
              >
                Déconnexion
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </HStack>

      <ProfilModal isOpen={showProfilModal} onClose={() => setShowProfilModal(false)} user={user} />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { logout(); navigate('/login'); }}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Déconnexion"
      />

      <DrawerNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onRefresh={fetchNotifications}
      />

      <Search
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </Flex>
  );
}

export default function DashboardLayout() {
  const [showCalculator, setShowCalculator] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar Desktop */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
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

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={200}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <Box
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        w="250px"
        bg="sidebar.bg"
        borderRight="1px solid"
        borderColor="sidebar.border"
        boxShadow="sidebar.shadow"
        zIndex={201}
        transform={isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}
        transition="transform 0.3s ease-in-out"
        display={{ base: 'block', lg: 'none' }}
      >
        <Flex h="100vh" flexDirection="column">
          {/* Bouton fermer */}
          <Box position="absolute" top={2} right={2} zIndex={10}>
            <IconButton
              aria-label="Fermer"
              // icon={<FiMenu />}
              variant="ghost"
              size="sm"
              color="sidebar.text"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </Box>

          {/* Bloc 1: Header */}
          <SidebarHeader />

          {/* Bloc 2: Navigation */}
          <SidebarNav onClose={() => setIsMobileSidebarOpen(false)} />

          {/* Bloc 3: User info */}
          <SidebarUser />
        </Flex>
      </Box>

      {/* Main content area */}
      <Flex flex={1} flexDirection="column" minW={0}>
        {/* Navbar */}
        <Navbar
          onCalculatorOpen={() => setShowCalculator(true)}
          onMobileMenuOpen={() => setIsMobileSidebarOpen(true)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        {/* Content */}
        <Box position="relative" flex={1} minH={0}>
          <Box
            ref={contentRef}
            h="100%"
            bg="surface.0"
            p={{ base: 3, lg: 6 }}
            overflow="auto"
            sx={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Outlet />
          </Box>
          <ScrollBar
            scrollRef={contentRef}
            orientation="y"
            top={0}
            bottom={0}
            right={0}
            thumbCrossSize={4}
            thumbColor="accent.60"
          />
        </Box>
      </Flex>

      <DrawerCalculate isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </Flex>
  );
}
