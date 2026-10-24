import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { createClient } from "@/lib/supabase/server";
import { VersionManager } from "@/components/admin/version-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Versi & Host File",
};

export default async function AdminFileVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let title = "";
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("files").select("id, title").eq("id", id).maybeSingle();
    if (!data) notFound();
    title = (data as { title: string }).title;
  } catch {
    notFound();
  }

  return (
    <Section className="py-6 sm:py-8">
      <VersionManager fileId={id} fileTitle={title} />
    </Section>
  );
}
