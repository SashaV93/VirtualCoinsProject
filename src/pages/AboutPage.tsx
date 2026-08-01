import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import {
  Box,
  Chip,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
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
            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary', maxWidth: 520 }}>
              {about.intro}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Contact
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          <Chip icon={<EmailIcon />} label={about.email} component="a" href={`mailto:${about.email}`} clickable />
          <Chip icon={<PhoneIcon />} label={about.phone} />
          <Chip icon={<PlaceIcon />} label={about.location} />
          <Chip
            icon={<GitHubIcon />}
            label="GitHub"
            component="a"
            href={about.github}
            target="_blank"
            rel="noopener noreferrer"
            clickable
          />
          <Chip
            icon={<LinkedInIcon />}
            label="LinkedIn"
            component="a"
            href={about.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            clickable
          />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          About this project
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
          {about.projectDescription}
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
          Built with
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          {about.stack.map((tech) => (
            <Chip key={tech} label={tech} variant="outlined" color="primary" size="small" />
          ))}
        </Stack>

        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
          Data sources
        </Typography>
        <Stack spacing={0.75}>
          {about.apis.map((api) => (
            <Stack
              key={api.name}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ sm: 1 }}
              sx={{ color: 'text.secondary' }}
            >
              <Typography variant="body2" sx={{ minWidth: 260, fontWeight: 600, color: 'text.primary' }}>
                {api.name}
              </Typography>
              <Typography variant="body2">{api.use}</Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Source code:{' '}
          <Link href={about.github} target="_blank" rel="noopener noreferrer">
            {about.github}
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
