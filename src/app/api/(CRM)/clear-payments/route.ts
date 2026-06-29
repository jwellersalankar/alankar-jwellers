import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function DELETE(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return Response.json(
        { success: false, message: "Phone is required" },
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

    // 🔥 Clear everything
    customer.payments = [];
    customer.dueAmount = 0;
    customer.advanceAmount = 0;

    await customer.save();

    return Response.json(
      {
        success: true,
        message: "All payment history cleared successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Clear payments error:", error.message);

    return Response.json(
      {
        success: false,
        message: "Failed to clear payment history",
        error: error.message,
      },
      { status: 500 }
    );
  }
}