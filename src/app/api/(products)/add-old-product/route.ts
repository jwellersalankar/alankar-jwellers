import dbconnect from "@/src/lib/dbconnect";
import OldProductModel from "@/src/models/OldProduct";

export async function POST(req: Request) {
    dbconnect();

    try {
        const body = await req.json();

        console.log("oldProducts: ",body);
        

        const { invoiceNo, name, description, weight, price, quantity, type, purity, huid } = body;

        if (!invoiceNo || !name || !weight || !price || !type || !purity) {
            return new Response(
                JSON.stringify({ success: false, message: "Missing required fields" }),
                { status: 400 },
            );
        }
        const oldProduct = new OldProductModel({
            inVoiceNo: invoiceNo,
            name,
            description,
            weight,
            price,
            quantity,
            type,
            purity,
            huid,
        });
        const savedProduct = await oldProduct.save();

        if(!savedProduct) {
            return new Response(
                JSON.stringify({ success: false, message: "Failed to add old product" }),
                { status: 500 },
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Old product added successfully", data: savedProduct }),
            { status: 200 },
        )

    } catch (error: any) {
        console.error("Error adding old product:", error.message);
        return new Response(
            JSON.stringify({ success: false, message: "Failed to add old product", error: error.message }),
            { status: 500 },
        );
    }
}