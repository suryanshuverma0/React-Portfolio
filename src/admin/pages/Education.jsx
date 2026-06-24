import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import ConfirmModal from "../components/ui/ConfirmModal";
import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../services/education.service";

function Education() {
  const [educations, setEducations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    degree: "",
    institution: "",
    description: "",
    startYear: "",
    endYear: "",
    order: 0,
  });

  const [current, setCurrent] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [deleteId, setDeleteId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const loadEducations = async () => {
    try {
      const data = await getEducations();

      setEducations(data);
    } catch {
      toast.error("Failed to load educations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEducations();
  }, []);

  useEffect(() => {
    if (current) {
      setFormData((prev) => ({
        ...prev,
        endYear: "",
      }));
    }
  }, [current]);

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
      degree: "",
      institution: "",
      description: "",
      startYear: "",
      endYear: "",
      order: 0,
    });

    setCurrent(false);
    setIsVisible(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        startYear: Number(formData.startYear),
        endYear: current || !formData.endYear ? null : Number(formData.endYear),
        order: Number(formData.order),
        current,

        isVisible,
      };

      if (editingId) {
        await updateEducation(editingId, payload);

        toast.success("Education updated");
      } else {
        await createEducation(payload);

        toast.success("Education created");
      }

      resetForm();

      loadEducations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save education");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (education) => {
    setEditingId(education._id);

    setFormData({
      degree: education.degree || "",
      institution: education.institution || "",
      description: education.description || "",
      startYear: education.startYear || "",
      endYear: education.endYear || "",
      order: education.order || 0,
    });

    setCurrent(education.current ?? false);

    setIsVisible(education.isVisible ?? true);
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

      await deleteEducation(deleteId);

      toast.success("Education deleted successfully");

      closeDeleteModal();

      await loadEducations();
    } catch {
      toast.error("Failed to delete education");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* FORM */}

      <div className="card">
        <div className="grid gap-5">
          <AdminInput
            label="Degree"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
          />

          <AdminInput
            label="Institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
          />

          <div className="grid md:grid-cols-2 gap-5">
            <AdminInput
              label="Start Year"
              type="number"
              name="startYear"
              value={formData.startYear}
              onChange={handleChange}
            />

            <AdminInput
              label="End Year"
              type="number"
              name="endYear"
              value={formData.endYear}
              onChange={handleChange}
              disabled={current}
              placeholder={current ? "Present" : "2026"}
            />
          </div>

          <AdminSwitch
            checked={current}
            onChange={setCurrent}
            label="Currently Studying"
          />

          <AdminInput
            label="Display Order"
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
          />

          <AdminTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

          <AdminSwitch
            checked={isVisible}
            onChange={setIsVisible}
            label="Visible on Portfolio"
          />

          <div className="flex justify-end gap-3">
            {editingId && (
              <button onClick={resetForm} className="btn-secondary">
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
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Education"
                  : "Add Education"}
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}

      <div
        className="
    grid

    grid-cols-1
    xl:grid-cols-2

    gap-6
  "
      >
        {educations.length === 0 && (
          <div
            className="
        card

        text-center

        py-16

        xl:col-span-2
      "
          >
            <h3 className="text-title mb-2">No Education Added</h3>

            <p className="text-body">Add your first education entry.</p>
          </div>
        )}

        {educations.map((education) => (
          <div
            key={education._id}
            className="
        card

        h-full

        flex
        flex-col

        justify-between
      "
          >
            <div>
              <div
                className="
            flex
            items-center

            gap-2

            mb-5
          "
              >
                <div
                  className="
              h-2
              w-2

              rounded-full

              bg-primary
            "
                />

                <p className="text-small">
                  {education.startYear}
                  {" — "}
                  {education.current ? "Present" : education.endYear}
                </p>
              </div>

              <h3
                className="
            text-title

            mb-2
          "
              >
                {education.degree}
              </h3>

              <p
                className="
            text-label

            mb-4
          "
              >
                {education.institution}
              </p>

              {education.description && (
                <p className="text-body">{education.description}</p>
              )}
            </div>

            <div
              className="
          flex

          gap-4

          mt-6
        "
            >
              <button
                onClick={() => handleEdit(education)}
                className="
            text-sm

            font-medium
          "
              >
                Edit
              </button>

              <button
                onClick={() => openDeleteModal(education._id)}
                className="
            text-sm

            font-medium

            text-red-500
          "
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Education"
        message="This action cannot be undone. Are you sure you want to delete this education entry?"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default Education;
