"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "next-auth";
import {
  ChevronDown,
  Pencil,
  Save,
  X,
  CircleUserRound,
  Shield,
  Store,
  FileText,
  Phone,
  Mail,
  MapPin,
  Hash,
  Coins,
  LogOut,
  CirclePercent,
  CreditCard,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import axios from "axios";
import { set } from "mongoose";
import { json } from "zod";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────
type IShop = {
  name: string;
  gstin: string;
  address: string;
  contactNumber: string;
  email: string;
  accountNumber: string;
  ifscCode: string;
  termsAndConditions: string;
  goldRatePer10g: string;
  silverRatePerKg: string;
  stateCode?: string;
  customDuty: string;
  gstOnMetal: string;
  gstOnMakingCharge: string;
};

type UserProfile = {
  username: string;
  role: string;
  shop: IShop;
};

// ── Mock data ──────────────────────────────────────────
const INITIAL_PROFILE: UserProfile = {
  username: "Anjali Sharma",
  role: "Store Manager",
  shop: {
    name: "Lakhhi Jewellers",
    gstin: "27AAPFU0939F1ZV",
    address: "124 Heritage Plaza, Suite 400, Calcutta, WB 700001",
    contactNumber: "+91 98300 12345",
    email: "contact@lakhhi.com",
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    goldRatePer10g: "72,450",
    silverRatePerKg: "89,200",
    gstOnMetal:"3",
    gstOnMakingCharge: "5",
    customDuty: "0",
    termsAndConditions:
      "All luxury items are certified by the National Gemological Institute. Return policy applies within 14 days for exchange only. Gold rates are subject to daily market revision.",
  },
};

// ── Helpers ────────────────────────────────────────────
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ── EditableField ──────────────────────────────────────
function EditableField({
  icon,
  label,
  value,
  editing,
  onChange,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const base =
    "w-full bg-transparent focus:outline-none transition-colors duration-200";

  return (
    <div className="flex flex-col gap-1">
      <label
        className="flex items-center gap-1.5 text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        <span className="text-[#C9A84C]">{icon}</span>
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={`${base} border border-[#DDD0C4] focus:border-[#8B6914] rounded-md px-3 py-2 text-[#3D2B1F] placeholder-[#C8B8A8] resize-none`}
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
              lineHeight: "1.7",
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${base} border-b border-[#DDD0C4] focus:border-[#8B6914] pb-1 text-[#3D2B1F]`}
            style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
          />
        )
      ) : (
        <p
          className="text-[#3D2B1F] leading-[1.6]"
          style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
        >
          {value || <span className="text-[#C8B8A8]">—</span>}
        </p>
      )}
    </div>
  );
}

// ── Section Divider ────────────────────────────────────
function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-1">
      <span className="text-[#8B6914]">{icon}</span>
      <p
        className="text-[#8B6914] tracking-[0.16em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {children}
      </p>
      <div className="flex-1 h-px bg-[#E8DDD4]" />
    </div>
  );
}

