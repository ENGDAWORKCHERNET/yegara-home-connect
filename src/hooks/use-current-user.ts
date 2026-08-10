import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "tenant" | "guard";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: AppRole;
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

      return {
        id: user.id,
        email: profileRes.data?.email || user.email || "",
        fullName: profileRes.data?.full_name || (user.email ?? "").split("@")[0] || "User",
        phone: profileRes.data?.phone || "",
        role: (rolesRes.data?.[0]?.role ?? "tenant") as AppRole,
      };
    },
  });
}
