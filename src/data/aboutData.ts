/**
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE — this is the only place the About page gets its content from.
 * To use a real photo, drop it at `public/profile.jpg` and change `photo` below
 * to `${import.meta.env.BASE_URL}profile.jpg`.
 * ---------------------------------------------------------------------------
 */
export const about = {
  fullName: 'Sasha Visloushkin',
  title: 'Full Stack Web Developer',
  // Files in `public/` are referenced through BASE_URL so the app also works
  // when it is hosted under a sub-path (e.g. GitHub Pages project sites).
  photo: `${import.meta.env.BASE_URL}profile.svg`,
  email: 'kasandravis93@gmail.com',
  location: 'Israel',

  projectDescription:
    'Cryptonite is a single-page application that tracks the top 100 virtual coins. ' +
    'The home page lists every coin as a card with a live search that filters locally, ' +
    'without hitting the server. Each card can expand to show the coin price in USD, EUR ' +
    'and ILS, and can be switched on to track it. Up to five coins can be tracked at once; ' +
    'trying to add a sixth opens a dialog that lets you swap one out. Tracked coins feed ' +
    'two more pages: a live report that redraws a chart every second from a single batched ' +
    'API call, and an AI page that asks ChatGPT whether each coin is worth buying.',
};
