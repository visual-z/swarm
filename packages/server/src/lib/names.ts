const ADJECTIVES = [
  'Swift', 'Bright', 'Silent', 'Cosmic', 'Emerald',
  'Golden', 'Crimson', 'Azure', 'Lunar', 'Solar',
  'Iron', 'Crystal', 'Shadow', 'Amber', 'Silver',
  'Frost', 'Thunder', 'Velvet', 'Obsidian', 'Sapphire',
  'Neon', 'Scarlet', 'Cobalt', 'Jade', 'Onyx',
  'Radiant', 'Vivid', 'Blazing', 'Mystic', 'Nimble',
  'Rapid', 'Keen', 'Bold', 'Calm', 'Fierce',
  'Noble', 'Phantom', 'Primal', 'Quiet', 'Royal',
  'Stark', 'Turbo', 'Ultra', 'Warp', 'Zenith',
  'Dusk', 'Dawn', 'Storm', 'Coral', 'Rune',
  'Polar', 'Titan', 'Echo', 'Nova', 'Apex',
];

const NOUNS = [
  'Falcon', 'Phoenix', 'Cascade', 'Nebula', 'Prism',
  'Vortex', 'Cipher', 'Beacon', 'Spark', 'Pulse',
  'Quasar', 'Raven', 'Lynx', 'Panda', 'Otter',
  'Hawk', 'Wolf', 'Tiger', 'Cobra', 'Eagle',
  'Arrow', 'Blade', 'Forge', 'Nexus', 'Orbit',
  'Shard', 'Flux', 'Drift', 'Comet', 'Flare',
  'Bolt', 'Surge', 'Wave', 'Reef', 'Peak',
  'Ridge', 'Mesa', 'Dune', 'Grove', 'Crest',
  'Arc', 'Gate', 'Lens', 'Core', 'Node',
  'Link', 'Atlas', 'Helix', 'Opal', 'Pixel',
  'Vertex', 'Lotus', 'Sonic', 'Rogue', 'Sage',
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDisplayName(): string {
  return `${pickRandom(ADJECTIVES)}${pickRandom(NOUNS)}`;
}
