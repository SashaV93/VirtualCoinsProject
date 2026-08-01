import type { AiPayload, AiRecommendation } from '../types/coin';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = [
  'You are a crypto market analyst assisting a student project.',
  'Given a coin\'s market snapshot, decide whether the coin looks worth buying right now.',
  'Answer ONLY with JSON of the shape:',
  '{"worthBuying": true|false, "explanation": "one short paragraph, 2-4 sentences"}',
  'The explanation must justify the verdict using the numbers you were given',
  '(price trend over 30/60/200 days, market cap, and 24h trading volume).',
  'This is general market commentary for a learning exercise, not financial advice.',
].join(' ');

function buildPrompt(payload: AiPayload): string {
  return [
    `Here is the market snapshot for ${payload.name}:`,
    JSON.stringify(payload, null, 2),
    '',
    'Is it worth buying this coin right now? Reply with the JSON described in your instructions.',
  ].join('\n');
}

/**
 * Offline fallback: a transparent rule-based verdict from the same numbers we
 * would have sent to ChatGPT. Used when no OpenAI key is configured, so the
 * page still works end-to-end.
 */
export function localRecommendation(payload: AiPayload): AiRecommendation {
  const d30 = payload.price_change_percentage_30d_in_currency;
  const d60 = payload.price_change_percentage_60d_in_currency;
  const d200 = payload.price_change_percentage_200d_in_currency;

  // Recent momentum matters more than the long tail, hence the weights.
  const momentum = d30 * 0.5 + d60 * 0.3 + d200 * 0.2;
  const liquidity = payload.market_cap_usd > 0 ? payload.volume_24h_usd / payload.market_cap_usd : 0;
  const largeCap = payload.market_cap_usd >= 10_000_000_000;

  const worthBuying = momentum > 0 || (largeCap && momentum > -5 && liquidity > 0.02);

  const fmt = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const explanation = worthBuying
    ? `${payload.name} shows a weighted momentum score of ${momentum.toFixed(2)} ` +
      `(30d ${fmt(d30)}, 60d ${fmt(d60)}, 200d ${fmt(d200)}). ` +
      `With a market cap of $${payload.market_cap_usd.toLocaleString()} and $${payload.volume_24h_usd.toLocaleString()} traded in the last 24 hours ` +
      `(${(liquidity * 100).toFixed(2)}% of its cap), the coin is liquid enough to enter and exit a position. ` +
      `On these numbers alone it looks like a reasonable buy — but momentum can reverse quickly, so size the position accordingly.`
    : `${payload.name} shows a weighted momentum score of ${momentum.toFixed(2)} ` +
      `(30d ${fmt(d30)}, 60d ${fmt(d60)}, 200d ${fmt(d200)}), meaning it has been losing value across the periods that carry the most weight. ` +
      `Its 24h volume of $${payload.volume_24h_usd.toLocaleString()} against a $${payload.market_cap_usd.toLocaleString()} market cap ` +
      `does not point to fresh demand either. ` +
      `On these numbers alone it does not look like a buy right now; waiting for the trend to turn would be the safer call.`;

  return { worthBuying, explanation, source: 'local' };
}

/** API #5 — ask ChatGPT for the recommendation. */
export async function fetchAiRecommendation(
  payload: AiPayload,
  apiKey: string,
  model: string,
): Promise<AiRecommendation> {
  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(payload) },
        ],
      }),
    });
  } catch {
    throw new Error('Could not reach the OpenAI API — check your internet connection.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('OpenAI rejected the API key (401). Check the key in Settings.');
    if (res.status === 429) throw new Error('OpenAI rate limit or quota exceeded (429).');
    throw new Error(`OpenAI request failed (${res.status}). ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned an empty response.');

  let parsed: { worthBuying?: unknown; explanation?: unknown };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    throw new Error('OpenAI did not return valid JSON.');
  }

  return {
    worthBuying: Boolean(parsed.worthBuying),
    explanation:
      typeof parsed.explanation === 'string' && parsed.explanation.trim()
        ? parsed.explanation
        : 'No explanation was returned.',
    source: 'openai',
  };
}

/** Picks the real API when a key exists, otherwise the local rules. */
export async function getRecommendation(
  payload: AiPayload,
  apiKey: string,
  model: string,
): Promise<AiRecommendation> {
  if (apiKey.trim()) return fetchAiRecommendation(payload, apiKey.trim(), model);
  return localRecommendation(payload);
}
