import dbconnect from "@/src/lib/dbconnect";
import Shop from "@/src/models/Shop";

export async function GET() {
    await dbconnect();

    try {
        const shop = await Shop.findOne().sort({ createdAt: -1 });

        if (!shop) {
            return Response.json({ success: false, message: "Shop details not found" }, { status: 404 });
        }

        return Response.json({ success: true, shop }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching shop details:", error.message);
        return Response.json({ success: false, message: "Failed to fetch shop details", error: error.message }, { status: 500 });
    }
}