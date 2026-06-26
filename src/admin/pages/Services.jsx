import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import AdminSelect from "../components/form/AdminSelect";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../services/service.service";
function Services() {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [technologies, setTechnologies] = useState([]);

  const [featured, setFeatured] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [formData, setFormData] = useState({
    category: "Full Stack",

    title: "",

    description: "",

    order: 0,
  });

  const categoryOptions = [
    {
      label: "Frontend",
      value: "Frontend",
    },

    {
      label: "Backend",
      value: "Backend",
    },

    {
      label: "Full Stack",
      value: "Full Stack",
    },

    {
      label: "Blockchain",
      value: "Blockchain",
    },

    {
      label: "Mobile",
      value: "Mobile",
    },

    {
      label: "DevOps",
      value: "DevOps",
    },

    {
      label: "UI/UX",
      value: "UI/UX",
    },

    {
      label: "Other",
      value: "Other",
    },
  ];

  const loadServices = async () => {
    try {
      const data = await getServices();

      setServices(data);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
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

    setTechnologies([]);

    setFeatured(false);

    setIsVisible(true);

    setFormData({
      category: "Full Stack",

      title: "",

      description: "",

      order: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,

        technologies,

        featured,

        isVisible,

        order: Number(formData.order),
      };

      if (editingId) {
        await updateService(editingId, payload);

        toast.success("Service updated successfully");
      } else {
        await createService(payload);

        toast.success("Service created successfully");
      }

      resetForm();

      await loadServices();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service._id);

    setFormData({
      category: service.category || "Full Stack",

      title: service.title || "",

      description: service.description || "",

      order: service.order || 0,
    });

    setTechnologies(service.technologies || []);

    setFeatured(service.featured ?? false);

    setIsVisible(service.isVisible ?? true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      await deleteService(deleteId);

      toast.success("Service deleted successfully");

      closeDeleteModal();

      await loadServices();
    } catch {
      toast.error("Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="card">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      {/* FORM */}

      <div className="card">
        <div className="grid gap-5">
          <AdminSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
          />

          <AdminInput
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Full Stack Web Applications"
          />

          <AdminTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the service..."
          />

          <TechnologyInput
            technologies={technologies}
            setTechnologies={setTechnologies}
          />

          <AdminInput
            label="Display Order"
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
          />

          <AdminSwitch
            checked={featured}
            onChange={setFeatured}
            label="Featured Service"
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
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Service"
                  : "Add Service"}
            </button>
          </div>
        </div>
      </div>

      <div
        className="
    grid

    grid-cols-1
    xl:grid-cols-2

    gap-6
  "
      >
        {services.length === 0 && (
          <div
            className="
        card

        text-center

        py-16

        xl:col-span-2
      "
          >
            <h3 className="text-title mb-2">No Services Added</h3>

            <p className="text-body">Add your first service.</p>
          </div>
        )}

        {services.map((service) => (
          <div
            key={service._id}
            className="
        card

        h-full

        flex
        flex-col

        justify-between
      "
          >
            <div>
              {/* CATEGORY */}

              <div
                className="
            inline-flex

            px-3
            py-1

            rounded-full

            bg-surface

            border
            border-border

            text-sm

            mb-5
          "
              >
                {service.category}
              </div>

              {/* TITLE */}

              <h3
                className="
            text-title

            mb-3
          "
              >
                {service.title}
              </h3>

              {/* DESCRIPTION */}

              <p
                className="
            text-body

            mb-5
          "
              >
                {service.description}
              </p>

              {/* TECHNOLOGIES */}

              {service.technologies?.length > 0 && (
                <div
                  className="
              flex
              flex-wrap

              gap-2

              mb-5
            "
                >
                  {service.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="
                    px-3
                    py-1

                    rounded-full

                    bg-surface

                    border
                    border-border

                    text-sm
                  "
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* FEATURED */}

              {service.featured && (
                <div
                  className="
              inline-flex

              px-3
              py-1

              rounded-full

              bg-primary

              text-background

              text-sm
            "
                >
                  Featured
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div
              className="
          flex

          gap-4

          mt-6
        "
            >
              <button
                onClick={() => handleEdit(service)}
                className="
            text-sm

            font-medium
          "
              >
                Edit
              </button>

              <button
                onClick={() => openDeleteModal(service._id)}
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
        title="Delete Service"
        message="This action cannot be undone. Are you sure you want to delete this service?"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default Services;
