"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type ApiResponse<T> = { data: T };

const unwrap = <T,>(response: T | ApiResponse<T>) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

type CreateEventResponse = {
  eventId: number;
  status: string;
};

type UserPage = {
  items: UserItem[];
  page: number;
  size: number;
  total: number;
};

type EventDetail = {
  id: number;
  eventDate: string;
  title: string | null;
  totalAmountRs: string;
  payerUserId: number;
  roundingMode: string;
  status: string;
  participants?: {
    userId: number;
    inviteStatus: string;
    dishCreditType: string;
    dishCreditValue: number;
    participated: boolean;
  }[];
  items?: {
    id: number;
    name: string;
    amountMinor: number;
    amountRs: string;
    payerUserId: number;
    participants: {
      userId: number;
      participated: boolean;
      dishCreditType: string;
      dishCreditValue: number;
    }[];
  }[];
  invitedCount: number;
  confirmedCount: number;
  declinedCount: number;
};

type ItemDraft = {
  id: string;
  name: string;
  amountRs: string;
  payerUserId: number | null;
  participants: Record<number, ParticipantDraft>;
};

type ParticipantDraft = {
  participated: boolean;
  dishCreditType: "NONE" | "FIXED" | "PERCENT";
  dishCreditValue: string;
  dishCreditValueRs: string;
};

const tabs = [
  { key: "details", label: "Details" },
  { key: "items", label: "Items" },
  { key: "review", label: "Review & Close" }
] as const;

const statusStep: Record<string, number> = {
  DRAFT: 1,
  INVITES_SENT: 2,
  AWAITING_ADMIN_DECISION: 3,
  READY_TO_CLOSE: 3,
  CLOSED: 4
};

