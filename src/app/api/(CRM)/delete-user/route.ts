import dbconnect from "@/src/lib/dbconnect";
import UserModel from "@/src/models/User";

export async function DELETE(req: Request){
    await dbconnect();

    try {
        const body = await req.json();

        console.log("Body: ",body);
        

        if(!body.email){
            return Response.json({success:false,message:"Email is required"},{status:400});
        }
        const user = await UserModel.findOne({email:body.email});

        if (!user) {
            return Response.json({success:false,message:"User not found"},{status:404});
        }

        const deletedUser = await UserModel.findByIdAndDelete(user._id);

        if (!deletedUser) {
            return Response.json({success:false,message:"Failed to delete user"},{status:500});
        }
        return Response.json({success:true,message:"User Deleted Successfully"},{status:201});
    } catch (error:any) {
        console.error("Error deleting user:", error.message);
        return Response.json({success:false,message:"Failed to delete user",error:error.message},{status:500})
    }
}