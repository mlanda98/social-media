import { useEffect, useState } from "react";

const Follow = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

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
    if (token){
    fetchSuggestedUsers();
    }
  }, [token]);

  const followUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/follow/{$userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to follow user");
      const data = await res.json();

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, followStatus: "pending" } : user
        )
      );
    } catch (error) {
      console.error("Error:", error); 
    }
  };

  const unfollowUser = async (userId) => {
    try{
      const res = await fetch(`http://localhost:5000/api/unfollow/${userId}`, {
        method: "DELETE", 
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })

      if (!res.ok) throw new Error("Failed to unfollow user");

      setUsers(users.map(user => 
        user.id === userId ? { ...user, followStatus: null}: user
      ))
    } catch (error){
      console.error("Error:", error);
    }
  }

  return (
    <div>
      <h2>People to Follow</h2>
      {users.length === 0 ? (
        <p>No suggestions available</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <img src={user.avatar}  alt={user.username} width="50"/>
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
    </div>
  )
};

export default Follow;