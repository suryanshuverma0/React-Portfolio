import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import AdminSelect from "../components/form/AdminSelect";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";
import ImageUploader from "../components/upload/ImageUploader";
import GalleryUploader from "../components/upload/GalleryUploader";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/project.service";
import { uploadImage, uploadImages } from "../services/upload.service";
import SkeletonCard from "../../components/common/SkeletonCard";

const categoryOptions = [
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "Full Stack", value: "Full Stack" },
  { label: "Blockchain", value: "Blockchain" },
  { label: "Artificial Intelligence", value: "Artificial Intelligence" },
  { label: "Mobile", value: "Mobile" },
  { label: "DevOps", value: "DevOps" },
  { label: "Software Engineering", value: "Software Engineering" },
  { label: "UI/UX", value: "UI/UX" },
  { label: "Other", value: "Other" },
];

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function EvaluationInput({ items, setItems }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  const addItem = () => {
    if (!label.trim() || !value.trim()) return;

    setItems([...items, { label: label.trim(), value: value.trim() }]);
    setLabel("");
    setValue("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="text-label">Evaluation Metrics</label>

      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Accuracy"
          className="h-control px-control rounded-control bg-surface border border-border"
        />

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="95.28%"
          className="h-control px-control rounded-control bg-surface border border-border"
        />

        <button
          type="button"
          onClick={addItem}
          className="px-5 rounded-control bg-primary text-background"
        >
          Add
        </button>
      </div>

      <div className="grid gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-surface border border-border"
          >
            <span className="text-small">
              {item.label}: <strong>{item.value}</strong>
            </span>

            <button type="button" onClick={() => removeItem(index)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [featured, setFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const [technologies, setTechnologies] = useState([]);
  const [features, setFeatures] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [evaluation, setEvaluation] = useState([]);

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [gallery, setGallery] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [architectureImages, setArchitectureImages] = useState([]);
  const [uploadingArchitecture, setUploadingArchitecture] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    category: "Full Stack",
    title: "",
    description: "",
    githubUrl: "",
    liveUrl: "",
    order: 0,
  });

  const loadProjects = async () => {
    try {
      const data = await getProjects();

      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !prev.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const resetForm = () => {
    setEditingId(null);

    setFeatured(false);
    setIsVisible(true);

    setTechnologies([]);
    setFeatures([]);
    setChallenges([]);
    setLearnings([]);
    setEvaluation([]);

    setThumbnail(null);
    setThumbnailPreview(null);

    setGallery([]);
    setArchitectureImages([]);

    setFormData({
      slug: "",
      category: "Full Stack",
      title: "",
      description: "",
      githubUrl: "",
      liveUrl: "",
      order: 0,
    });
  };

  const handleThumbnailSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingThumbnail(true);
      setThumbnailPreview(URL.createObjectURL(file));

      const imageData = await uploadImage(file, "projects");

      setThumbnail(imageData);
      toast.success("Thumbnail uploaded successfully");
    } catch {
      toast.error("Thumbnail upload failed");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleThumbnailRemove = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleGalleryAdd = async (e) => {
    const files = e.target.files;

    if (!files?.length) return;

    try {
      setUploadingGallery(true);

      const uploaded = await uploadImages(files, "projects");

      setGallery((prev) => [...prev, ...uploaded]);
      toast.success("Gallery images uploaded");
    } catch {
      toast.error("Gallery upload failed");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleGalleryRemove = (index) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleArchitectureAdd = async (e) => {
    const files = e.target.files;

    if (!files?.length) return;

    try {
      setUploadingArchitecture(true);

      const uploaded = await uploadImages(files, "projects");

      setArchitectureImages((prev) => [...prev, ...uploaded]);
      toast.success("Architecture images uploaded");
    } catch {
      toast.error("Architecture image upload failed");
    } finally {
      setUploadingArchitecture(false);
      e.target.value = "";
    }
  };

  const handleArchitectureRemove = (index) => {
    setArchitectureImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!thumbnail) {
      toast.error("Please upload a thumbnail image");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        order: Number(formData.order),
        githubUrl: formData.githubUrl || undefined,
        liveUrl: formData.liveUrl || undefined,
        thumbnail,
        gallery,
        architectureImages,
        features,
        technologies,
        challenges,
        learnings,
        evaluation,
        featured,
        isVisible,
      };

      if (editingId) {
        await updateProject(editingId, payload);
        toast.success("Project updated successfully");
      } else {
        await createProject(payload);
        toast.success("Project created successfully");
      }

      resetForm();
      await loadProjects();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project._id);

    setFormData({
      slug: project.slug || "",
      category: project.category || "Full Stack",
      title: project.title || "",
      description: project.description || "",
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      order: project.order || 0,
    });

    setThumbnail(project.thumbnail || null);
    setThumbnailPreview(project.thumbnail?.url || null);

    setGallery(project.gallery || []);
    setArchitectureImages(project.architectureImages || []);

    setFeatures(project.features || []);
    setTechnologies(project.technologies || []);
    setChallenges(project.challenges || []);
    setLearnings(project.learnings || []);
    setEvaluation(project.evaluation || []);

    setFeatured(project.featured ?? false);
    setIsVisible(project.isVisible ?? true);

    window.scrollTo({ top: 0, behavior: "smooth" });
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

      await deleteProject(deleteId);

      toast.success("Project deleted successfully");
      closeDeleteModal();
      await loadProjects();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="card h-fit">
          <ImageUploader
            preview={thumbnailPreview}
            onSelect={handleThumbnailSelect}
            onRemove={handleThumbnailRemove}
            label="Thumbnail"
          />
        </div>

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
              placeholder="Detection of Counterfeit Pharmaceutical Products"
            />

            <AdminInput
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="pharmaceutical-supply-chain-blockchain"
            />

            <AdminTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the project..."
            />

            <div className="grid md:grid-cols-2 gap-5">
              <AdminInput
                label="GitHub URL"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
              />

              <AdminInput
                label="Live URL"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <TechnologyInput
              technologies={technologies}
              setTechnologies={setTechnologies}
              label="Technologies"
              placeholder="React.js"
            />

            <TechnologyInput
              technologies={features}
              setTechnologies={setFeatures}
              label="Features"
              placeholder="QR-based product verification"
            />

            <TechnologyInput
              technologies={challenges}
              setTechnologies={setChallenges}
              label="Challenges"
              placeholder="Reducing blockchain gas consumption"
            />

            <TechnologyInput
              technologies={learnings}
              setTechnologies={setLearnings}
              label="Learnings"
              placeholder="Ethereum smart contract development"
            />

            <EvaluationInput items={evaluation} setItems={setEvaluation} />

            <GalleryUploader
              images={gallery}
              onAdd={handleGalleryAdd}
              onRemove={handleGalleryRemove}
              uploading={uploadingGallery}
              label="Gallery"
            />

            <GalleryUploader
              images={architectureImages}
              onAdd={handleArchitectureAdd}
              onRemove={handleArchitectureRemove}
              uploading={uploadingArchitecture}
              label="Architecture Images"
            />

            <AdminInput
              label="Display Order"
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
            />
          </div>

          <div className="mt-6 space-y-5">
            <AdminSwitch
              label="Featured Project"
              checked={featured}
              onChange={setFeatured}
            />

            <AdminSwitch
              label="Visible on Portfolio"
              checked={isVisible}
              onChange={setIsVisible}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="h-control px-6 rounded-control border border-border"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            saving || uploadingThumbnail || uploadingGallery || uploadingArchitecture
          }
          className="h-control px-6 rounded-control bg-primary text-background text-label transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : editingId ? "Update Project" : "Add Project"}
        </button>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="card text-center text-small">
            No projects added yet.
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project._id}
              className="card flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <img
                  src={project.thumbnail?.url}
                  alt={project.title}
                  className="h-24 w-36 rounded-xl border border-border object-cover"
                />

                <div>
                  <h3 className="text-label">{project.title}</h3>

                  <p className="text-small mt-1">{project.category}</p>

                  <p className="text-small">{project.slug}</p>

                  <div className="mt-2 flex gap-2">
                    {project.featured && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs">
                        Featured
                      </span>
                    )}

                    {!project.isVisible && (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(project)}
                  className="rounded-control border border-border px-4 py-2 transition hover:border-primary"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteModal(project._id)}
                  className="rounded-control bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
      />
    </div>
  );
}

export default Projects;
