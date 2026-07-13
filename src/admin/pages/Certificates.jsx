import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import ImageUploader from "../components/upload/ImageUploader";

import AdminInput from "../components/form/AdminInput";
import AdminSwitch from "../components/form/AdminSwitch";

import ConfirmModal from "../components/ui/ConfirmModal";

import {
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../services/certificate.service";

import { uploadImage } from "../services/upload.service";
import SkeketonCard from "../../components/common/SkeletonCard"

function Certificates() {
  const [certificates, setCertificates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [featured, setFeatured] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState(null);

  const [uploadedImage, setUploadedImage] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    year: new Date().getFullYear(),
    verifyUrl: "",
    order: 0,
  });

  const loadCertificates = async () => {
    try {
      const data = await getCertificates();

      setCertificates(data);
    } catch {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
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

    setImage(null);

    setPreview(null);

    setUploadedImage(null);

    setFeatured(false);

    setIsVisible(true);

    setFormData({
      title: "",
      issuer: "",
      year: new Date().getFullYear(),
      verifyUrl: "",
      order: 0,
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      setPreview(URL.createObjectURL(file));

      const imageData = await uploadImage(file, "certificates");

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
        year: Number(formData.year),
        order: Number(formData.order),
        image: uploadedImage,
        featured,
        isVisible,
      };

      if (editingId) {
        await updateCertificate(editingId, payload);

        toast.success("Certificate updated successfully");
      } else {
        await createCertificate(payload);

        toast.success("Certificate created successfully");
      }

      resetForm();

      await loadCertificates();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save certificate",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (certificate) => {
    setEditingId(certificate._id);

    setFormData({
      title: certificate.title || "",
      issuer: certificate.issuer || "",
      year: certificate.year || new Date().getFullYear(),
      verifyUrl: certificate.verifyUrl || "",
      order: certificate.order || 0,
    });

    setFeatured(certificate.featured ?? false);

    setIsVisible(certificate.isVisible ?? true);

    if (certificate.image) {
      setUploadedImage(certificate.image);

      setPreview(certificate.image.url);
    } else {
      setUploadedImage(null);

      setPreview(null);
    }

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

      await deleteCertificate(deleteId);

      toast.success("Certificate deleted successfully");

      closeDeleteModal();

      await loadCertificates();
    } catch {
      toast.error("Failed to delete certificate");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeketonCard/>;
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
            label="Certificate Image"
          />
        </div>

        <div className="card">
          <div className="grid gap-5">
            <AdminInput
              label="Certificate Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Responsive Web Design"
            />

            <AdminInput
              label="Issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              placeholder="freeCodeCamp"
            />

            <AdminInput
              label="Year"
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="2025"
            />

            <AdminInput
              label="Verify URL"
              name="verifyUrl"
              value={formData.verifyUrl}
              onChange={handleChange}
              placeholder="https://..."
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
              label="Featured Certificate"
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
            className="
            h-control
            px-6
            rounded-control
            border
            border-border
          "
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || uploading}
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
            : editingId
              ? "Update Certificate"
              : "Add Certificate"}
        </button>
      </div>

      <div className="space-y-4">
        {certificates.length === 0 ? (
          <div className="card text-center text-small">
            No certificates added yet.
          </div>
        ) : (
          certificates.map((certificate) => (
            <div
              key={certificate._id}
              className="
              card

              flex
              items-center
              justify-between

              gap-6
            "
            >
              <div className="flex items-center gap-5">
                <img
                  src={certificate.image?.url}
                  alt={certificate.title}
                  className="
                  h-24
                  w-36

                  rounded-xl

                  border
                  border-border

                  object-cover
                "
                />

                <div>
                  <h3 className="text-label">{certificate.title}</h3>

                  <p className="text-small mt-1">{certificate.issuer}</p>

                  <p className="text-small">{certificate.year}</p>

                  <div className="mt-2 flex gap-2">
                    {certificate.featured && (
                      <span
                        className="
                        rounded-full
                        bg-primary/10
                        px-3
                        py-1
                        text-xs
                      "
                      >
                        Featured
                      </span>
                    )}

                    {!certificate.isVisible && (
                      <span
                        className="
                        rounded-full
                        bg-red-500/10
                        px-3
                        py-1
                        text-xs
                      "
                      >
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(certificate)}
                  className="
                  rounded-control
                  border
                  border-border

                  px-4
                  py-2

                  transition

                  hover:border-primary
                "
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteModal(certificate._id)}
                  className="
                  rounded-control

                  bg-red-500

                  px-4
                  py-2

                  text-white

                  transition

                  hover:bg-red-600
                "
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
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        loading={deleting}
      />
    </div>
  );
}

export default Certificates;
