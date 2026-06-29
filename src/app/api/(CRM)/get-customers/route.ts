import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { dueAmount: { $gt: 0 } },
            { advanceAmount: { $gt: 0 } },
          ],
        }
      : {
        $or: [
          { dueAmount: { $gt: 0 } },
            { advanceAmount: { $gt: 0 } },
        ]
      };
    const customers = await CustomerModel.find(query).sort({ dueAmount: 1 });

    if (!customers) {
      return new Response(
        JSON.stringify({ success: false, message: "No customers found" }),
        { status: 404 },
      );
    }

    return new Response(JSON.stringify({ success: true, data: customers }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch customers",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}
