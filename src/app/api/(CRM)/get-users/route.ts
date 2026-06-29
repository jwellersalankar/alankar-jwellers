import dbconnect from "@/src/lib/dbconnect";
import UserModel from "@/src/models/User";

export async function GET() {
    await dbconnect();

    try {
        const users = await UserModel.find();

        if (!users) {
            return new Response(
                JSON.stringify({ success: false, message: "No users found" }),
                { status: 404 },
            );
        }

        return new Response(JSON.stringify({ success: true, data: users }), {
            status: 200,
        })
    } catch (error: any) {
        console.error("Error fetching users:", error.message);
        return new Response(
            JSON.stringify({
                success: false,
                message: "Failed to fetch users",
                error: error.message,
            }),
            { status: 500 },
        );
    }
}