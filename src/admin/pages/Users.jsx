import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

import { getUsers, deleteUser } from "../services/users.service";
import { useAuth } from "../../contexts/AuthContext";
import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";

function Users() {
  const { user: currentUser } = useAuth();

  const currentUserId = currentUser?._id || currentUser?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        (error.response?.status
          ? `Failed to load users (${error.response.status})`
          : "Failed to load users");

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);

      await deleteUser(userToDelete._id);

      toast.success("User deleted");

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));

      setUserToDelete(null);
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section>
        <h1 className="text-heading">Users</h1>

        <p className="text-body mt-3">
          Everyone who has registered or logged in. Only accounts on the
          admin allowlist can access this dashboard &mdash; everyone else is
          a regular user with no admin access.
        </p>
      </section>

      <div className="card overflow-x-auto">
        {loadError ? (
          <p className="text-small text-red-500 py-6 text-center">
            {loadError}
          </p>
        ) : users.length === 0 ? (
          <p className="text-small text-muted py-6 text-center">
            No users yet.
          </p>
        ) : (
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-3 pr-4 font-medium">Email</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Method</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Joined</th>
                <th className="py-3 pr-4 font-medium">Last Login</th>
                <th className="py-3 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4">{user.email}</td>

                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-primary text-background"
                          : "bg-surface border border-border"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 pr-4">
                    {user.isGoogleUser ? "Google" : "Password"}
                  </td>

                  <td className="py-3 pr-4">
                    {user.isActive ? "Active" : "Disabled"}
                  </td>

                  <td className="py-3 pr-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 pr-4">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Never"}
                  </td>

                  <td className="py-3 pr-4 text-right">
                    {user._id === currentUserId ? (
                      <span className="text-muted text-xs">You</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        aria-label={`Delete ${user.email}`}
                        className="
                          text-muted

                          hover:text-red-500

                          transition-colors
                        "
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Delete user"
        message={
          userToDelete
            ? `Delete ${userToDelete.email}? This can't be undone.`
            : ""
        }
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}

export default Users;
