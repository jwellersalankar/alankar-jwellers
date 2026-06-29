import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'owner' | 'staff';
    verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
        verified: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const UserModel = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User',UserSchema)

export default UserModel