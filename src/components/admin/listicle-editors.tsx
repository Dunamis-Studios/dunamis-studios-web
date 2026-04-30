"use client";

import * as React from "react";
import type {
  PostFaqItem,
  PostComparisonTable,
  PostComparisonRow,
} from "@/lib/content";
import {
  PRODUCT_CATALOG_SLUGS,
  PRODUCT_META,
  type ProductCatalogSlug,
} from "@/lib/types";

/**
 * Three optional structured-content editors that appear below the
 * TipTap article body. Each editor is collapsible, defaults to closed
 * when empty, and writes to the parent form's state via the onChange
 * callback. Backward compatibility is the load-bearing constraint:
 * an article with none of these populated round-trips to Redis as
 * before, and the rendered article surface is identical.
 */

// -----------------------------------------------------------------
// Shared collapsible-section shell. Each listicle field uses one.
// -----------------------------------------------------------------

interface CollapsibleSectionProps {
  label: string;
  summary: string;
  helperText: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  label,
  summary,
  helperText,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
        <span className="flex items-center gap-3">
          <span className="text-xs text-[var(--fg-muted)]">{summary}</span>
          <span
            aria-hidden
            className={`text-xs text-[var(--fg-subtle)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-[var(--border)] p-4">
          <p className="mb-3 text-xs leading-relaxed text-[var(--fg-muted)]">
            {helperText}
          </p>
          {children}
        </div>
      ) : null}
    </div>
  );
}

// Small input/textarea/button styles shared by all three editors.
const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]";
const subtleButtonClass =
  "rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed";
const accentButtonClass =
  "rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] hover:bg-[var(--bg-muted)]";
const dangerButtonClass =
  "rounded-md border border-[var(--color-danger)] px-2 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)]";

// -----------------------------------------------------------------
// FAQ editor: list of Q/A pairs, add/remove/reorder.
// -----------------------------------------------------------------

interface FaqEditorProps {
  value: PostFaqItem[];
  onChange: (next: PostFaqItem[]) => void;
}

export function ListicleFaqEditor({ value, onChange }: FaqEditorProps) {
  const [open, setOpen] = React.useState(value.length > 0);

  function addItem() {
    onChange([...value, { q: "", a: "" }]);
    setOpen(true);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<PostFaqItem>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const summary =
    value.length === 0
      ? "Optional"
      : `${value.length} ${value.length === 1 ? "question" : "questions"}`;

  return (
    <CollapsibleSection
      label="FAQ"
      summary={summary}
      helperText="Optional. Buyer-intent questions and answers. Renders an FAQ section at the bottom of the article and emits FAQPage schema."
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      <div className="space-y-3">
        {value.length === 0 ? (
          <p className="text-xs text-[var(--fg-muted)]">No questions yet.</p>
        ) : (
          value.map((item, i) => (
            <div
              key={i}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Q{i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className={subtleButtonClass}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === value.length - 1}
                    className={subtleButtonClass}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className={dangerButtonClass}
                    aria-label="Remove question"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={item.q}
                onChange={(e) => updateItem(i, { q: e.target.value })}
                placeholder="Question"
                className={inputClass}
              />
              <textarea
                value={item.a}
                onChange={(e) => updateItem(i, { a: e.target.value })}
                placeholder="Answer"
                rows={3}
                className={`${inputClass} mt-2 resize-y`}
              />
            </div>
          ))
        )}
        <button type="button" onClick={addItem} className={accentButtonClass}>
          + Add question
        </button>
      </div>
    </CollapsibleSection>
  );
}

// -----------------------------------------------------------------
// Comparison table editor: N-column structured table.
// -----------------------------------------------------------------

interface ComparisonEditorProps {
  value: PostComparisonTable | null;
  onChange: (next: PostComparisonTable | null) => void;
}

export function ListicleComparisonEditor({
  value,
  onChange,
}: ComparisonEditorProps) {
  const [open, setOpen] = React.useState(
    value !== null && (value.headers.length > 0 || value.rows.length > 0),
  );

  function initialize() {
    onChange({
      headers: ["Capability", "Subject A"],
      rows: [{ dimension: "", cells: [""] }],
    });
    setOpen(true);
  }

  function clear() {
    if (
      window.confirm(
        "Remove the comparison table entirely? This cannot be undone from the editor.",
      )
    ) {
      onChange(null);
    }
  }

  function updateHeader(headerIndex: number, text: string) {
    if (!value) return;
    onChange({
      ...value,
      headers: value.headers.map((h, i) => (i === headerIndex ? text : h)),
    });
  }

  function addColumn() {
    if (!value) return;
    const subjectCount = value.headers.length - 1;
    const nextLetter = String.fromCharCode(65 + subjectCount); // A, B, C...
    onChange({
      headers: [...value.headers, `Subject ${nextLetter}`],
      rows: value.rows.map((row) => ({ ...row, cells: [...row.cells, ""] })),
    });
  }

  function removeColumn(subjectIndex: number) {
    if (!value) return;
    if (value.headers.length <= 2) {
      // Need at least dimension + 1 subject column; clear instead.
      window.alert(
        "A comparison table needs at least one comparison subject. Remove the table entirely if you do not want any.",
      );
      return;
    }
    const subjectName = value.headers[subjectIndex + 1];
    if (!window.confirm(`Remove the "${subjectName}" column?`)) return;
    onChange({
      headers: value.headers.filter((_, i) => i !== subjectIndex + 1),
      rows: value.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== subjectIndex),
      })),
    });
  }

  function addRow() {
    if (!value) return;
    const subjectCount = value.headers.length - 1;
    onChange({
      ...value,
      rows: [
        ...value.rows,
        { dimension: "", cells: Array(subjectCount).fill("") },
      ],
    });
  }

  function updateRowDimension(rowIndex: number, text: string) {
    if (!value) return;
    onChange({
      ...value,
      rows: value.rows.map((r, i) =>
        i === rowIndex ? { ...r, dimension: text } : r,
      ),
    });
  }

  function updateCell(rowIndex: number, cellIndex: number, text: string) {
    if (!value) return;
    onChange({
      ...value,
      rows: value.rows.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              cells: r.cells.map((c, j) => (j === cellIndex ? text : c)),
            }
          : r,
      ),
    });
  }

  function removeRow(rowIndex: number) {
    if (!value) return;
    onChange({
      ...value,
      rows: value.rows.filter((_, i) => i !== rowIndex),
    });
  }

  function moveRow(rowIndex: number, direction: -1 | 1) {
    if (!value) return;
    const target = rowIndex + direction;
    if (target < 0 || target >= value.rows.length) return;
    const rows = [...value.rows];
    [rows[rowIndex], rows[target]] = [rows[target], rows[rowIndex]];
    onChange({ ...value, rows });
  }

  const summary = !value
    ? "Optional"
    : `${value.headers.length - 1} subjects, ${value.rows.length} rows`;

  return (
    <CollapsibleSection
      label="Comparison table"
      summary={summary}
      helperText="Optional. N-column comparison table. Renders below the article body. The first header labels the row dimension column; the rest are comparison subjects."
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      {value === null ? (
        <button type="button" onClick={initialize} className={accentButtonClass}>
          + Initialize comparison table
        </button>
      ) : (
        <ComparisonEditorBody
          value={value}
          onUpdateHeader={updateHeader}
          onAddColumn={addColumn}
          onRemoveColumn={removeColumn}
          onAddRow={addRow}
          onUpdateRowDimension={updateRowDimension}
          onUpdateCell={updateCell}
          onRemoveRow={removeRow}
          onMoveRow={moveRow}
          onClear={clear}
        />
      )}
    </CollapsibleSection>
  );
}

interface ComparisonEditorBodyProps {
  value: PostComparisonTable;
  onUpdateHeader: (i: number, text: string) => void;
  onAddColumn: () => void;
  onRemoveColumn: (subjectIndex: number) => void;
  onAddRow: () => void;
  onUpdateRowDimension: (rowIndex: number, text: string) => void;
  onUpdateCell: (rowIndex: number, cellIndex: number, text: string) => void;
  onRemoveRow: (rowIndex: number) => void;
  onMoveRow: (rowIndex: number, direction: -1 | 1) => void;
  onClear: () => void;
}

function ComparisonEditorBody({
  value,
  onUpdateHeader,
  onAddColumn,
  onRemoveColumn,
  onAddRow,
  onUpdateRowDimension,
  onUpdateCell,
  onRemoveRow,
  onMoveRow,
  onClear,
}: ComparisonEditorBodyProps) {
  const subjectHeaders = value.headers.slice(1);

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Headers
          </span>
          <button
            type="button"
            onClick={onAddColumn}
            className={subtleButtonClass}
          >
            + Add column
          </button>
        </div>
        <div>
          <label className="block text-xs text-[var(--fg-muted)]">
            Dimension column
          </label>
          <input
            type="text"
            value={value.headers[0] ?? ""}
            onChange={(e) => onUpdateHeader(0, e.target.value)}
            placeholder="e.g. Capability"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div className="space-y-2">
          {subjectHeaders.map((subject, i) => (
            <div key={i}>
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--fg-muted)]">
                  Subject {i + 1}
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveColumn(i)}
                  className={subtleButtonClass}
                  aria-label={`Remove ${subject || `subject ${i + 1}`} column`}
                >
                  Remove column
                </button>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => onUpdateHeader(i + 1, e.target.value)}
                placeholder={`Subject ${i + 1}`}
                className={`${inputClass} mt-1`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Rows
          </span>
          <button
            type="button"
            onClick={onAddRow}
            className={subtleButtonClass}
          >
            + Add row
          </button>
        </div>
        {value.rows.length === 0 ? (
          <p className="text-xs text-[var(--fg-muted)]">No rows yet.</p>
        ) : (
          value.rows.map((row, ri) => (
            <div
              key={ri}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Row {ri + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveRow(ri, -1)}
                    disabled={ri === 0}
                    className={subtleButtonClass}
                    aria-label="Move row up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveRow(ri, 1)}
                    disabled={ri === value.rows.length - 1}
                    className={subtleButtonClass}
                    aria-label="Move row down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveRow(ri)}
                    className={dangerButtonClass}
                    aria-label="Remove row"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--fg-muted)]">
                  Dimension
                </label>
                <input
                  type="text"
                  value={row.dimension}
                  onChange={(e) => onUpdateRowDimension(ri, e.target.value)}
                  placeholder={`e.g. "Permissions required"`}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div className="mt-2 space-y-2">
                {subjectHeaders.map((subject, ci) => (
                  <div key={ci}>
                    <label className="block text-xs text-[var(--fg-muted)]">
                      {subject || `Subject ${ci + 1}`}
                    </label>
                    <textarea
                      value={row.cells[ci] ?? ""}
                      onChange={(e) => onUpdateCell(ri, ci, e.target.value)}
                      placeholder="Cell content"
                      rows={2}
                      className={`${inputClass} mt-1 resize-y`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear table */}
      <div className="border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onClear} className={dangerButtonClass}>
          Remove comparison table
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// Related products selector: multi-select checkboxes.
// -----------------------------------------------------------------

interface RelatedProductsEditorProps {
  value: ProductCatalogSlug[];
  onChange: (next: ProductCatalogSlug[]) => void;
}

export function ListicleRelatedProductsEditor({
  value,
  onChange,
}: RelatedProductsEditorProps) {
  const [open, setOpen] = React.useState(value.length > 0);

  function toggle(slug: ProductCatalogSlug) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }

  const summary =
    value.length === 0
      ? "Optional"
      : `${value.length} selected`;

  return (
    <CollapsibleSection
      label="Related products"
      summary={summary}
      helperText="Optional. Internal links to product pages. Renders cards below the article body. Update PRODUCT_META in src/lib/types.ts to add new products to the list."
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      <div className="space-y-2">
        {PRODUCT_CATALOG_SLUGS.map((slug) => {
          const meta = PRODUCT_META[slug];
          const checked = value.includes(slug);
          return (
            <label
              key={slug}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 hover:bg-[var(--bg-subtle)]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(slug)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--fg)]">
                  {meta.name}
                </div>
                <div className="text-xs text-[var(--fg-muted)]">
                  {meta.tagline}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

// Re-export the PostComparisonRow type so post-editor.tsx can keep its
// state strongly typed without re-importing from content.ts directly.
export type { PostComparisonRow };
