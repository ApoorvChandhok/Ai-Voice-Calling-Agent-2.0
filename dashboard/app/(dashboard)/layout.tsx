import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/components/app-provider";
import { CopilotProvider } from "@/components/copilot/CopilotContext";
import CopilotWidget from "@/components/copilot/CopilotWidget";
import TopHeader from "@/components/TopHeader";
import MainWrapper from "@/components/MainWrapper";
import { UserProvider, type UserProfile } from "@/lib/context/user-context";
import ImpersonationBanner from "@/components/super-admin/ImpersonationBanner";

// Dashboard shell layout — only renders for authenticated users.
// Any unauthenticated request is caught by middleware first, but this
// is a second server-side guard for defense-in-depth.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile so every dashboard page knows the user's role & tenant
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, full_name, role, business_id")
    .eq("auth_user_id", user.id)
    .single();

  let businessId = profileRow?.business_id ?? null;
  let isImpersonating = false;

  if (profileRow?.role === "super_admin") {
    const cookieStore = await cookies();
    const activeWorkspaceId = cookieStore.get("active_workspace_id")?.value;
    if (activeWorkspaceId) {
      businessId = activeWorkspaceId;
      isImpersonating = true;
    }
  }

  // Optionally resolve the business name
  let businessName: string | null = null;
  if (businessId) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single();
    businessName = biz?.name ?? null;
  }

  const profile: UserProfile | null = profileRow
    ? {
        id:           profileRow.id,
        authUserId:   profileRow.auth_user_id,
        email:        profileRow.email,
        fullName:     profileRow.full_name ?? "",
        role:         profileRow.role,
        businessId,
        businessName,
      }
    : null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-[#111111] flex flex-col">
      {isImpersonating && businessName && (
        <ImpersonationBanner workspaceName={businessName} />
      )}
      <div className="flex-1 overflow-hidden flex">
        <UserProvider profile={profile}>
          <CopilotProvider>
            <AppProvider>
              <Sidebar />

              <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-[1] bg-white/40 dark:bg-transparent">
                <TopHeader />
                <MainWrapper>{children}</MainWrapper>
              </div>

              <CopilotWidget />
            </AppProvider>
          </CopilotProvider>
        </UserProvider>
      </div>
    </div>
  );
}