// ── Main ProfileDropdown ───────────────────────────────
export default function ProfileDropdown() {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<IShop | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();

  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "loading") return; // ⛔ wait
  
    if (status === "unauthenticated") {
      router.replace("/sign-in");
      return;
    }
  
    if (status === "authenticated") {
      setUser(session.user as User);
      console.log("User:", session.user);
      
    }
  }, [status, session]);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await axios.get("/api/get-shop");
        if (response.data.success) {
          setProfile((prev) => ({ ...prev, shop: response.data.shop }));
          setDraft(response.data.shop);
        }
      } catch (error) {
        console.error("Failed to fetch shop details:", error);
      }
    };
    fetchShop();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startEdit = () => {
    setDraft({ ...profile.shop });
    setEditing(true);
    setSaved(false);
  };

  const cancelEdit = () => {
    setDraft({ ...profile.shop });
    setEditing(false);
  };

  const saveEdit = async () => {
    setEditing(true);
    try {
      const body = draft;
      const response = await axios.patch("/api/edit-shop", body);
      if (response.data.success) {
        if (!draft) {
          setDraft(response.data.savedShop);
        }
        setDraft(response.data.updatedShop || draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
      console.log("Save response:", response.data.message);
    } catch (error) {
      console.error("Failed to save shop details:", error);
    } finally {
      setEditing(false);
    }
  };

  const setDraftField = (key: keyof IShop, val: string) =>
    setDraft((prev) => (prev ? { ...prev, [key]: val } : null));

  const handleLogout = async () => {
    await signOut({ redirect: false });
  };
  return (
    <div className="relative inline-block" ref={ref}>
      {/* ── Trigger Button ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setEditing(false);
        }}
        className="flex items-center gap-2.5 group"
        aria-label="Open profile menu"
      >
        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:ring-2 group-hover:ring-[#8B6914]/50"
          style={{
            background: "linear-gradient(135deg, #6B1A1A 0%, #3A0F0F 100%)",
            border: "1.5px solid #8B6914",
          }}
        >
          <span
            className="text-[#C9A84C] leading-none"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {initials(user?.name || "")}
          </span>
        </div>

        {/* Name */}
        <span
          className="text-[#3D2B1F] group-hover:text-[#8B6914] transition-colors duration-200 hidden sm:block"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {user?.name?.split(" ")[0]}
        </span>

        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-[#9E8A7E] transition-transform duration-200 hidden sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)]  md:w-[360px]  rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          style={{
            background: "#FFFFFF",
            maxHeight: "82vh",
            border: "1px solid #E8DDD4",
            boxShadow:
              "0 20px 60px rgba(44,26,14,0.18), 0 4px 16px rgba(44,26,14,0.10)",
          }}
        >
          {/* Top gradient accent */}
          <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

          {/* ── Profile Header ── */}
          <div className="flex-shrink-0 bg-[#FDF0F0] px-6 py-5">
            <div className="flex items-center gap-4">
              {/* Large avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #6B1A1A 0%, #3A0F0F 100%)",
                  border: "2px solid #8B6914",
                }}
              >
                <span
                  className="text-[#C9A84C] leading-none"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {initials(user?.name || "")}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Username */}
                <p
                  className="text-[#2C1A0E] truncate"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {user?.name}
                </p>
                {/* Role badge */}
                <span
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #F5CC5A22 0%, #E8B84B22 100%)",
                    border: "1px solid #C9A84C44",
                  }}
                >
                  <Shield
                    size={10}
                    strokeWidth={2}
                    className="text-[#8B6914]"
                  />
                  <span
                    className="text-[#7A5C00] tracking-[0.08em]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {user?.role}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          {user?.role === "owner" && (
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* ── Shop Details Section ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={<Store size={13} strokeWidth={2} />}>
                    Shop Details
                  </SectionLabel>
                  {!editing ? (
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-1.5 text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-200 ml-3 flex-shrink-0"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      <Pencil size={12} strokeWidth={2} />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <X size={12} strokeWidth={2} />
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-1.5 bg-[#6B1A1A] hover:bg-[#521414] text-white px-3 py-1.5 rounded-md transition-colors duration-200"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        <Save size={11} strokeWidth={2.2} />
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Saved confirmation */}
                {saved && (
                  <p
                    className="text-[#2E7D32] mb-3 -mt-2"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}
                  >
                    ✓ Shop details updated successfully.
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  <EditableField
                    icon={<Store size={10} strokeWidth={2.2} />}
                    label="Shop Name"
                    value={editing ? draft?.name ?? "" : profile.shop.name}
                    editing={editing}
                    onChange={(v) => setDraftField("name", v)}
                  />
                  <EditableField
                    icon={<Hash size={10} strokeWidth={2.2} />}
                    label="GSTIN"
                    value={editing ? draft?.gstin ?? "" : profile.shop.gstin}
                    editing={editing}
                    onChange={(v) => setDraftField("gstin", v)}
                  />
                  <EditableField
                    icon={<MapPin size={10} strokeWidth={2.2} />}
                    label="Address"
                    value={editing ? draft?.address ?? "" : profile.shop.address}
                    editing={editing}
                    onChange={(v) => setDraftField("address", v)}
                    multiline
                  />
                  <EditableField
                    icon={<Phone size={10} strokeWidth={2.2} />}
                    label="Contact Number"
                    value={
                      editing ? draft?.contactNumber ?? "" : profile.shop.contactNumber
                    }
                    editing={editing}
                    onChange={(v) => setDraftField("contactNumber", v)}
                  />
                  <EditableField
                    icon={<Mail size={10} strokeWidth={2.2} />}
                    label="Email"
                    value={editing ? draft?.email ?? "" : profile.shop.email}
                    editing={editing}
                    onChange={(v) => setDraftField("email", v)}
                  />
                  <EditableField
                    icon={<CreditCard size={10} strokeWidth={2.2} />}
                    label="Account Number"
                    value={editing ? draft?.accountNumber ?? "" : profile.shop.accountNumber}
                    editing={editing}
                    onChange={(v) => setDraftField("accountNumber", v)}
                  />
                  <EditableField
                    icon={<CreditCard size={10} strokeWidth={2.2} />}
                    label="IFSC Code"
                    value={editing ? draft?.ifscCode ?? "" : profile.shop.ifscCode}
                    editing={editing}
                    onChange={(v) => setDraftField("ifscCode", v)}
                  />
                </div>
              </div>

              {/* ── Market Rates Section ── */}
              <div>
                <SectionLabel icon={<Coins size={13} strokeWidth={2} />}>
                  Market Rates
                </SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {/* Gold Rate */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #FDF3DC 0%, #FBE8B0 100%)",
                      border: "1px solid #E8D080",
                    }}
                  >
                    <p
                      className="text-[#8B6914] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      Gold / 10g
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.goldRatePer10g ?? ""}
                        onChange={(e) =>
                          setDraftField("goldRatePer10g", e.target.value)
                        }
                        className="w-full bg-transparent text-[#5C3D00] focus:outline-none border-b border-[#C9A84C]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#5C3D00]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        ₹{draft?.goldRatePer10g}
                      </p>
                    )}
                  </div>

                  {/* Silver Rate / kg */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #F4F4F6 0%, #E8E8EC 100%)",
                      border: "1px solid #D0D0D8",
                    }}
                  >
                    <p
                      className="text-[#6B6B7A] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      Silver / kg
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.silverRatePerKg ?? ""}
                        onChange={(e) =>
                          setDraftField("silverRatePerKg", e.target.value)
                        }
                        className="w-full bg-transparent text-[#3A3A4A] focus:outline-none border-b border-[#A0A0B0]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#3A3A4A]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        ₹{draft?.silverRatePerKg}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <SectionLabel icon={<CirclePercent size={13} strokeWidth={2} />}>
                  Multiple Tax Rates
                </SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  {/* METALGST Rate */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #FDF3DC 0%, #FBE8B0 100%)",
                      border: "1px solid #E8D080",
                    }}
                  >
                    <p
                      className="text-[#8B6914] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      GST ON METAL Rate %
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.gstOnMetal ?? ""}
                        onChange={(e) =>
                          setDraftField("gstOnMetal", e.target.value)
                        }
                        className="w-full bg-transparent text-[#5C3D00] focus:outline-none border-b border-[#C9A84C]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#5C3D00]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {draft?.gstOnMetal || "0"} %
                      </p>
                    )}
                  </div>

                  {/* CGST Rate */}
                  {/* <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #F4F4F6 0%, #E8E8EC 100%)",
                      border: "1px solid #D0D0D8",
                    }}
                  >
                    <p
                      className="text-[#6B6B7A] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      CGST Rate %
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.cgst ?? ""}
                        onChange={(e) =>
                          setDraftField("cgst", e.target.value)
                        }
                        className="w-full bg-transparent text-[#3A3A4A] focus:outline-none border-b border-[#A0A0B0]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#3A3A4A]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {draft?.cgst || "0"} %
                      </p>
                    )}
                  </div> */}
                  {/* IGST Rate */}
                  {/* <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #F4F4F6 0%, #E8E8EC 100%)",
                      border: "1px solid #D0D0D8",
                    }}
                  >
                    <p
                      className="text-[#6B6B7A] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      IGST Rate %
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.igst ?? ""}
                        onChange={(e) =>
                          setDraftField("igst", e.target.value)
                        }
                        className="w-full bg-transparent text-[#3A3A4A] focus:outline-none border-b border-[#A0A0B0]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#3A3A4A]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {draft?.igst || "0"} %
                      </p>
                    )}
                  </div> */}
                  {/* GST on Making Charge */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #F4F4F6 0%, #E8E8EC 100%)",
                      border: "1px solid #D0D0D8",
                    }}
                  >
                    <p
                      className="text-[#6B6B7A] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      GST on Making Charge %
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.gstOnMakingCharge ?? ""}
                        onChange={(e) =>
                          setDraftField("gstOnMakingCharge", e.target.value)
                        }
                        className="w-full bg-transparent text-[#3A3A4A] focus:outline-none border-b border-[#A0A0B0]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#3A3A4A]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {draft?.gstOnMakingCharge || "0"} %
                      </p>
                    )}
                  </div>
                  {/* Custom Duty */}
                  {/* <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #F4F4F6 0%, #E8E8EC 100%)",
                      border: "1px solid #D0D0D8",
                    }}
                  >
                    <p
                      className="text-[#6B6B7A] tracking-[0.1em] uppercase mb-1"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      Custom Duty %
                    </p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft?.customDuty ?? ""}
                        onChange={(e) =>
                          setDraftField("customDuty", e.target.value)
                        }
                        className="w-full bg-transparent text-[#3A3A4A] focus:outline-none border-b border-[#A0A0B0]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <p
                        className="text-[#3A3A4A]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 700,
                        }}
                      >
                        {draft?.customDuty || "0"} %
                      </p>
                    )}
                  </div> */}

                </div>
              </div>

              {/* ── Terms & Conditions ── */}
              <div>
                <SectionLabel icon={<FileText size={13} strokeWidth={2} />}>
                  Terms & Conditions
                </SectionLabel>
                <EditableField
                  icon={<FileText size={10} strokeWidth={2.2} />}
                  label=""
                  value={
                    editing
                      ? draft?.termsAndConditions ?? ""
                      : profile.shop.termsAndConditions
                  }
                  editing={editing}
                  onChange={(v) => setDraftField("termsAndConditions", v)}
                  multiline
                />
              </div>
            </div>
          )}

          {/* ── Footer: Logout ── */}
          <div className="flex-shrink-0 border-t border-[#E8DDD4] px-6 py-4 bg-[#FAF6F1]">
            <button
              className="w-full flex items-center justify-center gap-2 text-[#8B2020] hover:bg-[#FADADD] py-2.5 rounded-md transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
              onClick={handleLogout}
            >
              <LogOut size={14} strokeWidth={1.8} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
