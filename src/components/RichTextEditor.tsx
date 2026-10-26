import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading2, Heading3, Pilcrow, List, ListOrdered } from 'lucide-react';
import { plainTextToHtml, sanitizeHtml } from '../utils/htmlContent';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClass?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe o pega el texto legal…',
  className = '',
  minHeightClass = 'min-h-[28rem]',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = plainTextToHtml(value || '');
    if (next !== lastValue.current && el.innerHTML !== next) {
      el.innerHTML = next || '<p></p>';
      lastValue.current = next;
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeHtml(el.innerHTML);
    lastValue.current = html;
    onChange(html);
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const cleaned = html ? sanitizeHtml(html) : plainTextToHtml(text);
    document.execCommand('insertHTML', false, cleaned);
    emit();
  };

  const btn =
    'p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors';

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        <button type="button" className={btn} title="Párrafo" onClick={() => run('formatBlock', 'p')}>
          <Pilcrow className="w-4 h-4" />
        </button>
        <button type="button" className={btn} title="Título" onClick={() => run('formatBlock', 'h2')}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Subtítulo"
          onClick={() => run('formatBlock', 'h3')}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <button type="button" className={btn} title="Negrita" onClick={() => run('bold')}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" className={btn} title="Cursiva" onClick={() => run('italic')}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" className={btn} title="Subrayado" onClick={() => run('underline')}>
          <Underline className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <button
          type="button"
          className={btn}
          title="Lista"
          onClick={() => run('insertUnorderedList')}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Lista numerada"
          onClick={() => run('insertOrderedList')}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <span className="ml-auto text-[10px] font-medium text-slate-400 px-2 hidden sm:inline">
          Pegar desde Word / Docs conserva formato básico
        </span>
      </div>

      <div
        ref={ref}
        role="textbox"
        aria-multiline
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        data-placeholder={placeholder}
        className={`rich-text-editor ${minHeightClass} max-h-[70vh] overflow-y-auto px-4 py-3 text-sm text-slate-800 dark:text-slate-100 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400`}
      />

      <style>{`
        .rich-text-editor h1,
        .rich-text-editor h2 {
          font-size: 1.15rem;
          font-weight: 800;
          margin: 0.85em 0 0.4em;
        }
        .rich-text-editor h3 {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0.75em 0 0.35em;
        }
        .rich-text-editor p {
          margin: 0.45em 0;
        }
        .rich-text-editor ul,
        .rich-text-editor ol {
          margin: 0.5em 0 0.5em 1.25em;
          padding: 0;
        }
        .rich-text-editor li {
          margin: 0.2em 0;
        }
        .rich-text-editor:empty:before {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
