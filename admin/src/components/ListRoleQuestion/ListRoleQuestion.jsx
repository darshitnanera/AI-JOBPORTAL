import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { listRoleQuestionStyles as s } from "../../assets/dummyStyles";

/* -------------------- Utilities for CSV Parsing -------------------- */
function parseCSV(text) {
  if (!text) return [];
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let insideQuotes = false;
  let cur = "";
  let line = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && !insideQuotes) {
      insideQuotes = true;
      continue;
    }
    if (ch === '"' && insideQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"' && insideQuotes) {
      insideQuotes = false;
      continue;
    }
    if (ch === "," && !insideQuotes) {
      line.push(cur);
      cur = "";
      continue;
    }
    if (ch === "\n" && !insideQuotes) {
      line.push(cur);
      rows.push(line.slice());
      line = [];
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur !== "" || line.length > 0) {
    line.push(cur);
    rows.push(line.slice());
  }

  const nonEmpty = rows.filter((r) =>
    r.some((c) => (c || "").toString().trim() !== ""),
  );
  if (nonEmpty.length === 0) return [];

  const headersRaw = nonEmpty[0].map((h) => (h || "").toString().trim());
  const headers = headersRaw.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const data = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const row = nonEmpty[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] != null ? row[idx].toString().trim() : "";
    });
    obj.__rawCells = nonEmpty[i];
    data.push(obj);
  }
  return { headersRaw, headers, data };
}

