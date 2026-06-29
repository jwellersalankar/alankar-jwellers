"use client";

import { useEffect, useState } from "react";
import {
  X,
  Gift,
  Heart,
  Phone,
  MessageSquare,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Cake,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ICustomer } from "@/src/models/Customer";
//import mongoose from "mongoose";
import { format } from 'date-fns';
import { set } from "mongoose";
import axios from "axios";
import { is } from "zod/locales";


// ── Types ──────────────────────────────────────────────
type WishType = "birthday" | "anniversary";
type Channel  = "phone" | "whatsapp" | "sms";

type Customer = {
  id: string;
  name: string;
  phone: string;
  occasion: WishType;
  date: string;
  wished: boolean;
};

// ── Mock Data ──────────────────────────────────────────
// const MOCK_CUSTOMERS: ICustomer[] = [
//   { _id: new mongoose.Types.ObjectId("1"), name: "Anjali Sharma",   phone: "+91 98300 12345",    dob: new Date("1990-01-01"), anniversary: new Date("2023-04-22"), adress: "123 Main St, City", dueAmount: 1000, advanceAmount: 500 },
//   { _id: new mongoose.Types.ObjectId("2"), name: "Vikram Singh",    phone: "+91 91234 56789", dob: new Date("1990-01-01"), anniversary: new Date("2023-04-22"), adress: "123 Main St, City", dueAmount: 1000, advanceAmount: 500, },
//   { _id: new mongoose.Types.ObjectId("3"), name: "Priya Nair",      phone: "+91 88001 23456",    dob: new Date("1990-01-01"), anniversary: new Date("2023-04-22"), adress: "123 Main St, City", dueAmount: 1000, advanceAmount: 500 },
//   { _id: new mongoose.Types.ObjectId("4"), name: "Rajesh Malhotra", phone: "+91 70012 34567",    dob: new Date("1990-01-01"), anniversary: new Date("2023-04-22"), adress: "123 Main St, City", dueAmount: 1000, advanceAmount: 500 },
//   { _id: new mongoose.Types.ObjectId("5"), name: "Sunita Kapoor",   phone: "+91 99100 23456",    dob: new Date("1990-01-01"), anniversary: new Date("2023-04-22"), adress: "123 Main St, City", dueAmount: 1000, advanceAmount: 500 },
// ];

// ── Helpers ────────────────────────────────────────────
const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6B1A1A 0%, #3A0F0F 100%)",
  "linear-gradient(135deg, #1A3A6B 0%, #0F1E3A 100%)",
  "linear-gradient(135deg, #1A5C3A 0%, #0F3020 100%)",
  "linear-gradient(135deg, #4A2A8A 0%, #2A1A5A 100%)",
  "linear-gradient(135deg, #6B5A1A 0%, #3A3010 100%)",
];

type Occasion = "birthday" | "anniversary";

const getMessage = (name: string, type: Occasion) => {
  if (type === "birthday") {
    return `🎉 Happy Birthday! 🎉

Dear ${name},

Wishing you happiness, success, and a wonderful year ahead.

May your life shine like gold and be filled with precious moments.

SRI LAKHHI JEWELLERS

Visit us for your special birthday offer!

Thank you for being a valued customer.`;
  }

  return `Happy Anniversary 💍

Dear ${name},

Wishing you both a lifetime of love and happiness.

May your bond grow stronger with each passing year.

SRI LAKHHI JEWELLERS

Visit us to celebrate your special day with exclusive offers.

Thank you for being a valued customer.`;
};

const formatPhoneForWhatsApp = (p: string) => {
  let phone = p.replace(/[^0-9]/g, "");

  // Remove leading 00 (international format)
  if (phone.startsWith("00")) {
    phone = phone.slice(2);
  }

  // If already starts with country code (like 91...) → keep
  if (phone.length > 10) {
    return phone;
  }

  // Otherwise assume India and add 91
  return "91" + phone;
};

const CHANNEL_CONFIG: Record<
  Channel,
  {
    label: string;
    icon: React.ReactNode;
    href: (p: string, name: string, type: Occasion) => string;
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
  }
