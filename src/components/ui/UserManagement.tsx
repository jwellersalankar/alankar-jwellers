"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  SlidersHorizontal,
  UserPlus,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { IUser } from "@/src/models/User";
import axios from "axios";
import { useSession } from "next-auth/react";

// ── Types ──────────────────────────────────────────────
type UserRole = "owner" | "staff";
type VerifiedStatus = "verified" | "unverified";

const ROLE_COLORS: Record<
  UserRole,
  { bg: string; text: string; border: string }
> = {
  owner: { bg: "#FDF3DC", text: "#7A5C00", border: "#E8D080" },
  staff: { bg: "#FADADD", text: "#7A1A1A", border: "#E8A0A8" },
};

const AVATAR_COLORS = [
  "linear-gradient(135deg, #6B1A1A 0%, #3A0F0F 100%)",
  "linear-gradient(135deg, #1A3A6B 0%, #0F1E3A 100%)",
  "linear-gradient(135deg, #1A6B3A 0%, #0F3A1E 100%)",
  "linear-gradient(135deg, #4A2A8A 0%, #2A1A5A 100%)",
  "linear-gradient(135deg, #6B5A1A 0%, #3A3010 100%)",
  "linear-gradient(135deg, #6B1A4A 0%, #3A0F28 100%)",
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ── Shared sub-components ──────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  isdeleting,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isdeleting: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#FADADD] border border-[#E8A0A8] rounded-lg px-3 py-2 mt-2">
      <p
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "11px",
          color: "#7A1A1A",
        }}
      >
        Remove <span className="font-bold">{name.split(" ")[0]}</span>?
      </p>
      <button
        onClick={onConfirm}
        disabled={isdeleting}
        className="px-2.5 py-1 rounded bg-[#8B2020] hover:bg-[#6B1A1A] text-white transition-colors"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="px-2.5 py-1 rounded border border-[#C8A0A8] text-[#7A1A1A] hover:bg-white/60 transition-colors"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 600,
        }}
      >
        No
      </button>
    </div>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span
      className="w-fit flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: "#F0FBF4", border: "1px solid #A0D4B0" }}
    >
      <UserCheck size={11} strokeWidth={2} style={{ color: "#1A6B3A" }} />
      <span
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
          color: "#1A6B3A",
          letterSpacing: "0.06em",
        }}
      >
        Verified
      </span>
    </span>
  ) : (
    <span
      className="w-fit flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: "#FFF8E7", border: "1px solid #E8D080" }}
    >
      <ShieldOff size={11} strokeWidth={2} style={{ color: "#7A5C00" }} />
      <span
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
          color: "#7A5C00",
          letterSpacing: "0.06em",
        }}
      >
        Pending
      </span>
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const s = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.06em] w-fit capitalize"
      style={{
        fontFamily: "'Georgia', serif",
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {role}
    </span>
  );
}

