import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Notification } from "@/integrations/supabase/types";

export function useNotifications() {
  const queryClient = useQueryClient();
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useCurrentUser();
  const userId = user?.id;

  // 1. Data fetching via TanStack React Query
  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    error: notificationsError,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as Notification[];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  // 2. Real-time subscription to postgres changes on notifications table
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("Realtime notification subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel).catch((err) => {
        console.error("Failed to remove notifications realtime channel:", err);
      });
    };
  }, [userId, queryClient]);

  // 3. Actions with optimistic updates & error fallback
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onMutate: async (id: string) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] });
      const previousNotifications = queryClient.getQueryData<Notification[]>([
        "notifications",
        userId,
      ]);

      if (previousNotifications) {
        const now = new Date().toISOString();
        queryClient.setQueryData<Notification[]>(
          ["notifications", userId],
          previousNotifications.map((n) =>
            n.id === id ? { ...n, read_at: now } : n
          )
        );
      }

      return { previousNotifications };
    },
    onError: (err, _id, context) => {
      console.error("Failed to mark notification as read:", err);
      if (userId && context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);

      if (error) throw new Error(error.message);
    },
    onMutate: async () => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] });
      const previousNotifications = queryClient.getQueryData<Notification[]>([
        "notifications",
        userId,
      ]);

      if (previousNotifications) {
        const now = new Date().toISOString();
        queryClient.setQueryData<Notification[]>(
          ["notifications", userId],
          previousNotifications.map((n) =>
            n.read_at === null ? { ...n, read_at: now } : n
          )
        );
      }

      return { previousNotifications };
    },
    onError: (err, _variables, context) => {
      console.error("Failed to mark all notifications as read:", err);
      if (userId && context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onMutate: async (id: string) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] });
      const previousNotifications = queryClient.getQueryData<Notification[]>([
        "notifications",
        userId,
      ]);

      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          ["notifications", userId],
          previousNotifications.filter((n) => n.id !== id)
        );
      }

      return { previousNotifications };
    },
    onError: (err, _id, context) => {
      console.error("Failed to delete notification:", err);
      if (userId && context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    },
  });

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch {
      // Reverted in onError, logged to console, surfaced via React Query
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch {
      // Reverted in onError, logged to console, surfaced via React Query
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await deleteNotificationMutation.mutateAsync(id);
    } catch {
      // Reverted in onError, logged to console, surfaced via React Query
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.read_at === null).length,
    [notifications]
  );

  return {
    // Data
    notifications,
    unreadCount,
    isLoading: isUserLoading || (Boolean(userId) && isNotificationsLoading),
    isError: isNotificationsError || isUserError,
    error:
      notificationsError ??
      (userError instanceof Error
        ? userError
        : userError
          ? new Error(String(userError))
          : null),

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
