import type { FileItem, ForumTopic, Game, Profile, Tutorial, Video } from "@/lib/types";
import { templatesEnabled } from "@/lib/data/settings";

/**
 * Konten template (pratinjau) — ditampilkan HANYA bila admin mengaktifkan
 * "Konten template" di Pengaturan → Tampilan situs.
 *
 * Prinsip:
 * - Konten asli SELALU tampil; template hanya DITAMBAHKAN ke akhir daftar
 *   (tidak pernah menggeser, menimpa, atau menghapus postingan nyata).
 * - Semua entitas memakai prefix id/slug "tpl-" → mustahil tabrakan dengan
 *   data asli di database.
 * - Ditandai `is_template: true` → kartu menampilkan pill "Contoh" dan
 *   halaman detail menampilkan notifikasi template.
 * - Video memakai video channel DeepCrips yang asli (thumbnail & embed
 *   bekerja), sehingga pratinjau terlihat hidup tanpa tautan rusak.
 */

export const TEMPLATE_PREFIX = "tpl-";

export function isTemplateId(id: string): boolean {
  return id.startsWith(TEMPLATE_PREFIX);
}

/** Gabungkan template ke daftar: dedupe by id, opsional hormati `limit`. */
export function withTemplates<T extends { id: string }>(items: T[], pool: T[], limit?: number): T[] {
  const seen = new Set(items.map((i) => i.id));
  const extras = pool.filter((e) => !seen.has(e.id));
  if (extras.length === 0) return items;
  const merged = [...items, ...extras];
  return limit === undefined ? merged : merged.slice(0, limit);
}

/** Cari entri template berdasar slug (halaman detail). */
export function findTemplateBySlug<T extends { slug: string }>(pool: T[], slug: string): T | null {
  return pool.find((t) => t.slug === slug) ?? null;
}

/** Cari entri template berdasar id (forum memakai id di URL). */
export function findTemplateById<T extends { id: string }>(pool: T[], id: string): T | null {
  return pool.find((t) => t.id === id) ?? null;
}

/** Gabungkan template bila toggle aktif — dipakai fungsi data publik. */
export async function fillTemplates<T extends { id: string }>(
  items: T[],
  pool: T[],
  limit?: number
): Promise<T[]> {
  if (!(await templatesEnabled())) return items;
  return withTemplates(items, pool, limit);
}

// ---------------------------------------------------------------------------
// Penulis contoh (hanya tampil di template forum)
// ---------------------------------------------------------------------------
const AUTHORS: Record<string, Profile> = {
  raka: {
    id: "tpl-author-raka",
    display_name: "Raka Pratama",
    avatar_url: null,
    bio: null,
    created_at: "2026-09-01T00:00:00.000Z",
  },
  dewi: {
    id: "tpl-author-dewi",
    display_name: "Dewi Anggraini",
    avatar_url: null,
    bio: null,
    created_at: "2026-09-05T00:00:00.000Z",
  },
  bima: {
    id: "tpl-author-bima",
    display_name: "Bima Saputra",
    avatar_url: null,
    bio: null,
    created_at: "2026-09-10T00:00:00.000Z",
  },
};

