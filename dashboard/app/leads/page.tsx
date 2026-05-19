import { getLeads } from "@/lib/actions";
import LeadsClientWrapper from "@/components/LeadsClientWrapper";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="h-full flex flex-col transition-colors duration-200">
      <LeadsClientWrapper initialLeads={leads} />
    </div>
  );
}
