// utils/updateStockOnPurchase.ts

import Product from "@/src/models/Product";

export const increaseStock = async (item: any) => {
  const value = (item.metalValue + item.makingCharge) * item.quantity;

  await Product.findByIdAndUpdate(item.productId, {
    $inc: {
      stockQuantity: item.quantity,
      stockValue: value,
    },
  });
};