// ── Mobile Card ────────────────────────────────────────
function MobileUserCard({
  user,
  idx,
  isConfirming,
  onToggleVerified,
  onToggleRole,
  onDeleteStart,
  onDeleteConfirm,
  onDeleteCancel,
  isdeleting,
  isUpdatingVerify,
  isUpdatingRole,
  onUpdateVerifyStart,
  onUpdateRoleStart,
}: {
  user: IUser;
  idx: number;
  isConfirming: boolean;
  onToggleVerified: () => void;
  onToggleRole: () => void;
  onDeleteStart: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  isdeleting: boolean;
  isUpdatingVerify: boolean;
  isUpdatingRole: boolean;
  onUpdateVerifyStart: () => void;
  onUpdateRoleStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const role = user.role as UserRole;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #E8DDD4", background: "#FFFFFF" }}
    >
      {/* Always-visible top row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
            border: "1.5px solid #8B6914",
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#C9A84C",
            }}
          >
            {initials(user.name)}
          </span>
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[#2C1A0E] truncate"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {user.name}
          </p>
          <p
            className="text-[#9E8A7E] truncate"
            style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}
          >
            {user.email}
          </p>
        </div>

        {/* Role + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <RoleBadge role={role} />
          {expanded ? (
            <ChevronUp size={15} strokeWidth={2} className="text-[#9E8A7E]" />
          ) : (
            <ChevronDown size={15} strokeWidth={2} className="text-[#9E8A7E]" />
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#F0E8E0]">
          {/* Verified row */}
          <div className="flex items-center justify-between pt-3">
            <span
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#9E8A7E",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Status
            </span>
            <VerifiedBadge verified={!!user.verified} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Verify / Revoke */}
            <button
              onClick={() => {
                onUpdateVerifyStart();
                onToggleVerified();
              }}
              disabled={isUpdatingVerify}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold tracking-[0.06em] transition-all duration-200 flex-1 ${
                user.verified
                  ? "bg-[#FFF8E7] border border-[#E8D080] text-[#7A5C00] hover:bg-[#FADADD] hover:border-[#E8A0A8] hover:text-[#7A1A1A]"
                  : "bg-[#F0FBF4] border border-[#A0D4B0] text-[#1A6B3A] hover:bg-[#D4F0DC]"
              }`}
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {user.verified ? (
                isUpdatingVerify ? (
                  "Revoking..."
                ) : (
                  <>
                    <ShieldOff size={12} strokeWidth={2} /> Revoke
                  </>
                )
              ) : isUpdatingVerify ? (
                "Verifying..."
              ) : (
                <>
                  <ShieldCheck size={12} strokeWidth={2} /> Verify
                </>
              )}
            </button>

            {/* Change Role */}
            <button
              onClick={() => {
                onUpdateRoleStart();
                onToggleRole();
              }}
              disabled={isUpdatingRole}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold tracking-[0.06em] transition-all duration-200 flex-1 ${
                role === "staff"
                  ? "bg-[#FFF8E7] border border-[#E8D080] text-[#7A5C00] hover:bg-[#FADADD] hover:border-[#E8A0A8] hover:text-[#7A1A1A]"
                  : "bg-[#F0FBF4] border border-[#A0D4B0] text-[#1A6B3A] hover:bg-[#D4F0DC]"
              }`}
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {role === "owner" ? (
                isUpdatingRole ? (
                  "Changing..."
                ) : (
                  <>
                    <UserCheck size={12} strokeWidth={2} /> Make Staff
                  </>
                )
              ) : isUpdatingRole ? (
                "Changing..."
              ) : (
                <>
                  <UserPlus size={12} strokeWidth={2} /> Make Owner
                </>
              )}
            </button>

            {/* Delete */}
            <button
              onClick={isConfirming ? onDeleteCancel : onDeleteStart}
              className="w-9 h-9 flex items-center justify-center rounded-md text-[#C0392B]/60 hover:text-[#C0392B] hover:bg-[#FADADD] transition-all duration-200 flex-shrink-0"
            >
              <Trash2 size={15} strokeWidth={1.6} />
            </button>
          </div>

          {/* Delete confirm */}
          {isConfirming && (
            <DeleteConfirm
              name={user.name}
              onConfirm={onDeleteConfirm}
              onCancel={onDeleteCancel}
              isdeleting={isdeleting}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<"all" | VerifiedStatus>(
    "all",
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateVerify, setUpdateVerify] = useState(false);
  const [updateRole, setUpdateRole] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateVerifyId, setUpdateVerifyId] = useState<string | null>(null);
  const [updateRoleId, setUpdateRoleId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 5;

  const { update } = useSession();

  useEffect(() => {
    setLoading(true);
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/get-users");
        if (!response.data.success) throw new Error(response.data.message);
        setUsers(response.data.data);
      } catch (error: any) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const verifiedStatus = u.verified ? "verified" : "unverified";
    const matchFilter =
      filterVerified === "all" || verifiedStatus === filterVerified;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const toggleVerified = async (id: string) => {
    setUpdateVerify(true);
    try {
      const body = {
        ...users.find((u) => u._id.toString() === id),
        verified: !users.find((u) => u._id.toString() === id)?.verified,
      };
      const response = await axios.patch("/api/edit-user", body);
      if (!response.data.success) throw new Error(response.data.error);
      await update({
        verified: true,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id.toString() === id
            ? ({ ...u, verified: !u.verified } as IUser)
            : u,
        ),
      );
    } catch (error: any) {
      console.error("Failed to toggle verify:", error.message);
    } finally {
      setUpdateVerify(false);
      setUpdateVerifyId(null);
    }
  };

  const deleteUser = async (id: string) => {
    setDeleting(true);
    try {
      const user = users.find((u) => u._id.toString() === id);
      const response = await axios.delete("/api/delete-user", { data: user });
      if (!response.data.success) throw new Error(response.data.error);
      setUsers((prev) => prev.filter((u) => u._id.toString() !== id));
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error("Error in deleting user:", error.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleRole = async (id: string) => {
    setUpdateRole(true);
    try {
      const body = {
        ...users.find((u) => u._id.toString() === id),
        role:
          users.find((u) => u._id.toString() === id)?.role === "owner"
            ? "staff"
            : "owner",
      };
      const response = await axios.patch("/api/edit-user", body);
      if (!response.data.success) throw new Error(response.data.error);
      await update({
        role:
          users.find((u) => u._id.toString() === id)?.role === "owner"
            ? "staff"
            : "owner",
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id.toString() === id
            ? ({ ...u, role: u.role === "owner" ? "staff" : "owner" } as IUser)
            : u,
        ),
      );
    } catch (error: any) {
      console.error("Error in toggling role:", error.message);
    } finally {
      setUpdateRole(false);
      setUpdateRoleId(null);
    }
  };

  const verifiedCount = users.filter((u) => u.verified === true).length;
  const unverifiedCount = users.filter((u) => u.verified === false).length;

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-16 pt-8 md:pt-12 pb-24 bg-[#FFF8F7]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h1
            className="text-[#8B2020] mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(24px, 3.5vw, 40px)",
              fontWeight: 700,
            }}
          >
            User Management
          </h1>
          <p
            className="text-[#9E8A7E]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "14px" }}
          >
            Manage staff access, roles, and account verification.
          </p>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {[
          {
            label: "Total Staff",
            value: users.length,
            bg: "#FAF6F1",
            border: "#DDD0C4",
            text: "#3D2B1F",
          },
          {
            label: "Verified",
            value: verifiedCount,
            bg: "#F0FBF4",
            border: "#A0D4B0",
            text: "#1A6B3A",
          },
          {
            label: "Pending",
            value: unverifiedCount,
            bg: "#FFF8E7",
            border: "#E8D080",
            text: "#7A5C00",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl flex-1 sm:flex-none"
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              minWidth: "100px",
            }}
          >
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(18px, 3vw, 22px)",
                fontWeight: 700,
                color: s.text,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 600,
                color: s.text,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div
        className="bg-[#F9EAEB] rounded-lg px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5"
        style={{ border: "1px solid #E8DDD4" }}
      >
        <div className="flex items-center gap-2.5 flex-1">
          <Search
            size={16}
            className="text-[#9E8A7E] flex-shrink-0"
            strokeWidth={1.8}
          />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#B8A898] text-[13px] sm:text-[14px] focus:outline-none"
            style={{ fontFamily: "'Georgia', serif" }}
          />
        </div>
        <div className="hidden sm:block h-8 w-px bg-[#DDD0C4]" />
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal
            size={13}
            strokeWidth={1.8}
            className="text-[#8B6914] flex-shrink-0"
          />
          {(["all", "verified", "unverified"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilterVerified(f);
                setCurrentPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase transition-colors duration-200 ${
                filterVerified === f
                  ? "bg-[#6B1A1A] text-white"
                  : "text-[#5C4A3A] hover:bg-[#EDE4DA]"
              }`}
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="w-full h-52 flex items-center justify-center">
          <Loader className="text-[#9E8A7E] animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl bg-white"
          style={{ border: "1px solid #E8DDD4" }}
        >
          <UserX size={32} strokeWidth={1.2} className="text-[#C8B8A8]" />
          <p
            className="text-[#B8A898]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "14px" }}
          >
            No users found
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* ── MOBILE  (< md): accordion cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginated.map((user, idx) => {
              const uid = user._id.toString();
              return (
                <MobileUserCard
                  key={uid}
                  user={user}
                  idx={idx}
                  isConfirming={confirmDeleteId === uid}
                  onToggleVerified={() => toggleVerified(uid)}
                  onToggleRole={() => toggleRole(uid)}
                  onDeleteStart={() => setConfirmDeleteId(uid)}
                  onDeleteConfirm={() => deleteUser(uid)}
                  onDeleteCancel={() => setConfirmDeleteId(null)}
                  isdeleting={deleting}
                  isUpdatingVerify={updateVerifyId === uid}
                  isUpdatingRole={updateRoleId === uid}
                  onUpdateVerifyStart={() => setUpdateVerifyId(uid)}
                  onUpdateRoleStart={() => setUpdateRoleId(uid)}
                />
              );
            })}
          </div>

          {/* ── DESKTOP (≥ md): full table ── */}
          <div
            className="hidden md:block bg-[#FFFFFF] rounded-xl overflow-hidden"
            style={{ border: "1px solid #E8DDD4" }}
          >
            {/* Header */}
            <div
              className="grid items-center px-6 py-4 border-b border-[#E8DDD4]"
              style={{ gridTemplateColumns: "2fr 2.2fr 1fr 1.2fr 1.4fr 1.5fr" }}
            >
              {[
                "Name",
                "Email",
                "Role",
                "Verified",
                "Actions",
                "Change Role",
              ].map((h) => (
                <p
                  key={h}
                  className="text-[#9E8A7E] tracking-[0.12em] uppercase"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            {paginated.map((user, idx) => {
              const uid = user._id.toString();
              const role = user.role as UserRole;
              const roleStyle = ROLE_COLORS[role];
              const isConfirming = confirmDeleteId === uid;

              return (
                <div key={uid}>
                  <div
                    className="grid items-center px-6 py-4 transition-colors duration-150 hover:bg-[#F5EDE4] border-b border-[#EDE4DA] last:border-b-0"
                    style={{
                      gridTemplateColumns: "2fr 2.2fr 1fr 1.2fr 1.4fr 1.5fr",
                    }}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                          border: "1.5px solid #8B6914",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#C9A84C",
                          }}
                        >
                          {initials(user.name)}
                        </span>
                      </div>
                      <p
                        className="text-[#2C1A0E] truncate"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {user.name}
                      </p>
                    </div>

                    {/* Email */}
                    <p
                      className="text-[#5C4A3A] truncate pr-4"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "13px",
                      }}
                    >
                      {user.email}
                    </p>

                    {/* Role badge */}
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.06em] w-fit capitalize"
                      style={{
                        fontFamily: "'Georgia', serif",
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        border: `1px solid ${roleStyle.border}`,
                      }}
                    >
                      {role}
                    </span>

                    {/* Verified */}
                    <VerifiedBadge verified={!!user.verified} />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUpdateVerifyId(uid);
                          toggleVerified(uid);
                        }}
                        disabled={updateVerify && updateVerifyId === uid}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold tracking-[0.06em] transition-all duration-200 w-24 ${
                          user.verified
                            ? "bg-[#FFF8E7] border border-[#E8D080] text-[#7A5C00] hover:bg-[#FADADD] hover:border-[#E8A0A8] hover:text-[#7A1A1A]"
                            : "bg-[#F0FBF4] border border-[#A0D4B0] text-[#1A6B3A] hover:bg-[#D4F0DC]"
                        }`}
                        style={{ fontFamily: "'Georgia', serif" }}
                      >
                        {user.verified ? (
                          updateVerify && updateVerifyId === uid ? (
                            "Revoking..."
                          ) : (
                            <>
                              <ShieldOff size={12} strokeWidth={2} /> Revoke
                            </>
                          )
                        ) : updateVerify && updateVerifyId === uid ? (
                          "Verifying..."
                        ) : (
                          <>
                            <ShieldCheck size={12} strokeWidth={2} /> Verify
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDeleteId(isConfirming ? null : uid)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[#C0392B]/60 hover:text-[#C0392B] hover:bg-[#FADADD] transition-all duration-200"
                      >
                        <Trash2 size={15} strokeWidth={1.6} />
                      </button>
                    </div>

                    {/* Change Role */}
                    <div>
                      <button
                        onClick={() => {
                          setUpdateRoleId(uid);
                          toggleRole(uid);
                        }}
                        disabled={updateRole && updateRoleId === uid}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold tracking-[0.06em] transition-all duration-200 ${
                          role === "staff"
                            ? "bg-[#FFF8E7] border border-[#E8D080] text-[#7A5C00] hover:bg-[#FADADD] hover:border-[#E8A0A8] hover:text-[#7A1A1A]"
                            : "bg-[#F0FBF4] border border-[#A0D4B0] text-[#1A6B3A] hover:bg-[#D4F0DC]"
                        }`}
                        style={{ fontFamily: "'Georgia', serif" }}
                      >
                        {role === "owner" ? (
                          updateRole && updateRoleId === uid ? (
                            "Changing..."
                          ) : (
                            <>
                              <UserCheck size={12} strokeWidth={2} /> Make Staff
                            </>
                          )
                        ) : updateRole && updateRoleId === uid ? (
                          "Changing..."
                        ) : (
                          <>
                            <UserPlus size={12} strokeWidth={2} /> Make Owner
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isConfirming && (
                    <div className="px-6 pb-4 border-b border-[#EDE4DA]">
                      <DeleteConfirm
                        name={user.name}
                        onConfirm={() => deleteUser(uid)}
                        onCancel={() => setConfirmDeleteId(null)}
                        isdeleting={deleting}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pagination (both views) ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 px-1">
              <p
                className="text-[#9E8A7E] tracking-[0.08em] uppercase"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px" }}
              >
                {Math.min(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  filtered.length,
                )}
                –{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} strokeWidth={2} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-[12px] font-bold transition-colors ${
                        currentPage === page
                          ? "bg-[#6B1A1A] text-white"
                          : "text-[#5C4A3A] hover:bg-[#EDE4DA]"
                      }`}
                      style={{ fontFamily: "'Georgia', serif" }}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[#6B5040] hover:bg-[#EDE4DA] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
