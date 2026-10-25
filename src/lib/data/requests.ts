import { createClient } from "@/lib/supabase/server";
import type { ContentRequest } from "@/lib/types";

export const REQUEST_PAGE_SIZE = 10;

export interface Paged<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}

export interface RequestListParams {
  q?: string;
  status?: string;
  sort?: "votes" | "latest";
  page?: number;
}

// Hint !kolom: content_requests punya banyak jalur ke profiles (via
// request_votes) dan ke games (via files) → tanpa hint PostgREST PGRST201.
// Satu literal string (bukan concatenation `+`) agar parser tipe supabase-js
// tetap mengenali select ini.
const REQUEST_SELECT =
  "*, requester:profiles!requester_id(id, display_name, avatar_url), game:games!game_id(id, slug, title)";

/**
 * Daftar permintaan publik. Visibilitas tidak difilter di query — diserahkan
 * ke policy RLS `requests_read`: status ≠ pending tampil publik, status
 * pending hanya terlihat oleh pemiliknya dan staf (bukan disembunyikan
 * untuk semua orang seperti filter `neq pending` yang lama).
 */
export async function listRequests(params: RequestListParams): Promise<Paged<ContentRequest>> {
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort === "latest" ? "latest" : "votes";
  try {
    const supabase = await createClient();
    let query = supabase.from("content_requests").select(REQUEST_SELECT, { count: "exact" });

    if (params.q) {
      query = query.or(
        `title.ilike.%${params.q.replace(/[%_,()\\]/g, "")}%,description.ilike.%${params.q.replace(/[%_,()\\]/g, "")}%`
      );
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (sort === "votes") {
      query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * REQUEST_PAGE_SIZE;
    const { data, count } = await query.range(from, from + REQUEST_PAGE_SIZE - 1);
    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as ContentRequest[],
      count: total,
      page,
      totalPages: Math.ceil(total / REQUEST_PAGE_SIZE),
    };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getRequest(id: string): Promise<ContentRequest | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_requests")
      .select(`${REQUEST_SELECT}, result_file:files!result_file_id(id, slug, title)`)
      .eq("id", id)
      .maybeSingle();
    return (data as unknown as ContentRequest | null) ?? null;
  } catch {
    return null;
  }
}

/** Apakah user telah memberi suara pada permintaan ini? */
export async function hasUserVoted(userId: string | null, requestId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("request_votes")
      .select("request_id")
      .eq("request_id", requestId)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

/** Permintaan milik user (untuk tab "Milik saya"). */
export async function listMyRequests(userId: string): Promise<ContentRequest[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_requests")
      .select(REQUEST_SELECT)
      .eq("requester_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data ?? []) as unknown as ContentRequest[];
  } catch {
    return [];
  }
}
