import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function PATCH(req: Request) {
  await dbconnect();

  try {
    const body = await req.json();

    if (!body.phone) {
      return Response.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    const customer = await CustomerModel.findOne({
      phone: body.phone,
      name: body.name,
    });

    if (!customer) {
      return Response.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────
    // 🔥 1. Add payment if provided
    // ─────────────────────────────────────────────
    if (body.payment) {
      const newPayment = {
        amount: Number(body.payment.amount),
        type: body.payment.type, // "credit" | "debit"
        reason: body.payment.reason, // "advance" | "purchase" | etc.
        mode: body.payment.mode || "cash",
        note: body.payment.note || "",
        billId: body.payment.billId || "",
        date: new Date(),
      };

      customer.payments.push(newPayment);
    }

    // ─────────────────────────────────────────────
    // 🔥 2. Recalculate balance from ledger
    // ─────────────────────────────────────────────
    let balance = 0;

    customer.payments.forEach((p: any) => {
      if (p.type === "credit") balance += p.amount;
      else balance -= p.amount;
    });

    const dueAmount = balance < 0 ? Math.abs(balance) : 0;
    const advanceAmount = balance > 0 ? balance : 0;

    // ─────────────────────────────────────────────
    // 🔥 3. Update other fields (safe fields only)
    // ─────────────────────────────────────────────
    if (body.name) customer.name = body.name;
    if (body.address) customer.adress = body.address;
    if (body.dob) customer.dob = body.dob;
    if (body.anniversary) customer.anniversary = body.anniversary;

    // ─────────────────────────────────────────────
    // 🔥 4. Save final values
    // ─────────────────────────────────────────────
    customer.dueAmount = dueAmount;
    customer.advanceAmount = advanceAmount;

    await customer.save();

    return Response.json(
      {
        success: true,
        data: customer,
        message: "Customer updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating customer:", error.message);

    return Response.json(
      {
        success: false,
        message: "Failed to update customer",
        error: error.message,
      },
      { status: 500 }
    );
  }
}