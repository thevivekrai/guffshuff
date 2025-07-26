import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';
import { Heart, Loader, MessageCircle, X } from 'lucide-react';

const MatchesPage = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialMatches = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/matches/potential');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Filter valid matches and ensure all required fields are present
          const validMatches = response.data
            .filter(match => 
              match && 
              match._id && 
              match.fullName && 
              match.school &&
              typeof match.fullName === 'string' &&
              typeof match.school === 'string'
            )
            .map(match => ({
              ...match,
              school: match.school.trim(),
              bio: match.bio?.trim() || '',
              fullName: match.fullName.trim()
            }));

          if (validMatches.length === 0) {
            toast.error('No valid matches found. Please try again later.');
            setPotentialMatches([]);
            setHasMore(false);
            return;
          }

          // Randomize the order of matches using Fisher-Yates shuffle
          for (let i = validMatches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validMatches[i], validMatches[j]] = [validMatches[j], validMatches[i]];
          }

          setPotentialMatches(validMatches);
          setHasMore(true);
          setCurrentIndex(0);
        } else {
          setPotentialMatches([]);
          setHasMore(false);
          toast.error('No potential matches available right now.');
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        toast.error(error.response?.data?.message || 'Failed to load matches');
        setPotentialMatches([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMatches();
  }, []);

  const handleLike = async () => {
    // Prevent multiple simultaneous likes
    if (isLoading) return;
    
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch || !currentMatch._id) {
      toast.error('Invalid user data');
      return;
    }
    
    setLoading(true);

    try {
      const response = await axiosInstance.post('/matches/like', {
        targetUserId: currentMatch._id
      });

      // If it's a match, handle the match flow
      if (response.data.match && response.data.targetUser) {
        const matchedUserData = {
          ...currentMatch,
          ...response.data.targetUser,
          _id: currentMatch._id // Ensure we keep the original ID
        };

        // Update chat store first
        const chatStore = useChatStore.getState();
        await chatStore.setSelectedUser(matchedUserData);
        
        // Update match state
        setMatchedUser(matchedUserData);
        setMatchModalOpen(true);
        
        // Remove matched user from potential matches
        setPotentialMatches(prev => prev.filter(m => m._id !== currentMatch._id));

        // Pre-fetch messages for the match
        try {
          await chatStore.getMessages(matchedUserData._id);
        } catch (err) {
          console.error('Error pre-fetching messages:', err);
          // Non-blocking error - don't show to user
        }
      } else {
        // Not a match, move to next and fetch more if needed
        if (currentIndex >= potentialMatches.length - 1) {
          try {
            await fetchMoreMatches();
            setCurrentIndex(0);
          } catch (fetchError) {
            console.error('Error fetching more matches:', fetchError);
            toast.error('Unable to load more matches. Please try again later.');
            // Stay on current index if fetch fails
          }
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }

    } catch (error) {
      console.error('Like error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to like user';
      toast.error(errorMessage);
    }
  };
  
  const fetchMoreMatches = async () => {
    try {
      const response = await axiosInstance.get('/matches/potential');
      if (response.data && response.data.length > 0) {
        // Filter valid matches and shuffle them
        const validMatches = response.data.filter(match => 
          match && match._id && match.fullName && match.school
        );
        const shuffledMatches = validMatches.sort(() => Math.random() - 0.5);
        
        // Combine with existing matches, removing duplicates
        setPotentialMatches(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const newMatches = shuffledMatches.filter(m => !existingIds.has(m._id));
          return [...prev, ...newMatches];
        });
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more matches:', error);
      toast.error('Failed to load more matches');
    }
  };

  const fetchInitialMatches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/matches/potential');
      if (response.data && response.data.length > 0) {
        const validMatches = response.data.filter(match => 
          match && match._id && match.fullName && match.school
        );
        const shuffledMatches = validMatches.sort(() => Math.random() - 0.5);
        setPotentialMatches(shuffledMatches);
        setHasMore(true);
      } else {
        setPotentialMatches([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading initial matches:', error);
      toast.error('Failed to load matches');
      setPotentialMatches([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleStartChat = async () => {
    if (!matchedUser?._id) {
      toast.error('Unable to start chat. Invalid user data.');
      return;
    }

    try {
      // Update chat store with latest user data
      const chatStore = useChatStore.getState();
      await chatStore.setSelectedUser(matchedUser);
      
      // Close match modal
      setMatchModalOpen(false);

      // Navigate to chat page
      navigate('/chat');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
    try {
      // Navigate to chat with the matched user
      setMatchModalOpen(false);
      navigate(`/chat/${matchedUser._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Unable to start chat. Please try again.');
    }
  };

  if (isLoading) {
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
          onClick={fetchInitialMatches}
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
          onClick={fetchInitialMatches}
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
