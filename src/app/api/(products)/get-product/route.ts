import dbconnect from "@/src/lib/dbconnect";
import ProductModel from "@/src/models/Product";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // 🔍 Search condition (name OR huid)
    const query: any = {
  stock: { $gt: 0 }, // ✅ always applied
};

if (search) {
  query.$or = [
    { name: { $regex: search, $options: "i" } },
    { huid: { $regex: search, $options: "i" } },
  ];
}

    const totalProducts = await ProductModel.countDocuments(query);

    const products = await ProductModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({
        success: true,
        products,
        pagination: {
          totalProducts,
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          pageSize: limit,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error fetching products",
      }),
      { status: 500 },
    );
  }
}
