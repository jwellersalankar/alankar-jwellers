// app/api/invoices/search/route.ts

import dbconnect from "@/src/lib/dbconnect";
import OrderModel from "@/src/models/Order";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const invoiceNumber = searchParams
      .get("q")
      ?.trim();

    if (!invoiceNumber) {
      return Response.json({
        success: true,
        data: [],
      });
    }

    const invoices = await OrderModel.aggregate([
      {
        $match: {
          invoiceNumber: {
            $regex: invoiceNumber,
            $options: "i",
          },
        },
      },

      {
        $lookup: {
          from: "customers", // collection name
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },

      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,

          invoiceNumber: 1,
          invoiceUrl: 1,

          totalAmount: 1,
          totalPayableAmmount: 1,

          totalTaxableValue: 1,

          totalCGST: 1,
          totalSGST: 1,
          totalIGST: 1,

          sellerGSTIN: 1,
          placeOfSupply: 1,
          isInterState: 1,

          createdAt: 1,

          products: 1,

          customer: {
            _id: "$customer._id",
            name: "$customer.name",
            phone: "$customer.phone",
            email: "$customer.email",
            adress: "$customer.adress",
            gstin: "$customer.gstin",
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $limit: 20,
      },
    ]);

    return Response.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message:
          "Failed to search invoices",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}