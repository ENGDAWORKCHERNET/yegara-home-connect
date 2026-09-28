import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; full_name: string; phone: string; email: string };

export type Building = {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type House = {
  id: string;
  owner_id: string;
  house_number: string;
  description: string;
  rent_amount: string | number;
  recurrence: "monthly" | "quarterly" | "yearly";
  next_due_date: string;
  building_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  created_at: string;
};

export type Assignment = {
  id: string;
  house_id: string;
  tenant_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Payment = {
  id: string;
  house_id: string;
  tenant_id: string;
  expected_amount: string | number;
  extracted_amount: string | number | null;
  status: "pending" | "verified" | "late" | "paid";
  trust_score: "high" | "medium" | "low";
  ai_notes: string;
  created_at: string;
  verified_at: string | null;
};

export type MaintenanceRequest = {
  id: string;
  house_id: string;
  tenant_id: string;
  description: string;
  image_path: string | null;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
};

export type Announcement = {
  id: string;
  author_id: string;
  title: string;
  message: string;
  created_at: string;
};

/** Houses, buildings, rental assignments and the profile directory needed to render names/phones. */
export function usePlatformData() {
  return useQuery({
    queryKey: ["platform-data"],
    queryFn: async () => {
      const [houses, assignments, profiles, buildings] = await Promise.all([
        supabase.from("houses").select("*").order("house_number"),
        supabase.from("tenant_assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, phone, email"),
        supabase.from("buildings").select("*").order("name"),
      ]);
      if (houses.error) throw new Error(houses.error.message);
      if (assignments.error) throw new Error(assignments.error.message);
      if (profiles.error) throw new Error(profiles.error.message);
      if (buildings.error) throw new Error(buildings.error.message);

      const directory = new Map<string, Profile>();
      for (const profile of (profiles.data ?? []) as Profile[]) directory.set(profile.id, profile);

      return {
        houses: (houses.data ?? []) as House[],
        buildings: (buildings.data ?? []) as Building[],
        assignments: (assignments.data ?? []) as Assignment[],
        directory,
      };
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Payment[];
    },
  });
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MaintenanceRequest[];
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Announcement[];
    },
  });
}

export function approvedTenantFor(assignments: Assignment[], houseId: string) {
  return assignments.find((a) => a.house_id === houseId && a.status === "approved") ?? null;
}
