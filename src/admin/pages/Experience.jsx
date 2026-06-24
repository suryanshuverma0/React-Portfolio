import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import AdminSelect from "../components/form/AdminSelect";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";

import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from "../services/experience.service";
function Experience() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [technologies, setTechnologies] = useState([]);
  const [isCurrent, setIsCurrent] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    location: "",
    employmentType: "Internship",
    startDate: "",
    endDate: "",
    companyUrl: "",
    description: "",
    order: 0,
  });

  const employmentOptions = [
    {
      label: "Full-time",
      value: "Full-time",
    },
    {
      label: "Part-time",
      value: "Part-time",
    },
    {
      label: "Internship",
      value: "Internship",
    },
    {
      label: "Contract",
      value: "Contract",
    },
    {
      label: "Freelance",
      value: "Freelance",
    },
    {
      label: "Remote",
      value: "Remote",
    },
    {
      label: "Others",
      value: "Others",
    },
  ];

  const loadExperiences = async () => {
    try {
      const data = await getExperiences();

      setExperiences(data);
    } catch {
      toast.error("Failed to load experiences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  useEffect(() => {
    if (isCurrent) {
      setFormData((prev) => ({
        ...prev,
        endDate: "",
      }));
    }
  }, [isCurrent]);

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
    setIsCurrent(false);
    setFeatured(false);
    setIsVisible(true);
    setFormData({
      role: "",
      company: "",
      location: "",
      employmentType: "Internship",
      startDate: "",
      endDate: "",
      companyUrl: "",
      description: "",
      order: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        endDate: isCurrent || !formData.endDate ? null : formData.endDate,
        companyUrl: formData.companyUrl || undefined,
        isCurrent,
        technologies,
        featured,
        isVisible,
        order: Number(formData.order),
      };

      if (editingId) {
        await updateExperience(editingId, payload);

        toast.success("Experience updated");
      } else {
        await createExperience(payload);
        toast.success("Experience created");
      }

      resetForm();

      await loadExperiences();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save experience",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (experience) => {
    setEditingId(experience._id);
    setFormData({
      role: experience.role || "",
      company: experience.company || "",
      location: experience.location || "",
      employmentType: experience.employmentType || "Internship",
      startDate: experience.startDate?.slice(0, 7) || "",
      endDate: experience.endDate?.slice(0, 7) || "",
      companyUrl: experience.companyUrl || "",
      description: experience.description || "",
      order: experience.order || 0,
    });

    setTechnologies(experience.technologies || []);
    setIsCurrent(experience.isCurrent ?? false);
    setFeatured(experience.featured ?? false);
    setIsVisible(experience.isVisible ?? true);

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
      await deleteExperience(deleteId);
      toast.success("Experience deleted successfully");
      loadExperiences()
      closeDeleteModal();
      await loadExperiences();
    } catch {
      toast.error("Failed to delete experience");
    } finally {
      setDeleting(false);
    }
  };
  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="grid gap-5">
          <AdminInput
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="React Developer"
          />

          <AdminInput
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="CyberArrow"
          />

          <div className="grid md:grid-cols-2 gap-5">
            <AdminInput
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Dubai, UAE"
            />

            <AdminSelect
              label="Employment Type"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              options={employmentOptions}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <AdminInput
              label="Start Date"
              type="month"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />

            <AdminInput
              label="End Date"
              type="month"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              disabled={isCurrent}
              placeholder={isCurrent ? "Present" : ""}
            />
          </div>

          <AdminSwitch
            checked={isCurrent}
            onChange={setIsCurrent}
            label="Currently Working Here"
          />

          <AdminInput
            label="Company URL"
            name="companyUrl"
            value={formData.companyUrl}
            onChange={handleChange}
            placeholder="https://company.com"
          />

          <TechnologyInput
            technologies={technologies}
            setTechnologies={setTechnologies}
          />

          <AdminTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
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
            label="Featured Experience"
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
                  ? "Update Experience"
                  : "Add Experience"}
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
        {experiences.length === 0 && (
          <div
            className="
        card

        text-center

        py-16

        xl:col-span-2
      "
          >
            <h3 className="text-title mb-2">No Experience Added</h3>

            <p className="text-body">Add your first experience entry.</p>
          </div>
        )}

        {experiences.map((experience) => (
          <div
            key={experience._id}
            className="
          card

          h-full

          flex
          flex-col

          justify-between
        "
          >
            <div>
              {/* DATE */}

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
                  {new Date(experience.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}

                  {" — "}

                  {experience.isCurrent
                    ? "Present"
                    : experience.endDate
                      ? new Date(experience.endDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "Present"}
                </p>
              </div>

              {/* ROLE */}

              <h3
                className="
              text-title

              mb-2
            "
              >
                {experience.role}
              </h3>

              {/* COMPANY */}

              <p
                className="
              text-label

              mb-2
            "
              >
                {experience.company}
              </p>

              {/* LOCATION + TYPE */}

              <p
                className="
              text-small

              mb-4
            "
              >
                {experience.location}

                {experience.location && experience.employmentType && " • "}

                {experience.employmentType}
              </p>

              {/* TECH STACK */}

              {experience.technologies?.length > 0 && (
                <div
                  className="
                flex
                flex-wrap

                gap-2

                mb-4
              "
                >
                  {experience.technologies.map((tech) => (
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

              {/* DESCRIPTION */}

              <p className="text-body">{experience.description}</p>

              {/* FEATURED */}

              {experience.featured && (
                <div
                  className="
                mt-4

                inline-flex

                px-3
                py-1

                rounded-full

                bg-surface

                border
                border-border

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
                onClick={() => handleEdit(experience)}
                className="
              text-sm

              font-medium
            "
              >
                Edit
              </button>

              <button
                onClick={() => openDeleteModal(experience._id)}
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
        title="Delete Experience"
        message="This action cannot be undone. Are you sure you want to delete this experience?"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default Experience;
