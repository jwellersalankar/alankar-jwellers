"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NavBar from "@/src/components/core/NavBar";
import Footer from "@/src/components/core/Footer";
import { useDebounceCallback } from "usehooks-ts";
import { set } from "mongoose";
import { IPRODUCTS } from "@/src/models/Product";
import axios from "axios";
import CreateProductModal from "@/src/components/products/CreateProduct";
import EditProductModal from "@/src/components/products/EditProduct";
import DeleteProductAlert from "@/src/components/ui/DeleteProductAlert";
import { id } from "zod/locales";
import Pagination from "@/src/components/ui/Pagination";
import ExportGSTReport from "@/src/components/ui/ExportGSTReport";
import { User } from "next-auth";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ── Types ──────────────────────────────────────────────
type Purity = "22k Gold" | "18k Gold" | "24k Gold";

type InventoryItem = {
  id: string;
  productName: string;
  purity: Purity;
  type: string;
  weightG: number;
  hsnCode: string;
  makingCharge: number;
};

// ── Mock Data ──────────────────────────────────────────
const mockItems: InventoryItem[] = [
  {
    id: "#GN-1131",
    productName: "Maharaja Filigree Necklace",
    purity: "22k Gold",
    type: "Necklace",
    weightG: 42.5,
    hsnCode: "71131910",
    makingCharge: 14500,
  },
  {
    id: "#RG-4421",
    productName: "Celestial Solitaire Ring",
    purity: "22k Gold",
    type: "Ring",
    weightG: 6.25,
    hsnCode: "71131920",
    makingCharge: 3200,
  },
  {
    id: "#BG-0012",
    productName: "Antique Temple Bangles",
    purity: "22k Gold",
    type: "Bangles",
    weightG: 38.9,
    hsnCode: "71131910",
    makingCharge: 11000,
  },
  {
    id: "#ER-8829",
    productName: "Emerald Drop Jhumkas",
    purity: "22k Gold",
    type: "Earrings",
    weightG: 18.45,
    hsnCode: "71131910",
    makingCharge: 6800,
  },
];

const PURITY_OPTIONS = ["All Purity", "22k", "18k", "24k", "Other"];
const TYPE_OPTIONS = ["All Types", "Gold", "Silver", "Other"];

// ── Purity Badge ───────────────────────────────────────
function PurityBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide"
      style={{
        background: "linear-gradient(135deg, #F5CC5A 0%, #E8B84B 100%)",
        color: "#5C3D00",
        fontFamily: "'Georgia', serif",
        border: "1px solid #D4A82A",
        minWidth: "68px",
      }}
    >
      {label}
    </span>
  );
}

