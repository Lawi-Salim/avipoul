import { Box } from '@chakra-ui/react';
import { GiChicken, GiRawEgg, GiWheat, GiWaterDrop, GiFeather } from 'react-icons/gi';
import type { IconType } from 'react-icons';

interface Motif {
  icon: IconType;
  top: string;
  left: string;
  size: number;
  rotate: number;
  opacity: number;
}

// Positions fixes et irrégulières — volontairement pas une grille,
// pour un effet plus organique. Ajuste/ajoute des entrées librement.
const motifs: Motif[] = [
  { icon: GiRawEgg, top: '8%', left: '6%', size: 32, rotate: -12, opacity: 0.10 },
  { icon: GiFeather, top: '14%', left: '22%', size: 30, rotate: 25, opacity: 0.09 },
  { icon: GiWaterDrop, top: '6%', left: '40%', size: 31, rotate: 8, opacity: 0.10 },
  { icon: GiWheat, top: '10%', left: '58%', size: 33, rotate: -6, opacity: 0.09 },
  { icon: GiRawEgg, top: '16%', left: '76%', size: 29, rotate: 15, opacity: 0.10 },
  { icon: GiChicken, top: '5%', left: '90%', size: 30, rotate: -20, opacity: 0.09 },
  { icon: GiWaterDrop, top: '18%', left: '34%', size: 32, rotate: 8, opacity: 0.10 },
  { icon: GiWaterDrop, top: '24%', left: '12%', size: 30, rotate: 18, opacity: 0.10 },

  { icon: GiWheat, top: '22%', left: '46%', size: 31, rotate: 10, opacity: 0.09 },
  { icon: GiChicken, top: '26%', left: '68%', size: 30, rotate: -10, opacity: 0.09 },
  { icon: GiChicken, top: '28%', left: '80%', size: 32, rotate: -10, opacity: 0.09 },
  { icon: GiWheat, top: '30%', left: '4%', size: 30, rotate: 10, opacity: 0.09 },
  { icon: GiWaterDrop, top: '36%', left: '90%', size: 30, rotate: -15, opacity: 0.10 },
  { icon: GiFeather, top: '34%', left: '28%', size: 30, rotate: 30, opacity: 0.09 },
  { icon: GiRawEgg, top: '42%', left: '12%', size: 31, rotate: -8, opacity: 0.09 },
  { icon: GiFeather, top: '46%', left: '82%', size: 29, rotate: 30, opacity: 0.09 },

  { icon: GiRawEgg, top: '52%', left: '24%', size: 32, rotate: 6, opacity: 0.10 },
  { icon: GiWaterDrop, top: '56%', left: '46%', size: 30, rotate: 18, opacity: 0.10 },
  { icon: GiWheat, top: '50%', left: '56%', size: 29, rotate: 10, opacity: 0.09 },
  { icon: GiWheat, top: '48%', left: '70%', size: 31, rotate: 10, opacity: 0.09 },
  { icon: GiWaterDrop, top: '60%', left: '6%', size: 30, rotate: 18, opacity: 0.10 },
  { icon: GiChicken, top: '66%', left: '88%', size: 32, rotate: -10, opacity: 0.09 },
  { icon: GiChicken, top: '64%', left: '30%', size: 31, rotate: -10, opacity: 0.09 },
  { icon: GiFeather, top: '64%', left: '74%', size: 30, rotate: -25, opacity: 0.09 },
  { icon: GiRawEgg, top: '70%', left: '40%', size: 30, rotate: -8, opacity: 0.10 },
  { icon: GiRawEgg, top: '72%', left: '18%', size: 30, rotate: 6, opacity: 0.10 },
  { icon: GiFeather, top: '76%', left: '70%', size: 31, rotate: -25, opacity: 0.09 },

  { icon: GiRawEgg, top: '78%', left: '8%', size: 30, rotate: 6, opacity: 0.10 },
  { icon: GiChicken, top: '82%', left: '32%', size: 29, rotate: 12, opacity: 0.09 },
  { icon: GiRawEgg, top: '84%', left: '78%', size: 31, rotate: -14, opacity: 0.10 },
  { icon: GiWheat, top: '88%', left: '10%', size: 29, rotate: 12, opacity: 0.09 },
  { icon: GiRawEgg, top: '90%', left: '44%', size: 30, rotate: -14, opacity: 0.10 },
  { icon: GiWaterDrop, top: '86%', left: '62%', size: 32, rotate: 20, opacity: 0.10 },
  { icon: GiRawEgg, top: '96%', left: '24%', size: 29, rotate: -8, opacity: 0.10 },
  { icon: GiFeather, top: '92%', left: '92%', size: 30, rotate: -18, opacity: 0.09 },
];

export default function PoultryBackground() {
  return (
    <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
      {motifs.map((m, i) => (
        <Box
          key={i}
          as={m.icon}
          position="absolute"
          top={m.top}
          left={m.left}
          boxSize={`${m.size}px`}
          color="accent.1"
          opacity={m.opacity}
          transform={`rotate(${m.rotate}deg)`}
        />
      ))}
    </Box>
  );
}
