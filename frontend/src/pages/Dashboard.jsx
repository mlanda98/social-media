import { useEffect, useState } from "react";
import { useNavigate} from "react-router-dom";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const username = localStorage.getItem("username")
  
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
      console.log("post data fetched", data)

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
