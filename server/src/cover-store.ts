import { atomicRename } from './atomic-file.js';
import { mkdirSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { record, integer, text } from './engine/validation.js';

export type Cover = { id: string; name: string; tapeId: string; title: string; year: number; image: string; source?: string };
type Index = { version: 1; revision: number; covers: Cover[]; selected: Record<string, string> };
const TAPE_IDS = ['tape-indiana', 'tape-gremlins', 'tape-backfuture', 'tape-goonies'];
const defaultCovers: Cover[] = [
  { id: 'builtin-indiana', name: 'Indiana Jones â€” originale MyRoom', tapeId: 'tape-indiana', title: 'Indiana Jones', year: 1981, image: '/covers/videoclub/indiana-jones.svg' },
  { id: 'builtin-gremlins', name: 'Gremlins â€” originale MyRoom', tapeId: 'tape-gremlins', title: 'Gremlins', year: 1984, image: '/covers/videoclub/gremlins.svg' },
  { id: 'builtin-backfuture', name: 'Retour vers le futur â€” originale MyRoom', tapeId: 'tape-backfuture', title: 'Retour vers le futur', year: 1985, image: '/covers/videoclub/retour-vers-le-futur.svg' },
  { id: 'builtin-goonies', name: 'Les Goonies â€” originale MyRoom', tapeId: 'tape-goonies', title: 'Les Goonies', year: 1985, image: '/covers/videoclub/goonies.svg' },
];
export class CoverStore {
  private index: Index = { version: 1, revision: 0, covers: defaultCovers, selected: Object.fromEntries(defaultCovers.map(c => [c.tapeId, c.id])) };
  private dir: string; private filePath: string;
  constructor(dataDir: string) {
    this.dir = join(dataDir, 'covers'); this.filePath = join(this.dir, 'catalog.json'); mkdirSync(this.dir, { recursive: true });
    if (existsSync(this.filePath)) { const value = JSON.parse(readFileSync(this.filePath, 'utf8')); const data = record(value, ['version', 'revision', 'covers', 'selected']); if (data.version !== 1) throw Error('Catalogue de jaquettes inconnu.'); this.index = this.parse(data); }
  }
  private parse(value: Record<string, unknown>): Index {
    const covers = (value.covers as unknown[]).map(item => { const c = record(item, ['id','name','tapeId','title','year','image','source']); return { id: text(c.id, 80), name: text(c.name, 120), tapeId: text(c.tapeId, 64), title: text(c.title, 120), year: integer(c.year, 1900, 2200), image: text(c.image, 512), ...(c.source === undefined ? {} : { source: text(c.source, 512) }) }; });
    if (covers.length > 128) throw Error('Trop de jaquettes.');
    const selected = value.selected as Record<string, string>; if (!selected || typeof selected !== 'object') throw Error('SÃ©lection de jaquettes invalide.');
    return { version: 1, revision: integer(value.revision), covers, selected: Object.fromEntries(TAPE_IDS.map(id => [id, typeof selected[id] === 'string' && covers.some(c => c.id === selected[id] && c.tapeId === id) ? selected[id] : covers.find(c => c.tapeId === id)?.id ?? ''])) };
  }
  snapshot() { return structuredClone(this.index); }
  publicSnapshot() { const selected = Object.fromEntries(TAPE_IDS.map(id => { const id2 = this.index.selected[id]; return [id, this.index.covers.find(c => c.id === id2) ?? this.index.covers.find(c => c.tapeId === id)]; })); return { revision: this.index.revision, covers: this.index.covers, selected }; }
  private commit(next: Index) { next.revision = this.index.revision + 1; writeFileSync(this.filePath + '.tmp', JSON.stringify(next, null, 2), { mode: 0o600 }); atomicRename(this.filePath + '.tmp', this.filePath); this.index = next; }
  import(file: Buffer, filename: string, tapeId: string, title: string, year: number, contentType = "") { if (!TAPE_IDS.includes(tapeId) || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(contentType)) throw Error('Format de jaquette ou cassette invalide.'); if (file.length > 4 * 1024 * 1024) throw Error('Image trop volumineuse (4 Mio maximum).'); const safeTitle=text(title,120),safeYear=integer(year,1900,2200); const ext = filename.toLowerCase().endsWith('.png') ? 'png' : filename.toLowerCase().endsWith('.webp') ? 'webp' : filename.toLowerCase().endsWith('.svg') ? 'svg+xml' : 'jpeg'; const hash = createHash('sha256').update(file).digest('hex'); const id = `cover-${randomUUID()}`; const path = join(this.dir, `${hash}.${ext.replace('+xml','')}`); if (!existsSync(path)) writeFileSync(path + '.tmp', file, { mode: 0o600 }), atomicRename(path + '.tmp', path); const cover: Cover = { id, name: filename.slice(0, 120), tapeId, title:safeTitle, year:safeYear, image: `/api/covers/files/${hash}.${ext.replace('+xml','')}` }; this.commit({ ...this.index, covers: [...this.index.covers, cover], selected: { ...this.index.selected, [tapeId]: id } }); return cover; }
  update(value: unknown) { const data = record(value, ['revision','cover','selected']); if (integer(data.revision) !== this.index.revision) throw Error('Catalogue de jaquettes modifiÃ© ailleurs.'); const c = record(data.cover, ['id','tapeId','title','year']); const previous = this.index.covers.find(item => item.id === c.id); if (!previous) throw Error('Jaquette introuvable.'); const nextCover = { ...previous, tapeId: text(c.tapeId,64), title: text(c.title,120), year: integer(c.year,1900,2200) }; const selected = data.selected === true ? { ...this.index.selected, [nextCover.tapeId]: nextCover.id } : this.index.selected; this.commit({ ...this.index, covers: this.index.covers.map(item => item.id === nextCover.id ? nextCover : item), selected }); return nextCover; }
  publicFile(name: string) { return /^[a-f0-9]{64}\.(png|jpe?g|webp|svg)$/.test(name) ? join(this.dir, name) : undefined; }
}
