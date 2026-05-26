import { getLeads } from "@/lib/actions";
import LeadsCRM from "@/components/LeadsCRM";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="h-full flex flex-col transition-colors duration-200">
      <LeadsCRM initialLeads={leads} />
    </div>
  );
}
