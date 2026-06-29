import { ICustomer } from "../models/Customer";
import { IProduct } from "../models/OldProduct";
import { IPRODUCTS } from "../models/Product";
import { ISHOP } from "../models/Shop";

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  customer: ICustomer | null;
  items: IPRODUCTS[];
  oldItems?: IProduct[];
  shopDetails?: ISHOP | null;
}