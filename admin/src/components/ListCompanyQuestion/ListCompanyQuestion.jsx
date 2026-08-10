// src/components/ListCompanyQuestion.jsx
import React, { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { listCompanyQuestionStyles as s } from "../../assets/dummyStyles";

const API_URL = "http://localhost:5000/api/interview";

// Robust CSV parser from CompanyQuestionPage
const parseCSVText = (text) => {
  const rows = [];
  let i = 0;
  const len = text.length;
  let cur = "";
  let row = [];
  let inQuotes = false;
  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cur += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        row.push(cur);
        cur = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        if (i + 1 < len && text[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
  }
  if (inQuotes) {
    row.push(cur);
    rows.push(row);
  } else {
    if (cur !== "" || row.length > 0) {
      row.push(cur);
      rows.push(row);
    }
  }
  return rows.map((r) => r.map((cell) => (cell == null ? "" : cell.trim())));
};

const ListCompanyQuestion = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    totalQuestions: "",
    imageFile: null,
    imagePreview: "", // objectURL or remote URL
    csvFile: null,
    csvFileName: "",
  });

  // Toast state (moved to top-right)
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success", // success | error | confirm
    confirmAction: null,
    confirmData: null,
  });

  // Auto-hide toasts (except confirm)
  useEffect(() => {
    if (toast.visible && toast.type !== "confirm") {
      const t = setTimeout(() => {
        setToast((p) => ({ ...p, visible: false }));
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Revoke any objectURLs created in formData.imagePreview when component unmounts
  useEffect(() => {
    return () => {
      if (formData.imagePreview && formData.imageFile) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      // revoke company image previews if any stored as object URLs
      companies.forEach((c) => {
        if (c._objectUrl) URL.revokeObjectURL(c._objectUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/companies`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch companies", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Prevent body scroll when modal is open; restore on close/unmount
  useEffect(() => {
    if (isEditModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return undefined;
  }, [isEditModalOpen]);

  /* ---------- Toast helpers ---------- */
  const showToast = (message, type = "success") => {
    setToast({
      visible: true,
      message,
      type,
      confirmAction: null,
      confirmData: null,
    });
  };

  const showConfirmToast = (message, onConfirm, data) => {
    setToast({
      visible: true,
      message,
      type: "confirm",
      confirmAction: onConfirm,
      confirmData: data,
    });
  };

  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  const handleConfirm = () => {
    if (toast.confirmAction) toast.confirmAction(toast.confirmData);
    hideToast();
  };

  /* ---------- CRUD handlers ---------- */
  const handleDelete = (id, name) => {
    showConfirmToast(
      `Delete "${name}"?`,
      async ({ id }) => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            setCompanies((prev) => prev.filter((x) => (x._id || x.id) !== id));
            showToast("Company deleted successfully!", "success");
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Delete failed", "error");
        }
      },
      { id },
    );
  };

  const handleEdit = (company) => {
    setEditingCompany(company);

    setFormData({
      name: company.companyName || company.name,
      totalQuestions: String(
        company.questionsCount || company.totalQuestions || "",
      ),
      imageFile: null,
      imagePreview:
        company.logo || company._objectUrl || company.imageUrl || "",
      csvFile: null,
      csvFileName: company.csvFileName || "",
    });
    setIsEditModalOpen(true);
  };

  /* ---------- File upload handlers ---------- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }

    // Revoke previous objectURL if it was created from a File
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: objectUrl,
    }));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type &&
      !file.type.includes("csv") &&
      !file.name.endsWith(".csv")
    ) {
      showToast("Please upload a CSV file", "error");
      return;
    }
    setFormData((prev) => ({ ...prev, csvFile: file, csvFileName: file.name }));
  };

  const handleRemoveImage = () => {
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData((p) => ({ ...p, imageFile: null, imagePreview: "" }));
  };

  const handleRemoveCsv = () => {
    setFormData((p) => ({ ...p, csvFile: null, csvFileName: "" }));
  };

  /* ---------- Compact formatter (e.g. 10000 -> 10k+) ---------- */
  const formatToCompact = (val) => {
    if (val == null) return "";
    const trimmed = String(val).trim();

    // If the user typed a plain number (optionally with commas), convert to compact
    if (
      /^\d{1,3}(?:,\d{3})*(?:\.\d+)?$/.test(trimmed) ||
      /^\d+(\.\d+)?$/.test(trimmed)
    ) {
      // remove commas then parse
      const num = Number(trimmed.replace(/,/g, ""));
      if (!Number.isFinite(num)) return trimmed;
      if (num >= 1000) {
        const k = Math.floor(num / 1000);
        return `${k}k+`;
      }
      return String(num);
    }

    // otherwise return the original string (allows alphabets)
    return trimmed;
  };

  /* ---------- Save edits ---------- */
  const handleSave = async () => {
    if (!editingCompany || isSaving) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("companyName", formData.name);
      formDataToSend.append("questionsCount", formData.totalQuestions);
      formDataToSend.append("csvFileName", formData.csvFileName);

      if (formData.imageFile) {
        formDataToSend.append("logoFile", formData.imageFile);
      }

      if (formData.csvFile) {
        formDataToSend.append("csvFile", formData.csvFile);
        const text = await formData.csvFile.text();
        const rows = parseCSVText(text);
        if (rows && rows.length > 1) {
          const headers = rows[0].map((h) =>
            (h || "").toString().toLowerCase(),
          );
          const qIdx = headers.findIndex((h) => h.includes("question"));
          const aIdx = headers.findIndex((h) => h.includes("answer"));
          const kIdx = headers.findIndex((h) => h.includes("key"));
          const questions = [];
          for (let i = 1; i < rows.length; i++) {
            const vals = rows[i];
            if (!vals.some((v) => (v || "").trim() !== "")) continue;
            questions.push({
              question: vals[qIdx >= 0 ? qIdx : 0] || "",
              answer: vals[aIdx >= 0 ? aIdx : 1] || "",
              keyPoints: (vals[kIdx >= 0 ? kIdx : 2] || "")
                .split(/(?:;|\||\r?\n)+/)
                .map((k) => k.trim())
                .filter((k) => k !== ""),
            });
          }
          formDataToSend.append("questionsData", JSON.stringify(questions));
        }
      }

      const response = await axios.put(
        `${API_URL}/${editingCompany._id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setCompanies((prev) =>
          prev.map((c) =>
            c._id === editingCompany._id ? response.data.company : c,
          ),
        );
        showToast("Company updated!", "success");
        setIsEditModalOpen(false);
        setEditingCompany(null);
        setFormData({
          name: "",
          totalQuestions: "",
          imageFile: null,
          imagePreview: "",
          csvFile: null,
          csvFileName: "",
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    // if we created a preview for the modal that isn't assigned to a company, revoke it
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setIsEditModalOpen(false);
    setEditingCompany(null);
    setFormData({
      name: "",
      totalQuestions: "",
      imageFile: null,
      imagePreview: "",
      csvFile: null,
      csvFileName: "",
    });
  };

  return (
    <div className={s.container}>
      <header className={s.header}>
        <Building2 className={s.headerIcon} size={36} />
        <h1 className={s.headerTitle}>Company Questions</h1>
      </header>

      {/* Grid of cards */}
      {loading && (
        <div className={s.loadingContainer}>
          <Loader2 className={s.loadingSpinner} size={40} />
          <p className={s.loadingText}>Loading company questions...</p>
        </div>
      )}
      {!loading && companies.length === 0 && (
        <div className={s.emptyState}>No company questions added yet.</div>
      )}
      <div className={s.grid}>
        {companies.map((company) => {
          const imgSrc =
            company.logo || company._objectUrl || company.imageUrl || "";
          return (
            <article
              key={company._id || company.id}
              className={s.card}
              role="article"
              aria-labelledby={`company-${company._id || company.id}-title`}
            >
              {/* Image: responsive heights for sm/md, preserved for lg+ */}
              <div className={s.cardImageContainer}>
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={company.companyName || company.name}
                    className={s.cardImage}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://via.placeholder.com/800x600?text=No+Image";
                    }}
                  />
                ) : (
                  <div className={s.cardImageFallback}>
                    <ImageIcon size={48} />
                  </div>
                )}

                {/* action buttons overlay - visible on hover (group) */}
                <div className={s.actionButtonsOverlay}>
                  <button
                    onClick={() => handleEdit(company)}
                    className={s.editButton}
                    title={`Edit ${company.companyName || company.name}`}
                  >
                    <Pencil size={16} className={s.editIcon} />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(
                        company._id || company.id,
                        company.companyName || company.name,
                      )
                    }
                    className={s.deleteButton}
                    title={`Delete ${company.companyName || company.name}`}
                  >
                    <Trash2 size={16} className={s.deleteIcon} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={s.cardContent}>
                <div>
                  <h2
                    id={`company-${company._id || company.id}-title`}
                    className={s.cardTitle}
                  >
                    {company.companyName || company.name}
                  </h2>

                  <div className={s.cardInfoContainer}>
                    <div className={s.questionsInfo}>
                      <span className={s.questionsLabel}>Total Questions</span>
                      <span className={s.questionsBadge}>
                        {company.questionsCount || company.totalQuestions}
                      </span>
                    </div>

                    <div className={s.csvInfo}>
                      <FileText size={14} className={s.csvIcon} />
                      {company.csvFileUrl ? (
                        <a
                          href={company.csvFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.csvLink}
                          title="Download CSV"
                        >
                          {company.csvFileName || "Download CSV"}
                        </a>
                      ) : (
                        <span className={s.csvText}>
                          {company.csvFileName || "No CSV"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={s.cardFooter}>
                  <div className={s.cardMeta}>
                    {/* placeholder for meta like "posted date" */}
                    {/* You can add company.postDate if available */}
                  </div>
                  <div className={s.cardActions}>
                    <button
                      onClick={() => handleEdit(company)}
                      className={s.cardEditBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(
                          company._id || company.id,
                          company.companyName || company.name,
                        )
                      }
                      className={s.cardDeleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Top-right Toast */}
      {toast.visible && (
        <div
          className={`${s.toastWrapper} ${
            toast.visible ? s.toastVisible : s.toastHidden
          }`}
        >
          <div
            className={`${s.toastContainer} ${
              toast.type === "success"
                ? s.toastSuccess
                : toast.type === "error"
                  ? s.toastError
                  : s.toastConfirm
            }`}
          >
            <div className={s.toastContent}>
              <div>
                {toast.type === "success" && (
                  <CheckCircle className={s.toastIconSuccess} />
                )}
                {toast.type === "error" && (
                  <AlertCircle className={s.toastIconError} />
                )}
                {toast.type === "confirm" && (
                  <AlertCircle className={s.toastIconConfirm} />
                )}
              </div>

              <div className={s.toastMessageContainer}>
                <p className={s.toastMessage}>{toast.message}</p>

                {toast.type === "confirm" && (
                  <div className={s.toastConfirmButtons}>
                    <button
                      onClick={handleConfirm}
                      className={s.toastConfirmBtn}
                    >
                      Confirm
                    </button>
                    <button onClick={hideToast} className={s.toastCancelBtn}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <button onClick={hideToast} className={s.toastCloseBtn}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className={s.modalOverlay} aria-modal="true" role="dialog">
          <div className={s.modalBackdrop} onClick={handleCloseModal} />
          <div className={s.modalContainer}>
            <div className={s.modalContent}>
              {/* name */}
              <div>
                {/* Cross button aligned right */}
                <div className={s.modalHeader}>
                  <button
                    onClick={handleCloseModal}
                    className={s.modalCloseBtn}
                  >
                    <X size={20} />
                  </button>
                </div>

                <label className={s.formLabel}>Company Name</label>

                <input
                  className={s.formInput}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  type="text"
                />
              </div>

              {/* total questions (text input now) */}
              <div>
                <label className={s.formLabel}>Total Questions</label>
                <input
                  className={s.formInput}
                  value={formData.totalQuestions}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      totalQuestions: e.target.value,
                    }))
                  }
                  type="text"
                  placeholder="e.g. 10k+ or 250 or 10k+ interviews"
                  onBlur={() =>
                    setFormData((p) => ({
                      ...p,
                      totalQuestions: formatToCompact(p.totalQuestions),
                    }))
                  }
                />
                <p className={s.formHelper}>
                  Accepts letters and numbers. Plain numbers are auto-formatted
                  (10000 → 10k+).
                </p>
              </div>

              {/* image upload (taller preview) */}
              <div>
                <label className={s.formLabel}>Company Image</label>
                {formData.imagePreview ? (
                  <div className={s.imagePreviewContainer}>
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className={s.imagePreview}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://via.placeholder.com/800x600?text=No+Image";
                      }}
                    />
                    <button
                      onClick={handleRemoveImage}
                      className={s.imageRemoveBtn}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className={s.imageUploadLabel}>
                    <div className={s.imageUploadContent}>
                      <Upload className={s.imageUploadIcon} />
                      <p className={s.imageUploadText}>Click to upload image</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className={s.imageUploadInput}
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* csv upload */}
              <div>
                <label className={s.formLabel}>CSV File</label>
                {formData.csvFileName ? (
                  <div className={s.csvFileDisplay}>
                    <span className={s.csvFileName}>
                      {formData.csvFileName}
                    </span>
                    <button
                      onClick={handleRemoveCsv}
                      className={s.csvRemoveBtn}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className={s.csvUploadLabel}>
                    <div className={s.csvUploadContent}>
                      <FileText className={s.csvUploadIcon} />
                      <p className={s.csvUploadText}>Upload CSV</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      className={s.csvUploadInput}
                      onChange={handleCsvUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className={s.modalFooter}>
              <button
                onClick={handleCloseModal}
                className={s.modalCancelBtn}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={s.modalSaveBtn}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCompanyQuestion;
