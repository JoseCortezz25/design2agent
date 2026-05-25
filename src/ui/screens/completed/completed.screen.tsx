import type { DesignMdArtifactBundle } from '@common/design-md/domain.types';
import { Download } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScreenContent } from '@ui/components/layout/screen-content';
import { Button } from '@ui/components/ui/button';
import { messages } from '@ui/config/messages';
import { useDesignMdActions } from '@ui/screens/design-md/use-design-md-actions';
import {
  DESIGN_MD_PREVIEW_TAB,
  type DesignMdPreviewTab
} from '@ui/store/design-md.store';
import {
  downloadText,
  downloadZipBase64
} from '@ui/screens/completed/completed-screen.util';
import { completedMessages } from '@ui/screens/completed/messages';

interface CompletedScreenProps {
  activeTab: DesignMdPreviewTab;
  artifacts: DesignMdArtifactBundle | null;
  onSetTab: (tab: DesignMdPreviewTab) => void;
}

const previewTabs = [
  {
    key: DESIGN_MD_PREVIEW_TAB.MARKDOWN,
    label: completedMessages.tabs.markdown
  },
  {
    key: DESIGN_MD_PREVIEW_TAB.TOKENS,
    label: completedMessages.tabs.tokens
  }
] as const;

const markdownComponents: Components = {
  h1({ children, ...props }) {
    return (
      <h1 className="mb-5 border-b border-slate-700 pb-3 text-sm font-extrabold tracking-[0.05em] text-slate-100" {...props}>
        {children}
      </h1>
    );
  },
  h2({ children, ...props }) {
    return (
      <h2 className="mt-7 mb-2 text-sm font-bold tracking-[0.02em] text-emerald-300" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    return (
      <h3 className="mt-5 mb-2 text-xs font-semibold tracking-[0.03em] text-sky-300" {...props}>
        {children}
      </h3>
    );
  },
  p({ children, ...props }) {
    return (
      <p className="mb-3 leading-6 text-slate-200" {...props}>
        {children}
      </p>
    );
  },
  ul({ children, ...props }) {
    return (
      <ul className="mb-4 list-disc space-y-1 pl-5 text-slate-200 marker:text-emerald-300" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }) {
    return (
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-slate-200 marker:text-emerald-300" {...props}>
        {children}
      </ol>
    );
  },
  li({ children, ...props }) {
    return <li className="leading-6" {...props}>{children}</li>;
  },
  code({ children, className, ...props }) {
    return (
      <code
        className={`rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[0.95em] text-amber-200 ${className ?? ''}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children, ...props }) {
    return (
      <pre
        className="mb-4 overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-3 text-slate-100"
        {...props}
      >
        {children}
      </pre>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="mb-4 overflow-auto rounded-2xl border border-slate-700">
        <table className="w-full border-collapse text-left" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th({ children, ...props }) {
    return (
      <th
        className="border-b border-slate-700 bg-slate-900 px-3 py-2 font-bold text-slate-100"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td
        className="border-b border-slate-800 px-3 py-2 text-slate-200"
        {...props}
      >
        {children}
      </td>
    );
  }
};

export function CompletedScreen({
  activeTab,
  artifacts,
  onSetTab
}: CompletedScreenProps) {
  const { startDesignMdExtraction } = useDesignMdActions();
  const markdownContent = artifacts?.markdown?.content ?? '';
  const tokensContent = artifacts?.dtcgJson?.content ?? '';
  const hasZip = artifacts?.zipBase64 != null;
  const selectedPreviewTab =
    activeTab === DESIGN_MD_PREVIEW_TAB.TOKENS
      ? DESIGN_MD_PREVIEW_TAB.TOKENS
      : DESIGN_MD_PREVIEW_TAB.MARKDOWN;

  return (
    <ScreenContent>
      <div className="border-primary/70 bg-primary text-primary-foreground overflow-hidden rounded-[16px] border shadow-[0_14px_30px_rgba(31,111,95,0.18)]">
        <div
          className="bg-background text-primary grid grid-cols-2"
          role="tablist"
        >
          {previewTabs.map(tab => (
            <button
              key={tab.key}
              aria-selected={selectedPreviewTab === tab.key}
              role="tab"
              type="button"
              onClick={() => onSetTab(tab.key)}
              className={`hover:bg-primary/5 focus-visible:ring-ring border-b-2 px-4 py-4 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                selectedPreviewTab === tab.key
                  ? 'border-primary'
                  : 'text-primary/80 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="preview-scroll-transparent max-h-[300px] min-h-[300px] overflow-auto bg-black p-5 font-mono text-xs leading-6 text-slate-100">
          {selectedPreviewTab === DESIGN_MD_PREVIEW_TAB.MARKDOWN ? (
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              skipHtml
            >
              {markdownContent}
            </ReactMarkdown>
          ) : (
            <pre className="break-words whitespace-pre-wrap text-slate-100">
              {tokensContent}
            </pre>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={artifacts?.markdown == null}
          className="border-primary/30 bg-background text-primary focus-visible:ring-ring flex w-full items-center justify-between rounded-[14px] border px-5 py-4 text-left shadow-[0_8px_18px_rgba(31,111,95,0.08)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          onClick={() => {
            if (artifacts?.markdown != null) {
              downloadText(
                artifacts.markdown.content,
                artifacts.markdown.fileName,
                artifacts.markdown.mimeType
              );
            }
          }}
        >
          <span className="text-sm font-bold">
            {completedMessages.downloads.markdown}
          </span>
          <Download aria-hidden className="text-accent size-5" />
        </button>

        <button
          type="button"
          disabled={artifacts?.dtcgJson == null}
          className="border-primary/30 bg-background text-primary focus-visible:ring-ring flex w-full items-center justify-between rounded-[14px] border px-5 py-4 text-left shadow-[0_8px_18px_rgba(31,111,95,0.08)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          onClick={() => {
            if (artifacts?.dtcgJson != null) {
              downloadText(
                artifacts.dtcgJson.content,
                artifacts.dtcgJson.fileName,
                artifacts.dtcgJson.mimeType
              );
            }
          }}
        >
          <span className="text-sm font-bold">
            {completedMessages.downloads.tokens}
          </span>
          <Download aria-hidden className="text-accent size-5" />
        </button>

        <button
          type="button"
          disabled={!hasZip}
          className="border-primary/30 bg-background text-primary focus-visible:ring-ring flex w-full items-center justify-between rounded-[14px] border px-5 py-4 text-left shadow-[0_8px_18px_rgba(31,111,95,0.08)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          onClick={() => {
            if (artifacts?.zipBase64 != null) {
              downloadZipBase64(
                artifacts.zipBase64,
                completedMessages.downloads.zipFileName
              );
            }
          }}
        >
          <span className="text-sm font-bold">
            {completedMessages.downloads.zipLabel}
          </span>
          <Download aria-hidden className="text-accent size-5" />
        </button>
      </div>

      <Button className="w-full" onClick={startDesignMdExtraction}>
        {messages.common.actions.retry}
      </Button>
    </ScreenContent>
  );
}
