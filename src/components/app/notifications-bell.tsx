import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  Megaphone,
  Receipt,
  Trash2,
  Wrench,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Notification } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Number.isNaN(diffInSeconds) || diffInSeconds < 0) {
    return "just now";
  }
  if (diffInSeconds < 60) {
    return "just now";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "rent_due":
      return <CalendarClock className="size-4 text-amber-500 shrink-0 mt-0.5" />;
    case "announcement":
      return <Megaphone className="size-4 text-blue-500 shrink-0 mt-0.5" />;
    case "receipt_uploaded":
      return <Receipt className="size-4 text-emerald-500 shrink-0 mt-0.5" />;
    case "maintenance_request":
      return <Wrench className="size-4 text-purple-500 shrink-0 mt-0.5" />;
    default:
      return <Bell className="size-4 text-muted-foreground shrink-0 mt-0.5" />;
  }
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      navigate({ to: notification.link });
    }
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-9 shrink-0 text-foreground"
      aria-label="Notifications"
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAllAsRead()}
          disabled={unreadCount === 0}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Mark all as read
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 max-h-[400px] overflow-y-auto divide-y divide-border/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <span className="grid size-10 place-items-center rounded-full bg-muted mb-2">
              <Bell className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">You're all caught up! 🎉</p>
            <p className="text-xs text-muted-foreground mt-0.5">No notifications to show</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "group flex items-start gap-3 p-3 transition-colors hover:bg-muted/60 cursor-pointer text-left relative",
                !notification.read_at && "bg-blue-50/60 dark:bg-blue-950/25"
              )}
            >
              {getNotificationIcon(notification.type)}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={cn(
                      "text-xs truncate",
                      !notification.read_at
                        ? "font-semibold text-foreground"
                        : "font-normal text-foreground/80"
                    )}
                  >
                    {notification.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted shrink-0"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-lg">
        {content}
      </PopoverContent>
    </Popover>
  );
}
