import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Tag,
  Briefcase,
  Users,
  DollarSign,
  Clock,
  Building2,
  FileText,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Code,
  GraduationCap,
  ListChecks,
  Layers,
  Plus,
  Loader2,
} from "lucide-react";
import { listJobsStyles as s, getBadgeClasses } from "../../assets/dummyStyles";

/* Small reusable Badge (for wrapping we forward className) */
const Badge = ({ children, variant = "default", onRemove, className = "" }) => {
  return (
    <span
      className={`${s.badgeBase} ${getBadgeClasses(variant, "")} ${className}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 hover:text-red-600 focus:outline-none"
          aria-label="Remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

/* Field wrapper for consistent animated border/focus */
const Field = ({ label, icon, children }) => {
  return (
    <div className={s.fieldContainer}>
      <label className={s.fieldLabel}>
        {icon} <span>{label}</span>
      </label>
      <div className={s.fieldWrapper}>{children}</div>
    </div>
  );
};

function formatSalary(salary) {
  if (!salary) return "Not disclosed";
  const { amount, period } = salary;
  const amt = Number(amount || 0).toLocaleString();
  const periodLabel =
    period === "month" ? "/month" : period === "year" ? "/year" : `/${period}`;
  return `$ ${amt} ${periodLabel}`;
}

export default function ListJobs() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const mapBackToFrontend = (bJob) => {
    return {
      id: bJob._id,
      image:
        bJob.companyLogo?.startsWith("http") ||
        bJob.companyLogo?.startsWith("data:")
          ? bJob.companyLogo
          : `http://localhost:5000${bJob.companyLogo || ""}`,
      role: bJob.roleName,
      company: bJob.companyName,
      techstack: bJob.techStack,
      locations: [bJob.location],
      experience: bJob.experience,
      salary: {
        amount: bJob.salary,
        period: (bJob.salaryType || "").replace("/", "") || "month",
      },
      jobType: bJob.jobType,
      postDate: bJob.postDate
        ? new Date(bJob.postDate).toISOString().split("T")[0]
        : "",
      category: bJob.category,
      openings: bJob.openings,
      overview: bJob.overview,
      responsibilities: bJob.responsibilities,
      criteria: bJob.jobCriteria,
      education: bJob.education,
    };
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/job/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setJobs(res.data.jobs.map(mapBackToFrontend));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // small inputs for arrays (tech/responsibility/criterion/education kept)
  const [newTech, setNewTech] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");
  const [newCriterion, setNewCriterion] = useState("");
  const [newEducation, setNewEducation] = useState("");

  // --- Location inline-edit states (only used while editing a job) ---
  const [editingLocationIndex, setEditingLocationIndex] = useState(null);
  const [editingLocationText, setEditingLocationText] = useState("");

  // company filter (new)
  const [companyFilter, setCompanyFilter] = useState("");

  // file input ref for image upload
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job? This action cannot be undone."))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`http://localhost:5000/api/job/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        setToast({ type: "success", text: "Job deleted successfully" });
      }
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Failed to delete job" });
    }
  };

  const openEdit = (job) => {
    // create a deep-ish clone so editing doesn't mutate the list until saved
    setEditingJob(JSON.parse(JSON.stringify(job)));
    setShowModal(true);
    // reset small inputs
    setNewTech("");
    setNewResponsibility("");
    setNewCriterion("");
    setNewEducation("");
    setEditingLocationIndex(null);
    setEditingLocationText("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setEditingLocationIndex(null);
    setEditingLocationText("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      formDataToSend.append("roleName", editingJob.role || "");
      formDataToSend.append("companyName", editingJob.company || "");
      formDataToSend.append(
        "location",
        editingJob.locations && editingJob.locations.length > 0
          ? editingJob.locations[0]
          : "",
      );
      formDataToSend.append("experience", editingJob.experience || "");
      formDataToSend.append("salary", editingJob.salary?.amount || 0);
      formDataToSend.append("salaryType", editingJob.salary?.period || "month");
      formDataToSend.append("jobType", editingJob.jobType || "");
      formDataToSend.append("postDate", editingJob.postDate || "");
      formDataToSend.append("category", editingJob.category || "");
      formDataToSend.append("openings", editingJob.openings || 1);
      formDataToSend.append("overview", editingJob.overview || "");

      formDataToSend.append(
        "techStack",
        JSON.stringify(editingJob.techstack || []),
      );
      formDataToSend.append(
        "responsibilities",
        JSON.stringify(editingJob.responsibilities || []),
      );
      formDataToSend.append(
        "jobCriteria",
        JSON.stringify(editingJob.criteria || []),
      );
      formDataToSend.append(
        "education",
        JSON.stringify(editingJob.education || []),
      );

      if (editingJob.image && editingJob.image.startsWith("data:")) {
        const res = await fetch(editingJob.image);
        const blob = await res.blob();
        formDataToSend.append("companyLogo", blob, "logo.png");
      }

      const res = await axios.put(
        `http://localhost:5000/api/job/${editingJob.id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        const updatedJob = mapBackToFrontend(res.data.job);
        setJobs((prev) =>
          prev.map((j) => (j.id === editingJob.id ? updatedJob : j)),
        );
        setToast({ type: "success", text: "Job updated successfully" });
        closeModal();
      }
    } catch (error) {
      console.error("Error updating job:", error);
      setToast({ type: "error", text: "Failed to update job" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditingJob((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  // add item to array field (tech/responsibilities/criteria/education)
  const addArrayItem = (field, item) => {
    if (!item || !item.trim()) return;
    setEditingJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: [...(prev[field] || []), item.trim()],
      };
    });
  };

  const removeArrayItem = (field, index) => {
    setEditingJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index),
      };
    });
  };

  /* ---------- Image upload handlers ---------- */
  const handleBrowseClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", text: "Please select a valid image file." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleFieldChange("image", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    handleFieldChange("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Location inline edit helpers
  const startEditLocation = (idx) => {
    setEditingLocationIndex(idx);
    setEditingLocationText(editingJob?.locations?.[idx] ?? "");
  };

  const saveEditLocation = () => {
    if (editingLocationIndex === null) return;
    const trimmed = (editingLocationText || "").trim();
    setEditingJob((prev) => {
      if (!prev) return prev;
      const arr = Array.isArray(prev.locations) ? [...prev.locations] : [];
      if (!trimmed) {
        // if user cleared text, we delete the location instead
        arr.splice(editingLocationIndex, 1);
      } else {
        arr[editingLocationIndex] = trimmed;
      }
      return { ...prev, locations: arr };
    });
    setEditingLocationIndex(null);
    setEditingLocationText("");
  };

  const cancelEditLocation = () => {
    setEditingLocationIndex(null);
    setEditingLocationText("");
  };

  // derive filtered list
  const filteredJobs = jobs.filter((job) =>
    job.company.toLowerCase().includes(companyFilter.trim().toLowerCase()),
  );

  return (
    <div className={s.container}>
      <div className={s.contentWrapper}>
        {/* Header - responsive stacking on small screens */}
        <header className={s.header}>
          <h1 className={s.headerTitle}>Job Listings</h1>

          <div className={s.headerRight}>
            {/* company filter (top-right) */}
            <div className={s.filterContainer}>
              <input
                type="text"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Filter by company"
                className={s.filterInput}
              />
              {companyFilter && (
                <button
                  onClick={() => setCompanyFilter("")}
                  aria-label="Clear filter"
                  className={s.filterClearBtn}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Badge variant="default" className={s.badgeShrink}>
              <Briefcase size={14} />
              {filteredJobs.length} Showing
            </Badge>
          </div>
        </header>

        {/* Grid */}
        <div className={s.grid}>
          {filteredJobs.map((job) => (
            <article key={job.id} className={s.jobCard}>
              <div className={s.jobCardGradientBar} />

              <div className={s.jobCardContent}>
                {/* Responsive: stack image & details on small screens */}
                <div className={s.jobHeader}>
                  <div className={s.jobImageContainer}>
                    <div className={s.jobImageWrapper}>
                      <img
                        src={job.image}
                        alt={job.company}
                        className={s.jobImage}
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/150")
                        }
                      />
                    </div>
                    <div className={s.jobImageBadge}>
                      <Building2 size={16} className={s.jobImageBadgeIcon} />
                    </div>
                  </div>

                  <div className={s.jobDetails}>
                    <div className={s.jobTitleRow}>
                      <div>
                        <h2 className={s.jobTitle}>{job.role}</h2>
                        <p className={s.jobCompany}>
                          <Building2 size={14} />
                          {job.company}
                        </p>
                      </div>

                      <span className={s.jobSalary}>
                        {formatSalary(job.salary)}
                      </span>
                    </div>

                    <div className={s.techStackContainer}>
                      {job.techstack?.map((tech, idx) => (
                        <Badge key={idx} variant="tech" className={s.techBadge}>
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    <div className={s.jobMetaGrid}>
                      <div className={s.jobMetaItem}>
                        <MapPin size={14} className={s.jobMetaIcon} />
                        <span className={s.jobMetaText}>
                          {job.locations?.join(" • ")}
                        </span>
                      </div>
                      <div className={s.jobMetaItem}>
                        <Clock size={14} className={s.jobMetaIcon} />
                        <span className={s.jobMetaText}>{job.experience}</span>
                      </div>
                      <div className={s.jobMetaItem}>
                        <Tag size={14} className={s.jobMetaIcon} />
                        <span className={s.jobMetaText}>{job.category}</span>
                      </div>
                      <div className={s.jobMetaItem}>
                        <Users size={14} className={s.jobMetaIcon} />
                        <span className={s.jobMetaText}>
                          {job.openings}{" "}
                          {job.openings > 1 ? "openings" : "opening"}
                        </span>
                      </div>
                    </div>

                    <p className={s.jobOverview}>{job.overview}</p>
                  </div>
                </div>

                <div className={s.jobSections}>
                  <div>
                    <h4 className={s.sectionTitle}>
                      <ListChecks size={14} className={s.sectionIcon} />
                      Responsibilities
                    </h4>
                    <ul className={s.sectionList}>
                      {job.responsibilities?.map((r, i) => (
                        <li key={i} className={s.sectionListItem}>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className={s.sectionTitle}>
                      <ListChecks size={14} className={s.sectionIcon} />
                      Criteria
                    </h4>
                    <ul className={s.sectionList}>
                      {job.criteria?.map((c, i) => (
                        <li key={i} className={s.sectionListItem}>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className={s.sectionTitle}>
                      <GraduationCap size={14} className={s.sectionIcon} />
                      Education
                    </h4>
                    <ul className={s.sectionList}>
                      {job.education?.map((e, i) => (
                        <li key={i} className={s.sectionListItem}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={s.jobActions}>
                  <button onClick={() => openEdit(job)} className={s.editBtn}>
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      navigate("/applicants", {
                        state: {
                          jobId: job.id,
                          role: job.role,
                          companyName: job.company,
                        },
                      })
                    }
                    className={s.applicantsBtn}
                  >
                    <Users size={14} />
                    Applicants
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className={s.deleteBtn}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editingJob && (
        <div
          className={s.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-job-title"
        >
          {/* backdrop */}
          <div className={s.modalBackdrop} onClick={closeModal} aria-hidden />

          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className={s.modalContainer}
          >
            {/* header */}
            <div className={s.modalHeader}>
              <div>
                <h3 id="edit-job-title" className={s.modalTitle}>
                  <Edit3 size={20} />
                  Edit Job – {editingJob.role || "Untitled"}
                </h3>
                <p className={s.modalSubtitle}>
                  {editingJob.company ?? "Unknown company"} ·{" "}
                  {editingJob.category ?? "Uncategorized"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={s.modalCloseBtn}
                  onClick={closeModal}
                  aria-label="Close edit"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className={s.modalContent}>
              {/* Image upload section */}
              <div className={s.sectionContainerLight}>
                <h4 className={s.sectionHeader}>
                  <ImageIcon size={16} className={s.sectionHeaderIcon} />
                  Company Image
                </h4>

                <div className={s.imageUploadContainer}>
                  <div className={s.imagePreviewWrapper}>
                    <div className={s.imagePreview}>
                      <img
                        src={
                          editingJob.image || "https://via.placeholder.com/150"
                        }
                        alt="Company"
                        className={s.imagePreviewImg}
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/150")
                        }
                      />
                    </div>
                  </div>

                  <div className={s.imageUploadActions}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={s.hiddenInput}
                      aria-hidden
                    />

                    <Field
                      label="Upload Image"
                      icon={<ImageIcon size={14} className="text-slate-400" />}
                    >
                      <div className={s.imageUploadButtons}>
                        <div className={s.imageUploadText}>
                          <div className={s.imageUploadInfo}>
                            Click{" "}
                            <button
                              type="button"
                              onClick={handleBrowseClick}
                              className={s.imageUploadBrowse}
                            >
                              Browse
                            </button>{" "}
                            to select an image from your device.
                          </div>
                          <div className={s.imageUploadStatus}>
                            {editingJob.image
                              ? editingJob.image.startsWith("data:")
                                ? "Using uploaded image (local preview)"
                                : "Using external image URL"
                              : "No image selected"}
                          </div>
                        </div>

                        <div className={s.imageUploadBtnGroup}>
                          <button
                            type="button"
                            onClick={handleBrowseClick}
                            className={s.browseBtn}
                          >
                            Browse
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className={s.removeBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className={s.sectionContainer}>
                <h4 className={s.sectionHeader}>
                  <Layers size={16} className={s.sectionHeaderIcon} />
                  Basic Information
                </h4>
                <div className={s.formGrid2}>
                  <div>
                    <Field
                      label="Role *"
                      icon={<Briefcase size={14} className="text-slate-400" />}
                    >
                      <input
                        value={editingJob?.role ?? ""}
                        onChange={(e) =>
                          handleFieldChange("role", e.target.value)
                        }
                        className={s.input}
                        required
                      />
                    </Field>
                  </div>

                  <div>
                    <Field
                      label="Company *"
                      icon={<Building2 size={14} className="text-slate-400" />}
                    >
                      <input
                        value={editingJob?.company ?? ""}
                        onChange={(e) =>
                          handleFieldChange("company", e.target.value)
                        }
                        className={s.input}
                        required
                      />
                    </Field>
                  </div>

                  <div>
                    <Field
                      label="Category"
                      icon={<Tag size={14} className="text-slate-400" />}
                    >
                      <select
                        value={editingJob?.category ?? ""}
                        onChange={(e) =>
                          handleFieldChange("category", e.target.value)
                        }
                        className={s.select}
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        <option value="Engineering">Engineering</option>
                        <option value="IT">IT</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Design">Design</option>
                        <option value="Product">Product</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </Field>
                  </div>

                  <div>
                    <Field
                      label="Job Type"
                      icon={<Clock size={14} className="text-slate-400" />}
                    >
                      <select
                        value={editingJob?.jobType ?? ""}
                        onChange={(e) =>
                          handleFieldChange("jobType", e.target.value)
                        }
                        className={s.select}
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Location & Experience */}
              <div className={s.sectionContainer}>
                <h4 className={s.sectionHeader}>
                  <MapPin size={16} className={s.sectionHeaderIcon} />
                  Location & Experience
                </h4>
                <div className={s.formGrid2}>
                  <div>
                    <Field label="Locations" icon={<MapPin size={12} />}>
                      {/* inline-edit per location - NO add-multiple input */}
                      <div className="flex flex-col gap-2">
                        {(editingJob?.locations || []).length === 0 && (
                          <div className="text-xs text-slate-500">
                            No locations defined
                          </div>
                        )}

                        {(editingJob?.locations || []).map((loc, idx) => (
                          <div key={idx} className={s.locationItem}>
                            {/* if editing this index, show input */}
                            {editingLocationIndex === idx ? (
                              <>
                                <input
                                  type="text"
                                  value={editingLocationText}
                                  onChange={(e) =>
                                    setEditingLocationText(e.target.value)
                                  }
                                  className={s.locationInput}
                                />
                                <button
                                  type="button"
                                  onClick={saveEditLocation}
                                  className={s.locationSaveBtn}
                                  aria-label={`Save location ${idx + 1}`}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditLocation}
                                  className={s.locationCancelBtn}
                                  aria-label={`Cancel edit location ${idx + 1}`}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant="location"
                                  className="max-w-full wrap-break-word"
                                >
                                  <MapPin size={12} />
                                  <span className="ml-1 max-w-xs wrap-break-word">
                                    {loc}
                                  </span>
                                </Badge>

                                <button
                                  type="button"
                                  onClick={() => startEditLocation(idx)}
                                  className={s.locationEditBtn}
                                  aria-label={`Edit location ${idx + 1}`}
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeArrayItem("locations", idx)
                                  }
                                  className={s.locationRemoveBtn}
                                  aria-label={`Remove location ${idx + 1}`}
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <div>
                    <Field label="Experience" icon={<Clock size={12} />}>
                      <input
                        value={editingJob?.experience ?? ""}
                        onChange={(e) =>
                          handleFieldChange("experience", e.target.value)
                        }
                        className={s.input}
                        placeholder="2 - 5 years"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Tech & Salary */}
              <div className={`${s.sectionContainer} overflow-visible`}>
                <h4 className={s.sectionHeader}>
                  <Code size={16} className={s.sectionHeaderIcon} />
                  Tech Stack & Compensation
                </h4>

                <div className={s.formGrid2}>
                  <div>
                    <Field label="Tech Stack" icon={<Code size={12} />}>
                      {/* badges: wrap lines and force-break long tokens */}
                      <div className={s.badgeList}>
                        {(editingJob?.techstack || []).map((tech, idx) => (
                          <Badge
                            key={idx}
                            variant="tech"
                            onRemove={() => removeArrayItem("techstack", idx)}
                            className={s.badgeItem}
                          >
                            <Code size={12} />
                            <span className={s.badgeText}>{tech}</span>
                          </Badge>
                        ))}
                      </div>

                      <div className={s.addItemContainer}>
                        <input
                          type="text"
                          value={newTech}
                          onChange={(e) => setNewTech(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addArrayItem("techstack", newTech);
                              setNewTech("");
                            }
                          }}
                          className={s.addItemInput}
                          placeholder="Add a technology and press Enter"
                          aria-label="Add technology"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addArrayItem("techstack", newTech);
                            setNewTech("");
                          }}
                          className={s.addItemBtn}
                          aria-label="Add tech"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </Field>
                  </div>

                  <div>
                    <Field label="Salary" icon={<DollarSign size={12} />}>
                      <div className={s.salaryContainer}>
                        {/* Show empty when amount is 0 or undefined so placeholder appears */}
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            typeof editingJob?.salary?.amount === "number" &&
                            editingJob.salary.amount > 0
                              ? editingJob.salary.amount
                              : ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            const amountValue =
                              raw === "" ? undefined : Number(raw);
                            handleFieldChange("salary", {
                              ...(editingJob?.salary || {}),
                              amount: amountValue,
                            });
                          }}
                          placeholder="Amount"
                          className={s.salaryAmountInput}
                          aria-label="Salary amount"
                        />

                        <select
                          value={editingJob?.salary?.period ?? "month"}
                          onChange={(e) =>
                            handleFieldChange("salary", {
                              ...(editingJob?.salary || {}),
                              period: e.target.value,
                            })
                          }
                          className={s.salaryPeriodSelect}
                          aria-label="Salary period"
                        >
                          <option value="hour">/ hour</option>
                          <option value="day">/ day</option>
                          <option value="week">/ week</option>
                          <option value="month">/ month</option>
                          <option value="year">/ year</option>
                        </select>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Overview */}
              <div className={s.sectionContainer}>
                <h4 className={s.sectionSubHeader}>
                  <FileText size={16} className={s.sectionHeaderIcon} />
                  Overview
                </h4>
                <textarea
                  value={editingJob?.overview ?? ""}
                  onChange={(e) =>
                    handleFieldChange("overview", e.target.value)
                  }
                  rows={3}
                  className={s.textarea}
                  placeholder="Brief description of the role..."
                />
              </div>

              {/* Responsibilities & Criteria */}
              <div className={s.formGrid2}>
                <div className={`${s.sectionContainer} overflow-visible`}>
                  <h4 className={s.sectionSubHeader}>
                    <ListChecks size={16} className={s.sectionHeaderIcon} />
                    Responsibilities
                  </h4>

                  <ul className={s.listContainer}>
                    {(editingJob?.responsibilities || []).map((resp, idx) => (
                      <li key={idx} className={s.listItem}>
                        <span className={s.listItemBullet}>•</span>
                        <span className={s.listItemText}>{resp}</span>
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem("responsibilities", idx)
                          }
                          className={s.listItemRemoveBtn}
                          aria-label={`Remove responsibility ${idx + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className={s.addItemContainer}>
                    <input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("responsibilities", newResponsibility);
                          setNewResponsibility("");
                        }
                      }}
                      className={s.addItemInput}
                      placeholder="Add a responsibility"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem("responsibilities", newResponsibility);
                        setNewResponsibility("");
                      }}
                      className={s.addItemBtn}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Criteria (responsive, wraps to new lines, no scroll) */}
                <div className={`${s.sectionContainer} overflow-visible`}>
                  <h4 className={s.sectionSubHeader}>
                    <ListChecks size={16} className={s.sectionHeaderIcon} />
                    Criteria
                  </h4>

                  <ul className={s.listContainer}>
                    {(editingJob?.criteria || []).map((crit, idx) => (
                      <li key={idx} className={s.listItem}>
                        <span className={s.listItemBullet}>•</span>

                        <span
                          className="flex-1 min-w-0 wrap-break-word break-all whitespace-normal"
                          aria-label={`Criterion ${idx + 1}`}
                        >
                          {crit}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeArrayItem("criteria", idx)}
                          className={s.listItemRemoveBtn}
                          aria-label={`Remove criterion ${idx + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className={s.addItemContainer}>
                    <input
                      type="text"
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("criteria", newCriterion);
                          setNewCriterion("");
                        }
                      }}
                      className={s.addItemInput}
                      placeholder="Add a criterion"
                      aria-label="Add criterion"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addArrayItem("criteria", newCriterion);
                        setNewCriterion("");
                      }}
                      className={s.addItemBtn}
                      aria-label="Add criterion"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Education & Misc (unchanged) */}
              <div className={s.sectionContainer}>
                <h4 className={s.sectionHeader}>
                  <GraduationCap size={16} className={s.sectionHeaderIcon} />
                  Education & Additional Info
                </h4>

                <div className={s.formGrid2}>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      Education
                    </label>

                    <ul className={s.listContainer}>
                      {(editingJob?.education || []).map((edu, idx) => (
                        <li key={idx} className={s.listItem}>
                          <span className={s.listItemBullet}>•</span>
                          <span className={s.listItemText}>{edu}</span>
                          <button
                            type="button"
                            onClick={() => removeArrayItem("education", idx)}
                            className={s.listItemRemoveBtn}
                            aria-label={`Remove education ${idx + 1}`}
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className={s.addItemContainer}>
                      <input
                        type="text"
                        value={newEducation}
                        onChange={(e) => setNewEducation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addArrayItem("education", newEducation);
                            setNewEducation("");
                          }
                        }}
                        className={s.addItemInput}
                        placeholder="Add education"
                        aria-label="Add education"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          addArrayItem("education", newEducation);
                          setNewEducation("");
                        }}
                        className={s.addItemBtn}
                        aria-label="Add education"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <Field
                      label="Openings"
                      icon={<Users size={14} className="text-slate-400" />}
                    >
                      <input
                        type="number"
                        min="1"
                        value={editingJob?.openings ?? 1}
                        onChange={(e) =>
                          handleFieldChange("openings", Number(e.target.value))
                        }
                        className="w-full min-w-0 rounded-md bg-white border-none outline-none px-2 py-2"
                        aria-label="Openings"
                      />
                    </Field>

                    <Field
                      label="Post Date (Cannot be changed)"
                      icon={<Calendar size={14} className="text-slate-400" />}
                    >
                      <input
                        type="date"
                        value={editingJob?.postDate ?? ""}
                        onChange={(e) =>
                          handleFieldChange("postDate", e.target.value)
                        }
                        className="w-full min-w-0 rounded-md bg-white border-none outline-none px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Post date"
                        disabled
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* footer actions */}
            <div className={s.modalFooter}>
              <button
                type="button"
                onClick={closeModal}
                className={s.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className={`${s.modalSaveBtn} ${isUpdating ? s.modalSaveBtnDisabled : ""}`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={s.toastContainer}>
          <div
            className={`${s.toastContent} ${
              toast.type === "success" ? s.toastSuccess : s.toastError
            }`}
          >
            {toast.type === "success" ? (
              <Check size={18} className={s.toastIconSuccess} />
            ) : (
              <AlertCircle size={18} className={s.toastIconError} />
            )}
            <span className={s.toastText}>{toast.text}</span>
          </div>
        </div>
      )}

      <style>{s.animations}</style>
    </div>
  );
}
