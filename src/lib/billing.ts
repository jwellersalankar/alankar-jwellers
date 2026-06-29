import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";
import Order from "@/src/models/Order";
import OldProductModel from "@/src/models/OldProduct";
import mongoose from "mongoose";

export async function addCustomer(data: any) {
  await dbconnect();

  try {
    if (!data.name || !data.phone || !data.adress) {
      return {
        success: false,
        message: "Name, phone, and address are required.",
        status: 400,
      };
    }

    const customer = await CustomerModel.findOne({
      phone: data.phone,
      name: data.name,
    });

    if (customer) {
      const updatedCustomer = await CustomerModel.findByIdAndUpdate(
        customer._id,
        { ...data },
        { new: true },
      );
      if (updatedCustomer) {
        return {
            success: true,
            data: updatedCustomer,
            message: "Customer updated successfully.",
            status: 200,
          };
      } else {
        return {
          success: false,
          message: "Failed to update customer.",
          status: 500,
        };
      }
    }
    const newCustomer = new CustomerModel({ ...data });
    const savedCustomer = await newCustomer.save();

    if (!savedCustomer) {
      return {
        success: false,
        message: "Failed to add customer.",
        status: 500,
      };
    }
    return {
      success: true,
      data: savedCustomer,
      message: "Customer added successfully.",
      status: 201,
    };
  } catch (error: any) {
    console.error("Error adding customer:", error?.message);
    return { success: false, message: "Failed to add customer.", status: 500 };
  }
}

export async function createOrder(data: any) {
  await dbconnect();

  try {
    const body = data;

    console.log("Order body: ", body);

    if (
      !body.customerId ||
      !body.products ||
      body.totalAmount == null ||
      body.grossWeight == null ||
      body.customDuty == null ||
      body.sgst == null ||
      body.cgst == null ||
      body.igst == null ||
      body.gstOnMakingCharge == null ||
      body.totalPayableAmmount == null ||
      !body.invoiceNumber ||
      !body.invoiceUrl
    ) {
      return { success: false, message: "Missing required fields.", status: 400 };
    }

    console.log("Body after Validation:", body);

    const newOrder = new Order({
      customerId: new mongoose.Types.ObjectId(body.customerId),
      products: body.products.map((item: any) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
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
      return{ success: false, message: "Failed to create order.", status: 500 };
    }

    return {
        success: true,
        data: savedOrder,
        message: "Order created successfully.",
        status: 201,
      };
  } catch (error: any) {
    console.error("Error creating order:", error?.message);
    return { success: false, message: "Failed to create order.", status: 500 };
  }
}

export async function addOldProducts(data: any) {
  await dbconnect();

  try {
    const body = data;

    console.log("oldProducts: ", body);

    const {
      invoiceNo,
      name,
      description,
      weight,
      price,
      quantity,
      type,
      purity,
      huid,
    } = body;

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

    if (!savedProduct) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to add old product",
        }),
        { status: 500 },
      );
    }

    console.log("Saved Old Product: ", savedProduct);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Old product added successfully",
        data: savedProduct,
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error adding old product:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to add old product",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}