> = {
  phone: {
    label: "Call",
    icon: <Phone size={13} strokeWidth={1.8} />,
    href: (p) => `tel:${p.replace(/\s/g, "")}`,
    bg: "#F0FBF4",
    text: "#1A6B3A",
    border: "#A0D4B0",
    hoverBg: "#D4F0DC",
  },

  whatsapp: {
    label: "WhatsApp",
    icon: <MessageSquare size={13} strokeWidth={1.8} />,
   href: (p, name, type) => {
  const phone = formatPhoneForWhatsApp(p);

  const rawMessage = getMessage(name, type);
  const message = encodeURIComponent(rawMessage);

  return `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
},
    bg: "#F0FBF4",
    text: "#1A6B3A",
    border: "#A0D4B0",
    hoverBg: "#D4F0DC",
  },

  sms: {
    label: "SMS",
    icon: <MessageSquare size={13} strokeWidth={1.8} />,
    href: (p, name, type) => {
      const phone = p.replace(/\s/g, "");
      const safeMessage = encodeURIComponent(
  new TextDecoder().decode(new TextEncoder().encode(getMessage(name, type)))
);
      return `sms:${phone}?body=${safeMessage}`;
    },
    bg: "#EEF4FF",
    text: "#2A4A8A",
    border: "#B0C4E8",
    hoverBg: "#C8D8F8",
  },
};

// ── Shared sub-components ──────────────────────────────

function ChannelPill({
  channel,
  phone,
  name,
  type,
}: {
  channel: Channel;
  phone: string;
  name: string;
  type: Occasion; // 👈 NEW
}) {
  const cfg = CHANNEL_CONFIG[channel];

  return (
    <a
      href={cfg.href(phone, name, type)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-150 cursor-pointer"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontFamily: "'Georgia', serif",
        fontSize: "10px",
        fontWeight: 700,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = cfg.hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = cfg.bg)}
    >
      {cfg.icon}
      {cfg.label}
    </a>
  );
}

function WishedBadge({ wished }: { wished: boolean }) {
  return wished ? (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: "#F0FBF4", border: "1px solid #A0D4B0" }}
    >
      <CheckCircle2 size={11} strokeWidth={2} style={{ color: "#1A6B3A" }} />
      <span style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700, color: "#1A6B3A", letterSpacing: "0.06em" }}>
        Wished
      </span>
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: "#FFF8E7", border: "1px solid #E8D080" }}
    >
      <Sparkles size={11} strokeWidth={2} style={{ color: "#8B6914" }} />
      <span style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700, color: "#8B6914", letterSpacing: "0.06em" }}>
        Pending
      </span>
    </span>
  );
}

function OccasionBadge({ type }: { type: WishType }) {
  return type === "birthday" ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
      style={{ background: "#FDF0F0", border: "1px solid #E8A0A8" }}
    >
      <Cake size={10} strokeWidth={2} style={{ color: "#8B2020" }} />
      <span style={{ fontFamily: "'Georgia', serif", fontSize: "9px", fontWeight: 700, color: "#8B2020", letterSpacing: "0.06em" }}>
        Birthday
      </span>
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
      style={{ background: "#FDF3DC", border: "1px solid #E8D080" }}
    >
      <Heart size={10} strokeWidth={2} style={{ color: "#8B6914" }} />
      <span style={{ fontFamily: "'Georgia', serif", fontSize: "9px", fontWeight: 700, color: "#8B6914", letterSpacing: "0.06em" }}>
        Anniversary
      </span>
    </span>
  );
}

// ── Mobile Customer Card ───────────────────────────────
function MobileCustomerCard({
  customer,
  idx,
  onMarkWished,
}: {
  customer: ICustomer;
  idx: number;
  onMarkWished: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = new Date();

  const isBirthday =
    customer?.dob &&
    new Date(customer.dob).getDate() === today.getDate() &&
    new Date(customer.dob).getMonth() === today.getMonth();

  const isAnniversary =
    customer?.anniversary &&
    new Date(customer.anniversary).getDate() === today.getDate() &&
    new Date(customer.anniversary).getMonth() === today.getMonth();

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #EDE4DA", background: "#FFFFFF" }}
    >
      {/* Always-visible top row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar with occasion dot */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
          style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length], border: "1.5px solid #8B6914" }}
        >
          <span style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 700, color: "#C9A84C" }}>
            {initials(customer?.name)}
          </span>
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: customer?.dob ? "#8B2020" : "#8B6914", border: "1.5px solid white" }}
          >
            {isBirthday
              ? <Cake size={7} className="text-white" />
              : isAnniversary ? <Heart size={7} className="text-white" /> : <div className="flex gap-1"><Cake size={7} className="text-white" /><Heart size={7} className="text-white" /></div>}
          </span>
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="text-[#2C1A0E] truncate" style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 600 }}>
            {customer?.name}
          </p>
          <p className="text-[#9E8A7E]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
            {customer?.phone}
          </p>
        </div>

        {/* Badge + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <OccasionBadge type={isBirthday ? "birthday" : "anniversary"} />
          {expanded
            ? <ChevronUp size={14} strokeWidth={2} className="text-[#9E8A7E]" />
            : <ChevronDown size={14} strokeWidth={2} className="text-[#9E8A7E]" />}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#F0E8E0]">

          {/* Wished status row */}
          <div className="flex items-center justify-between pt-3">
            <span
              style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#9E8A7E", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Status
            </span>
            {/* <div className="flex items-center gap-3">
              <WishedBadge wished={customer.wished} />
              {!customer.wished && (
                <button
                  onClick={onMarkWished}
                  className="inline-flex items-center gap-1 text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-150"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
                >
                  <CheckCircle2 size={11} strokeWidth={2} />
                  Mark Wished
                </button>
              )}
            </div> */}
          </div>

          {/* Date row */}
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#9E8A7E", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Date
            </span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: "12px", color: "#3D2B1F", fontWeight: 600 }}>
              {isBirthday ? format(customer?.dob, "dd MMMM yyyy") : format(customer?.anniversary, "dd MMMM yyyy")}
            </span>
          </div>

          {/* Communicate with */}
          <div>
            <p
              className="mb-2"
              style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#9E8A7E", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Communicate With
            </p>
            <div className="flex flex-wrap gap-2">
              {(["phone", "whatsapp", "sms"] as Channel[]).map((ch) => (
                <ChannelPill key={ch} channel={ch} phone={customer.phone} name={customer.name} type={isBirthday ? "birthday" : "anniversary"} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
interface WishingPopupProps {
  customers?: ICustomer[];
  onClose?: () => void;
  onMarkWished?: (id: string) => void;
}

export default function WishingPopup({
  customers: externalCustomers,
  onClose,
  onMarkWished,
}: WishingPopupProps) {
  const [customers, setCustomers]     = useState<ICustomer[]>(externalCustomers ?? []);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<"all" | WishType | "pending" | "wished">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(()=>{
   const fetchOccasions = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/get-wishing-customer");
      if (!response.data.success) throw new Error(response.data.message);
      setCustomers(response.data.data);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
    } finally {
      setLoading(false);
    }
   };
   fetchOccasions();
  },[]);

  // const markWished = (id: string) => {
  //   setCustomers((prev) => prev.map((c) => (c._id.toString() === id ? { ...c, wished: true } : c)));
  //   onMarkWished?.(id);
  // };

  const today = new Date();

  const isBirthday = (customer: ICustomer) => {
    return customer?.dob && new Date(customer.dob).getDate() === today.getDate() && new Date(customer.dob).getMonth() === today.getMonth();
  };

  const isAnniversary = (customer: ICustomer) => {
    return customer?.anniversary && new Date(customer.anniversary).getDate() === today.getDate() && new Date(customer.anniversary).getMonth() === today.getMonth();
  }

const filtered = customers?.filter((c) => {
  const matchSearch =
    c?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
    c?.phone?.includes(search);

  const matchFilter =
    filter === "all"
      ? true
      : filter === "birthday"
      ? isBirthday(c)
      : filter === "anniversary"
      ? isAnniversary(c)
      : false;

  return matchSearch && matchFilter;
});

  const totalPages       = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated        = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  let birthdayCount    =  0;
  let anniversaryCount = 0;

  paginated.forEach((c) => {
    if (isBirthday(c)) birthdayCount += 1;
    if (isAnniversary(c)) anniversaryCount += 1;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6"
      style={{ background: "rgba(14, 8, 4, 0.82)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-[780px] max-h-[94vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#FFFFFF" }}
      >
        {/* Top accent */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        {/* ── Modal Header ── */}
        <div className="flex-shrink-0 bg-[#FDF0F0] px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.8} />
          </button>

          <div className="flex items-start gap-3 sm:gap-4 pr-6">
            {/* Icon */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #F5CC5A 0%, #E8B84B 100%)" }}
            >
              <Gift size={20} strokeWidth={1.6} className="text-[#5C3D00]" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-[#8B6914] tracking-[0.18em] uppercase mb-1"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
              >
                CRM — Automated Greetings
              </p>
              <h2
                className="text-[#2C1A0E]"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "clamp(16px, 2.5vw, 24px)", fontWeight: 400 }}
              >
                Today's Celebrations
              </h2>

              {/* Stats — wrap on mobile */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "11px", color: "#8B2020" }}
                >
                  <Cake size={11} strokeWidth={2} />
                  <strong>{birthdayCount}</strong> Birthdays
                </span>
                <span className="hidden sm:block w-px h-3 bg-[#DDD0C4]" />
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "11px", color: "#8B6914" }}
                >
                  <Heart size={11} strokeWidth={2} />
                  <strong>{anniversaryCount}</strong> Anniversaries
                </span>
                <span className="hidden sm:block w-px h-3 bg-[#DDD0C4]" />
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "11px", color: "#7A5C00" }}
                >
                  {/* <Sparkles size={11} strokeWidth={2} />
                  <strong>{pendingCount}</strong> Pending */}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 w-10 h-[2px] rounded-full bg-[#8B6914]" />
        </div>

        {/* ── Search + Filter bar ── */}
        <div
          className="flex-shrink-0 flex flex-col gap-3 px-4 sm:px-8 py-3 sm:py-4 border-b border-[#E8DDD4]"
          style={{ background: "#FAF6F1" }}
        >
          {/* Search */}
          <div className="flex items-center gap-2.5 w-full bg-white border border-[#DDD0C4] rounded-md px-3 sm:px-3.5 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200">
            <Search size={14} strokeWidth={1.8} className="text-[#9E8A7E] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#B8A898] text-[13px] focus:outline-none"
              style={{ fontFamily: "'Georgia', serif" }}
            />
          </div>

          {/* Filter pills — scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {([
              { key: "all",         label: "All" },
              { key: "birthday",    label: "🎂 Birthday" },
              { key: "anniversary", label: "💛 Anniversary" },
            ] as { key: typeof filter; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setCurrentPage(1); }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.08em] uppercase transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                  filter === f.key ? "bg-[#6B1A1A] text-white" : "text-[#5C4A3A] hover:bg-[#EDE4DA]"
                }`}
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Gift size={30} strokeWidth={1.2} className="text-[#C8B8A8]" />
              <p className="text-[#B8A898]" style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}>
                Loading...
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">

          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Gift size={30} strokeWidth={1.2} className="text-[#C8B8A8]" />
              <p className="text-[#B8A898]" style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}>
                No celebrations found
              </p>
            </div>
          ) : (
            <>
              {/* ── MOBILE (< sm): accordion cards ── */}
              <div className="flex flex-col gap-3 p-4">
                {paginated.map((customer, idx) => (
                  <MobileCustomerCard
                    key={customer._id.toString()}
                    customer={customer}
                    idx={idx}
                    onMarkWished={() => {}}
                  />
                ))}
              </div>

              {/* ── TABLET / DESKTOP (≥ sm): table ── */}
              <div className="hidden">

                {/* Table header — sticky */}
                <div
                  className="grid items-center px-5 md:px-8 py-3 border-b border-[#E8DDD4] sticky top-0 z-10"
                  style={{
                    gridTemplateColumns: "2fr 1.4fr 1fr 1fr 2fr",
                    background: "linear-gradient(135deg, #FDF3DC 0%, #FAF0CC 100%)",
                  }}
                >
                  {["Name", "Phone No.", "Occasion", "Wished", "Communicate With"].map((h) => (
                    <p
                      key={h}
                      className="text-[#8B6914] tracking-[0.12em] uppercase"
                      style={{ fontFamily: "'Georgia', serif", fontSize: "9px", fontWeight: 700 }}
                    >
                      {h}
                    </p>
                  ))}
                </div>

                Table rows
                {paginated.map((customer, idx) => (
                  // <div
                  //   key={customer.id}
                  //   className={`grid items-center px-5 md:px-8 py-4 transition-colors duration-150 hover:bg-[#FFF9F0] ${
                  //     idx !== paginated.length - 1 ? "border-b border-[#EDE4DA]" : ""
                  //   }`}
                  //   style={{ gridTemplateColumns: "2fr 1.4fr 1fr 1fr 2fr" }}
                  // >
                  //   {/* Name + Avatar */}
                  //   <div className="flex items-center gap-3 min-w-0">
                  //     <div
                  //       className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  //       style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length], border: "1.5px solid #8B6914" }}
                  //     >
                  //       <span style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 700, color: "#C9A84C" }}>
                  //         {initials(customer.name)}
                  //       </span>
                  //       <span
                  //         className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  //         style={{ background: customer.occasion === "birthday" ? "#8B2020" : "#8B6914", border: "1.5px solid white" }}
                  //       >
                  //         {customer.occasion === "birthday"
                  //           ? <Cake size={7} className="text-white" />
                  //           : <Heart size={7} className="text-white" />}
                  //       </span>
                  //     </div>
                  //     <div className="min-w-0">
                  //       <p className="text-[#2C1A0E] truncate" style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 600 }}>
                  //         {customer.name}
                  //       </p>
                  //       <p className="text-[#9E8A7E]" style={{ fontFamily: "'Georgia', serif", fontSize: "10px" }}>
                  //         {customer.date}
                  //       </p>
                  //     </div>
                  //   </div>

                  //   {/* Phone */}
                  //   <p className="text-[#5C4A3A]" style={{ fontFamily: "'Georgia', serif", fontSize: "12px" }}>
                  //     {customer.phone}
                  //   </p>

                  //   {/* Occasion */}
                  //   <div>
                  //     <OccasionBadge type={customer.occasion} />
                  //   </div>

                  //   {/* Wished */}
                  //   <div className="flex flex-col gap-1.5">
                  //     <WishedBadge wished={customer.wished} />
                  //     {!customer.wished && (
                  //       <button
                  //         onClick={() => markWished(customer.id)}
                  //         className="inline-flex items-center gap-1 text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-150"
                  //         style={{ fontFamily: "'Georgia', serif", fontSize: "9px", fontWeight: 700 }}
                  //       >
                  //         <CheckCircle2 size={10} strokeWidth={2} />
                  //         Mark Wished
                  //       </button>
                  //     )}
                  //   </div>

                  //   {/* Channels */}
                  //   <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  //     {(["phone", "whatsapp", "sms"] as Channel[]).map((ch) => (
                  //       <ChannelPill key={ch} channel={ch} phone={customer.phone} />
                  //     ))}
                  //   </div>
                  // </div>
                  <div></div>
                ))}
              </div>
            </>
          )}
        </div>
          )
        }

        {/* ── Footer: pagination ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-4 border-t border-[#E8DDD4] bg-[#FAF6F1]">
          <p
            className="text-[#9E8A7E] tracking-[0.08em] uppercase"
            style={{ fontFamily: "'Georgia', serif", fontSize: "10px" }}
          >
            {filtered.length === 0
              ? "No records"
              : `${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filtered.length
                )} of ${filtered.length}`}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-[12px] font-bold transition-colors ${
                  currentPage === page ? "bg-[#6B1A1A] text-white" : "text-[#5C4A3A] hover:bg-[#EDE4DA]"
                }`}
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}