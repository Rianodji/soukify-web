"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check } from "lucide-react";
import { usePolledData } from "@/hooks/usePolledData";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/dashboard/actions";
import type { AppNotification, NotificationsResponse } from "@/types/api";

const EMPTY: NotificationsResponse = { items: [], total: 0, unreadCount: 0 };

function getHref(n: AppNotification): string {
  const data = n.data ?? {};
  switch (n.type) {
    case "ORDER_CREATED":
    case "ORDER_CONFIRMED":
    case "ORDER_COMPLETED":
    case "ORDER_CANCELLED":
    case "DISPUTE_OPENED":
      return data.orderId ? `/dashboard/orders/${data.orderId}` : "/dashboard/orders";
    case "SHOP_APPROVED":
    case "SHOP_REJECTED":
    case "SHOP_SUSPENDED":
      return "/dashboard/boutique";
    case "KYC_APPROVED":
    case "KYC_REJECTED":
      return "/dashboard/profile";
    case "ANNONCE_EXPIRED":
      return data.annonceId ? `/dashboard/annonces/${data.annonceId}` : "/dashboard/annonces";
    default:
      return "/dashboard";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export function NotificationsButton({ size = "w-9 h-9" }: { size?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const { data, mutate } = usePolledData("my-notifications", fetchNotifications, EMPTY);
  const { items: notifications, unreadCount } = data ?? EMPTY;

  function handleClick(n: AppNotification) {
    const href = getHref(n);
    setOpen(false);
    if (!n.isRead) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        await mutate();
      });
    }
    router.push(href);
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      await mutate();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={`relative ${size} rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors`}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error border border-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-border shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-brand hover:underline disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Tout marquer comme lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center">
                <BellOff className="w-8 h-8 text-border" />
                <p className="text-sm text-text-secondary">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-primary-50 transition-colors ${!n.isRead ? "bg-primary-50/50" : ""}`}
                    >
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!n.isRead ? "bg-brand" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.isRead ? "font-semibold text-text-primary" : "font-medium text-text-secondary"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{n.body}</p>
                        <p className="text-xs text-text-disabled mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
