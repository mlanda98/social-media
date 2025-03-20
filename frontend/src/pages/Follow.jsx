import {  useEffect, useState} from "react";

const Follow = () => {
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const token = localStorage.getItem("token");

  const fetchFollowCount = async () => {
    try {
      const res = await fetch("http://localhost:8000/follow/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch follow count");
      const data = await res.json();

      setFollowerCount(data.followers);
      setFollowingCount(data.following);
    } catch (error) {
      console.error("Error fetching follow count:", error);
    }
  };
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const res = await fetch("http://localhost:8000/follow/suggested-user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (token) {
      fetchSuggestedUsers();
    }
  }, [token]);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const res = await fetch("http://localhost:8000/follow/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch pending requests");
        const data = await res.json();
        setPendingRequests(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (token) {
      fetchPendingRequests();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchFollowCount();
      fetchFollowers();
      fetchFollowing(); 
        }
  }, [token]);

  const followUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/follow/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to follow user");
      }

      setUsers((users) =>
        users.map((user) =>
          user.id === userId ? { ...user, followStatus: "pending" } : user
        )
      );
      fetchFollowCount();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const acceptFollow = async (followId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/follow/accept/${followId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to accept follow request");

      setPendingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== followId)
      );
      fetchFollowCount();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const rejectFollow = async (followId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/follow/reject/${followId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to reject follow request");
      setPendingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== followId)
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchFollowers = async () => {
    try{
      const res = await fetch("http://localhost:8000/follow/followers", {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      })
      if (res.ok){
        const data = await res.json();
        setFollowers(data);
      }
    } catch (error){
      console.error("Error fetching followers:", error);
    }
  }

  const fetchFollowing = async () => {
    try {
      const res = await fetch("http://localhost:8000/follow/following", {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}
      });
      if (res.ok){
        const data = await res.json();
        setFollowing(data);
      }
    } catch (error){
        console.error("Error fetching following:", error);
    }
  }
  const unfollowUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/follow/unfollow/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to unfollow user");

      setFollowing((prev) =>
        prev.filter((user) =>
          user.following.id !== userId)
      );
      fetchFollowing();
      fetchFollowCount();
      fetchFollowers();
    } catch (error) {
      console.error("Error:", error);
    }
  
  };

  

  return (
    <div>
      <div>
        <span>Followers: {followerCount}</span>
        <span>Following: {followingCount}</span>
      </div>
      <h2>People to Follow</h2>
      {users.length === 0 ? (
        <p>No suggestions available</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <img src={user.avatar} alt={user.username} width="50" />
              <span>{user.username}</span>

              {user.followStatus === "accepted" ? (
                <button onClick={() => unfollowUser(user.id)}>Unfollow</button>
              ) : user.followStatus === "pending" ? (
                <button disabled>Pending...</button>
              ) : (
                <button onClick={() => followUser(user.id)}>Follow</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <h2>Pending Follow Requests</h2>
      {pendingRequests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {pendingRequests.map((request) => (
            <li key={request.id}>
              <img
                src={request.follower.avatar}
                alt={request.follower.username}
                width="50"
              />
              <span>{request.follower.username}</span>
              <button onClick={() => acceptFollow(request.id)}>Accept</button>
              <button onClick={() => rejectFollow(request.id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2>Followers</h2>
        <ul>
          {followers.map((user) => (
            <li key={user.follower.id}>
              {user.follower.username} 
            </li>
          )) }
        </ul>

        <h2>Following</h2>
        <ul>
          {following.map((user) => (
            <li key={user.following.id}>
              {user.following.username}
              <button onClick={() => unfollowUser(user.following.id)}>Unfollow</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Follow;
