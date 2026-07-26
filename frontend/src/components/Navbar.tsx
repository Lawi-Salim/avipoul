import { useState } from 'react';
import { Box, HStack, IconButton, Text, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FiSun, FiMoon, FiLogOut, FiUser, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import { useThemeMode } from '../theme/ThemeMode';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../utils/Avatars';
import { useNavigate } from 'react-router-dom';
import ProfilModal from './ProfilModal';

export default function Navbar() {
  const { colorMode, toggleThemeMode } = useThemeMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfilModal, setShowProfilModal] = useState(false);

  return (
    <>
    <Box
      as="nav"
      bg="surface.1"
      borderBottom="1px solid"
      borderColor="border.1"
      px={4}
      py={2}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <HStack justify="space-between" maxW="1400px" mx="auto">
        <HStack spacing={4}>
          <HStack
            spacing={2}
            cursor="pointer"
            onClick={() => navigate('/cycles')}
            _hover={{ opacity: 0.8 }}
          >
            <Text fontSize="lg" fontWeight="bold" color="accent.1">
              AVIPOUL
            </Text>
          </HStack>

          <HStack spacing={1}>
            <Box
              as="button"
              px={3}
              py={1}
              borderRadius="md"
              fontSize="sm"
              color="text.2"
              _hover={{ bg: 'surface.2' }}
              onClick={() => navigate('/depenses')}
            >
              <HStack spacing={1}>
                <FiDollarSign />
                <Text display={{ base: 'none', md: 'block' }}>Depenses</Text>
              </HStack>
            </Box>
            <Box
              as="button"
              px={3}
              py={1}
              borderRadius="md"
              fontSize="sm"
              color="text.2"
              _hover={{ bg: 'surface.2' }}
              onClick={() => navigate('/ventes')}
            >
              <HStack spacing={1}>
                <FiShoppingBag />
                <Text display={{ base: 'none', md: 'block' }}>Ventes</Text>
              </HStack>
            </Box>
          </HStack>
        </HStack>

        <HStack spacing={3}>
          <IconButton
            aria-label="Changer de theme"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleThemeMode}
            variant="ghost"
            size="sm"
            color="text.2"
            display={{ base: 'none', md: 'flex' }}
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
                  display={{ base: 'flex', md: 'none' }}
                  fontSize={{ base: "md", md: "sm" }}
                >
                  {colorMode === 'light' ? 'Mode sombre' : 'Mode clair'}
                </MenuItem>

                <MenuItem
                  bg="transparent"
                  _hover={{ bg: 'surface.2' }}
                  icon={<FiLogOut />}
                  color="danger.1"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  fontSize={{ base: "md", md: "sm" }}
                >
                  Déconnexion
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </HStack>
      </HStack>
    </Box>

    <ProfilModal isOpen={showProfilModal} onClose={() => setShowProfilModal(false)} user={user} />
    </>
  );
}
