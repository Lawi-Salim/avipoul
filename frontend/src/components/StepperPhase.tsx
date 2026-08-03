import { Fragment } from 'react';
import { Box, HStack, Text, VStack, useBreakpointValue } from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';

export interface PhaseStep {
  value: string;
  label: string;
  abbr?: string;
}

interface StepperPhaseProps {
  phases: PhaseStep[];
  current: string;
  completed?: boolean;
}

export default function StepperPhase({
  phases,
  current,
  completed = false,
}: StepperPhaseProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const currentIndex = completed ? phases.length : phases.findIndex((p) => p.value === current);

  return (
    <HStack spacing={0} w="100%" align="flex-start">
      {phases.map((phase, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <Fragment key={phase.value}>
            <VStack flex="1" spacing={1.5} align="center" minW={0}>
              <Box
                w={8}
                h={8}
                borderRadius="full"
                borderWidth="2px"
                borderColor={isCurrent ? 'accent.1' : isPast ? 'success.1' : 'border.1'}
                bg={isPast ? 'success.1' : isCurrent ? 'accent.1' : 'transparent'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isPast || completed ? (
                  <FiCheck color="white" size={14} />
                ) : isCurrent ? (
                  <Box w={2.5} h={2.5} borderRadius="full" bg="white" />
                ) : (
                  <Box w={2} h={2} borderRadius="full" bg="border.2" />
                )}
              </Box>
              <Text
                fontSize="xs"
                color={isCurrent ? 'accent.1' : isPast ? 'success.1' : 'text.3'}
                fontWeight={isCurrent ? 'bold' : 'normal'}
                textAlign="center"
                noOfLines={1}
              >
                {isMobile ? (phase.abbr ?? phase.label) : phase.label}
              </Text>
            </VStack>
            {i < phases.length - 1 && (
              <Box
                flex="1"
                mt="15px"
                h="2px"
                bg={i < currentIndex ? 'success.1' : 'border.1'}
                borderRadius="full"
              />
            )}
          </Fragment>
        );
      })}
    </HStack>
  );
}
