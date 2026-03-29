const ADJECTIVES = ['Iron', 'Silent', 'Copper', 'Amber', 'Swift', 'Stone', 'Quiet', 'Bright'];
const NOUNS = ['Falcon', 'River', 'Thorn', 'Cedar', 'Crane', 'Dusk', 'Ember', 'Basin'];

export function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}
