import { useEffect, useState } from "react";
import { fetchMe } from "../utils/api";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState<{id:number,email:string} | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchMe(token).then(data => {
      if (data.error) {
        setError(data.error);
        navigate("/login");
      } else {
        setUser(data);
      }
    });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Email:</strong> {user.email}</p>
    </div>
  );
};

export default Profile;
