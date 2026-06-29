import dbconnect from "@/src/lib/dbconnect";
import Shop from "@/src/models/Shop";
import { log } from "console";

export async function PATCH(req: Request) {
  await dbconnect();

  try {
    const body = await req.json();

    log("Received shop details:", body);

    const shop = await Shop.findOne().sort({ createdAt: -1 });

    if (!shop) {
      if (
        !body.name ||
        !body.gstin ||
        !body.address ||
        !body.contactNumber ||
        !body.email ||
        !body.goldRatePer10g ||
        !body.silverRatePerKg ||
        !body.gstOnMetal ||
        !body.customDuty ||
        !body.gstOnMakingCharge
      ) {
        return Response.json(
          { success: false, message: "All fields are required." },
          { status: 400 },
        );
      }
      const parseCurrency = (value: string) => Number(value.replace(/,/g, ""));
      const newShop = new Shop({
        name: body.name,
        gstin: body.gstin,
        address: body.address,
        contactNumber: body.contactNumber,
        email: body.email,
        accountNumber: body.accountNumber || "",
        ifscCode: body.ifscCode || "",
        goldRatePer10g: parseCurrency(body.goldRatePer10g),
        silverRatePerKg: parseCurrency(body.silverRatePerKg),
        gstOnMetal: parseCurrency(body.gstOnMetal),
        customDuty: parseCurrency(body.customDuty),
        gstOnMakingCharge: parseCurrency(body.gstOnMakingCharge),
        termsAndConditions: body.termsAndConditions || "",
      });
      const savedShop = await newShop.save();

      if (!savedShop) {
        return Response.json(
          { success: false, message: "Failed to create shop details" },
          { status: 500 },
        );
      }

      return Response.json(
        {
          success: true,
          savedShop,
          message: "Shop details created successfully",
        },
        { status: 201 },
      );
    } else {
      const updatedShop = await Shop.findByIdAndUpdate(shop._id, body,{new:true});

      if (!updatedShop) {
        return Response.json(
          { success: false, message: "Failed to update shop details" },
          { status: 500 },
        );
      }

      return Response.json(
        {
          success: true,
          updatedShop,
          message: "Shop details updated successfully",
        },
        { status: 200 },
      );
    }
  } catch (error: any) {
    console.error("Error updating shop details:", error.message);
    return Response.json(
      {
        success: false,
        message: "Failed to update shop details",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