// ── Select Dropdown ────────────────────────────────────
function SelectDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-[#DDD0C4] text-[#5C4A3A] text-[12px] tracking-[0.08em] uppercase font-semibold pl-4 pr-9 py-2.5 rounded-md cursor-pointer focus:outline-none focus:border-[#8B6914] transition-colors"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6914] pointer-events-none"
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
function MainSection() {
  const [products, setProducts] = useState<IPRODUCTS[] | null>(null);
  const [search, setSearch] = useState("");
  const [purity, setPurity] = useState("All Purity");
  const [type, setType] = useState("All Types");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [selectEditProduct, setSelectEditProduct] = useState<IPRODUCTS | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounceCallback(setSearch, 300);
  const [user, setUser] = useState<User | null>(null);
  
    const router = useRouter();
  
    const { data: session, status } = useSession();

useEffect(() => {
  console.log(session);
  
  if (status === "loading") return; // ⛔ wait

  if (status === "unauthenticated") {
    router.replace("/sign-in");
    return;
  }

  if (status === "authenticated") {
    setUser(session.user as User);
  }

  if (status === "authenticated" && session.user?.verified === false) {
  router.replace("/");
}
}, [status, session]);
  

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `/api/get-product?page=${currentPage}&limit=${limit}&search=${search}`,
        );

        if (response.data.success) {
          setProducts(response.data.products);
          setTotalItems(response.data.pagination.totalProducts);
          setTotalPages(response.data.pagination.totalPages);
        } else {
          console.error("Failed to fetch products:", response.data.message);
        }
      } catch (error: any) {
        console.error("Error fetching products:", error?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, limit, search]);

  const filteredItems = products?.filter((item) => {
    const searchMatch = item?.name
      ?.toLowerCase()
      ?.includes(search?.toLowerCase());
    const purityMatch = purity === "All Purity" || item?.purity === purity;
    const typeMatch = type === "All Types" || item?.type === type;
    return searchMatch && purityMatch && typeMatch;
  });

  const handleSaveNewProduct = (data: IPRODUCTS) => {
    setProducts((prevProducts) => [data, ...(prevProducts || [])]);
    setAddProductOpen(false);
    setCurrentPage(1);
  };

  const handleSaveEditedProduct = (data: IPRODUCTS) => {
    setProducts((prevProducts) => {
      if (!prevProducts) return [data];
      return prevProducts.map((p) => (p._id === data._id ? data : p));
    });
    setEditProductOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    setDeleting(true);

    try {
      const response = await axios.delete(
        `/api/delete-product/${id}`,
      );
      if (response?.data?.success) {
        setProducts((prevProducts) => {
          if (!prevProducts) return null;
          return prevProducts.filter((p) => p._id.toString() !== id);
        });
      } else {
        console.error("Failed to delete product:", response?.data?.message);
      }
    } catch (error: any) {
      console.error("Error deleting product:", error?.message);
    } finally {
      setDeleting(false);
    }
  };

  const tableHeaders = [
    { label: "Item ID", key: "id" },
    { label: "Product Name", key: "productName" },
    {label:"Stocks", key: "stocks"},
    { label: "Purity", key: "purity" },
    { label: "Type", key: "type" },
    { label: "Weight (G)", key: "weightG" },
    { label: "HSN Code", key: "hsnCode" },
    { label: "Making Charge", key: "makingCharge" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F7] px-8 md:px-14 lg:px-20 pt-16 pb-24">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-10">
        <div>
          <h1
            className="text-[#8B2020] mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            Inventory Management
          </h1>
          <p
            className="text-[#9E8A7E]"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Track and manage your handcrafted heirloom collection with
            precision.
          </p>
        </div>

        {/* New Item Button */}
        <button
          className="flex items-center gap-2 bg-[#8B2020] hover:bg-[#6E1A1A] text-white px-6 py-3.5 rounded-md transition-colors duration-200 flex-shrink-0 mt-3 sm:mt-1"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
          onClick={() => setAddProductOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Item
        </button>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="bg-[#F9EAEB] rounded-lg px-5 py-4 flex flex-col md:flex-row items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 w-full">
          <Search
            size={18}
            className="text-[#9E8A7E] flex-shrink-0"
            strokeWidth={1.8}
          />
          <input
            type="text"
            placeholder="Search product name or Item ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#B8A898] text-[14px] focus:outline-none"
            style={{ fontFamily: "'Georgia', serif" }}
          />
        </div>

        {/* Divider */}
        <div className="h-px w-full md:h-8 md:w-px bg-[#DDD0C4]" />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SelectDropdown
            value={purity}
            options={PURITY_OPTIONS}
            onChange={setPurity}
          />
          <SelectDropdown
            value={type}
            options={TYPE_OPTIONS}
            onChange={setType}
          />
        </div>
        <ExportGSTReport />
      </div>

      {/* ── Table ── */}
      <div className="bg-[#FFFFFF] rounded-lg overflow-hidden overflow-x-auto">
        {/* ───────── Desktop Table Header (hidden on mobile) ───────── */}
        <div
          className="hidden md:grid items-center px-6 py-4 border-b border-[#E8DDD4]"
          style={{
            gridTemplateColumns:
              "120px 400px 100px 130px 120px 100px 110px 180px 100px",
          }}
        >
          {tableHeaders.map((h) => (
            <span
              key={h.key}
              className="text-[#9E8A7E] tracking-[0.12em] uppercase whitespace-nowrap"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {h.label}
            </span>
          ))}
        </div>

        {/* ───────── Content ───────── */}
        {loading ? (
          <div className="p-6 text-center text-[#5C4A3A]">
            Loading products...
          </div>
        ) : products && products.length > 0 ? (
          <div>
            {filteredItems?.map((item, idx) => (
              <div
                key={item._id.toString()}
                className={`transition-colors duration-150 ${
                  idx !== filteredItems?.length - 1
                    ? "border-b border-[#EDE4DA]"
                    : ""
                }`}
              >
                {/* ───────── MOBILE CARD ───────── */}
                <div className="md:hidden px-5 py-4 bg-[#FFFDF9]">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className="text-[#2C1A0E]"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      {item?.name}
                    </span>

                    <div className="flex gap-3">
                      <button
                        className="text-[#5BB8D4]"
                        onClick={() => {
                          setSelectEditProduct(item);
                          setEditProductOpen(true);
                        }}
                      >
                        <Pencil size={18} />
                      </button>

                      <DeleteProductAlert
                        productName={item?.name}
                        productId={item?._id?.toString()}
                        onConfirm={() =>
                          handleDeleteProduct(item?._id?.toString())
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-[#9E8A7E]">ID</span>
                    <span className="text-[#6B5040]">
                      {item?.huid || "#N/A"}
                    </span>

                    <span className="text-[#9E8A7E]">Purity</span>
                    <PurityBadge label={item?.purity} />

                    <span className="text-[#9E8A7E]">Stocks</span>
                    <span className="text-[#2C1A0E] font-semibold">
                      {item?.stock} pcs
                    </span>

                    <span className="text-[#9E8A7E]">Type</span>
                    <span className="text-[#5C4A3A]">{item?.type}</span>

                    <span className="text-[#9E8A7E]">Weight</span>
                    <span className="text-[#2C1A0E] font-semibold">
                      {item?.weight?.toFixed(2)}
                    </span>

                    <span className="text-[#9E8A7E]">HSN</span>
                    <span className="text-[#6B5040]">{item?.hsn || "N/A"}</span>

                    <span className="text-[#9E8A7E]">Making</span>
                    <span className="text-[#8B6914]">
                      {item?.makingCharge
                        ? "₹" + item?.makingCharge?.toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* ───────── DESKTOP ROW ───────── */}
                <div
                  className="hidden md:grid items-center px-6 py-5 hover:bg-[#F5EDE4]"
                  style={{
                    gridTemplateColumns:
                     "120px 400px 100px 130px 120px 100px 110px 180px 100px",
                  }}
                >
                  <span className="text-[#6B5040] text-[13px] font-[Georgia]">
                    {item?.huid || "#N/A"}
                  </span>

                  <span className="text-[#2C1A0E] text-[15px] font-semibold pr-4 whitespace-nowrap font-[Georgia]">
                    {item?.name}
                  </span>

                  <span className="text-[#2C1A0E] text-[13px] font-semibold pr-4 whitespace-nowrap font-[Georgia]">
                    {item?.stock} pcs
                  </span>

                  <div> <PurityBadge label={item?.purity} /> </div>

                  <span className="text-[#5C4A3A] text-[13px] font-[Georgia]">
                    {item.type}
                  </span>

                  <span className="text-[#2C1A0E] text-[13px] font-semibold font-[Georgia]">
                    {item?.weight?.toFixed(2)}
                  </span>

                  <span className="text-[#6B5040] text-[13px] font-[Georgia]">
                    {item?.hsn || "N/A"}
                  </span>

                  <span className="text-[#8B6914] text-[13px] font-medium font-[Georgia]">
                    {item?.makingCharge
                      ? "₹" + item?.makingCharge?.toLocaleString()
                      : "N/A"}
                  </span>

                  <div className="flex items-center gap-4">
                    <button className="text-[#5BB8D4] hover:text-[#3A9AB8]">
                      <Pencil
                        size={20}
                        strokeWidth={1.6}
                        onClick={() => {
                          setSelectEditProduct(item);
                          setEditProductOpen(true);
                        }}
                      />
                    </button>

                    <DeleteProductAlert
                      productName={item?.name}
                      productId={item?._id?.toString()}
                      onConfirm={() =>
                        handleDeleteProduct(item?._id?.toString())
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-[#5C4A3A]">
            No products found.
          </div>
        )}

        {/* ───────── Footer ───────── */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between px-6 py-5 border-t border-[#E8DDD4]">
          <span className="text-[#9E8A7E] tracking-[0.08em] uppercase text-[11px] font-[Georgia] text-center md:text-left">
            Showing {(currentPage - 1) * limit + 1} to {products?.length} of{" "}
            {totalItems} Items
          </span>

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
      {addProductOpen && (
        <CreateProductModal
          onClose={() => setAddProductOpen(false)}
          onSave={(data: IPRODUCTS) => {
            handleSaveNewProduct(data);
          }}
        />
      )}
      {editProductOpen && (
        <EditProductModal
          product={selectEditProduct || null}
          onClose={() => setEditProductOpen(false)}
          onSave={(data: IPRODUCTS) => {
            handleSaveEditedProduct(data);
          }}
        />
      )}
    </div>
  );
}

export default function InventorySection() {
  return (
    <main>
      <NavBar />
      <MainSection />
      <Footer />
    </main>
  );
}
