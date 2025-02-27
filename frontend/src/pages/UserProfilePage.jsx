import { useParams } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

const UserProfilePage = () => {
  const { userId } = useParams();
  const { getUserById } = useChatStore();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = await getUserById(userId);
      setUser(fetchedUser);
      setIsLoading(false);
    };

    fetchUser();
  }, [userId, getUserById]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">{user.fullName}</h1>
            <p className="mt-2">@{user.username}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img
              src={user.profilePic || "/avatar.png"}
              alt="Profile"
              className="size-32 rounded-full object-cover border-4 "
            />
            <p className="text-sm text-zinc-400">{user.bio}</p>
            <p className="text-sm text-zinc-400">{user.school}</p> {/* Add school */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
