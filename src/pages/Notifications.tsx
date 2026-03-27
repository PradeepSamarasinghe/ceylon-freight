import { useState, useEffect } from "react";
import { Bell, Check, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  shipment_id: string;
}

const Notifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setFetching(true);
      const q = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (filter === "unread") q.eq("is_read", false);
      if (filter === "read") q.eq("is_read", true);
      const { data } = await q;
      if (data) setNotifications(data as Notification[]);
      setFetching(false);
    };
    fetch();
  }, [user, filter]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as Notification;
        if (filter === "read") return;
        setNotifications((prev) => [n, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, filter]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      filter === "unread"
        ? prev.filter((n) => n.id !== id)
        : prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    navigate(`/shipment/${n.shipment_id}`);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) =>
      filter === "unread" ? [] : prev.map((n) => ({ ...n, is_read: true }))
    );
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllRead = async () => {
    const readIds = notifications.filter((n) => n.is_read).map((n) => n.id);
    if (!readIds.length) {
      toast.info("No read notifications to clear");
      return;
    }
    await supabase.from("notifications").delete().in("id", readIds);
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    toast.success(`Cleared ${readIds.length} read notification${readIds.length > 1 ? "s" : ""}`);
  };

  const clearAll = async () => {
    if (!notifications.length) return;
    const ids = notifications.map((n) => n.id);
    await supabase.from("notifications").delete().in("id", ids);
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={readCount > 0 ? clearAllRead : clearAll}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {readCount > 0 ? "Clear read" : "Clear all"}
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="mb-3 h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">No notifications{filter !== "all" ? ` (${filter})` : ""}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`group relative rounded-lg border border-border/50 transition-colors hover:bg-secondary/50 ${
                  !n.is_read ? "bg-secondary/30 border-primary/20" : "bg-card"
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left px-4 py-3.5 pr-12"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Package className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => deleteNotification(e, n.id)}
                  className="absolute right-3 top-3.5 rounded-md p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