const splitMulti = (cell) =>
  (cell || "")
    .toString()
    .split(/[\n;\|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

function parseCompanyEntry(entry) {
  if (!entry) return { name: "", date: "" };
  const paren = entry.match(/^(.*?)\s*\(\s*([^)]+)\s*\)\s*$/);
  if (paren) return { name: paren[1].trim(), date: paren[2].trim() };
  const hyphen = entry.match(/^(.*?)\s*[-–—]\s*(.+)$/);
  if (hyphen && /\d/.test(hyphen[2]))
    return { name: hyphen[1].trim(), date: hyphen[2].trim() };
  return { name: entry.trim(), date: "" };
}

function uniqueStrings(arr) {
  const s = new Set();
  arr.forEach((x) => {
    if (x && x.toString().trim()) s.add(x.toString().trim());
  });
  return Array.from(s);
}

function uniquePairs(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach((p) => {
    const k = `${(p.name || "").toLowerCase()}||${(p.date || "").toLowerCase()}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ name: p.name || "", date: p.date || "" });
    }
  });
  return out;
}

const findHeaderKey = (headers, variants) => {
  for (const v of variants) {
    const low = v.toLowerCase().replace(/\s+/g, "_");
    const idx = headers.indexOf(low);
    if (idx !== -1) return headers[idx];
  }
  return null;
};

const ListRoleQuestion = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    imageFile: null,
    imagePreview: "",
    roleName: "",
    totalQuestions: "",
    csvFile: null,
    csvFileName: "",
    questionsData: null,
  });
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/interview/roles",
      );
      if (response.data.success) {
        setRoles(response.data.roles);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      addToast("Failed to fetch roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      toasts.forEach((toast) => {
        if (toast.imagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(toast.imagePreview);
        }
      });
    };
  }, [toasts]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleEditStart = (role) => {
    setEditingId(role._id);
    setEditFormData({
      imageFile: null,
      imagePreview: role.image,
      roleName: role.roleName,
      totalQuestions: role.questionsCount,
      csvFile: null,
      csvFileName: role.csvFileName || "",
      questionsData: null,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
      }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData((prev) => ({
        ...prev,
        csvFile: file,
        csvFileName: file.name,
      }));

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const { headers, data } = parseCSV(ev.target.result);
          if (!data || data.length === 0) return;

          const qKey = findHeaderKey(headers, ["question", "q", "prompt"]);
          const aKey = findHeaderKey(headers, ["answer", "ans", "response"]);
          const kpKey = findHeaderKey(headers, [
            "keypoints",
            "key_points",
            "key_point",
          ]);
          const companyKey = findHeaderKey(headers, [
            "company",
            "companies",
            "employer",
          ]);
          const dateKey = findHeaderKey(headers, [
            "date",
            "asked_date",
            "post_date",
          ]);

          const map = new Map();
          data.forEach((rowObj) => {
            const rawQuestion =
              (qKey && rowObj[qKey]) || Object.values(rowObj)[0] || "";
            const question = (rawQuestion || "").toString().trim();
            if (!question) return;

            const answer = (aKey && rowObj[aKey]) || "";
            const keypointsCell = (kpKey && rowObj[kpKey]) || "";
            const companyCell = (companyKey && rowObj[companyKey]) || "";
            const dateCell = (dateKey && rowObj[dateKey]) || "";

            const keypoints = uniqueStrings(splitMulti(keypointsCell));
            let pairs = [];
            const compEntries = splitMulti(companyCell);
            const dateEntries = splitMulti(dateCell);

            if (compEntries.length > 0) {
              const max = Math.max(compEntries.length, dateEntries.length);
              for (let i = 0; i < max; i++) {
                const comp = compEntries[i]
                  ? parseCompanyEntry(compEntries[i]).name
                  : "N/A";
                const dt = dateEntries[i] || dateEntries[0] || "";
                pairs.push({ name: comp, date: dt });
              }
            }

            const key = question.toLowerCase();
            if (!map.has(key)) {
              map.set(key, {
                question,
                answer: answer.toString().trim(),
                keyPoints: keypoints,
                companies: pairs,
              });
            } else {
              const ex = map.get(key);
              ex.keyPoints = uniqueStrings([...ex.keyPoints, ...keypoints]);
              ex.companies = uniquePairs([...ex.companies, ...pairs]);
              map.set(key, ex);
            }
          });

          setEditFormData((prev) => ({
            ...prev,
            questionsData: Array.from(map.values()),
          }));
        } catch (err) {
          console.error("CSV parse error on edit:", err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEditSave = async (id) => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("roleName", editFormData.roleName);
      formData.append("questionsCount", editFormData.totalQuestions);
      formData.append("csvFileName", editFormData.csvFileName);

      if (editFormData.imageFile) {
        formData.append("imageFile", editFormData.imageFile);
      }

      if (editFormData.csvFile) {
        formData.append("csvFile", editFormData.csvFile);
      }

      if (editFormData.questionsData) {
        formData.append(
          "questionsData",
          JSON.stringify(editFormData.questionsData),
        );
      }

      const response = await axios.put(
        `http://localhost:5000/api/interview/role/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setRoles((prev) =>
          prev.map((role) => (role._id === id ? response.data.role : role)),
        );
        addToast("Role updated successfully!", "success");
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error updating role:", err);
      addToast(err.response?.data?.message || "Failed to update role", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditCancel = () => {
    if (editFormData.imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(editFormData.imagePreview);
    }
    setEditingId(null);
    setEditFormData({
      imageFile: null,
      imagePreview: "",
      roleName: "",
      totalQuestions: "",
      csvFile: "",
    });
  };

  const handleDeleteClick = (id) => {
    setDeleteRoleId(id);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/interview/role/${deleteRoleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setRoles((prev) => prev.filter((role) => role._id !== deleteRoleId));
        setDeleteRoleId(null);
        addToast("Role deleted successfully!", "success");
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      addToast(err.response?.data?.message || "Failed to delete role", "error");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteRoleId(null);
  };

  return (
    <div className={s.pageContainer}>
      {/* Top-right Toast Container */}
      <div className={s.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${s.baseToast} ${
              toast.type === "success" ? s.toastSuccess : s.toastInfo
            }`}
          >
            {toast.type === "success" && <CheckCircle size={18} />}
            <span className={s.toastMessage}>{toast.message}</span>
          </div>
        ))}

        {deleteRoleId !== null && (
          <div className={s.confirmToastContainer}>
            <div className={s.confirmIconWrapper}>
              <AlertTriangle className={s.confirmIcon} />
            </div>
            <div className={s.confirmContent}>
              <p className={s.confirmTitle}>
                Are you sure you want to delete this role?
              </p>
              <p className={s.confirmSubtitle}>This action cannot be undone.</p>
            </div>
            <div className={s.confirmActions}>
              <button onClick={handleDeleteCancel} className={s.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={s.deleteConfirmBtn}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <h1 className={s.title}>Role Questions</h1>

      <div className={s.grid}>
        {loading ? (
          <div className={s.loadingContainer}>
            <Loader2 className={s.spinner} />
          </div>
        ) : roles.length === 0 ? (
          <div className={s.emptyContainer}>
            <p className={s.emptyText}>No role questions found.</p>
          </div>
        ) : (
          roles.map((role, index) => (
            <div
              key={role._id}
              className={`${s.cardBase} ${
                editingId === role._id ? s.cardEditingBorder : s.cardHoverBorder
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {editingId === role._id ? (
                // Edit Mode
                <div className={s.editContainer}>
                  <div className={s.imageRow}>
                    <div className={s.imagePreviewCircle}>
                      {editFormData.imagePreview ? (
                        <img
                          src={editFormData.imagePreview}
                          alt="Preview"
                          className={s.imagePreviewImg}
                        />
                      ) : (
                        <ImageIcon className={s.imageIcon} />
                      )}
                    </div>
                    <label className={s.browseLabel}>
                      Browse Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={s.fileInputHidden}
                      />
                    </label>
                  </div>

                  <div>
                    <label className={s.formLabel}>Role Name</label>
                    <input
                      type="text"
                      name="roleName"
                      value={editFormData.roleName}
                      onChange={handleEditChange}
                      className={s.formInput}
                    />
                  </div>

                  <div>
                    <label className={s.formLabel}>Total Questions</label>
                    <input
                      type="text"
                      name="totalQuestions"
                      value={editFormData.totalQuestions}
                      onChange={handleEditChange}
                      placeholder="e.g., 120, 10k+, 3.5k"
                      className={s.formInput}
                    />
                  </div>

                  <div>
                    <label className={s.formLabel}>CSV File</label>
                    <div className={s.csvRow}>
                      <span className={s.csvDisplaySpan}>
                        {editFormData.csvFileName || "No file chosen"}
                      </span>
                      <label className={s.csvBrowseLabel}>
                        Browse
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvChange}
                          className={s.fileInputHidden}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={s.editActions}>
                    <button
                      onClick={handleEditCancel}
                      className={s.cancelButton}
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleEditSave(role._id)}
                      disabled={saveLoading}
                      className={s.saveButton}
                    >
                      {saveLoading ? (
                        <Loader2 size={14} className={s.saveSpinner} />
                      ) : (
                        <Save size={14} />
                      )}
                      <span>{saveLoading ? "Saving" : "Save"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className={s.viewContainer}>
                  <div className={s.viewHeader}>
                    <div className={s.viewImageCircle}>
                      {role.image ? (
                        <img
                          src={role.image}
                          alt={role.roleName}
                          className={s.viewImage}
                        />
                      ) : (
                        <ImageIcon className={s.imageIcon} />
                      )}
                    </div>
                    <div className={s.viewContent}>
                      <h3 className={s.viewRoleName}>{role.roleName}</h3>
                      <p className={s.viewQuestionsCount}>
                        <span className={s.greenDot}></span>
                        {role.questionsCount} questions
                      </p>
                    </div>
                  </div>

                  <div className={s.csvInfoRow}>
                    <FileText size={14} className="text-gray-400 shrink-0" />
                    {role.csvFileUrl ? (
                      <a
                        href={role.csvFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.csvLink}
                        title="Download CSV"
                      >
                        {role.csvFileName || "Download CSV"}
                      </a>
                    ) : (
                      <span className={s.csvNoLink}>
                        {role.csvFileName || "No CSV"}
                      </span>
                    )}
                  </div>

                  <div className={s.actionButtons}>
                    <button
                      onClick={() => handleEditStart(role)}
                      className={s.editButton}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(role._id)}
                      className={s.deleteButton}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListRoleQuestion;
