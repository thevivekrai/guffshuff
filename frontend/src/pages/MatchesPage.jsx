import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';
import { Heart, Loader, MessageCircle, X } from 'lucide-react';

const MatchesPage = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [imgError, setImgError] = useState({});
  const navigate = useNavigate();
  const theme = useThemeStore(state => state.theme);

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
              match.email &&
              typeof match.fullName === 'string' &&
              typeof match.school === 'string' &&
              typeof match.email === 'string'
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
    if (isLoading) {
      toast.error('Please wait while processing previous action');
      return;
    }
    
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch || !currentMatch._id) {
      toast.error('Invalid user data');
      return;
    }
    
    setIsLoading(true);

    try {
      // Create the match first
      const response = await axiosInstance.post('/matches/like', {
        targetUserId: currentMatch._id
      });

      // If it's a match, handle the match flow
      if (response.data.match) {
        // Use the complete user data from response
        const matchedUserData = response.data.targetUser;

        // Update chat store and state
        const chatStore = useChatStore.getState();
        await chatStore.setSelectedUser(matchedUserData);
        
        // Update match state and show modal
        setMatchedUser(matchedUserData);
        setMatchModalOpen(true);
        
        // Remove matched user from potential matches
        setPotentialMatches(prev => prev.filter(m => m._id !== currentMatch._id));
        
        // Navigate to chat after a short delay to show the match modal
        setTimeout(() => {
          setMatchModalOpen(false);
          navigate(`/chat/${matchedUserData._id}`);
        }, 2000);
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
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
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
      setIsLoading(false);
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
      const chatStore = useChatStore.getState();
      await chatStore.setSelectedUser(matchedUser);
      
      // Close modal and navigate to chat
      setMatchModalOpen(false);
      navigate(`/chat/${matchedUser._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
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
    <div className="min-h-screen pt-24 bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="relative rounded-lg shadow-xl overflow-hidden bg-gray-800">
          <img 
            src={imgError[currentMatch._id] ? '/avatar.png' : (currentMatch.profilePic || '/avatar.png')} 
            alt={currentMatch.fullName}
            className="w-full h-80 object-cover"
            onError={() => setImgError(prev => ({ ...prev, [currentMatch._id]: true }))}
          />
          <div className="p-6 bg-gray-800 text-white">
            <h2 className="text-2xl font-bold mb-2 text-white">
              {currentMatch.fullName}
            </h2>
            <p className="mb-2 text-gray-300">
              School: {currentMatch.school}
            </p>
            {currentMatch.bio && (
              <p className="mb-4 text-gray-400">
                {currentMatch.bio}
              </p>
            )}
            
            <div className="flex justify-center gap-6 mt-4">
              <button
                onClick={handleSkip}
                className="p-4 rounded-full transition transform hover:scale-105 bg-gray-700 hover:bg-gray-600 text-white"
                aria-label="Skip"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={handleLike}
                className="p-4 rounded-full transition transform hover:scale-105 text-white bg-red-500 hover:bg-red-600"
                aria-label="Like"
              >
                <Heart className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {matchModalOpen && matchedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-8 max-w-sm w-full text-center shadow-2xl transform transition-all duration-300 scale-100 bg-gray-800">
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="relative">
                <img
                  src={useAuthStore.getState().authUser?.profilePic || '/avatar.png'}
                  alt="Your profile"
                  className="w-20 h-20 rounded-full border-4 border-red-500"
                />
              </div>
              <Heart className="w-10 h-10 text-red-500 animate-pulse" />
              <div className="relative">
                <img
                  src={imgError[matchedUser._id] ? '/avatar.png' : (matchedUser.profilePic || '/avatar.png')}
                  alt={matchedUser.fullName}
                  className="w-20 h-20 rounded-full border-4 border-red-500"
                  onError={() => setImgError(prev => ({ ...prev, [matchedUser._id]: true }))}
                />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-6 text-white">
              It's a Match!
            </h3>
            <button
              onClick={handleStartChat}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg mb-2 flex items-center justify-center gap-2 transition transform hover:scale-105"
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
