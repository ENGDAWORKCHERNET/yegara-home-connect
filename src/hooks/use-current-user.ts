import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "tenant" | "guard";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: AppRole;
  hasExplicitRole: boolean;
};

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1),
      ]);

      const hasExplicitRole = (rolesRes.data?.length ?? 0) > 0;
      const metadataRole = (user.user_metadata?.role as AppRole | undefined);

      return {
        id: user.id,
        email: profileRes.data?.email || user.email || "",
        fullName: profileRes.data?.full_name || (user.user_metadata?.full_name as string) || (user.email ?? "").split("@")[0] || "User",
        phone: profileRes.data?.phone || (user.user_metadata?.phone as string) || "",
        role: (rolesRes.data?.[0]?.role ?? metadataRole ?? "tenant") as AppRole,
        hasExplicitRole: hasExplicitRole || !!metadataRole,
      };
    },
  });
}
