import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminSelect from "../components/form/AdminSelect";
import AdminSwitch from "../components/form/AdminSwitch";
import ConfirmModal from "../components/ui/ConfirmModal";

import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../services/skills.service";

const categoryOptions = [
  { value: "Programming Languages", label: "Programming Languages" },

  { value: "Frontend Development", label: "Frontend Development" },
  { value: "Frontend Frameworks", label: "Frontend Frameworks" },
  { value: "UI Libraries", label: "UI Libraries" },
  { value: "CSS Frameworks", label: "CSS Frameworks" },

  { value: "Backend Development", label: "Backend Development" },
  { value: "Backend Frameworks", label: "Backend Frameworks" },
  { value: "API Development", label: "API Development" },

  { value: "Mobile Development", label: "Mobile Development" },

  { value: "Databases", label: "Databases" },
  { value: "Database Design", label: "Database Design" },
  { value: "ORMs", label: "ORMs" },

  { value: "Blockchain Development", label: "Blockchain Development" },
  { value: "Web3", label: "Web3" },
  { value: "Smart Contracts", label: "Smart Contracts" },

  { value: "Cloud Computing", label: "Cloud Computing" },
  { value: "DevOps", label: "DevOps" },
  { value: "Containerization", label: "Containerization" },
  { value: "CI/CD", label: "CI/CD" },

  { value: "Operating Systems", label: "Operating Systems" },
  { value: "Networking", label: "Networking" },
  { value: "Linux", label: "Linux" },
  { value: "System Administration", label: "System Administration" },

  {
    value: "Data Structures & Algorithms",
    label: "Data Structures & Algorithms",
  },

  {
    value: "Computer Science Fundamentals",
    label: "Computer Science Fundamentals",
  },

  {
    value: "Object-Oriented Programming",
    label: "Object-Oriented Programming",
  },

  { value: "Design Patterns", label: "Design Patterns" },
  { value: "System Design", label: "System Design" },

  { value: "Cybersecurity", label: "Cybersecurity" },

  {
    value: "Authentication & Authorization",
    label: "Authentication & Authorization",
  },

  {
    value: "Artificial Intelligence",
    label: "Artificial Intelligence",
  },

  { value: "Machine Learning", label: "Machine Learning" },
  { value: "Deep Learning", label: "Deep Learning" },
  { value: "Data Science", label: "Data Science" },
  { value: "Data Analytics", label: "Data Analytics" },
  { value: "Big Data", label: "Big Data" },

  { value: "Testing", label: "Testing" },
  { value: "Automation Testing", label: "Automation Testing" },

  {
    value: "Software Architecture",
    label: "Software Architecture",
  },

  { value: "Microservices", label: "Microservices" },

  { value: "Game Development", label: "Game Development" },

  {
    value: "Embedded Systems",
    label: "Embedded Systems",
  },

  { value: "IoT", label: "IoT" },

  {
    value: "Tools & Platforms",
    label: "Tools & Platforms",
  },

  { value: "Version Control", label: "Version Control" },
  { value: "Build Tools", label: "Build Tools" },

  {
    value: "Project Management",
    label: "Project Management",
  },

  { value: "Documentation", label: "Documentation" },

  { value: "UI/UX Design", label: "UI/UX Design" },

  { value: "Soft Skills", label: "Soft Skills" },

  {
    value: "Currently Exploring",
    label: "Currently Exploring",
  },

  { value: "Other", label: "Other" },
];

function Skills() {
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [featured, setFeatured] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    category: categoryOptions[0].value,
    order: 0,
  });

  const loadSkills = async () => {
    try {
      const data = await getSkills();

      setSkills(data);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
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
      name: "",
      category: categoryOptions[0].value,
      order: 0,
    });

    setFeatured(false);

    setIsVisible(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        order: Number(formData.order),
        featured,
        isVisible,
      };

      if (editingId) {
        await updateSkill(editingId, payload);

        toast.success("Skill updated successfully");
      } else {
        await createSkill(payload);

        toast.success("Skill created successfully");
      }

      resetForm();

      await loadSkills();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save skill");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (skill) => {
    setEditingId(skill._id);

    setFormData({
      name: skill.name,
      category: skill.category,
      order: skill.order,
    });

    setFeatured(skill.featured);

    setIsVisible(skill.isVisible);
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

      await deleteSkill(deleteId);

      toast.success("Skill deleted successfully");

      closeDeleteModal();

      await loadSkills();
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="card">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      {/* FORM */}

      <div className="card">
        <div className="grid gap-5">
          <AdminInput
            label="Skill Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="React.js"
          />

          <AdminSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categoryOptions}
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
            label="Featured Skill"
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
              {saving ? "Saving..." : editingId ? "Update Skill" : "Add Skill"}
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}

      <div
        className="
        grid

        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3

        gap-6
      "
      >
        {skills.length === 0 && (
          <div
            className="
            card

            text-center

            py-16

            xl:col-span-3
          "
          >
            <h3 className="text-title mb-2">No Skills Added</h3>

            <p className="text-body">Add your first skill.</p>
          </div>
        )}

        {skills.map((skill) => (
          <div
            key={skill._id}
            className="
            card

            h-full

            flex
            flex-col

            justify-between
          "
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`
                  h-2
                  w-2

                  rounded-full

                  ${skill.featured ? "bg-yellow-500" : "bg-primary"}
                `}
                />

                <p className="text-small">{skill.category}</p>
              </div>

              <h3 className="text-title mb-3">{skill.name}</h3>

              {skill.featured && (
                <span
                  className="
                  inline-block

                  rounded-full

                  bg-yellow-500/10

                  px-3
                  py-1

                  text-xs

                  font-medium

                  text-yellow-600
                "
                >
                  Featured
                </span>
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
                onClick={() => handleEdit(skill)}
                className="
                text-sm

                font-medium
              "
              >
                Edit
              </button>

              <button
                onClick={() => openDeleteModal(skill._id)}
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
        title="Delete Skill"
        message="This action cannot be undone. Are you sure you want to delete this skill?"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default Skills;
