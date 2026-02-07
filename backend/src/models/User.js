import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: ""
    },

    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationCodeExpires: Date,

     resetPasswordToken: String,
    resetPasswordExpire: Date,


    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorCode: {
        type: String,
        default: null
    },
    twoFactorExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;