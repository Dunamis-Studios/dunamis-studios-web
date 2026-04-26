"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import * as React from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="tiptap-content px-4 py-3 min-h-[400px] text-sm text-[var(--fg)] focus-within:outline-none"
      />
    </div>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  function addLink() {
    const url = window.prompt("URL:");
    if (url) {
      editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/content/images", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        editor!.chain().focus().setImage({ src: url }).run();
      } else {
        const urlFallback = window.prompt("Upload failed. Enter image URL manually:");
        if (urlFallback) {
          editor!.chain().focus().setImage({ src: urlFallback }).run();
        }
      }
    };
    input.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] px-2 py-1.5">
      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="B"
        title="Bold"
      />
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="I"
        title="Italic"
      />
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="S"
        title="Strikethrough"
      />
      <span className="mx-1 h-4 w-px bg-[var(--border)]" />
      <ToolbarBtn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="H2"
        title="Heading 2"
      />
      <ToolbarBtn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="H3"
        title="Heading 3"
      />
      <span className="mx-1 h-4 w-px bg-[var(--border)]" />
      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="UL"
        title="Bullet List"
      />
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="OL"
        title="Ordered List"
      />
      <ToolbarBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="BQ"
        title="Blockquote"
      />
      <ToolbarBtn
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        label="<>"
        title="Code Block"
      />
      <span className="mx-1 h-4 w-px bg-[var(--border)]" />
      <ToolbarBtn
        active={editor.isActive("link")}
        onClick={addLink}
        label="Link"
        title="Add Link"
      />
      <ToolbarBtn
        active={false}
        onClick={addImage}
        label="Img"
        title="Add Image"
      />
      <span className="mx-1 h-4 w-px bg-[var(--border)]" />
      <ToolbarBtn
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="HR"
        title="Horizontal Rule"
      />
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-fg)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
      }`}
    >
      {label}
    </button>
  );
}
