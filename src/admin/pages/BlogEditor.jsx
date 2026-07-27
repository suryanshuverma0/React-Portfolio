import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import TechnologyInput from "../components/form/TechnologyInput";
import ImageUploader from "../components/upload/ImageUploader";
import MarkdownEditor from "../components/blog/MarkdownEditor";
import SkeletonCard from "../../components/common/SkeletonCard";

import { getPost, createPost, updatePost } from "../services/blog.service";
import { uploadImage } from "../services/upload.service";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
  });

  const [tags, setTags] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const loadPost = async () => {
      try {
        const post = await getPost(id);

        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
        });

        setTags(post.tags || []);
        setIsVisible(post.isVisible ?? false);

        setCoverImage(post.coverImage || null);
        setCoverImagePreview(post.coverImage?.url || null);
      } catch {
        toast.error("Failed to load post");
        navigate("/dashboard/blog");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !isEditing && !prev.slug
        ? { slug: slugify(value) }
        : {}),
    }));
  };

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setCoverImagePreview(URL.createObjectURL(file));

      const image = await uploadImage(file, "blog");

      setCoverImage(image);
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Cover image upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverRemove = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        slug: slugify(formData.slug),
        tags,
        isVisible,
        ...(coverImage ? { coverImage } : {}),
      };

      if (isEditing) {
        await updatePost(id, payload);
        toast.success("Post updated");
      } else {
        await createPost(payload);
        toast.success(isVisible ? "Post published" : "Draft saved");
      }

      navigate("/dashboard/blog");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-heading">
          {isEditing ? "Edit Post" : "New Post"}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="card h-fit">
          <ImageUploader
            preview={coverImagePreview}
            onSelect={handleCoverSelect}
            onRemove={handleCoverRemove}
            label="Cover Image"
          />
        </div>

        <div className="card space-y-5">
          <AdminInput
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="How I built this portfolio CMS"
          />

          <AdminInput
            label="Slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="how-i-built-this-portfolio-cms"
          />

          <AdminTextarea
            label="Excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="A short summary shown on the blog listing page..."
          />

          <TechnologyInput
            technologies={tags}
            setTechnologies={setTags}
            label="Tags"
            placeholder="engineering"
          />
        </div>
      </div>

      <MarkdownEditor
        value={formData.content}
        onChange={(content) =>
          setFormData((prev) => ({ ...prev, content }))
        }
      />

      <div className="card flex items-center justify-between gap-4">
        <div>
          <h3 className="text-label">Published</h3>

          <p className="text-small mt-1">
            When off, this post is a draft only visible in the admin panel.
          </p>
        </div>

        <AdminSwitch checked={isVisible} onChange={setIsVisible} />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/blog")}
          className="h-control px-6 rounded-control border border-border"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || uploadingCover}
          className="h-control px-6 rounded-control bg-primary text-background text-label transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Update Post" : "Save Post"}
        </button>
      </div>
    </div>
  );
}

export default BlogEditor;
