import dbconnect from "@/src/lib/dbconnect";
import UserModel, { IUser } from "@/src/models/User";

export async function PATCH(req:Request){
    await dbconnect();

    try {
        const body = await req.json();

        if(!body.email){
            return Response.json({success:false,message:"Email is required"},{status:400});
        }

        const user = await UserModel.findOne({email:body.email});

        if(!user){
            return Response.json({success:false,message:"User not found"},{status:404});
        }

        const updatedUser = await UserModel.findByIdAndUpdate(user._id,body);

        if(!updatedUser){
            return Response.json({success:false,message:"Failed to update user"},{status:500});
        }
        else{
            return Response.json({success:true,data:updatedUser,message:"User updated successfully"},{status:200});
        }
    } catch (error: any) {
        console.error("Error in updatin users: ",error.message);
        return Response.json({success:false,message:"Failed to update user",error:error.message},{status:500})
    }
}