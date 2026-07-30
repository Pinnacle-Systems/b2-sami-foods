import { useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useGetProductCategoriesQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation,
} from "../../redux/services/productCategoryApi";

/* ── helpers ── */
const EMPTY_FORM = {
  name: "",
  description: "",
  productCategoryImage: "",
};

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "Category name is required";
  return errs;
}

const PAGE_SIZE = 10;

/* ── ImageUpload component ── */
function ImageUpload({ label, value, onChange }) {
  const ref = useRef();

  // Resolve preview url
  const previewUrl = (() => {
    if (!value) return "";
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === "string") {
      if (
        value.startsWith("data:") ||
        value.startsWith("http:") ||
        value.startsWith("https:")
      ) {
        return value;
      }
      return `/${value}`; // resolves through Vite proxy
    }
    return "";
  })();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div className="pcm-img-upload-wrap">
      <span className="pcm-label">{label}</span>
      <div className="pcm-img-upload-box" onClick={() => ref.current?.click()}>
        {previewUrl ? (
          <div className="pcm-img-preview-wrap">
            <img src={previewUrl} alt="preview" className="pcm-img-preview" />
            <button
              type="button"
              className="pcm-img-remove"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="pcm-img-placeholder">
            <ImagePlus size={22} className="pcm-img-placeholder-icon" />
            <span>Click to upload</span>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/* ════════════════════════════════════════
   Main Page
   ════════════════════════════════════════ */
export default function ProductCategoryMaster() {
  /* ── RTK Query hooks ── */
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProductCategoriesQuery();

  const [createCategory, { isLoading: isCreating }] =
    useCreateProductCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateProductCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteProductCategoryMutation();

  /* ── local UI state ── */
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [apiError, setApiError] = useState("");

  /* ── filtered / paged rows ── */
  const filtered = categories.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── form handlers ── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError("");
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      description: row.description || "",
      productCategoryImage: row.productCategoryImage || "",
    });
    setErrors({});
    setApiError("");
    setEditId(row.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setErrors({});
    setApiError("");
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", (form.description || "").trim());

    if (form.productCategoryImage instanceof File) {
      formData.append("productCategoryImage", form.productCategoryImage);
    } else {
      formData.append("productCategoryImage", form.productCategoryImage || "");
    }

    try {
      if (editId !== null) {
        await updateCategory({ id: editId, body: formData }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Updated Successfully",
          text: `Category "${form.name}" has been updated successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createCategory(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Created Successfully",
          text: `Category "${form.name}" has been created successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
        setPage(1);
      }
      closeForm();
    } catch (err) {
      const actionText = editId !== null ? "update" : "create";
      setApiError(
        err?.data?.message || "Something went wrong. Please try again.",
      );
      Swal.fire({
        icon: "error",
        title: "Failed to Save",
        text: err?.data?.message || `Failed to ${actionText} category.`,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteId).unwrap();
      Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        text: "Category has been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      setDeleteId(null);
      if (paged.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      setDeleteId(null);
      setApiError(err?.data?.message || "Failed to delete category.");
      Swal.fire({
        icon: "error",
        title: "Failed to Delete",
        text: err?.data?.message || "Failed to delete category.",
      });
    }
  };

  const isSaving = isCreating || isUpdating;

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="pcm-loading-state">
        <Loader2 size={32} className="pcm-spinner" />
        <p>Loading categories…</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="pcm-error-state">
        <AlertCircle size={32} className="pcm-error-icon" />
        <p>{error?.data?.message || "Failed to load categories"}</p>
        <button className="pcm-add-btn" onClick={refetch}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pcm-root">
      {/* ── Header ── */}
      <div className="pcm-header">
        <div className="pcm-header-left">
          <div className="pcm-header-icon">
            <Tag size={20} />
          </div>
          <div>
            <h2 className="pcm-title">Product Category Master</h2>
            <p className="pcm-subtitle">Manage product categories</p>
          </div>
        </div>
        <button className="pcm-add-btn" onClick={openAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* ── API error banner ── */}
      {apiError && (
        <div className="pcm-api-error">
          <AlertCircle size={15} />
          <span>{apiError}</span>
          <button onClick={() => setApiError("")}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="pcm-search-row">
        <div className="pcm-search-wrap">
          <Search size={15} className="pcm-search-icon" />
          <input
            className="pcm-search-input"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button className="pcm-search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
        <span className="pcm-count">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Add / Edit Form Panel ── */}
      {showForm && (
        <div className="pcm-modal-overlay">
          <div className="pcm-form-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="pcm-form-panel-header">
              <span className="pcm-form-panel-title">
                {editId !== null ? "Edit Category" : "Add New Category"}
              </span>
              <button className="pcm-form-close" onClick={closeForm}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pcm-form" noValidate>
              <div className="pcm-form-grid">
                {/* Left Column: Name & Description */}
                <div className="pcm-form-col">
                  {/* Name */}
                  <div className="pcm-field ">
                    <label htmlFor="pcm-name" className="pcm-label">
                      Category Name <span className="pcm-required">*</span>
                    </label>
                    <input
                      id="pcm-name"
                      name="name"
                      className={`w-80 pcm-input ${errors.name ? "pcm-input-err" : ""}`}
                      placeholder="e.g. Spices & Masalas"
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <span className="pcm-err-msg">{errors.name}</span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="pcm-field">
                    <label htmlFor="pcm-desc" className="pcm-label">
                      Description
                    </label>
                    <textarea
                      id="pcm-desc"
                      name="description"
                      rows={4}
                      className="pcm-input pcm-textarea"
                      placeholder="Brief description of this category…"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Right Column: Banner / Cover Image */}
                <div className="pcm-form-col">
                  <ImageUpload
                    label="Banner / Cover Image"
                    value={form.productCategoryImage}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, productCategoryImage: v }))
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pcm-form-actions">
                <button
                  type="button"
                  className="pcm-btn-cancel"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  className="pcm-btn-reset"
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setErrors({});
                    setApiError("");
                  }}
                  disabled={isSaving}
                >
                  <RefreshCw size={14} /> Reset
                </button>
                <button
                  type="submit"
                  className="pcm-btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="pcm-btn-spinner" />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSaving
                    ? editId !== null
                      ? "Updating…"
                      : "Saving…"
                    : editId !== null
                      ? "Update"
                      : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="pcm-table-wrap ">
        {paged.length === 0 ? (
          <div className="pcm-empty">
            <Tag size={40} className="pcm-empty-icon" />
            <p>
              {search
                ? "No categories match your search."
                : "No categories added yet."}
            </p>
            {!search && (
              <button className="pcm-add-btn mt-4" onClick={openAdd}>
                <Plus size={15} /> Add First Category
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="pcm-table w-full min-w-[600px] rounded-lg bg-transparent">
            <thead>
              <tr>
                <th className="pcm-th pcm-th-num w-6">#</th>
                <th className="pcm-th w-32">Category Name</th>
                <th className="pcm-th w-64">Description</th>
                <th className="pcm-th pcm-th-actions w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged?.map((row, idx) => (
                <tr key={row.id} className="pcm-tr">
                  <td className="pcm-td pcm-td-num border-r border-gray-300">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="pcm-td pcm-td-name border-r border-gray-300">
                    {row?.name}
                  </td>
                  <td className="pcm-td pcm-td-name border-r border-gray-300">
                    {row?.description || <span className="pcm-no-data">—</span>}
                  </td>
                  <td className="pcm-td pcm-td-actions flex justify-center">
                    <button
                      className="pcm-action-btn pcm-edit-btn"
                      onClick={() => openEdit(row)}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="pcm-action-btn pcm-delete-btn"
                      onClick={() => setDeleteId(row.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pcm-pagination">
          <button
            className="pcm-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pcm-page-btn ${p === page ? "pcm-page-active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="pcm-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId !== null && (
        <div className="pcm-modal-overlay">
          <div className="pcm-modal">
            <div className="pcm-modal-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="pcm-modal-title">Delete Category?</h3>
            <p className="pcm-modal-text">
              This will permanently remove{" "}
              <strong>
                "{categories.find((r) => r.id === deleteId)?.name}"
              </strong>
              . This action cannot be undone.
            </p>
            <div className="pcm-modal-actions">
              <button
                className="pcm-btn-cancel"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="pcm-btn-delete-confirm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={14} className="pcm-btn-spinner" />
                ) : null}
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
