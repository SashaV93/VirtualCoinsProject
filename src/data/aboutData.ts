/**
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE — this is the only place the About page gets its content from.
 * Replace the placeholders with your real details, and drop your photo at
 * `public/profile.jpg` (then change `photo` below to '/profile.jpg').
 * ---------------------------------------------------------------------------
 */
export const about = {
  fullName: 'Your Full Name',
  title: 'Full Stack Web Developer',
  // Files in `public/` are referenced through BASE_URL so the app also works
  // when it is hosted under a sub-path (e.g. GitHub Pages project sites).
  photo: `${import.meta.env.BASE_URL}profile.svg`,
  email: 'you@example.com',
  phone: '+972-50-000-0000',
  location: 'Israel',
  github: 'https://github.com/your-username',
  linkedin: 'https://www.linkedin.com/in/your-profile/',

  intro:
    'Full Stack Web Development student at John Bryce. I enjoy turning raw APIs into ' +
    'interfaces that feel obvious to use, and I care about clean state management ' +
    'and code that the next developer can read.',

  projectDescription:
    'Cryptonite is a single-page application that tracks the top 100 virtual coins. ' +
    'The home page lists every coin as a card with a live search that filters locally, ' +
    'without hitting the server. Each card can expand to show the coin price in USD, EUR ' +
    'and ILS, and can be switched on to track it. Up to five coins can be tracked at once; ' +
    'trying to add a sixth opens a dialog that lets you swap one out. Tracked coins feed ' +
    'two more pages: a live report that redraws a chart every second from a single batched ' +
    'API call, and an AI page that asks ChatGPT whether each coin is worth buying.',

  stack: [
    'React 19',
    'TypeScript',
    'Redux Toolkit',
    'React Router',
    'Material UI',
    'Recharts',
    'Vite',
  ],

  apis: [
    { name: 'CoinGecko — markets', use: 'The 100 coins on the home page' },
    { name: 'CoinGecko — coin details', use: 'USD / EUR / ILS prices behind "More Info"' },
    { name: 'CryptoCompare — pricemulti', use: 'One batched live price call per second' },
    { name: 'CoinGecko — market data', use: 'The numbers sent to ChatGPT' },
    { name: 'OpenAI — chat completions', use: 'The buy / avoid recommendation' },
  ],
};
