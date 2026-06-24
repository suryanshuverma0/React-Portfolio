import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminSwitch from "../components/form/AdminSwitch";
import ConfirmModal from "../components/ui/ConfirmModal";

import {
  getStats,
  createStat,
  updateStat,
  deleteStat,
} from "../services/stats.service";

function Stats() {
  const [stats, setStats] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [formData, setFormData] = useState({
    label: "",
    value: "",
    section: "about",
    order: 0,
  });

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);

    setFormData({
      label: "",
      value: "",
      section: "about",
      order: 0,
    });

    setIsVisible(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        section: formData.section,
        order: Number(formData.order),
        isVisible,
      };

      if (editingId) {
        await updateStat(editingId, payload);

        toast.success("Stat updated successfully");
      } else {
        await createStat(payload);

        toast.success("Stat created successfully");
      }

      resetForm();

      await loadStats();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save stat");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (stat) => {
    setEditingId(stat._id);

    setFormData({
      label: stat.label,
      value: stat.value,
      section: stat.section,
      order: stat.order,
    });

    setIsVisible(stat.isVisible);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteStat(deleteId);

      toast.success("Stat deleted successfully");

      closeDeleteModal();

      await loadStats();
    } catch {
      toast.error("Failed to delete stat");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="card">Loading stats... </div>;
  }

  return (
    <div className="space-y-6">
      {" "}
      <div className="card">
        {" "}
        <div className="grid gap-5">
          <AdminInput
            label="Label"
            name="label"
            value={formData.label}
            onChange={handleChange}
            placeholder="Projects Completed"
          />

          <AdminInput
            label="Value"
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="15+"
          />

          <div className="space-y-2">
            <label className="text-label">Section</label>

            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="
      w-full

      h-control

      px-control

      rounded-control

      bg-surface

      border
      border-border

      outline-none

      focus:border-primary
    "
            >
              <option value="about">About</option>
              <option value="hero">Hero</option>
              <option value="projects">Projects</option>
            </select>
          </div>

          <AdminInput
            label="Display Order"
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
          />

          <AdminSwitch
            checked={isVisible}
            onChange={setIsVisible}
            label="Visible on Portfolio"
          />

          <div className="flex justify-end gap-3">
            {editingId && (
              <button
                onClick={resetForm}
                className="
              h-control
              px-5

              rounded-control

              border
              border-border
            "
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="
            h-control
            px-6

            rounded-control

            bg-primary

            text-background
          "
            >
              {saving ? "Saving..." : editingId ? "Update Stat" : "Add Stat"}
            </button>
          </div>
        </div>
      </div>
      <div
        className="
      grid

      grid-cols-2
      md:grid-cols-4

      gap-6
    "
      >
        {stats.map((stat) => (
          <div
            key={stat._id}
            className="
          card

          text-center
        "
          >
            <div
              className="
            text-heading

            mb-2
          "
            >
              {stat.value}
            </div>

            <p className="text-small">{stat.label}</p>

            <p className="text-muted mt-1">{stat.section}</p>

            <div
              className="
            flex
            justify-center

            gap-4

            mt-5
          "
            >
              <button onClick={() => handleEdit(stat)}>Edit</button>

              <button
                onClick={() => openDeleteModal(stat._id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Stat"
        message="This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default Stats;
