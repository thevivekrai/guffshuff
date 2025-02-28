import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatPage = () => {
  const { userId } = useParams();
  const { getMessages, messages, selectedUser, setSelectedUser, getUserById } = useChatStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const user = await getUserById(userId);
      setSelectedUser(user);
      getMessages(userId);
    };
    fetchUserAndMessages();
  }, [userId, getMessages, setSelectedUser, getUserById]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center p-4 border-b border-base-300">
        <img
          src={selectedUser?.profilePic || "/avatar.png"}
          alt={selectedUser?.name}
          className="size-12 object-cover rounded-full cursor-pointer"
          onClick={() => navigate(`/user/${userId}`)} // Navigate to user profile on avatar click
        />
        <div className="ml-4">
          <div className="font-medium">{selectedUser?.fullName}</div>
          <div className="text-sm text-zinc-400">{selectedUser?.school}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message._id} className="mb-4">
            <div className={`p-2 rounded-lg ${message.senderId === authUser._id ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      {/* Add message input and send button here */}
    </div>
  );
};

export default ChatPage;
