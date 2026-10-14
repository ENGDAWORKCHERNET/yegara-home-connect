import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DashboardShell } from "@/components/app/dashboard-shell";

function getFirebaseUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = auth.currentUser ?? (await getFirebaseUser());
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  ),
});
