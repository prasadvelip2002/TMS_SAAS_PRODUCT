"use client";

import { useEffect, useState } from "react";
import { 
  fetchApi, 
  getWhatsAppStatus, 
  getWhatsAppLogs, 
  sendWhatsAppMessage, 
  getDrivers, 
  getCustomers 
} from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { 
  MessageSquare, 
  Bell, 
  Search, 
  X, 
  Activity, 
  Send, 
  ExternalLink, 
  CheckCheck, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Plus, 
  RefreshCw,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "system">("whatsapp");
  
  // Data states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [whatsAppLogs, setWhatsAppLogs] = useState<any[]>([]);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Composer Modal states
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [recipientType, setRecipientType] = useState<"driver" | "customer" | "custom">("driver");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("trip_assigned");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error", text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifs, logs, status, drvs, custs] = await Promise.allSettled([
        fetchApi("/Notifications"),
        getWhatsAppLogs(100),
        getWhatsAppStatus(),
        getDrivers(),
        getCustomers()
      ]);

      if (notifs.status === "fulfilled") setNotifications(notifs.value || []);
      if (logs.status === "fulfilled") setWhatsAppLogs(logs.value || []);
      if (status.status === "fulfilled") setStatusInfo(status.value || null);
      if (drvs.status === "fulfilled") setDrivers(drvs.value || []);
      if (custs.status === "fulfilled") setCustomers(custs.value || []);
    } catch (e) {
      console.error("Failed to load notifications or WhatsApp logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default message template when selected
  const applyTemplate = (templateKey: string, name = recipientName) => {
    setSelectedTemplate(templateKey);
    const targetName = name || "Valued Partner";

    switch (templateKey) {
      case "trip_assigned":
        setMessageBody(
          `🚛 *TransitFlow · Trip Assignment*\n\n` +
          `Hello *${targetName}*,\n` +
          `A new trip has been assigned to you:\n\n` +
          `• *Trip ID:* TRIP-1042\n` +
          `• *Route:* Mumbai ➔ Pune\n` +
          `• *Advance Amount:* ₹12,000\n\n` +
          `Please report at the loading bay on time and verify status in TransitFlow Driver App.`
        );
        break;
      case "delivery_confirm":
        setMessageBody(
          `✅ *TransitFlow · Consignment Delivered*\n\n` +
          `Dear *${targetName}*,\n` +
          `Your consignment has safely reached the destination.\n\n` +
          `• *Status:* Delivered Successfully\n` +
          `• *Time:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
          `Verified digital POD will be available on your portal shortly. Thank you!`
        );
        break;
      case "advance_disbursed":
        setMessageBody(
          `💰 *TransitFlow · Advance Disbursed*\n\n` +
          `Hello *${targetName}*,\n` +
          `Your trip advance of *₹15,000* has been disbursed to your registered account.\n\n` +
          `Please verify the balance in your TransitFlow Driver wallet. Drive safely!`
        );
        break;
      case "pod_reminder":
        setMessageBody(
          `📸 *TransitFlow · Action Required: Upload POD*\n\n` +
          `Hello *${targetName}*,\n` +
          `Your recent trip has been marked as Delivered.\n` +
          `Please snap and upload a clear photo of the stamped POD to trigger balance release.`
        );
        break;
      default:
        setMessageBody("");
        break;
    }
  };

  const handleOpenComposer = () => {
    setIsComposerOpen(true);
    setFeedback(null);
    if (drivers.length > 0) {
      setRecipientType("driver");
      setRecipientName(drivers[0].name || "");
      setRecipientPhone(drivers[0].phone || "");
      applyTemplate("trip_assigned", drivers[0].name);
    } else {
      applyTemplate("trip_assigned");
    }
  };

  const handleRecipientSelect = (type: "driver" | "customer" | "custom", idOrVal: string) => {
    setRecipientType(type);
    if (type === "driver") {
      const d = drivers.find(drv => drv.id.toString() === idOrVal);
      if (d) {
        setRecipientName(d.name || "");
        setRecipientPhone(d.phone || "");
        applyTemplate(selectedTemplate, d.name);
      }
    } else if (type === "customer") {
      const c = customers.find(cust => cust.id.toString() === idOrVal);
      if (c) {
        setRecipientName(c.name || "");
        setRecipientPhone(c.phone || "");
        applyTemplate(selectedTemplate, c.name);
      }
    } else {
      setRecipientName("");
      setRecipientPhone("");
    }
  };

  const handleSendMessage = async (openWebFallback = false) => {
    if (!recipientPhone.trim() || !messageBody.trim()) {
      setFeedback({ type: "error", text: "Please provide both a recipient phone number and a message." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await sendWhatsAppMessage({
        phoneNumber: recipientPhone,
        recipientName: recipientName || "Contact",
        templateName: selectedTemplate,
        message: messageBody
      });

      if (openWebFallback || res.shareUrl) {
        window.open(res.shareUrl, "_blank");
      }

      setFeedback({ 
        type: "success", 
        text: `Message queued successfully! (Status: ${res.status || 'Delivered'})` 
      });

      setTimeout(() => {
        setIsComposerOpen(false);
        loadData();
      }, 1200);
    } catch (err: any) {
      setFeedback({ 
        type: "error", 
        text: err.message || "Failed to send WhatsApp message." 
      });
    } finally {
      setSending(false);
    }
  };

  const filteredWhatsAppLogs = whatsAppLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      log.phoneNumber?.toLowerCase().includes(q) ||
      log.recipientName?.toLowerCase().includes(q) ||
      log.templateName?.toLowerCase().includes(q) ||
      log.message?.toLowerCase().includes(q) ||
      log.status?.toLowerCase().includes(q)
    );
  });

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & WhatsApp Hub</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Business API
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Automated trip assignments, delivery alerts, driver reminders, and in-app system notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenComposer}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_16px_rgba(37,211,102,0.4)] transition-all text-sm"
          >
            <MessageSquare className="w-4 h-4 fill-white/20" />
            <span>Send WhatsApp Message</span>
          </button>
        </div>
      </div>

      {/* Connection & Delivery Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Business Channel</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-emerald-950">
            {statusInfo?.businessNumber || "+91 90000 12345"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Meta Verified · Quality High</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sent</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {statusInfo?.totalSent ?? whatsAppLogs.length}
          </p>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-500" /> Automated & Manual Triggers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivered & Read</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {statusInfo?.totalDelivered ?? Math.max(0, whatsAppLogs.length - 1)}
          </p>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> 99.4% Delivery Success
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trigger Automations</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">4 Workflows</p>
          <p className="mt-2 text-xs text-slate-500">Trip Assign, Delivery, Advance, POD</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "whatsapp"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Outbox & Automation Logs</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
            {whatsAppLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "system"
              ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-App System Alerts</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
            {notifications.length}
          </span>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 p-2 mb-6 flex items-center justify-between">
        <div className="flex items-center px-4 gap-3 flex-1">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === "whatsapp" ? "Search by recipient, phone, template or message..." : "Search alerts by title or content..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: WhatsApp Tab Content */}
      {activeTab === "whatsapp" && (
        <div className="space-y-8">
          {/* Automated Trigger Rules Banner */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                title: "Trip Assigned",
                tpl: "trip_assigned",
                target: "Assigned Driver",
                desc: "Auto-sends route, cargo, vehicle & advance details on trip assignment."
              },
              {
                title: "Advance Disbursed",
                tpl: "advance_disbursed",
                target: "Driver Wallet",
                desc: "Alerts driver immediately upon accounts finance advance clearance."
              },
              {
                title: "Consignment Delivered",
                tpl: "delivery_confirm",
                target: "Customer Contact",
                desc: "Notifies customer that truck has arrived at drop location."
              },
              {
                title: "POD Reminder",
                tpl: "pod_reminder",
                target: "Driver",
                desc: "Prompts driver to upload physical signed proof of delivery photo."
              }
            ].map((rule, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800 tracking-tight">{rule.title}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{rule.desc}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="font-mono text-slate-600">{rule.tpl}</span>
                  <span>{rule.target}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-lg text-slate-900 tracking-tight">WhatsApp Dispatch Log</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Every outbound WhatsApp message dispatched by TransitFlow</p>
              </div>
              <button 
                onClick={handleOpenComposer}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Compose
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center p-16">
                <Activity className="animate-spin text-emerald-600 w-8 h-8" />
              </div>
            ) : filteredWhatsAppLogs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No WhatsApp logs yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  Assign a trip or click "Send WhatsApp Message" to send your first automated communication.
                </p>
                <button
                  onClick={handleOpenComposer}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  Compose WhatsApp Message
                </button>
              </div>
            ) : (
              <ProtoTable headers={["DATE / TIME", "RECIPIENT", "PHONE NUMBER", "TEMPLATE", "MESSAGE PREVIEW", "STATUS", "ACTION"]}>
                {filteredWhatsAppLogs.map((log) => {
                  const cleanPhone = (log.phoneNumber || "").replace(/\D/g, "");
                  const shareUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(log.message || "")}`;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <Td className="font-mono text-[12px] text-slate-500">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                      </Td>
                      <Td>
                        <span className="font-semibold text-slate-900">{log.recipientName || "Contact"}</span>
                      </Td>
                      <Td className="font-mono text-xs text-slate-700">
                        +{log.phoneNumber}
                      </Td>
                      <Td>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {log.templateName || "custom"}
                        </span>
                      </Td>
                      <Td className="text-slate-600 max-w-xs truncate text-xs" title={log.message}>
                        {log.message || "Template message sent."}
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.status === "Delivered" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.status === "Failed"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {log.status === "Delivered" && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                          {log.status || "Sent"}
                        </span>
                      </Td>
                      <Td>
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                          title="Open WhatsApp Chat"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Chat</span>
                        </a>
                      </Td>
                    </tr>
                  );
                })}
              </ProtoTable>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Notifications Tab Content */}
      {activeTab === "system" && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">System Notification Log</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">In-app notifications and alerts</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-16">
              <Activity className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No system alerts found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                There are no in-app notifications recorded for this tenant.
              </p>
            </div>
          ) : (
            <ProtoTable headers={["DATE", "TYPE", "TITLE", "MESSAGE PREVIEW", "ENTITY"]}>
              {filteredNotifications.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                  <Td className="font-mono text-[12px]">{new Date(n.createdAt).toLocaleString()}</Td>
                  <Td>
                    <span className="px-[8px] py-[3px] bg-blue-50 text-blue-700 rounded-[6px] text-[11px] font-semibold border border-blue-100">
                      {n.type}
                    </span>
                  </Td>
                  <Td className="font-semibold text-slate-900">{n.title}</Td>
                  <Td className="text-slate-600 max-w-md truncate">{n.message}</Td>
                  <Td className="font-mono text-[12px]">{n.entityId ? `#${n.entityId}` : "—"}</Td>
                </tr>
              ))}
            </ProtoTable>
          )}
        </div>
      )}

      {/* WhatsApp Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Compose WhatsApp Message</h3>
                  <p className="text-xs text-white/80">Send verified business message or open direct chat</p>
                </div>
              </div>
              <button 
                onClick={() => setIsComposerOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-12">
              {/* Form Side */}
              <div className="md:col-span-7 space-y-4">
                {feedback && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === "success" 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{feedback.text}</span>
                  </div>
                )}

                {/* Recipient Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recipient Group
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "driver", label: "Driver" },
                      { id: "customer", label: "Customer" },
                      { id: "custom", label: "Custom Phone" }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleRecipientSelect(type.id as any, "")}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          recipientType === type.id
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Selection Dropdown or Manual */}
                {recipientType === "driver" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Driver</label>
                    <select
                      onChange={(e) => handleRecipientSelect("driver", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.phone || "No Phone"})</option>
                      ))}
                    </select>
                  </div>
                )}

                {recipientType === "customer" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Customer</label>
                    <select
                      onChange={(e) => handleRecipientSelect("customer", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone || "No Phone"})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Phone & Recipient Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number (+91...)</label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Predefined Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="trip_assigned">trip_assigned (Trip & Route details)</option>
                    <option value="delivery_confirm">delivery_confirm (Delivery confirmation to customer)</option>
                    <option value="advance_disbursed">advance_disbursed (Advance payment alert)</option>
                    <option value="pod_reminder">pod_reminder (Proof of delivery upload reminder)</option>
                    <option value="custom">Custom Freeform Message</option>
                  </select>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Message Content</label>
                  <textarea
                    rows={6}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your WhatsApp notification message..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* WhatsApp Live Preview Side */}
              <div className="md:col-span-5 flex flex-col">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Live Chat Preview
                </label>
                <div className="flex-1 rounded-2xl bg-[#EFEAE2] p-4 flex flex-col justify-end border border-slate-300 relative overflow-hidden shadow-inner min-h-[300px]">
                  {/* WhatsApp background pattern */}
                  <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#128C7E_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                  <div className="relative z-10 self-end max-w-[90%] bg-white rounded-2xl rounded-tr-none p-3 shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-slate-200/50">
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                      {messageBody || "Your message preview will appear here..."}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => handleSendMessage(false)}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-xs transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "Sending via API..." : "Send via Business API"}</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage(true)}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp Web (wa.me)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
