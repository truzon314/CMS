"use client";

import { useRef } from "react";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const COMMANDS = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "insertUnorderedList", icon: List, label: "Bullet list" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
] as const;

/** COMPONENT_HIERARCHY.md's `RichTextEditor` — a deliberately lightweight
 * contentEditable wrapper (no ProseMirror/Tiptap dependency) with a small,
 * fixed toolbar. Uncontrolled by design: `dangerouslySetInnerHTML` is only
 * ever applied on mount (parent remounts via `key` when switching posts,
 * same pattern as the rest of this app's editors), so typing never fights
 * React re-renders. */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleInput() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function handleCommand(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url) handleCommand("createLink", url);
  }

  return (
    <div className="rounded-md border">
      <div className="flex gap-1 border-b bg-neutral-50 p-1.5">
        {COMMANDS.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleCommand(command)}
            aria-label={label}
            className="flex size-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200"
          >
            <Icon size={14} />
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          aria-label="Link"
          className="flex size-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200"
        >
          <LinkIcon size={14} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        onBlur={handleInput}
        className="prose prose-sm min-h-[280px] max-w-none p-3 text-sm focus:outline-none"
      />
    </div>
  );
}
