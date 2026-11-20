/** Shared naming presets; saving still uses the authoritative names command. */
export const TEAM_LEON = ['Léon', 'Reno', 'Fabien', 'Nico'] as const;
export const CHARACTER_NAMES = [
  'Batman', 'Superman', 'Wonder Woman', 'Spider-Man', 'Iron Man', 'Hulk',
  'Thor', 'Black Panther', 'Captain Marvel', 'Wolverine', 'Mickey', 'Minnie',
  'Donald', 'Dingo', 'Daisy', 'Pluto', 'Simba', 'Nala', 'Timon', 'Pumbaa',
  'Elsa', 'Anna', 'Olaf', 'Aladdin', 'Jasmine', 'Génie', 'Mulan', 'Stitch',
  'Blanche-Neige', 'Prof', 'Grincheux', 'Joyeux', 'Dormeur', 'Timide',
  'Atchoum', 'Simplet', 'Woody', 'Buzz', 'Vaiana', 'Raiponce',
] as const;

export function randomPlayerNames(random: () => number = Math.random): string[] {
  const pool: string[] = [...CHARACTER_NAMES];
  return Array.from({ length: 4 }, () => {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw Error('Invalid random sample');
    return pool.splice(Math.floor(sample * pool.length), 1)[0]!;
  });
}
