import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trash2, Pencil, Check, X, KeyRound } from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

import {
  getRegistrationOptions,
  verifyRegistration,
  listPasskeys,
  renamePasskey,
  deletePasskey,
} from "../services/passkey.service";
import AdminInput from "../components/form/AdminInput";
import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";

function Security() {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [registering, setRegistering] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  const [passkeyToDelete, setPasskeyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPasskeys = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await listPasskeys();

      setPasskeys(data);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message || "Failed to load passkeys";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handleRegister = async () => {
    if (!browserSupportsWebAuthn()) {
      toast.error("This browser doesn't support passkeys");

      return;
    }

    try {
      setRegistering(true);

      const optionsJSON = await getRegistrationOptions();

      const credentialResponse = await startRegistration({ optionsJSON });

      await verifyRegistration(credentialResponse, newPasskeyName.trim() || undefined);

      toast.success("Passkey added");
      setNewPasskeyName("");

      await loadPasskeys();
    } catch (error) {
      console.error(error);

      // Cancelling the browser's own passkey prompt isn't a real error.
      if (error?.name === "NotAllowedError") {
        return;
      }

      toast.error(error.response?.data?.message || "Failed to add passkey");
    } finally {
      setRegistering(false);
    }
  };

  const startRename = (passkey) => {
    setEditingId(passkey.id);
    setEditingName(passkey.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveRename = async (id) => {
    if (!editingName.trim()) {
      toast.error("Name can't be empty");

      return;
    }

    try {
      setSavingRename(true);

      const updated = await renamePasskey(id, editingName.trim());

      setPasskeys((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: updated.name } : p)),
      );

      cancelRename();
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to rename passkey");
    } finally {
      setSavingRename(false);
    }
  };

  const handleDelete = async () => {
    if (!passkeyToDelete) return;

    try {
      setDeleting(true);

      await deletePasskey(passkeyToDelete.id);

      toast.success("Passkey deleted");

      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyToDelete.id));

      setPasskeyToDelete(null);
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Failed to delete passkey");
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
        <h1 className="text-heading">Security</h1>

        <p className="text-body mt-3">
          Passkeys let you sign in with your device's fingerprint, face, or
          screen lock instead of a password &mdash; nothing here ever leaves
          your device. You can register as many as you like and remove any
          of them at any time.
        </p>
      </section>

      <div className="card space-y-4">
        <h2 className="text-title">Add a passkey</h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <AdminInput
              label="Name (optional)"
              placeholder="e.g. iPhone, YubiKey"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              maxLength={100}
            />
          </div>

          <button
            type="button"
            onClick={handleRegister}
            disabled={registering}
            className="
              h-control px-6 rounded-control bg-primary text-background
              text-label transition hover:opacity-90 disabled:opacity-50
              inline-flex items-center justify-center gap-2
            "
          >
            <KeyRound size={16} />
            {registering ? "Waiting for device..." : "Add Passkey"}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loadError ? (
          <p className="text-small text-red-500 py-6 text-center">
            {loadError}
          </p>
        ) : passkeys.length === 0 ? (
          <p className="text-small text-muted py-6 text-center">
            No passkeys registered yet.
          </p>
        ) : (
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-3 pr-4 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Type</th>
                <th className="py-3 pr-4 font-medium">Added</th>
                <th className="py-3 pr-4 font-medium">Last Used</th>
                <th className="py-3 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {passkeys.map((passkey) => (
                <tr
                  key={passkey.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4">
                    {editingId === passkey.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={100}
                        className="
                          h-9 px-3 rounded-control bg-surface border
                          border-border outline-none focus:border-primary
                        "
                      />
                    ) : (
                      passkey.name
                    )}
                  </td>

                  <td className="py-3 pr-4">
                    {passkey.deviceType === "multiDevice"
                      ? "Synced"
                      : "Device-bound"}
                    {passkey.backedUp ? " · Backed up" : ""}
                  </td>

                  <td className="py-3 pr-4">
                    {new Date(passkey.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 pr-4">
                    {passkey.lastUsedAt
                      ? new Date(passkey.lastUsedAt).toLocaleString()
                      : "Never"}
                  </td>

                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-3">
                      {editingId === passkey.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveRename(passkey.id)}
                            disabled={savingRename}
                            aria-label="Save name"
                            className="text-muted hover:text-primary transition-colors"
                          >
                            <Check size={16} strokeWidth={2} />
                          </button>

                          <button
                            type="button"
                            onClick={cancelRename}
                            disabled={savingRename}
                            aria-label="Cancel rename"
                            className="text-muted hover:text-red-500 transition-colors"
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startRename(passkey)}
                            aria-label={`Rename ${passkey.name}`}
                            className="text-muted hover:text-primary transition-colors"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPasskeyToDelete(passkey)}
                            aria-label={`Delete ${passkey.name}`}
                            className="text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(passkeyToDelete)}
        title="Delete passkey"
        message={
          passkeyToDelete
            ? `Delete "${passkeyToDelete.name}"? You won't be able to sign in with it anymore.`
            : ""
        }
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPasskeyToDelete(null)}
      />
    </div>
  );
}

export default Security;
