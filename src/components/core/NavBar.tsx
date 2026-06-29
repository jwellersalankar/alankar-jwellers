"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleUserRound, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import ProfileDropdown from "../ui/Profiledropdown";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "HOME", href: "/" },
  { label: "INVENTORY", href: "/inventory" },
  { label: "BILLING", href: "/billing" },
  { label: "CRM", href: "/crm" },
];

export default function NavBar() {
  const [activeItem, setActiveItem] = useState<string>("HOME");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const pathname = usePathname();

  const {data: session} = useSession()

  useEffect(() => {
    if(!session || !session.user) {
      return;
    }
    setUser(session.user as User);
  }, [session]);

  return (
    <nav className="w-full bg-[#FFF8F7] border-b border-[#E8DDD4] shadow-sm">
      <div className="max-w-screen-xl mx-auto px-6 h-[90px] flex items-center justify-between relative">
        
        {/* Logo */}
        <div className=" flex-shrink-0">
          <div className=" ">
            {/* Decorative floral emblem using SVG — no external image */}
            <img src="/Logo.png" alt="Hero" className="w-[100px] h-[80px] object-cover rounded-full" />
          </div>
        </div>

        {/* Desktop Nav Links — centered */}
        <ul className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setActiveItem(item.label)}
                  className={`
                    relative text-[13px] font-semibold tracking-[0.12em] transition-colors duration-200 pb-1
                    ${
                      (item.href === pathname)
                        ? "text-[#8B6914]"
                        : "text-[#3D2B1F] hover:text-[#8B6914]"
                    }
                  `}
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {item.label}
                  {/* Active underline */}
                  {(item.href === pathname) && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8B6914] rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right side — User icon + mobile hamburger */}
        <div className="flex items-center gap-4">
          {/* User Icon */}
          {
            user ? (
              <div>
                <ProfileDropdown />
              </div>
            ) : (
              <button
            aria-label="User account"
            className="text-[#3D2B1F] hover:text-[#8B6914] transition-colors duration-200"
          >
            <CircleUserRound
              size={80}
              strokeWidth={1.4}
              className="text-[#3D2B1F] hover:text-[#8B6914] transition-colors"
            />
          </button>
            )
          }

          {/* Mobile Hamburger */}
          <button
            aria-label="Toggle menu"
            className="md:hidden text-[#3D2B1F] hover:text-[#8B6914] transition-colors duration-200"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6F1] border-t border-[#E8DDD4] px-6 pb-4">
          <ul className="flex flex-col gap-4 pt-4">
            {navItems.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setActiveItem(item.label);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      block text-[13px] font-semibold tracking-[0.12em] py-2 border-b border-[#E8DDD4] transition-colors duration-200
                      ${isActive ? "text-[#8B6914]" : "text-[#3D2B1F] hover:text-[#8B6914]"}
                    `}
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}