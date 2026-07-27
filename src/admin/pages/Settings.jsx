import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AdminInput from "../components/form/AdminInput";
import AdminTextarea from "../components/form/AdminTextarea";
import AdminSwitch from "../components/form/AdminSwitch";
import TechnologyInput from "../components/form/TechnologyInput";
import ImageUploader from "../components/upload/ImageUploader";

import {
  getSettings,
  createSettings,
  updateSettings,
} from "../services/settings.service";
import { uploadImage } from "../services/upload.service";
import SkeletonCard from "../../components/common/SkeletonCard";

function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [siteKeywords, setSiteKeywords] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicAccessEnabled, setPublicAccessEnabled] = useState(true);

  const [ogImage, setOgImage] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState(null);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    contactEmail: "",
    contactPhone: "",
    footerName: "",
    footerRole: "",
    resumeUrl: "",
  });

  const [socials, setSocials] = useState({
    github: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
  });

  const loadSettings = async () => {
    try {
      const settings = await getSettings();

      setFormData({
        siteTitle: settings.siteTitle || "",
        siteDescription: settings.siteDescription || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        footerName: settings.footerName || "",
        footerRole: settings.footerRole || "",
        resumeUrl: settings.resumeUrl || "",
      });

      setSiteKeywords(settings.siteKeywords || []);
      setMaintenanceMode(settings.maintenanceMode ?? false);
      setPublicAccessEnabled(settings.publicAccessEnabled ?? true);

      setSocials({
        github: settings.socials?.github || "",
        linkedin: settings.socials?.linkedin || "",
        twitter: settings.socials?.twitter || "",
        instagram: settings.socials?.instagram || "",
        facebook: settings.socials?.facebook || "",
      });

      if (settings.ogImage) {
        setOgImagePreview(settings.ogImage);
      }

      setIsCreateMode(false);
    } catch {
      setIsCreateMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;

    setSocials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOgImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingOgImage(true);
      setOgImagePreview(URL.createObjectURL(file));

      const imageData = await uploadImage(file, "settings");

      setOgImage(imageData.url);
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingOgImage(false);
    }
  };

  const handleOgImageRemove = () => {
    setOgImage("");
    setOgImagePreview(null);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        siteKeywords,
        socials,
        maintenanceMode,
        publicAccessEnabled,
        ...(ogImage !== null ? { ogImage } : {}),
      };

      if (isCreateMode) {
        await createSettings(payload);
        toast.success("Settings created successfully");
      } else {
        await updateSettings(payload);
        toast.success("Settings updated successfully");
      }

      await loadSettings();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="card">
        <h2 className="text-title mb-5">Site & SEO</h2>

        <div className="grid gap-5">
          <AdminInput
            label="Site Title"
            name="siteTitle"
            value={formData.siteTitle}
            onChange={handleChange}
            placeholder="Suryanshu Verma | Blockchain Developer & MERN Engineer"
          />

          <AdminTextarea
            label="Site Description"
            name="siteDescription"
            value={formData.siteDescription}
            onChange={handleChange}
            placeholder="Used as the default meta description across the site..."
          />

          <TechnologyInput
            technologies={siteKeywords}
            setTechnologies={setSiteKeywords}
            label="SEO Keywords"
            placeholder="blockchain developer"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="card h-fit">
          <ImageUploader
            preview={ogImagePreview}
            onSelect={handleOgImageSelect}
            onRemove={handleOgImageRemove}
            label="Social Share Image"
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Contact</h2>

          <div className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-5">
              <AdminInput
                label="Contact Email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="you@example.com"
              />

              <AdminInput
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+977 9800000000"
              />
            </div>

            <AdminInput
              label="Resume / CV URL"
              name="resumeUrl"
              value={formData.resumeUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-title mb-5">Social Links</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="GitHub"
            name="github"
            value={socials.github}
            onChange={handleSocialChange}
            placeholder="https://github.com/..."
          />

          <AdminInput
            label="LinkedIn"
            name="linkedin"
            value={socials.linkedin}
            onChange={handleSocialChange}
            placeholder="https://linkedin.com/in/..."
          />

          <AdminInput
            label="Twitter / X"
            name="twitter"
            value={socials.twitter}
            onChange={handleSocialChange}
            placeholder="https://x.com/..."
          />

          <AdminInput
            label="Instagram"
            name="instagram"
            value={socials.instagram}
            onChange={handleSocialChange}
            placeholder="https://instagram.com/..."
          />

          <AdminInput
            label="Facebook"
            name="facebook"
            value={socials.facebook}
            onChange={handleSocialChange}
            placeholder="https://facebook.com/..."
          />
        </div>
      </div>

      <div className="card">
        <h2 className="text-title mb-5">Footer</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="Footer Name"
            name="footerName"
            value={formData.footerName}
            onChange={handleChange}
            placeholder="Suryanshu Verma"
          />

          <AdminInput
            label="Footer Role"
            name="footerRole"
            value={formData.footerRole}
            onChange={handleChange}
            placeholder="Computer Engineer"
          />
        </div>
      </div>

      <div className="card flex items-center justify-between gap-4">
        <div>
          <h3 className="text-label">Maintenance Mode</h3>

          <p className="text-small mt-1">
            Show a maintenance banner on the public portfolio.
          </p>
        </div>

        <AdminSwitch checked={maintenanceMode} onChange={setMaintenanceMode} />
      </div>

      <div className="card flex items-center justify-between gap-4">
        <div>
          <h3 className="text-label">Public Registration &amp; Login</h3>

          <p className="text-small mt-1">
            When on, anyone can register or log in (email/password or
            Google) &mdash; new sign-ups are created as regular users with no
            dashboard access. When off, only suryanshuverma42@gmail.com can
            register or log in; everyone else is blocked, including accounts
            that already exist. Never affects already-signed-in sessions.
          </p>
        </div>

        <AdminSwitch
          checked={publicAccessEnabled}
          onChange={setPublicAccessEnabled}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || uploadingOgImage}
          className="h-control px-6 rounded-control bg-primary text-background text-label transition hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : isCreateMode
              ? "Create Settings"
              : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default Settings;
