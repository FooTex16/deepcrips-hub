import { Section } from "@/components/layout/section";
import { FeaturedManager } from "@/components/admin/featured-manager";

export const dynamic = "force-dynamic";

export default function AdminFeaturedPage() {
  return (
    <Section className="py-6 sm:py-8">
      <FeaturedManager />
    </Section>
  );
}
