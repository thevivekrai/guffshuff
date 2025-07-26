import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, User, Edit3, School } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, checkAuth } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [formData, setFormData] = useState({
    fullName: authUser.fullName,
    username: authUser.username,
    bio: authUser.bio || "",
    school: authUser.school || "", // Add school
  });

  useEffect(() => {
    setFormData({
      fullName: authUser.fullName,
      username: authUser.username,
      bio: authUser.bio || "",
      school: authUser.school || "", // Add school
    });
  }, [authUser]);

  const resizeImage = (file, maxWidth, maxHeight, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg");
        callback(dataUrl);
      };
    };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resizeImage(file, 300, 300, async (base64Image) => {
      setSelectedImg(base64Image);
      try {
        await updateProfile({ ...formData, profilePic: base64Image });
        checkAuth(); // Fetch the latest user data
      } catch (error) {
        console.error("Error updating profile picture:", error);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username.length < 5) {
      toast.error("Username must be at least 5 characters long");
      return;
    }
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully");
      checkAuth(); // Fetch the latest user data
    } catch (error) {
      if (error.response?.data?.message === "Username already exists") {
        toast.error("Username already exists");
      } else {
        toast.error("Failed to update profile");
      }
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <input
                type="text"
                className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
              <input
                type="text"
                className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Bio
              </div>
              <textarea
                className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <School className="w-4 h-4" />
                School/College
              </div>
              <input
                type="text"
                className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
                value={formData.school}
                readOnly
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </button>
          </form>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
