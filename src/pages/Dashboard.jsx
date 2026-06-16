import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
   const { logout ,user} = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };
  return (
  
    <div
      className="
        min-h-screen

        flex
        items-center
        justify-center

        bg-background
      "
    >
      <div
        className="
          text-center
          space-y-4
        "
      >
        <h1
          className="
            text-4xl
            font-bold
          "
        >
          Dashboard
        </h1>

        <p
          className="
            text-muted
          "
        >
          You are authenticated.
        </p>

         <div>

      <button onClick={handleLogout}>
        Logout
      </button>

      <h1>{user.email}</h1>
    </div>
      </div>
    </div>
  );
}

export default Dashboard;
