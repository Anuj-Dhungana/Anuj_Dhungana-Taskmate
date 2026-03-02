import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            default: '',
            trim: true,
            maxlength: 2000,
        },
        roomID: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null,
            index: true,
        },
        startsAt: {
            type: Date,
            required: true,
            index: true,
        },
        endsAt: {
            type: Date,
            required: true,
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: 15,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attendees: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
