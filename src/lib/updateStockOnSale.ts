// utils/updateStockOnSale.ts

import Product from "@/src/models/Product";

export const decreaseStock = async (item: any) => {
  if (!item.productId || !item.quantity) {
    throw new Error("Invalid stock payload");
  }

  await Product.findByIdAndUpdate(
    item.productId,
    {
      $inc: {
        stock: -item.quantity,
      },
    },
    { new: true }
  );
};