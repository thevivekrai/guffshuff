import Match from "../models/match.model.js";
import User from "../models/user.model.js";

export const getPotentialMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    // Find users from the same school who are not already matched
    const potentialMatches = await User.find({
      $and: [
        { _id: { $ne: userId } },
        { school: currentUser.school },
        { _id: { $nin: [...currentUser.matches, ...currentUser.likes] } }
      ]
    }).select("-password -matches -likes");

    res.status(200).json(potentialMatches);
  } catch (error) {
    console.error("Error in getPotentialMatches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createMatch = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot match with yourself" });
    }

    // Check if users exist
    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Check if already liked
    if (currentUser.likes.includes(targetUserId)) {
      return res.status(400).json({ error: "You've already liked this user" });
    }

    // Add to likes
    currentUser.likes.push(targetUserId);
    await currentUser.save();

    // Check if target user has already liked current user
    if (targetUser.likes.includes(userId.toString())) {
      // It's a match!
      const match = new Match({
        users: [userId, targetUserId],
        status: 'matched'
      });
      await match.save();

      // Update both users' matches arrays
      currentUser.matches.push(targetUserId);
      targetUser.matches.push(userId);
      
      await Promise.all([currentUser.save(), targetUser.save()]);

      return res.status(200).json({ 
        message: "It's a match!", 
        match,
        targetUser: {
          _id: targetUser._id,
          fullName: targetUser.fullName,
          profilePic: targetUser.profilePic
        }
      });
    }

    res.status(200).json({ message: "Like registered successfully" });
  } catch (error) {
    console.error("Error in createMatch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('matches', '-password');
    
    res.status(200).json(user.matches);
  } catch (error) {
    console.error("Error in getMatches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
