import { useState } from "react";
import Swal from "sweetalert2";
import {
  Scale,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import {
  useGetUomsQuery,
  useCreateUomMutation,
  useUpdateUomMutation,
  useDeleteUomMutation,
} from "../../redux/services/uomApi";

/* ── helpers ── */
const EMPTY_FORM = {
  name: "",
  shortCode: "",
  status: true,
};

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "UOM Name is required";
  if (!form.shortCode.trim()) errs.shortCode = "Short Code is required";
  return errs;
}

const PAGE_SIZE = 10;

export default function UomMaster() {
  /* ── RTK Query hooks ── */
  const {
    data: uoms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUomsQuery();

  const [createUom, { isLoading: isCreating }] = useCreateUomMutation();
  const [updateUom, { isLoading: isUpdating }] = useUpdateUomMutation();
  const [deleteUom, { isLoading: isDeleting }] = useDeleteUomMutation();

  /* ── local UI state ── */
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  /* ── filtered / paged rows ── */
  const filtered = uoms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      (r.status ? "active" : "inactive").includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── form handlers ── */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      shortCode: row.shortCode,
      status: row.status,
    });
    setErrors({});
    setEditId(row.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      if (editId !== null) {
        // Update UOM
        await updateUom({
          id: editId,
          body: {
            name: form.name.trim(),
            shortCode: form.shortCode.trim(),
            status: form.status,
          },
        }).unwrap();

        Swal.fire({
          icon: "success",
          title: "Updated Successfully",
          text: `UOM "${form.name}" has been updated successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Create UOM
        await createUom({
          name: form.name.trim(),
          shortCode: form.shortCode.trim(),
          status: form.status,
        }).unwrap();

        Swal.fire({
          icon: "success",
          title: "Created Successfully",
          text: `UOM "${form.name}" has been created successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
        setPage(1);
      }
      closeForm();
    } catch (err) {
      const actionText = editId !== null ? "update" : "create";
      Swal.fire({
        icon: "error",
        title: "Failed to Save",
        text: err?.data?.message || `Failed to ${actionText} UOM.`,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUom(deleteId).unwrap();
      Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        text: "UOM has been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      setDeleteId(null);
      if (paged.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      setDeleteId(null);
      Swal.fire({
        icon: "error",
        title: "Failed to Delete",
        text: err?.data?.message || "Failed to delete UOM.",
      });
    }
  };

  const toggleStatus = async (row) => {
    try {
      const nextStatus = !row.status;
      await updateUom({
        id: row.id,
        body: { status: nextStatus },
      }).unwrap();

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `UOM status set to ${nextStatus ? "Active" : "Inactive"}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Update Status",
        text: err?.data?.message || "Failed to update UOM status.",
      });
    }
  };

  const isSaving = isCreating || isUpdating;

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="pcm-loading-state">
        <Loader2 size={32} className="pcm-spinner animate-spin" />
        <p>Loading UOMs…</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="pcm-error-state">
        <AlertCircle size={32} className="pcm-error-icon" />
        <p>{error?.data?.message || "Failed to load UOMs"}</p>
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
            <Scale size={20} />
          </div>
          <div>
            <h2 className="pcm-title">UOM Master</h2>
            <p className="pcm-subtitle">Manage Units of Measure</p>
          </div>
        </div>
        <button className="pcm-add-btn" onClick={openAdd}>
          <Plus size={16} /> Add UOM
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="pcm-search-row max-w-4xl">
        <div className="pcm-search-wrap">
          <Search size={15} className="pcm-search-icon" />
          <input
            className="pcm-search-input"
            placeholder="Search UOMs…"
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
          <div className="pcm-form-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="pcm-form-panel-header">
              <span className="pcm-form-panel-title">
                {editId !== null ? "Edit UOM" : "Add New UOM"}
              </span>
              <button className="pcm-form-close" onClick={closeForm} disabled={isSaving}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pcm-form" noValidate>
              <div className="flex flex-col md:flex-row gap-6 mb-2">
                {/* UOM Name */}
                <div className="pcm-field flex-[2] min-w-0">
                  <label htmlFor="pcm-name" className="pcm-label">
                    UOM Name <span className="pcm-required">*</span>
                  </label>
                  <input
                    id="pcm-name"
                    name="name"
                    className={`w-full pcm-input ${errors.name ? "pcm-input-err" : ""}`}
                    placeholder="e.g. Kilogram"
                    value={form.name}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  {errors.name && (
                    <span className="pcm-err-msg">{errors.name}</span>
                  )}
                </div>

                {/* Short Code */}
                <div className="pcm-field flex-[1] min-w-0">
                  <label htmlFor="pcm-shortCode" className="pcm-label">
                    Short Code <span className="pcm-required">*</span>
                  </label>
                  <input
                    id="pcm-shortCode"
                    name="shortCode"
                    className={`w-full pcm-input ${errors.shortCode ? "pcm-input-err" : ""}`}
                    placeholder="e.g. kg"
                    value={form.shortCode}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  {errors.shortCode && (
                    <span className="pcm-err-msg">{errors.shortCode}</span>
                  )}
                </div>

                {/* Status Toggle Toggler */}
                <div className="pcm-field flex-[1] min-w-0">
                  <span className="pcm-label block mb-1">Status</span>
                  <label className="pm-toggle-label cursor-pointer flex items-center h-10 select-none">
                    <input
                      type="checkbox"
                      name="status"
                      checked={form.status}
                      onChange={handleChange}
                      className="hidden"
                      disabled={isSaving}
                    />
                    <div
                      className={`pm-toggle-track ${form.status ? "pm-toggle-on" : ""
                        }`}
                    >
                      <div className="pm-toggle-thumb" />
                    </div>
                    <span className="pm-toggle-text font-semibold ml-2">
                      {form.status ? "Active" : "Inactive"}
                    </span>
                  </label>
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
                    <Loader2 size={14} className="pcm-btn-spinner animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSaving
                    ? editId !== null
                      ? "Updating…"
                      : "Saving…"
                    : editId !== null
                      ? "Update"
                      : "Save UOM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="pcm-table-wrap max-w-4xl">
        {paged.length === 0 ? (
          <div className="pcm-empty">
            <Scale size={40} className="pcm-empty-icon" />
            <p>
              {search
                ? "No UOMs match your search."
                : "No UOMs added yet."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="pcm-table w-full min-w-[600px] rounded-lg bg-transparent">
            <thead>
              <tr>
                <th className="pcm-th pcm-th-num w-12">#</th>
                <th className="pcm-th text-left pl-6">UOM Name</th>
                <th className="pcm-th w-32 text-left pl-6">Short Code</th>
                <th className="pcm-th w-36 text-center">Status</th>
                <th className="pcm-th pcm-th-actions w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, idx) => (
                <tr key={row.id} className="pcm-tr">
                  <td className="pcm-td pcm-td-num border-r border-gray-300">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="pcm-td pcm-td-name border-r border-gray-300 pl-6">
                    {row.name}
                  </td>
                  <td className="pcm-td pcm-td-name border-r border-gray-300 pl-6">
                    {row.shortCode}
                  </td>
                  <td className="pcm-td border-r border-gray-300 text-center">
                    <button
                      className={`pm-status-badge ${row.status ? "pm-status-active" : "pm-status-inactive"
                        }`}
                      onClick={() => toggleStatus(row)}
                      title="Click to toggle status"
                      disabled={isUpdating}
                    >
                      {row.status ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                      {row.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="pcm-td pcm-td-actions flex justify-center gap-2">
                    <button
                      className="pcm-action-btn pcm-edit-btn"
                      onClick={() => openEdit(row)}
                      title="Edit"
                      disabled={isSaving}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="pcm-action-btn pcm-delete-btn"
                      onClick={() => setDeleteId(row.id)}
                      title="Delete"
                      disabled={isDeleting}
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
        <div className="pcm-pagination max-w-4xl justify-center mt-4">
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
        <div className="pcm-modal-overlay animate-fade-in">
          <div className="pcm-modal animate-auth-card-in">
            <div className="pcm-modal-icon">
              <Trash2 size={24} className="text-destructive animate-pulse" />
            </div>
            <h3 className="pcm-modal-title">Delete UOM?</h3>
            <p className="pcm-modal-text text-sm mb-6">
              This will permanently remove{" "}
              <strong>
                "{uoms.find((r) => r.id === deleteId)?.name}"
              </strong>
              . This action cannot be undone.
            </p>
            <div className="pcm-modal-actions flex justify-end gap-3">
              <button
                className="pcm-btn-cancel px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-all"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-destructive text-white hover:bg-destructive/90 text-destructive-foreground rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={14} className="pcm-btn-spinner animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