const PUBLISHED = "2026-10-15T08:00:00.000Z";

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------
export const TEMPLATE_GAMES: Game[] = [
  {
    id: "tpl-game-elden-ring",
    slug: "tpl-game-elden-ring",
    title: "Elden Ring",
    summary:
      "ARPG dunia terbuka karya FromSoftware — jelajahi Lands Between, tantang bos ikonik, dan temukan rahasia dunia yang luas.",
    description:
      "Elden Ring memadukan dunia terbuka luas dengan desain level khas Souls-like.\n\n## Fitur utama\n- Dunia terbuka tanpa layar muat antar wilayah\n- Kustomisasi build bebas tanpa kelas\n- Kooperatif dan PvP online\n\n> Halaman ini bagian dari konten template contoh.",
    cover_url: null,
    genre: "Action RPG",
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
  {
    id: "tpl-game-mlbb",
    slug: "tpl-game-mlbb",
    title: "Mobile Legends: Bang Bang",
    summary:
      "Game MOBA 5v5 paling populer di Indonesia — hero, strategi tim, dan turnamen esports rutin setiap musim.",
    description:
      "Mobile Legends dimainkan dalam format 5v5 dengan tujuan menghancurkan base lawan.\n\n## Fitur utama\n- Lebih dari 100 hero dengan role berbeda\n- Mode ranking dan turnamen esports\n- Kustomisasi skin dan emblem\n\n> Halaman ini bagian dari konten template contoh.",
    cover_url: null,
    genre: "MOBA",
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
  {
    id: "tpl-game-cyberpunk",
    slug: "tpl-game-cyberpunk",
    title: "Cyberpunk 2077",
    summary:
      "RPG dunia terbuka bertema futuristik di Night City — pilih jalur netrunner, solo, atau techie.",
    description:
      "Cyberpunk 2077 membawa kota Night City yang padat dan hidup dengan pilihan cerita yang berbuntut panjang.\n\n## Fitur utama\n- Pilihan dialog memengaruhi jalan cerita\n- Modifikasi cyberware untuk gaya bermain\n- Dunia terbuka dengan aktivitas sampingan\n\n> Halaman ini bagian dari konten template contoh.",
    cover_url: null,
    genre: "Open World RPG",
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
];

// ---------------------------------------------------------------------------
// File unduhan
// ---------------------------------------------------------------------------
export const TEMPLATE_FILES: FileItem[] = [
  {
    id: "tpl-file-save-elden",
    slug: "tpl-file-save-elden-ring",
    game_id: "tpl-game-elden-ring",
    title: "Save File 100% — Elden Ring",
    summary: "Slot save lengkap dengan semua bos terkalahkan dan karakter siap NG+ (contoh).",
    description:
      "Save file contoh berisi progres 100%. Salin file save ke folder %APPDATA%\\EldenRing sebelum memulai game.\n\n> Konten template — unduhan nyata aktif setelah admin menerbitkan file asli.",
    category: "other",
    size_bytes: 48_318_382,
    source_info: "Kontributor komunitas (contoh).",
    security_notes: "Selalu backup save asli sebelum menimpa.",
    check_status: "manual_review",
    check_notes: "Ditinjau manual oleh admin (contoh).",
    screenshots: [],
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: TEMPLATE_GAMES[0],
    is_template: true,
  },
  {
    id: "tpl-file-fps-mod",
    slug: "tpl-file-fps-boost-gta-v",
    game_id: null,
    title: "FPS Boost Mod Pack — GTA V",
    summary: "Paket pengaturan grafis untuk PC kentang agar FPS lebih stabil (contoh).",
    description:
      "Kumpulan file konfigurasi untuk menaikkan performa GTA V di perangkat menengah.\n\n> Konten template.",
    category: "mod",
    size_bytes: 12_582_912,
    source_info: "Komunitas (contoh).",
    security_notes: "Matikan mod lain sebelum memasang paket ini.",
    check_status: "unverified",
    check_notes: null,
    screenshots: [],
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
  {
    id: "tpl-file-speedy-cursor",
    slug: "tpl-file-speedy-cursor-tool",
    game_id: null,
    title: "Speedy Cursor Tool — Windows",
    summary: "Utilitas kecil untuk mengatur kecepatan kursor & scroll (contoh).",
    description:
      "Tool portabel tanpa instalasi untuk penyesuaian pointer dan scroll wheel.\n\n> Konten template.",
    category: "tools",
    size_bytes: 1_048_576,
    source_info: "Pengembang pihak ketiga (contoh).",
    security_notes: "Unduh hanya dari host resmi yang tercantum.",
    check_status: "hash_matched",
    check_notes: "SHA-256 cocok (contoh).",
    screenshots: [],
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
  {
    id: "tpl-file-obs-scene",
    slug: "tpl-file-obs-scene-pack",
    game_id: null,
    title: "OBS Scene Pack untuk Streamer Pemula",
    summary: "Kumpulan scene OBS siap pakai: starting, break, dan ending (contoh).",
    description:
      "Impor file scene ke OBS Studio untuk tampilan stream yang rapi dalam hitungan menit.\n\n> Konten template.",
    category: "script",
    size_bytes: 3_145_728,
    source_info: "DeepCrips Hub (contoh).",
    security_notes: "Periksa kembali URL yang disisipkan sebelum live.",
    check_status: "manual_review",
    check_notes: "Ditinjau manual oleh admin (contoh).",
    screenshots: [],
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
];

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------
export const TEMPLATE_TUTORIALS: Tutorial[] = [
  {
    id: "tpl-tutorial-mod-gta",
    slug: "tpl-tutorial-install-mod-gta-v",
    title: "Cara Install Mod GTA V dengan Aman",
    summary:
      "Langkah demi langkah memasang mod tanpa merusak save game — dari unduhan hingga uninstall.",
    body: "Mod membuat GTA V terasa baru, tapi pemasangan yang salah bisa membuat game crash.\n\n## 1. Siapkan folder mod\nBuat folder `mods/` sebagai salinan aman dari file asli.\n\n## 2. Pasang script hook\nJalankan installer dan pastikan versi sesuai dengan versi game.\n\n## 3. Urutkan mod dengan benar\nMod yang dimuat terakhir biasanya menimpa mod sebelumnya.\n\n## 4. Backup save\nSalin folder `%USERPROFILE%\\Documents\\Rockstar Games\\GTA V\\Profiles` sebelum bermain.\n\n> Halaman ini adalah konten template contoh.",
    category: "Panduan Modding",
    game_id: null,
    cover_url: null,
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
  {
    id: "tpl-tutorial-windows-gaming",
    slug: "tpl-tutorial-optimasi-windows-gaming",
    title: "Optimasi Windows untuk Gaming: 7 Setelan Wajib",
    summary:
      "Matikan fitur yang menguras performa, atur power plan, dan raih FPS ekstra tanpa upgrade hardware.",
    body: "Sebagian besar FPS yang hilang di Windows berasal dari fitur yang jarang disadari.\n\n## 1. Power plan ke High Performance\n## 2. Matikan game DVR & background recording\n## 3. Nonaktifkan aplikasi startup yang tidak perlu\n## 4. Update driver grafis dari situs resmi\n## 5. Aktifkan Hardware-Accelerated GPU Scheduling\n## 6. Atur game ke High Performance di Graphics settings\n## 7. Bersihkan drive secara berkala\n\n> Halaman ini adalah konten template contoh.",
    category: "Tips Windows",
    game_id: null,
    cover_url: null,
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
  {
    id: "tpl-tutorial-obs-stream",
    slug: "tpl-tutorial-streaming-obs-youtube",
    title: "Streaming Pertama di YouTube dengan OBS",
    summary:
      "Dari pengaturan encoder, bitrate, hingga overlay agar stream pertama tampil profesional.",
    body: "Streaming pertama terasa rumit, padahal hanya butuh beberapa pengaturan kunci.\n\n## 1. Sambungkan akun YouTube\nGunakan *Stream Key* dari YouTube Studio, bukan yang lama.\n\n## 2. Atur encoder\nEncoder x264 untuk CPU kuat, NVENC bila punya kartu grafis NVIDIA.\n\n## 3. Bitrate\nMulai dari 4500–6000 Kbps untuk 1080p60.\n\n## 4. Overlay sederhana\nBanner mulai, chat box, dan kamera sudah cukup untuk awal.\n\n> Halaman ini adalah konten template contoh.",
    category: "Konten Kreator",
    game_id: null,
    cover_url: null,
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    game: null,
    is_template: true,
  },
];

// ---------------------------------------------------------------------------
// Video (video asli channel DeepCrips — thumbnail & embed bekerja)
// ---------------------------------------------------------------------------
export const TEMPLATE_VIDEOS: Video[] = [
  {
    id: "tpl-video-7peczevuimk",
    slug: "tpl-video-tutor-seki",
    title: "Tutor Seki",
    description: null,
    video_url: "https://www.youtube.com/watch?v=7peczEvUimk",
    thumbnail_url: null,
    category: "Channel",
    game_id: null,
    duration_seconds: null,
    status: "published",
    published_at: "2023-04-29T13:58:23.000Z",
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
  {
    id: "tpl-video-5mhe6qrbze",
    slug: "tpl-video-ctf-writeup",
    title: "Atera Akroti Tyorya Bir Skoletra — P1 | CTF 004",
    description: null,
    video_url: "https://www.youtube.com/watch?v=5mhe6-qrbZE",
    thumbnail_url: null,
    category: "Channel",
    game_id: null,
    duration_seconds: null,
    status: "published",
    published_at: "2022-06-29T14:08:52.000Z",
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
  {
    id: "tpl-video-lncz28mfu1o",
    slug: "tpl-video-redevelop-bren",
    title: "Redevelop — BREN (Lagu Gabut)",
    description: null,
    video_url: "https://www.youtube.com/watch?v=lnCZ28Mfu1o",
    thumbnail_url: null,
    category: "Channel",
    game_id: null,
    duration_seconds: null,
    status: "published",
    published_at: "2023-04-05T04:33:29.000Z",
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
  {
    id: "tpl-video-ukcpq7cyy",
    slug: "tpl-video-scas-drawing",
    title: "SCAS: The First Drawing",
    description: null,
    video_url: "https://www.youtube.com/watch?v=UKCPq7C_yyY",
    thumbnail_url: null,
    category: "Channel",
    game_id: null,
    duration_seconds: null,
    status: "published",
    published_at: "2022-06-29T07:49:56.000Z",
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    is_template: true,
  },
];

// ---------------------------------------------------------------------------
// Topik forum
// ---------------------------------------------------------------------------
export const TEMPLATE_TOPICS: ForumTopic[] = [
  {
    id: "tpl-topic-build-pc",
    slug: "tpl-topic-build-pc",
    title: "Rekomendasi build PC 10 juta untuk gaming 1440p",
    body: "Halo semua, saya mau rakit PC dengan budget 10 juta untuk main game di resolusi 1440p.\n\nRencana kasar:\n- CPU: Ryzen 5 7600\n- GPU: RX 7700 XT\n- RAM: 32GB DDR5\n- SSD: 1TB NVMe\n\nMenurut kalian ada yang perlu diganti supaya seimbang?",
    author_id: AUTHORS.raka.id,
    author: AUTHORS.raka,
    game_id: null,
    game: null,
    hidden: false,
    locked: false,
    reaction_count: 14,
    comment_count: 8,
    hotness_score: 32.5,
    last_activity_at: "2026-10-20T10:00:00.000Z",
    created_at: "2026-10-18T09:00:00.000Z",
    updated_at: "2026-10-20T10:00:00.000Z",
    is_template: true,
  },
  {
    id: "tpl-topic-safe-download",
    slug: "tpl-topic-safe-download",
    title: "Cara aman memilih situs download mod — ada tips?",
    body: "Akhir-akhir ini banyak mod yang ternyata membawa file mencurigakan.\n\nKebiasaan saya sekarang: cek reputasi situs, baca komentar terbaru, dan scan file sebelum dieksekusi. Ada praktik lain yang biasa kalian lakukan?",
    author_id: AUTHORS.dewi.id,
    author: AUTHORS.dewi,
    game_id: null,
    game: null,
    hidden: false,
    locked: false,
    reaction_count: 9,
    comment_count: 5,
    hotness_score: 21.2,
    last_activity_at: "2026-10-19T14:30:00.000Z",
    created_at: "2026-10-17T11:00:00.000Z",
    updated_at: "2026-10-19T14:30:00.000Z",
    is_template: true,
  },
  {
    id: "tpl-topic-mouse-budget",
    slug: "tpl-topic-mouse-budget",
    title: "Review mouse gaming budget 300 ribuan: worth it?",
    body: "Baru coba mouse gaming sekitar 300 ribu dan cukup terkejut dengan sensornya.\n\nYang saya suka: ringan, switch kliknya tajam. Yang kurang: kabelnya kaku.\n\nAda yang pakai seri sama? Gimana daya tahannya?",
    author_id: AUTHORS.bima.id,
    author: AUTHORS.bima,
    game_id: null,
    game: null,
    hidden: false,
    locked: false,
    reaction_count: 7,
    comment_count: 6,
    hotness_score: 18.4,
    last_activity_at: "2026-10-18T20:00:00.000Z",
    created_at: "2026-10-16T15:30:00.000Z",
    updated_at: "2026-10-18T20:00:00.000Z",
    is_template: true,
  },
  {
    id: "tpl-topic-gpu-stable-fps",
    slug: "tpl-topic-gpu-stable-fps",
    title: "Settingan GPU biar FPS stabil di game AAA",
    body: "FPS sering turun naik padahal hardware seharusnya kuat. Yang akhirnya membantu:\n\n1. Cap FPS sedikit di bawah rata-rata monitor\n2. Matikan V-Sync, pakai frame limiter in-game\n3. Turunkan shadow satu tingkat\n4. Pastikan suhu GPU di bawah 80°C\n\nSilakan tambah tips kalian.",
    author_id: AUTHORS.raka.id,
    author: AUTHORS.raka,
    game_id: null,
    game: null,
    hidden: false,
    locked: false,
    reaction_count: 22,
    comment_count: 11,
    hotness_score: 41.8,
    last_activity_at: "2026-10-21T08:15:00.000Z",
    created_at: "2026-10-15T10:00:00.000Z",
    updated_at: "2026-10-21T08:15:00.000Z",
    is_template: true,
  },
];