export default function LeaderCreateEventPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("details");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventStatus, setEventStatus] = useState<string>("DRAFT");
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);
  const [initializedTab, setInitializedTab] = useState(false);
  const [initializedForm, setInitializedForm] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [roundingMode, setRoundingMode] = useState("NONE");

  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [items, setItems] = useState<ItemDraft[]>([]);

  const hasValidEventId = typeof eventId === "number" && Number.isFinite(eventId);

  useEffect(() => {
    if (initializedFromQuery) return;
    const value = searchParams.get("eventId");
    if (!value) {
      setInitializedFromQuery(true);
      return;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setEventId(parsed);
    }
    setInitializedFromQuery(true);
  }, [initializedFromQuery, searchParams]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await apiFetch<UserPage | UserItem[] | ApiResponse<UserPage | UserItem[]>>(
          endpoints.admin.users({ page: 1, size: 200, status: "ACTIVE" })
        );
        const data = unwrap(res);
        if (Array.isArray(data)) {
          setUsers(data);
          return;
        }
        if (data && Array.isArray(data.items)) {
          setUsers(data.items);
          return;
        }
        setUsers([]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load team members";
        toast.error(message);
      }
    };
    loadUsers();
  }, []);

  const loadDetail = useCallback(async () => {
    if (!hasValidEventId) return;
    try {
      const res = await apiFetch<EventDetail | ApiResponse<EventDetail>>(
        endpoints.events.detail(eventId)
      );
      const data = unwrap(res);
        setEventDetail(data || null);
      if (data?.status) {
        setEventStatus(data.status);
        if (!initializedForm) {
          setTitle(data.title || "");
          setEventDate(data.eventDate || "");
          setRoundingMode(data.roundingMode || "NONE");
          if (data.participants && data.participants.length > 0) {
            setParticipantIds(data.participants.map((p) => p.userId));
          }
          if (data.items && data.items.length > 0) {
            setItems(
              data.items.map((item) => {
                const participants = item.participants.reduce<Record<number, ParticipantDraft>>(
                  (acc, participant) => {
                    acc[participant.userId] = {
                      participated: participant.participated,
                      dishCreditType: (participant.dishCreditType ||
                        "NONE") as ParticipantDraft["dishCreditType"],
                      dishCreditValue:
                        participant.dishCreditType === "PERCENT"
                          ? String(participant.dishCreditValue ?? "")
                          : "",
                      dishCreditValueRs:
                        participant.dishCreditType === "FIXED"
                          ? formatMinorToRs(participant.dishCreditValue)
                          : ""
                    };
                    return acc;
                  },
                  {}
                );
                return {
                  id: `${item.id}`,
                  name: item.name,
                  amountRs: item.amountRs || "",
                  payerUserId: item.payerUserId ?? null,
                  participants
                };
              })
            );
          }
          setInitializedForm(true);
        }
        if (!initializedTab) {
          const status = data.status;
          const nextTab =
            status === "DRAFT"
              ? "details"
              : status === "INVITES_SENT"
                ? "items"
                : status === "AWAITING_ADMIN_DECISION" || status === "READY_TO_CLOSE" || status === "CLOSED"
                  ? "review"
                  : "details";
          setActiveTab(nextTab);
          setInitializedTab(true);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load event detail";
      toast.error(message);
    }
  }, [eventId, hasValidEventId, initializedTab]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!hasValidEventId) return;
    if (eventStatus === "CLOSED") return;
    const interval = setInterval(() => {
      loadDetail();
    }, 10000);
    return () => clearInterval(interval);
  }, [eventStatus, hasValidEventId, loadDetail]);

  const canAccessTab = (key: string) => {
    if (key === "details") return true;
    if (!hasValidEventId) return false;
    const step = statusStep[eventStatus] ?? 0;
    if (key === "items") return step >= 2;
    if (key === "review") return step >= 2;
    return false;
  };

  const createEvent = async () => {
    if (!eventDate || !title || participantIds.length === 0) {
      toast.error("Fill all required fields and select participants");
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<CreateEventResponse | ApiResponse<CreateEventResponse>>(
        endpoints.events.list(),
        {
          method: "POST",
          body: JSON.stringify({
            eventDate,
            title,
            roundingMode
          })
        }
      );
      const data = unwrap(res);
      if (!data || !Number.isFinite(data.eventId)) {
        toast.error("Event was created but ID was missing. Please refresh.");
        return;
      }
      setEventId(data.eventId);
      setEventStatus(data.status || "DRAFT");
      await apiFetch(endpoints.events.invite(data.eventId), {
        method: "POST",
        body: JSON.stringify({ userIds: participantIds })
      });
      toast.success("Event created and invites sent");
      setEventStatus("INVITES_SENT");
      setActiveTab("items");
      await loadDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (participantIds.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const nextParticipants = { ...item.participants };
        participantIds.forEach((id) => {
          if (!nextParticipants[id]) {
            nextParticipants[id] = {
              participated: true,
              dishCreditType: "NONE",
              dishCreditValue: "",
              dishCreditValueRs: ""
            };
          }
        });
        Object.keys(nextParticipants).forEach((key) => {
          const userId = Number(key);
          if (!participantIds.includes(userId)) {
            delete nextParticipants[userId];
          }
        });
        return { ...item, participants: nextParticipants };
      })
    );
  }, [participantIds]);

  const upsertItems = async () => {
    if (!hasValidEventId || items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        items: items.map((item) => ({
          itemId: null,
          name: item.name,
          amountRs: Number(item.amountRs),
          payerUserId: item.payerUserId,
          participants: Object.entries(item.participants).map(([id, participant]) => ({
            userId: Number(id),
            dishCreditType: participant.dishCreditType,
            dishCreditValue:
              participant.dishCreditType === "PERCENT"
                ? Number(participant.dishCreditValue || 0)
                : 0,
            dishCreditValueRs:
              participant.dishCreditType === "FIXED"
                ? Number(participant.dishCreditValueRs || 0)
                : 0,
            participated: participant.participated
          }))
        }))
      };
      await apiFetch(endpoints.events.items(eventId), {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      toast.success("Items saved");
      await loadDetail();
      setActiveTab("review");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save items";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const closeEvent = async () => {
    if (!hasValidEventId) return;
    if (eventStatus !== "READY_TO_CLOSE") {
      toast.error("Event not ready to close");
      return;
    }
    const toastId = toast.loading("Closing event...");
    try {
      setLoading(true);
      await apiFetch(endpoints.events.close(eventId), { method: "POST" });
      toast.update(toastId, {
        render: "Event closed",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
      setEventStatus("CLOSED");
      await loadDetail();
      router.push("/leader/events");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to close event";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: "",
        amountRs: "",
        payerUserId: eventDetail?.payerUserId ?? null,
        participants: participantIds.reduce<Record<number, ParticipantDraft>>((acc, id) => {
          acc[id] = {
            participated: true,
            dishCreditType: "NONE",
            dishCreditValue: "",
            dishCreditValueRs: ""
          };
          return acc;
        }, {})
      }
    ]);
  };

  const participantsSummary = useMemo(() => {
    return users.filter((user) => participantIds.includes(user.id));
  }, [users, participantIds]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">Create Event</h1>
          <p className="mt-2 text-sm text-slate-500">
            Build an event step by step based on backend status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          Status:
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {eventStatus}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => canAccessTab(tab.key) && setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === tab.key
                ? "bg-blue-100 text-brand"
                : "border border-blue-100 text-slate-600 hover:text-ink"
            } ${!canAccessTab(tab.key) ? "cursor-not-allowed opacity-40" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Event title
              <input
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-600">
              Event date
              <input
                type="date"
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-600">
              Rounding mode
              <select
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm"
                value={roundingMode}
                onChange={(event) => setRoundingMode(event.target.value)}
              >
                {["NONE", "NEAREST_1", "NEAREST_5", "NEAREST_10"].map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Select participants</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                    participantIds.includes(user.id)
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-blue-50"
                  }`}
                >
                  <span>{user.name}</span>
                  <input
                    type="checkbox"
                    checked={participantIds.includes(user.id)}
                    onChange={(event) => {
                      setParticipantIds((prev) =>
                        event.target.checked
                          ? [...prev, user.id]
                          : prev.filter((id) => id !== user.id)
                      );
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            className="mt-6 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={createEvent}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create event"}
          </button>
        </div>
      )}

      {activeTab === "items" && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Event items</p>
            <button
              className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              onClick={addItem}
            >
              Add item
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-blue-50 p-4">
                <div className="mb-3 text-sm font-semibold text-ink">
                  Item {index + 1}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs text-slate-500">
                    Item name
                    <input
                      className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 text-sm"
                      value={item.name}
                      onChange={(event) =>
                        setItems((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, name: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Amount (Rs)
                    <input
                      className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 text-sm"
                      value={item.amountRs}
                      onChange={(event) =>
                        setItems((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, amountRs: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Payer
                    <select
                      className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 text-sm"
                      value={item.payerUserId ?? ""}
                      onChange={(event) =>
                        setItems((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, payerUserId: Number(event.target.value) } : entry
                          )
                        )
                      }
                    >
                      <option value="">Select payer</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Participants</p>
                  <div className="mt-3 space-y-3">
                    {participantsSummary.map((user) => {
                      const participant = item.participants[user.id];
                      return (
                        <div
                          key={user.id}
                          className="grid gap-3 rounded-2xl border border-blue-50 p-3 text-xs text-slate-600 md:grid-cols-[1.2fr_0.6fr_0.8fr_1fr]"
                        >
                          <div className="font-semibold text-ink">{user.name}</div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={participant?.participated ?? true}
                              onChange={(event) =>
                                setItems((prev) =>
                                  prev.map((entry, idx) =>
                                    idx === index
                                      ? {
                                          ...entry,
                                          participants: {
                                            ...entry.participants,
                                            [user.id]: {
                                              ...entry.participants[user.id],
                                              participated: event.target.checked
                                            }
                                          }
                                        }
                                      : entry
                                  )
                                )
                              }
                            />
                            Participate
                          </label>
                          <label>
                            Dish credit type
                            <select
                              className="mt-1 w-full rounded-lg border border-blue-100 px-2 py-1 text-xs"
                              value={participant?.dishCreditType ?? "NONE"}
                              onChange={(event) =>
                                setItems((prev) =>
                                  prev.map((entry, idx) =>
                                    idx === index
                                      ? {
                                          ...entry,
                                          participants: {
                                            ...entry.participants,
                                            [user.id]: {
                                              ...entry.participants[user.id],
                                              dishCreditType: event.target.value as ParticipantDraft["dishCreditType"],
                                              dishCreditValue: "",
                                              dishCreditValueRs: ""
                                            }
                                          }
                                        }
                                      : entry
                                  )
                                )
                              }
                            >
                              {["NONE", "FIXED", "PERCENT"].map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </label>
                          {participant?.dishCreditType === "FIXED" ? (
                            <label>
                              Dish credit (Rs)
                              <input
                                className="mt-1 w-full rounded-lg border border-blue-100 px-2 py-1 text-xs"
                                value={participant.dishCreditValueRs}
                                onChange={(event) =>
                                  setItems((prev) =>
                                    prev.map((entry, idx) =>
                                      idx === index
                                        ? {
                                            ...entry,
                                            participants: {
                                              ...entry.participants,
                                              [user.id]: {
                                                ...entry.participants[user.id],
                                                dishCreditValueRs: event.target.value
                                              }
                                            }
                                          }
                                        : entry
                                    )
                                  )
                                }
                              />
                            </label>
                          ) : participant?.dishCreditType === "PERCENT" ? (
                            <label>
                              Dish credit (%)
                              <input
                                className="mt-1 w-full rounded-lg border border-blue-100 px-2 py-1 text-xs"
                                value={participant.dishCreditValue}
                                onChange={(event) =>
                                  setItems((prev) =>
                                    prev.map((entry, idx) =>
                                      idx === index
                                        ? {
                                            ...entry,
                                            participants: {
                                              ...entry.participants,
                                              [user.id]: {
                                                ...entry.participants[user.id],
                                                dishCreditValue: event.target.value
                                              }
                                            }
                                          }
                                        : entry
                                    )
                                  )
                                }
                              />
                            </label>
                          ) : (
                            <div className="text-xs text-slate-400">No dish credit</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-6 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={upsertItems}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save items"}
          </button>
        </div>
      )}

      {activeTab === "review" && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Event summary</p>
          <div className="mt-4 text-sm text-slate-600">
            <p>Participants invited: {eventDetail?.invitedCount ?? "N/A"}</p>
            <p>Confirmed: {eventDetail?.confirmedCount ?? "N/A"}</p>
            <p>Declined: {eventDetail?.declinedCount ?? "N/A"}</p>
            <p>Total amount: {eventDetail?.totalAmountRs ?? "N/A"}</p>
          </div>
          <button
            className="mt-6 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={closeEvent}
            disabled={loading || eventStatus !== "READY_TO_CLOSE"}
          >
            {eventStatus === "READY_TO_CLOSE" ? "Close event" : "Waiting for responses"}
          </button>
        </div>
      )}
    </section>
  );
}
  const formatMinorToRs = (minor?: number) => {
    if (typeof minor !== "number" || !Number.isFinite(minor)) return "";
    return (minor / 100).toFixed(2);
  };
