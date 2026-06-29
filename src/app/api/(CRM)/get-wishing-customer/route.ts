import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const today = new Date();

    const customers = await CustomerModel.find({
      $or: [
        {
          $expr: {
            $and: [
                { $ne: ["$dob", null] },
              { $eq: [{ $dayOfMonth: "$dob" }, today.getDate()] },
              { $eq: [{ $month: "$dob" }, today.getMonth() + 1] },
            ],
          },
        },
        {
          $expr: {
            $and: [
                { $ne: ["$anniversary", null] },
              { $eq: [{ $dayOfMonth: "$anniversary" }, today.getDate()] },
              { $eq: [{ $month: "$anniversary" }, today.getMonth() + 1] },
            ],
          },
        },
      ],
    });

    if (customers) {
      return Response.json({ success: true, data: customers }, { status: 200 });
    } else {
      return Response.json(
        { success: false, message: "No customers found" },
        { status: 404 },
      );
    }
  } catch (error: any) {
    console.error(
      "Error in fetching customers with dob and anniversary: ",
      error.message,
    );
    return Response.json(
      {
        success: false,
        message: "Failed to fetch customers",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
