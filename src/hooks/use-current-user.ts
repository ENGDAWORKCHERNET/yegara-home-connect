import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
  // Track the Firebase user in state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Once we know the Firebase user, query the profile + roles
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user", firebaseUser?.uid ?? null],
    staleTime: 30_000,
    enabled: firebaseUser !== undefined, // wait for auth state to resolve
    queryFn: async () => {
      if (!firebaseUser) return null;

      const [profileRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", firebaseUser.uid)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", firebaseUser.uid)
          .limit(1),
      ]);

      const hasExplicitRole = (rolesRes.data?.length ?? 0) > 0;
      const metadataRole = (firebaseUser as any).reloadUserInfo?.customAttributes
        ? (JSON.parse((firebaseUser as any).reloadUserInfo.customAttributes).role as AppRole | undefined)
        : undefined;

      return {
        id: firebaseUser.uid,
        email: profileRes.data?.email || firebaseUser.email || "",
        fullName:
          profileRes.data?.full_name ||
          firebaseUser.displayName ||
          (firebaseUser.email ?? "").split("@")[0] ||
          "User",
        phone: profileRes.data?.phone || firebaseUser.phoneNumber || "",
        role: (rolesRes.data?.[0]?.role ?? metadataRole ?? "tenant") as AppRole,
        hasExplicitRole,
      };
    },
  });
}
