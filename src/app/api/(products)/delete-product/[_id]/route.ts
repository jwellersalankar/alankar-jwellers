import dbconnect from "@/src/lib/dbconnect";
import ProductModel from "@/src/models/Product";

export async function DELETE(req: Request, context: { params: Promise<{ _id: string }> }) {
    await dbconnect();
    const { _id } = await context.params;

    try {
        const deletedProduct = await ProductModel.findByIdAndDelete(_id);

        if (deletedProduct) {
            return new Response(JSON.stringify({ success: true, message: "Product deleted successfully." }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: "Product not found." }), { status: 404 });
        }
    } catch (error) {
        return new Response(JSON.stringify({success:false,message:"An error occurred while deleting the product."}),{status:500})
    }
}