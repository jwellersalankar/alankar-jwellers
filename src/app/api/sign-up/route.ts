import dbconnect from "@/src/lib/dbconnect";
import UserModel from "@/src/models/User";
import bcrypt from "bcryptjs";
import { success } from "zod";

export async function POST(req: Request) {
    await dbconnect();

    try {
        const {name,email,password} = await req.json();
        
        if(!name || !email || !password){
            return new Response(JSON.stringify({success:false,message:"All fields are required."}),{status:400})
        }

        const existingUser = await UserModel.findOne({email});

        if(existingUser){
            return new Response(JSON.stringify({
                success:false,
                message:"Email already in use."}),{status:400})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        return new Response(JSON.stringify({success:true,message:"User created successfully."}),{status:201})

    } catch (error) {
        return new Response(JSON.stringify({success:false,message:"An error occurred while creating the user."}),{status:500})
    }
}