import { useState, useEffect } from 'react';
import { Search, Heart, MessageCircle, Share2, Filter, Send } from 'lucide-react';

const STORAGE_KEY = 'community_posts_v1';

const INITIAL_POSTS = [
  {
    id: 'post_1',
    author: 'Alice Chen',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alice',
    tag: 'Backpacking across Japan',
    content: 'Just finished an amazing 2-week trip through Kyoto and Tokyo! Highly recommend taking the shinkansen early in the morning to catch a glimpse of Mt. Fuji. Anyone planning a similar route soon?',
    likes: 124,
    likedBy: [],
    comments: [
      { id: 'c1', author: 'David Kim', text: 'I am going next month! Which pass did you use?', timestamp: Date.now() - 3600000 }
    ],
    timestamp: Date.now() - 7200000 // 2 hours ago
  },
  {
    id: 'post_2',
    author: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=David',
    tag: 'Rome Weekend Getaway',
    content: 'Pro tip for Rome: skip the expensive restaurants near the Colosseum and walk 10 minutes into the Trastevere neighborhood. Best pasta I have ever had for half the price!',
    likes: 89,
    likedBy: [],
    comments: [],
    timestamp: Date.now() - 18000000 // 5 hours ago
  },
  {
    id: 'post_3',
    author: 'Maria Garcia',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maria',
    tag: 'Bali Digital Nomad',
    content: 'Found the most incredible hidden waterfall in Ubud today. The hike was tough but absolutely worth it. DM me if you want the exact coordinates!',
    likes: 256,
    likedBy: [],
    comments: [],
    timestamp: Date.now() - 86400000 // 1 day ago
  }
];

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, most_liked, most_comments

  // UI State
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Current User Mock
  const currentUser = 'user_me_123';
  const currentUserName = 'You';
  const currentUserAvatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    }
  }, []);

  const savePosts = (newPosts) => {
    setPosts(newPosts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
  };

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    const newPost = {
      id: `post_${Date.now()}`,
      author: currentUserName,
      avatar: currentUserAvatar,
      tag: newPostTag.trim() || 'General Trip',
      content: newPostContent,
      likes: 0,
      likedBy: [],
      comments: [],
      timestamp: Date.now()
    };
    savePosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostTag('');
  };

  const handleLike = (postId) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likedBy?.includes(currentUser);
        return {
          ...p,
          likes: hasLiked ? p.likes - 1 : p.likes + 1,
          likedBy: hasLiked 
            ? p.likedBy.filter(u => u !== currentUser)
            : [...(p.likedBy || []), currentUser]
        };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleAddComment = (postId) => {
    if (!commentText.trim()) return;
    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...(p.comments || []), 
            { id: `c_${Date.now()}`, author: currentUserName, text: commentText, timestamp: Date.now() }
          ]
        };
      }
      return p;
    });
    savePosts(updated);
    setCommentText('');
    setActiveCommentPost(null);
  };

  const handleShare = async (post) => {
    const shareData = {
      title: `${post.author}'s Trip`,
      text: post.content,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${post.author} shared: ${post.content}`);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Derive unique tags for filter
  const allTags = ['All', ...new Set(posts.map(p => p.tag))];

  // Apply Search, Filter, Sort
  const filteredAndSortedPosts = posts
    .filter(p => {
      if (selectedTag !== 'All' && p.tag !== selectedTag) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.content.toLowerCase().includes(q) || 
               p.author.toLowerCase().includes(q) || 
               p.tag.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'most_liked') return b.likes - a.likes;
      if (sortBy === 'most_comments') return (b.comments?.length || 0) - (a.comments?.length || 0);
      return 0;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Community</h2>
          <p className="text-slate-500 mt-1">Share experiences and discover tips from other travelers.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search posts or authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <select 
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 outline-none cursor-pointer"
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag === 'All' ? 'Filter by Tag' : tag}</option>
            ))}
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 outline-none cursor-pointer"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="most_liked">Sort: Most Liked</option>
            <option value="most_comments">Sort: Most Comments</option>
          </select>
        </div>
      </div>

      {/* Post creation box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 transition-all focus-within:shadow-md focus-within:border-blue-100">
        <img src={currentUserAvatar} alt="You" className="w-12 h-12 rounded-full border border-slate-200 hidden md:block" />
        <div className="flex-1 space-y-3">
          <input 
            type="text"
            placeholder="Trip Tag (e.g. Backpacking Japan)"
            value={newPostTag}
            onChange={(e) => setNewPostTag(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
          />
          <textarea 
            placeholder="Share your travel experience or ask a question..." 
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 resize-none min-h-[100px]"
          ></textarea>
          <div className="flex justify-end">
            <button 
              onClick={handlePost}
              disabled={!newPostContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post to Community
            </button>
          </div>
        </div>
      </div>

      {/* Community Posts */}
      <div className="space-y-6">
        {filteredAndSortedPosts.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl border border-slate-100">
            No posts found matching your criteria.
          </div>
        )}
        
        {filteredAndSortedPosts.map(post => {
          const hasLiked = post.likedBy?.includes(currentUser);
          const showComments = activeCommentPost === post.id;
          
          return (
            <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-5 transition-all hover:border-slate-200" style={{ viewTransitionName: `post-${post.id}` }}>
              <div className="flex-shrink-0 hidden sm:block">
                <img src={post.avatar} alt={post.author} className="w-14 h-14 rounded-full border border-slate-200 bg-slate-50" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 sm:hidden" />
                    <div>
                      <h4 className="font-bold text-slate-800">{post.author}</h4>
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-md mt-1">
                        Trip: {post.tag}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{formatTime(post.timestamp)}</span>
                </div>
                
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-6 pt-3 mt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${hasLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                  >
                    <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} className={hasLiked ? 'scale-110 transition-transform' : ''} /> 
                    {post.likes}
                  </button>
                  <button 
                    onClick={() => {
                      setActiveCommentPost(showComments ? null : post.id);
                      setCommentText('');
                    }}
                    className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${showComments ? 'text-blue-500' : 'text-slate-500 hover:text-blue-500'}`}
                  >
                    <MessageCircle size={18} fill={showComments ? 'currentColor' : 'none'} /> 
                    {post.comments?.length || 0}
                  </button>
                  <button 
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-500 transition-colors text-sm font-medium ml-auto"
                  >
                    <Share2 size={18} /> <span className="hidden sm:inline">Share</span>
                  </button>
                </div>

                {/* Inline Comments Section */}
                {showComments && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                    {/* Existing Comments */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {post.comments?.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first!</p>
                      )}
                      {post.comments?.map(comment => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-2xl text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-700">{comment.author}</span>
                            <span className="text-[10px] text-slate-400">{formatTime(comment.timestamp)}</span>
                          </div>
                          <p className="text-slate-600">{comment.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2 relative">
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 bg-white border border-slate-200 rounded-full pl-4 pr-10 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                      />
                      <button 
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 p-1.5 hover:bg-blue-50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
