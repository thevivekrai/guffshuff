import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Heart, Loader, MessageCircle, X } from 'lucide-react';

const MatchesPage = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      try {
        const response = await axiosInstance.get('/matches/potential');
        if (!response.data || response.data.length === 0) {
          setHasMore(false);
          setPotentialMatches([]);
        } else {
          // Filter out any matches without required fields
          const validMatches = response.data.filter(match => 
            match && match._id && match.fullName && match.school
          );
          
          // Shuffle the valid matches
          const shuffledMatches = [...validMatches].sort(() => Math.random() - 0.5);
          setPotentialMatches(shuffledMatches);
          setHasMore(true);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Retry after 2 seconds
        } else {
          toast.error('Unable to load matches. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, []);

  const handleLike = async () => {
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch || !currentMatch._id) {
      toast.error('Invalid user data');
      return;
    }

    try {
      const response = await axiosInstance.post('/matches/like', {
        targetUserId: currentMatch._id
      });

      if (response.data.match) {
        // Create the match in the chat store
        setMatchedUser({
          _id: currentMatch._id,
          fullName: currentMatch.fullName,
          profilePic: currentMatch.profilePic,
          school: currentMatch.school,
          bio: currentMatch.bio
        });
        setMatchModalOpen(true);
      }

      // Remove the current match from the array
      setPotentialMatches(prev => prev.filter(match => match._id !== currentMatch._id));

      // If we're running low on matches, fetch more
      if (potentialMatches.length <= 3) {
        fetchPotentialMatches();
      }

      // Move to next match or show no more matches
      if (currentIndex >= potentialMatches.length - 1) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to like user';
      toast.error(errorMessage);
      
      // If we get a 500 error, wait a moment and try to refresh the matches
      if (error.response?.status === 500) {
        setTimeout(() => {
          fetchPotentialMatches();
        }, 1000);
      }
    }
  };
  
  const fetchPotentialMatches = async () => {
    try {
      const response = await axiosInstance.get('/matches/potential');
      // Shuffle the matches array to randomize the order
      const shuffledMatches = response.data.sort(() => Math.random() - 0.5);
      setPotentialMatches(shuffledMatches);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error(error.response?.data?.message || 'Failed to load potential matches');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleStartChat = () => {
    if (matchedUser && matchedUser._id) {
      setMatchModalOpen(false); // Close the modal first
      // Small delay to allow modal animation to complete
      setTimeout(() => {
        navigate(`/chat/${matchedUser._id}`);
      }, 100);
    } else {
      toast.error('Unable to start chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentMatch = potentialMatches[currentIndex];

  if (!currentMatch || !hasMore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">No More Matches</h2>
        <p className="text-gray-600 mb-4">Check back later for new potential matches!</p>
        <button 
          onClick={fetchPotentialMatches}
          className="btn btn-primary"
        >
          Refresh Matches
        </button>
      </div>
    );
  }

  // Ensure all required data is present
  if (!currentMatch.fullName || !currentMatch._id) {
    console.error('Invalid match data:', currentMatch);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">Unable to load match information</p>
        <button 
          onClick={fetchPotentialMatches}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        <img 
          src={currentMatch.profilePic || '/avatar.png'} 
          alt={currentMatch.fullName}
          className="w-full h-96 object-cover"
        />
        <div className="p-4 bg-white">
          <h2 className="text-2xl font-bold">{currentMatch.fullName}</h2>
          <p className="text-gray-600 mb-2">School: {currentMatch.school}</p>
          {currentMatch.bio && (
            <p className="text-gray-700 mb-4">{currentMatch.bio}</p>
          )}
          
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSkip}
              className="p-4 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={handleLike}
              className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition text-white"
            >
              <Heart className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {matchModalOpen && matchedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <img
                src={useAuthStore.getState().authUser?.profilePic || '/avatar.png'}
                alt="Your profile"
                className="w-16 h-16 rounded-full"
              />
              <Heart className="w-8 h-8 text-red-500" />
              <img
                src={matchedUser.profilePic || '/avatar.png'}
                alt={matchedUser.fullName}
                className="w-16 h-16 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold mb-4">It's a Match!</h3>
            <button
              onClick={handleStartChat}
              className="w-full bg-blue-500 text-white py-2 rounded-lg mb-2 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Start Texting
            </button>
            <button
              onClick={() => setMatchModalOpen(false)}
              className="w-full bg-gray-200 py-2 rounded-lg"
            >
              Continue Scrolling
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
