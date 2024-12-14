'use client';

import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo = ({ width = 150, height = 50 }: LogoProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/');
  };

  const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSI0MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CiAgPHRleHQgeD0iMjUiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSI+V09PU0VMTDwvdGV4dD4KPC9zdmc+';

  return (
    <Box
      component="div"
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'black',
        padding: '8px 16px',
        borderRadius: '4px',
        '&:hover': {
          opacity: 0.9,
        },
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <Image
        src={logoBase64}
        alt="Woosell Logo"
        width={width}
        height={height}
        priority
        style={{
          filter: 'brightness(1)',
        }}
      />
    </Box>
  );
};

export default Logo;
