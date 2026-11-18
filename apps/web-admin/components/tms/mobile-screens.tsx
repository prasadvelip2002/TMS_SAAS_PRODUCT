"use client"

import {
  Home,
  Truck,
  Bell,
  User,
  MapPin,
  Camera,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Navigation,
  FileText,
  Clock,
  Upload,
  ArrowRight,
  Package,
  IndianRupee,
  Phone as PhoneIcon,
  Star,
  Shield,
  LogOut,
  ChevronRight as ChevronRightIcon,
  Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-[600px] w-[300px] shrink-0 rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-xl">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
        <div className="h-full w-full overflow-hidden rounded-[1.8rem] bg-background">
          <div className="flex items-center justify-between bg-background px-5 pt-3 text-xs font-medium text-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 rounded-sm bg-foreground/70" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-foreground/70" />
            </span>
          </div>
          <div className="h-[calc(100%-24px)] overflow-y-auto">{children}</div>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

function TabBar({ active }: { active: string }) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "trips", icon: Truck, label: "Trips" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "profile", icon: User, label: "Profile" },
  ]
  return (
    <div className="sticky bottom-0 flex items-center justify-around border-t border-border bg-card px-2 py-2">
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = t.id === active
        return (
          <div key={t.id} className={`flex flex-col items-center gap-0.5 text-[10px] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
            {t.label}
          </div>
        )
      })}
    </div>
  )
}

function Login() {
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div className="pt-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Truck className="h-7 w-7" />
        </span>
        <h2 className="mt-6 text-2xl font-bold">LogiPulse Driver</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your trips</p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Mobile number</label>
            <div className="mt-1 rounded-xl border border-border bg-card px-3 py-3 text-sm">+91 98765 43210</div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">OTP</label>
            <div className="mt-1 flex gap-2">
              {["4", "2", "9", "1"].map((n, i) => (
                <div key={i} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-card font-semibold">
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <button className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground">Verify &amp; Continue</button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Resend OTP in 0:24</p>
      </div>
    </div>
  )
}

function MyTrips() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-primary px-5 pb-5 pt-4 text-primary-foreground">
        <p className="text-xs opacity-80">Good morning</p>
        <h2 className="text-xl font-bold">Rajesh Kumar</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[["2", "Active"], ["1", "New"], ["₹15k", "Advance"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-primary-foreground/10 py-2">
              <div className="text-lg font-bold">{v}</div>
              <div className="text-[10px] opacity-80">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="rounded-2xl border-2 border-accent bg-accent/5 p-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-accent text-accent-foreground">New Trip</Badge>
            <span className="text-xs text-muted-foreground">TRIP-2291</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold">Mumbai</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">Pune</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">148 km · Auto parts · 07 Jul 09:00</p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-lg border border-border py-2 text-sm font-medium">Reject</button>
            <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">Accept</button>
          </div>
        </div>
        {[
          ["TRIP-2287", "Delhi", "Jaipur", "In Transit", "blue"],
          ["TRIP-2280", "Chennai", "Bangalore", "Loading", "amber"],
        ].map(([id, from, to, status]) => (
          <div key={id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{id}</span>
              <Badge variant="secondary">{status}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-semibold">{from}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{to}</span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
      <TabBar active="home" />
    </div>
  )
}

function TripDetails() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-primary px-5 pb-4 pt-4 text-primary-foreground">
        <p className="text-xs opacity-80">TRIP-2287 · In Transit</p>
        <div className="mt-2 flex items-center gap-2 text-lg font-bold">
          Delhi <ArrowRight className="h-4 w-4" /> Jaipur
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Navigation className="h-4 w-4 text-primary" /> Route progress
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary">
            <div className="h-2 w-2/3 rounded-full bg-accent" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">182 / 268 km · ETA 3:40 PM</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Freight", "₹32,000"],
            ["Advance", "₹15,000"],
            ["Vehicle", "DL01 CE 8890"],
            ["Material", "Textiles"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
              <p className="mt-0.5 text-sm font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            [Camera, "Upload POD", "bg-accent text-accent-foreground"],
            [Wallet, "Request Advance", "border border-border"],
            [FileText, "Raise Charge", "border border-border"],
          ].map(([Icon, label, cls]: any, i) => (
            <button key={i} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${cls}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <TabBar active="trips" />
    </div>
  )
}

function PodUpload() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">Upload POD</h2>
        <p className="text-xs text-muted-foreground">TRIP-2287 · Delhi → Jaipur</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        {["Front side", "Back side"].map((label, i) => (
          <div key={label}>
            <p className="mb-2 text-sm font-medium">{label}</p>
            <div
              className={`flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed ${
                i === 0 ? "border-emerald-300 bg-emerald-50" : "border-border bg-secondary/40"
              }`}
            >
              {i === 0 ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">POD_front.jpg uploaded</span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tap to capture</span>
                </>
              )}
            </div>
          </div>
        ))}
        <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <Clock className="mb-1 inline h-3.5 w-3.5" /> POD must be uploaded within 24 hours of delivery.
        </div>
      </div>
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" /> Submit POD
        </button>
      </div>
    </div>
  )
}

function RequestAdvance() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">Request Advance</h2>
        <p className="text-xs text-muted-foreground">TRIP-2291 · Mumbai → Pune</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Amount requested</p>
          <p className="mt-1 text-3xl font-bold">₹15,000</p>
          <p className="mt-1 text-[11px] text-emerald-600">Within trip limit (₹18,000)</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["₹5,000", "₹10,000", "₹15,000"].map((a, i) => (
            <button key={a} className={`rounded-xl py-2.5 text-sm font-medium ${i === 2 ? "bg-primary text-primary-foreground" : "border border-border"}`}>
              {a}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Reason</label>
          <div className="mt-1 rounded-xl border border-border bg-card px-3 py-3 text-sm">Fuel &amp; toll for trip</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-medium">Payment mode</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">UPI</span>
            <span className="rounded-lg border border-border px-3 py-1.5 text-xs">Bank</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <button className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground">Submit Request</button>
      </div>
    </div>
  )
}

function Notifications() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">Notifications</h2>
      </div>
      <div className="flex-1 space-y-2 p-4">
        {[
          [CheckCircle2, "Advance approved", "₹15,000 credited via UPI", "2m ago", "text-emerald-500"],
          [Camera, "POD reminder", "Upload POD for TRIP-2287", "1h ago", "text-accent"],
          [Truck, "New trip assigned", "Mumbai → Pune · TRIP-2291", "3h ago", "text-primary"],
          [Wallet, "Charge under review", "Unloading ₹3,200 pending", "5h ago", "text-muted-foreground"],
        ].map(([Icon, title, sub, time, color]: any, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">{time}</span>
          </div>
        ))}
      </div>
      <TabBar active="alerts" />
    </div>
  )
}

function AcceptReject() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-accent px-5 pb-5 pt-4 text-accent-foreground">
        <Badge className="bg-accent-foreground/15 text-accent-foreground">New Trip Offer</Badge>
        <h2 className="mt-2 text-xl font-bold">TRIP-2291</h2>
        <p className="text-xs opacity-90">Expires in 04:58</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold">Mumbai</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">Pune</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              [Package, "Auto parts", "16 T"],
              [Navigation, "Distance", "148 km"],
              [Clock, "Loading", "07 Jul 09:00"],
              [IndianRupee, "Earning", "₹28,500"],
            ].map(([Icon, k, v]: any, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          Advance up to ₹15,000 available on acceptance.
        </div>
      </div>
      <div className="flex gap-3 border-t border-border p-4">
        <button className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold">Reject</button>
        <button className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground">Accept Trip</button>
      </div>
    </div>
  )
}

function DocumentUpload() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">Upload Documents</h2>
        <p className="text-xs text-muted-foreground">TRIP-2287 · Delhi → Jaipur</p>
      </div>
      <div className="flex-1 space-y-3 p-4">
        {[
          ["LR / Consignment note", "Verified", "green"],
          ["Weighment slip", "Uploaded", "blue"],
          ["Toll receipts", "Pending", "amber"],
          ["Fuel bill", "Pending", "amber"],
        ].map(([doc, status, tone]) => (
          <div key={doc as string} className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{doc}</p>
                <p className={`text-xs ${tone === "green" ? "text-emerald-600" : tone === "blue" ? "text-blue-600" : "text-amber-600"}`}>{status}</p>
              </div>
            </div>
            {tone === "amber" ? (
              <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">Upload</button>
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" /> Submit All
        </button>
      </div>
    </div>
  )
}

function RequestCharge() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">Raise Additional Charge</h2>
        <p className="text-xs text-muted-foreground">TRIP-2287 · Delhi → Jaipur</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Charge type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["Unloading", "Detention", "Toll extra", "Loading wait"].map((t, i) => (
              <button key={t} className={`rounded-xl py-2.5 text-sm font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="mt-1 text-3xl font-bold">₹3,200</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Attach proof</label>
          <div className="mt-2 flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">receipt_2287.jpg</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground">
          <Plus className="h-4 w-4" /> Submit Charge
        </button>
      </div>
    </div>
  )
}

function PaymentStatus() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-primary px-5 pb-5 pt-4 text-primary-foreground">
        <h2 className="text-lg font-bold">Payments</h2>
        <div className="mt-3 rounded-2xl bg-primary-foreground/10 p-4">
          <p className="text-xs opacity-80">Total earned (this month)</p>
          <p className="mt-1 text-2xl font-bold">₹1,24,500</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        {[
          ["TRIP-2287", "Final settlement", "₹19,700", "Paid", "green"],
          ["TRIP-2291", "Advance", "₹15,000", "Credited", "green"],
          ["TRIP-2287", "Unloading charge", "₹3,200", "Under review", "amber"],
          ["TRIP-2280", "Final settlement", "₹22,400", "Processing", "blue"],
        ].map(([id, label, amt, status, tone], i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone === "green" ? "bg-emerald-50 text-emerald-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{amt}</p>
              <p className={`text-[11px] ${tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-blue-600"}`}>{status}</p>
            </div>
          </div>
        ))}
      </div>
      <TabBar active="home" />
    </div>
  )
}

