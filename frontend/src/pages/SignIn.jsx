import { useState } from "react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:8000/auth/login", {
      method: "POST", 
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email, password}),
    })

    const data = await response.json();
    if (response.ok){
      localStorage.setItem("token", data.token)
      alert("Login successful!");
    } else {
      alert(data.message);
    }
  }

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        />
        <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default SignIn;