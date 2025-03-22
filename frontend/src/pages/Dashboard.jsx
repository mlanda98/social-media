import { useEffect, useState } from "react";
import { useNavigate, useResolvedPath } from "react-router-dom";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch("http://localhost:8000/post/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch posts", response.status);
        return;
      }
      const data = await response.json();
      setPosts(data);
    };
    fetchPosts();
  }, [navigate]);

  const handlePostCreate = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:8000/post/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: newPostContent }),
    });

    if (response.ok) {
      setNewPostContent("");
      const newPost = await response.json();
      setPosts([newPost, ...posts]);
    } else {
      alert("Failed to create post");
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:8000/post/like/${postId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, likesCount: post.likesCount + 1 }
            : post
        )
      );
    } else {
      alert("Failed to like post");
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const content = commentInputs[postId];

    if (!content) return;

    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:8000/post/comment/${postId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      }
    );
    if (response.ok) {
      const newComment = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, newComment.comment],
              }
            : post
        )
      );
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } else {
      alert("Failed to add comment");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div>
      <h2>Welcome to Dashboard</h2>
      <div>
        <h3>Dashboard Navigation</h3>
        <Link to={`/profile/${username}`}>Go to Profile</Link>
        <Link to={"/follow"}>Following Page</Link>
      </div>
      <div>
        <h3>Create Post</h3>
        <form onSubmit={handlePostCreate}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Write a post"
            required
          ></textarea>
          <button type="submit">Post</button>
        </form>
      </div>

      <div>
        <h3>Recent Posts</h3>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post, index) => (
            <div key={post.id || index}>
              <p>{post.content}</p>
              <small>By {post.author || "Unknown"}</small>
              <div>
                <strong>{post.likes?.length || 0} Likes</strong>
                <strong>{post.comments?.length || 0} Comments</strong>
              </div>

              <div>
                {post.likes?.map((like, lIndex) => (
                  <div key={like.id || lIndex}>{like.user.username}</div>
                ))}
              </div>

              <div>
                {post.comments?.map((comment, cIndex) => (
                  <div key={comment.id || cIndex}>
                    <p>{comment.content}</p>
                    <small>By {comment.author || "Unknown"}</small>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
