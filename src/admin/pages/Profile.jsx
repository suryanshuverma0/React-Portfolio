import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ImageUploader from "../components/upload/ImageUploader";
import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import RoleInput from "../components/form/RoleInput";
import {
  getProfile,
  createProfile,
  updateProfile,
} from "../services/profile.service";
import { uploadImage } from "../services/upload.service";

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [roles, setRoles] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [image, setImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    availability: "",
    description: "",
  });

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      setFormData({
        name: profile.name || "",
        headline: profile.headline || "",
        availability: profile.availability || "",
        description: profile.description || "",
      });
      setRoles(profile.roles || []);
      setIsVisible(profile.isVisible ?? true);
      if (profile.image) {
        setUploadedImage(profile.image);
        setPreview(profile.image.url);
      }
      setIsCreateMode(false);
    } catch (error) {
      setIsCreateMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setPreview(URL.createObjectURL(file));
      const imageData = await uploadImage(file, "profile");
      setUploadedImage(imageData);
      setImage(file);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = () => {
    setImage(null);
    setUploadedImage(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        roles,
        isVisible,
        image: uploadedImage,
      };
      if (isCreateMode) {
        await createProfile(payload);
        toast.success("Profile created successfully");
      } else {
        await updateProfile(payload);
        toast.success("Profile updated successfully");
      }

      await loadProfile();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card">Loading profile...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div
        className="
          grid

          gap-6

          lg:grid-cols-[280px_minmax(0,1fr)]
        "
      >
        <div className="card h-fit">
          <ImageUploader
            image={image}
            preview={preview}
            onSelect={handleImageSelect}
            onRemove={handleImageRemove}
            label="Profile Image"
          />
        </div>

        <div className="card">
          <div className="grid gap-5">
            <AdminInput
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Suryanshu Verma"
            />

            <AdminInput
              label="Headline"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              placeholder="Blockchain Developer & MERN Engineer"
            />

            <AdminInput
              label="Availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              placeholder="Open to opportunities"
            />

            <RoleInput roles={roles} setRoles={setRoles} />
          </div>
        </div>
      </div>

      <div className="card">
        <AdminTextarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={8}
          placeholder="Tell visitors about yourself..."
        />
      </div>

      <div
        className="
          card

          flex
          items-center
          justify-between

          gap-4
        "
      >
        <div>
          <h3 className="text-label">Visible on Portfolio</h3>

          <p className="text-small mt-1">
            Hide or show your profile on the public portfolio website.
          </p>
        </div>

        <AdminSwitch checked={isVisible} onChange={setIsVisible} />
      </div>

      <div
        className="
          flex
          justify-end
        "
      >
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="
            h-control

            px-6

            rounded-control

            bg-primary

            text-background

            text-label

            transition

            hover:opacity-90

            disabled:opacity-50
          "
        >
          {saving
            ? "Saving..."
            : isCreateMode
              ? "Create Profile"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default Profile;
