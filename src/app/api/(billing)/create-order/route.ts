import dbconnect from "@/src/lib/dbconnect";
import { decreaseStock } from "@/src/lib/updateStockOnSale";
import Order from "@/src/models/Order";
import { forEach } from "jszip";

export async function POST(req: Request) {
  await dbconnect();

  try {
    const body = await req.json();

    console.log("Order body: ", body);

    if (
      !body.customerId ||
      !body.products ||
      !body.totalAmount ||
      !body.grossWeight ||
      !body.customDuty ||
      !body.sgst ||
      !body.cgst ||
      !body.igst ||
      !body.gstOnMakingCharge ||
      !body.totalPayableAmmount ||
      !body.invoiceNumber ||
      !body.invoiceUrl
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields." }),
        { status: 400 },
      );
    }
    const newOrder = new Order({
      customerId: body.customerId.toObjectId(),
      products: body.products.map((item: any) => ({
        productId: item.productId.toObjectId(),
        quantity: 1,
      })),
      totalAmount: body.totalAmount,
      grossWeight: body.grossWeight,
      customDuty: body.customDuty,
      sgst: body.sgst,
      cgst: body.cgst,
      igst: body.igst,
      gstOnMakingCharge: body.gstOnMakingCharge,
      discount: body.discount || 0,
      totalPayableAmmount: body.totalPayableAmmount,
      invoiceNumber: body.invoiceNumber,
      invoiceUrl: body.invoiceUrl,
      oldProducts: body.oldProducts || [],
    });

    const savedOrder = await newOrder.save();

    if (!savedOrder) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to create order." }),
        { status: 500 },
      );
    }

    body.products.forEach((item: any, i: number) => {
      decreaseStock(item);
    });
    return new Response(
      JSON.stringify({
        success: true,
        savedOrder,
        message: "Order created successfully.",
      }),
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating order:", error?.message);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to create order." }),
      { status: 500 },
    );
  }
}
