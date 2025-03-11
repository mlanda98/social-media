import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Profile = () => {
  const { username } = useParams();
  console.log(username);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/profile/${username}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        console.error("Failed to fetch user data", response.status);
        return;
      }

      const data = await response.json();
      console.log("user data", data)
      setUserData(data);

      const postsResponse = await fetch(
        `http://localhost:8000/post/user/${username}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!postsResponse.ok) {
        console.error("Failed to fetch posts", postsResponse.status);
        return;
      }

      const postsData = await postsResponse.json();
      setPosts(postsData.posts || []);
    };
    fetchUserProfile();
  }, [username, navigate]);

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h2>{userData.username}'s Profile</h2>
      <div className="profile-header">
        <img
          src={userData.avatar}
          alt={`${userData.username}'s Gravatar`}
          className="profile-avatar"
        />
        <div className="profile-info">
          <h3>{userData.username}</h3>
          <p>Email: {userData.email}</p>
          <p>Followers: {userData.followersCount}</p>
          <p>Following: {userData.followingCount}</p>
        </div>
      </div>
      <div>
        <h3>Recent Posts</h3>
        {posts.length === 0 ? (
          <p>No posts available</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post">
              <p>{post.content}</p>
              <small>By {post.author}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
