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
                  ],
              }
            : {};
        const customers = await CustomerModel.find(query)
            .limit(5)
            .sort({ createdAt: -1 });

        if (!customers) {
            return Response.json({ success: false, message: "No customers found" }, { status: 404 });
        }

        return Response.json({ success: true, data: customers }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching customers:", error.message);
        return Response.json({ success: false, message: "Failed to fetch customers", error: error.message }, { status: 500 });
    }
}