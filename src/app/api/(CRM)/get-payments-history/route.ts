import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const phone = searchParams.get("phone");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!phone) {
      return Response.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    const customer = await CustomerModel.findOne({ phone });

    if (!customer) {
      return Response.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────
    // 🔥 Sort payments (latest first)
    // ─────────────────────────────────────────────
    const sortedPayments = [...customer.payments].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // ─────────────────────────────────────────────
    // 🔥 Pagination
    // ─────────────────────────────────────────────
    const start = (page - 1) * limit;
    const paginatedPayments = sortedPayments.slice(
      start,
      start + limit
    );

    // ─────────────────────────────────────────────
    // 🔥 Calculate balance (live)
    // ─────────────────────────────────────────────
    let balance = 0;

    customer.payments.forEach((p: any) => {
      if (p.type === "credit") balance += p.amount;
      else balance -= p.amount;
    });

    const dueAmount = balance < 0 ? Math.abs(balance) : 0;
    const advanceAmount = balance > 0 ? balance : 0;

    return Response.json(
      {
        success: true,
        data: {
          customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone,
          },

          payments: paginatedPayments,

          summary: {
            totalPayments: customer.payments.length,
            currentPage: page,
            totalPages: Math.ceil(customer.payments.length / limit),
          },

          balance: {
            dueAmount,
            advanceAmount,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching payments:", error.message);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch payment history",
        error: error.message,
      },
      { status: 500 }
    );
  }
}