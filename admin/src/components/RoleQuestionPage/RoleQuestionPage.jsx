// src/pages/RoleQuestionPage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Briefcase,
  Hash,
  Calendar,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { roleQuestionPageStyles as s } from "../../assets/dummyStyles";

/* -------------------- Utilities (unchanged) -------------------- */
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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB");
}

/* -------------------- Toast with animation -------------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === "success"
      ? "bg-green-50 border-green-500"
      : "bg-red-50 border-red-500";
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 border-l-4 rounded-lg shadow-lg ${bg} animate-fadeInUp`}
    >
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className="text-gray-700">{message}</span>
    </div>
  );
};

/* -------------------- Main Component -------------------- */
const RoleQuestionPage = () => {
  const [roleName, setRoleName] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const clearToast = useCallback(() => setToast(null), []);

  const validateFields = () => {
    if (!roleName.trim()) {
      setToast({ message: "Role name is required", type: "error" });
      return false;
    }
    if (!totalQuestions.trim()) {
      setToast({ message: "Total questions is required", type: "error" });
      return false;
    }
    if (!imagePreview) {
      setToast({ message: "Please upload an image", type: "error" });
      return false;
    }
    if (questions.length === 0) {
      setToast({
        message: "Please upload a CSV with questions",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleAddRoleQuestion = async () => {
    if (!validateFields()) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append("roleName", roleName);
      formDataToSend.append("questionsCount", totalQuestions);
      if (csvFile) {
        formDataToSend.append("csvFile", csvFile);
        formDataToSend.append("csvFileName", csvFile.name);
      }

      const imageFile = imageInputRef.current?.files?.[0];
      if (imageFile) {
        formDataToSend.append("imageFile", imageFile);
      }

      formDataToSend.append("questionsData", JSON.stringify(questions));

      const response = await axios.post(
        "http://localhost:5000/api/interview/role",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setToast({
          message: "Role question added successfully",
          type: "success",
        });
        setRoleName("");
        setTotalQuestions("");
        setImagePreview("");
        setCsvFile(null);
        setQuestions([]);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (csvInputRef.current) csvInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error adding role questions:", err);
      setToast({
        message: err.response?.data?.message || "Failed to add role question",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f && f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => setImagePreview(r.result);
      r.readAsDataURL(f);
    } else {
      setToast({ message: "Please upload a valid image file", type: "error" });
    }
  };

  const findHeaderKey = (headers, variants) => {
    for (const v of variants) {
      const low = v.toLowerCase().replace(/\s+/g, "_");
      const idx = headers.indexOf(low);
      if (idx !== -1) return headers[idx];
    }
    for (const h of headers) {
      for (const v of variants) {
        if ((h || "").includes(v.toLowerCase().replace(/\s+/g, "_"))) return h;
      }
    }
    return null;
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, data } = parseCSV(ev.target.result);
        if (!data || data.length === 0) {
          setToast({ message: "CSV is empty or malformed", type: "error" });
          setIsUploading(false);
          return;
        }

        const qKey = findHeaderKey(headers, [
          "question",
          "q",
          "prompt",
          "title",
        ]);
        const aKey = findHeaderKey(headers, [
          "answer",
          "ans",
          "response",
          "solution",
        ]);
        const kpKey = findHeaderKey(headers, [
          "keypoints",
          "key_points",
          "key_point",
          "points",
          "highlights",
        ]);
        const companyKey = findHeaderKey(headers, [
          "company",
          "companies",
          "employer",
          "company_name",
        ]);
        const dateKey = findHeaderKey(headers, [
          "date",
          "asked_date",
          "posted",
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

          const parsedFromCompany = compEntries.map((c) =>
            parseCompanyEntry(c),
          );
          const hasParsedDates = parsedFromCompany.some((p) => p.date);

          if (compEntries.length > 0 && hasParsedDates) {
            pairs = parsedFromCompany.map((p) => ({
              name: p.name || "",
              date: p.date || "",
            }));
          } else if (compEntries.length > 0 && dateEntries.length > 0) {
            const max = Math.max(compEntries.length, dateEntries.length);
            for (let i = 0; i < max; i++) {
              const comp = compEntries[i]
                ? parseCompanyEntry(compEntries[i]).name
                : "N/A";
              const dt = dateEntries[i] || dateEntries[0] || "";
              pairs.push({ name: comp, date: dt });
            }
          } else if (compEntries.length > 0) {
            pairs = compEntries.map((c) => {
              const p = parseCompanyEntry(c);
              return { name: p.name || "", date: p.date || "" };
            });
          } else if (dateEntries.length > 0) {
            pairs = dateEntries.map((d) => ({ name: "N/A", date: d }));
          } else {
            pairs = [];
          }

          const key = question.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              question,
              answer: (answer || "").toString().trim(),
              keyPoints: keypoints.slice(),
              companies: pairs.slice(),
            });
          } else {
            const ex = map.get(key);
            if (
              ((answer || "") + "").toString().trim().length >
              (ex.answer || "").toString().trim().length
            ) {
              ex.answer = (answer || "").toString().trim();
            }
            ex.keyPoints = uniqueStrings([...ex.keyPoints, ...keypoints]);
            ex.companies = uniquePairs([...ex.companies, ...pairs]);
            map.set(key, ex);
          }
        });

        const aggregated = Array.from(map.values()).map((item, idx) => ({
          id: idx + 1,
          ...item,
        }));
        aggregated.forEach((it) => {
          it.companies = uniquePairs(it.companies || []);
          it.keyPoints = uniqueStrings(it.keyPoints || []);
        });
        aggregated.sort(
          (a, b) => (b.companies?.length || 0) - (a.companies?.length || 0),
        );

        setQuestions(aggregated);
        setToast({
          message: "Role successfully uploaded",
          type: "success",
        });
      } catch (err) {
        console.error("CSV parse error:", err);
        setToast({
          message: "Failed to parse CSV — check formatting and headers",
          type: "error",
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setToast({ message: "Error reading file", type: "error" });
      setIsUploading(false);
    };

    reader.readAsText(file, "utf-8");
  };

  return (
    <div className={s.pageContainer}>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-animation {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

      <div className={s.contentWrapper}>
        <h1 className={s.title}>Role Interview Questions</h1>

        <div className={s.formGrid}>
          <div className={s.formColumn}>
            <div className={s.card}>
              <label className={s.cardLabel}>
                <Briefcase className={s.labelIcon} /> Role Name{" "}
                <span className={s.requiredStar}>*</span>
              </label>
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className={s.inputField}
              />
            </div>

            <div className={s.card}>
              <label className={s.cardLabel}>
                <Hash className={s.labelIcon} /> Total Questions{" "}
                <span className={s.requiredStar}>*</span>
              </label>
              <input
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                placeholder="e.g. 10k+, 500+"
                className={s.inputField}
              />
            </div>

            <div className={s.card}>
              <label className={s.cardLabel}>
                <ImageIcon className={s.labelIcon} /> Upload Image{" "}
                <span className={s.requiredStar}>*</span>
              </label>
              <div
                onClick={() => imageInputRef.current.click()}
                className={s.dropzone}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={s.previewImage}
                  />
                ) : (
                  <>
                    <Upload className={s.uploadIcon} />
                    <p className={s.uploadText}>Click to upload an image</p>
                  </>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={s.fileInputHidden}
                />
              </div>
            </div>
          </div>

          <div className={s.formColumn}>
            <div className={s.card}>
              <label className={s.cardLabel}>
                <FileText className={s.labelIcon} /> Upload CSV{" "}
                <span className={s.requiredStar}>*</span>
              </label>
              <div
                onClick={() => csvInputRef.current.click()}
                className={s.dropzone}
              >
                {csvFile ? (
                  <div className={s.csvSuccess}>
                    <CheckCircle className="w-5 h-5" />
                    {csvFile.name}
                  </div>
                ) : (
                  <>
                    <Upload className={s.uploadIcon} />
                    <p className={s.uploadHint}>
                      Click to upload CSV (headers: question, answer, keyPoints,
                      company, date). Use ; or | inside a cell for multiple
                      values. Company may include date: `Google (2021-03-10)`.
                    </p>
                  </>
                )}
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className={s.fileInputHidden}
                />
              </div>
              {isUploading && (
                <div className={s.spinnerContainer}>
                  <div className={s.spinner}></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={s.buttonContainer}>
          <button
            onClick={handleAddRoleQuestion}
            disabled={isUploading}
            className={`${s.addButton} ${isUploading ? s.addButtonDisabled : ""}`}
          >
            {isUploading ? (
              <>
                <Loader2 className={s.buttonSpinner} />
                Adding...
              </>
            ) : (
              "Add Role Question"
            )}
          </button>
        </div>

        {questions.length > 0 && (
          <div className={s.questionsSection}>
            <h2 className={s.sectionTitle}>
              Loaded Questions ({questions.length})
            </h2>

            <div className={s.questionsGrid}>
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`${s.cardAnimation} ${s.questionCard}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={s.cardTopLine}></div>
                  <div className={s.questionNumberBadge}>#{q.id}</div>

                  <div className={s.questionTextContainer}>
                    <p className={s.questionText}>{q.question}</p>
                  </div>

                  <div className={s.answerContainer}>{q.answer}</div>

                  {(q.keyPoints || []).length > 0 && (
                    <div className={s.keyPointsContainer}>
                      {(q.keyPoints || []).map((kp, i) => (
                        <span key={i} className={s.keyPointBadge}>
                          {kp}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={s.companiesLabel}>
                    <Briefcase className="w-3.5 h-3.5" /> Asked in
                  </div>
                  <div className={s.companiesContainer}>
                    {(q.companies || []).length > 0 ? (
                      (q.companies || []).map((c, i) => (
                        <div key={i} className={s.companyBadge}>
                          <Briefcase className={s.companyIcon} />
                          <span className={s.companyName}>{c.name}</span>
                          {c.date && (
                            <>
                              <span className={s.separator}>·</span>
                              <Calendar className={s.calendarIcon} />
                              <span className={s.dateText}>
                                {formatDate(c.date)}
                              </span>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className={s.noDataText}>No company data</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={clearToast}
          />
        )}
      </div>
    </div>
  );
};

export default RoleQuestionPage;
