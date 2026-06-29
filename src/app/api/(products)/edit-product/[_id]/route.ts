import dbconnect from "@/src/lib/dbconnect";
import ProductModel from "@/src/models/Product";

export async function PATCH(req: Request, context: { params: Promise<{ _id: string }> }) {
    await dbconnect();

    const { _id } = await context.params;

    try {
        const { name, description, weight, price, stock, type, purity, makingCharge, huid, hsn } = await req.json();

        const product = await ProductModel.findById(_id);

        if (!product) {
            return new Response(JSON.stringify({ success: false, message: "Product not found." }), { status: 404 });
        }
        product.name = name || product.name;
        product.description = description || product.description;
        product.weight = weight || product.weight;
        product.price = price || product.price;
        product.stock = stock || product.stock;
        product.type = type || product.type;
        product.purity = purity || product.purity;
        product.makingCharge = makingCharge || product.makingCharge;
        product.huid = huid || product.huid;
        product.hsn = hsn || product.hsn;

        const updatedProduct = await product.save();

        if (updatedProduct) {
            return new Response(JSON.stringify({ success: true, updatedProduct, message: "Product updated successfully." }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: "Failed to update product." }), { status: 500 });
        }

    } catch (error) {
        return new Response(JSON.stringify({success:false,message:"An error occurred while updating the product."}),{status:500})
    }
}