function Profile() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-primary px-5 pb-6 pt-6 text-center text-primary-foreground">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/15 text-xl font-bold">
          RK
        </div>
        <h2 className="mt-3 text-lg font-bold">Rajesh Kumar</h2>
        <p className="text-xs opacity-80">Driver · LogiPulse Fleet</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-current" /> 4.7 · 312 trips
        </div>
      </div>
      <div className="flex-1 space-y-2 p-4">
        {[
          [PhoneIcon, "Mobile", "+91 98765 43210"],
          [Truck, "Assigned vehicle", "DL01 CE 8890"],
          [Shield, "License", "DL-0420 · valid till 2029"],
          [FileText, "KYC status", "Verified"],
        ].map(([Icon, k, v]: any, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
              <p className="text-sm font-medium">{v}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-red-600">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      <TabBar active="profile" />
    </div>
  )
}

const MOBILE_SCREENS = [
  { label: "Login / OTP", Comp: Login },
  { label: "My Trips", Comp: MyTrips },
  { label: "Accept / Reject Trip", Comp: AcceptReject },
  { label: "Trip Details", Comp: TripDetails },
  { label: "POD Upload", Comp: PodUpload },
  { label: "Document Upload", Comp: DocumentUpload },
  { label: "Request Advance", Comp: RequestAdvance },
  { label: "Request Charge", Comp: RequestCharge },
  { label: "Payment Status", Comp: PaymentStatus },
  { label: "Notifications", Comp: Notifications },
  { label: "Profile", Comp: Profile },
]

export function MobileScreens() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <Badge className="mb-3 bg-accent text-accent-foreground">Mobile · Driver App</Badge>
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Driver field app</h2>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Flutter blueprints for the driver-facing app — trip acceptance, POD capture, advances, and alerts on the go.
        </p>
      </header>

      <div className="flex snap-x gap-8 overflow-x-auto pb-6">
        {MOBILE_SCREENS.map(({ label, Comp }) => (
          <div key={label} className="snap-center">
            <Phone label={label}>
              <Comp />
            </Phone>
          </div>
        ))}
      </div>
    </section>
  )
}
