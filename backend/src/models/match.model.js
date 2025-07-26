import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    status: {
      type: String,
      enum: ['pending', 'matched', 'rejected'],
      default: 'pending'
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  { timestamps: true }
);

// Ensure users field always has exactly 2 users
matchSchema.pre('save', function(next) {
  if (this.users.length !== 2) {
    next(new Error('A match must have exactly 2 users'));
  }
  next();
});

const Match = mongoose.model("Match", matchSchema);

export default Match;
