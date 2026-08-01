import EmailIcon from '@mui/icons-material/Email';
import PlaceIcon from '@mui/icons-material/Place';
import { Box, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { about } from '../data/aboutData';

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <Box
            component="img"
            src={about.photo}
            alt={about.fullName}
            // Until public/profile.jpg is added, fall back to the placeholder
            // rather than showing a broken image.
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== about.photoFallback) img.src = about.photoFallback;
            }}
            sx={{
              width: 148,
              height: 148,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(240,185,11,0.6)',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {about.fullName}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
              {about.title}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Contact
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <Chip
            icon={<EmailIcon />}
            label={about.email}
            component="a"
            href={`mailto:${about.email}`}
            clickable
          />
          <Chip icon={<PlaceIcon />} label={about.location} />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          About this project
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
          {about.projectDescription}
        </Typography>
      </Paper>
    </Container>
  );
}
