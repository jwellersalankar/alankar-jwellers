import dbconnect from "@/src/lib/dbconnect";
import CustomerModel from "@/src/models/Customer";

export async function POST(request: Request){
    dbconnect();

    try {
        const body = await request.json();
        if (!body.name || !body.phone || !body.adress) {
            return new Response(JSON.stringify({ success: false, message: "Name, phone, and address are required." }), { status: 400 });
        }

        const customer = await CustomerModel.findOne({ phone: body.phone, name: body.name });

        if (customer) {
            const updatedCustomer = await CustomerModel.findByIdAndUpdate(customer._id, { ...body }, { new: true });
            if (updatedCustomer) {
                return new Response(JSON.stringify({ success: true, data:updatedCustomer, message: "Customer updated successfully." }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ success: false, message: "Failed to update customer." }), { status: 500 });
            }
        }

        const newCustomer = new CustomerModel({ ...body });
        const savedCustomer = await newCustomer.save();

        if (!savedCustomer) {
            return new Response(JSON.stringify({ success: false, message: "Failed to add customer." }), { status: 500 });
        }
        return new Response(JSON.stringify({ success: true, data:savedCustomer, message: "Customer added successfully." }), { status: 201 });
    } catch (error: any) {
        console.error("Error adding customer:", error?.message);
        return new Response(JSON.stringify({ success: false, message: "Failed to add customer." }), { status: 500 });
    }
}