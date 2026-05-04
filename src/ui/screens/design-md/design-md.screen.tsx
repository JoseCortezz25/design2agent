import {
  DESIGN_MD_ISSUE_SEVERITY,
  type DesignMdIssue,
  type DesignMdSettings
} from '@common/design-md/domain.types';
import { Button } from '@ui/components/ui/button';
import {
  extractCurrentDesignPage,
  saveDesignMdSettings
} from '@ui/repositories/design-md.repository';
import { messages } from '@ui/config/messages';
import { designMdMessages } from './messages';
import {
  DESIGN_MD_PREVIEW_TAB,
  DESIGN_MD_UI_STATUS,
  selectHasBlockingErrors,
  useDesignMdStore
} from '@ui/store/design-md.store';

function getMetricValue(value: number) {
  return value > 0 ? value : 0;
}

function resolveStepLabel(label: string) {
  const map = {
    'reading-current-page': designMdMessages.generating.steps.variables,
    'snapshot-ready': designMdMessages.generating.steps.styles,
    'normalizing-snapshot': designMdMessages.generating.steps.designMd,
    'generating-design-artifacts': designMdMessages.generating.steps.tokens,
    'validating-artifacts': designMdMessages.generating.steps.lint,
    'artifacts-ready': designMdMessages.generating.steps.lint
  } as const;

  if (label in map) {
    return map[label as keyof typeof map];
  }

  return label;
}

function parseIssuesBySeverity(issues: DesignMdIssue[]) {
  return {
    errors: issues.filter(issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.ERROR)
      .length,
    warnings: issues.filter(
      issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.WARNING
    ).length,
    info: issues.filter(issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.INFO)
      .length
  };
}

function downloadText(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadZipBase64(zipBase64: string, fileName: string) {
  const binary = atob(zipBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createUpdatedSettings(
  currentSettings: DesignMdSettings | null,
  updates: Partial<DesignMdSettings>
) {
  if (currentSettings == null) {
    return null;
  }

  return {
    ...currentSettings,
    ...updates
  };
}

export function DesignMdScreen() {
  const {
    status,
    sourceSnapshot,
    settings,
    artifacts,
    issues,
    activeTab,
    progress,
    errorMessage,
    actions
  } = useDesignMdStore();

  const hasBlockingErrors = useDesignMdStore(selectHasBlockingErrors);
  const issueCount = parseIssuesBySeverity(issues);
  const progressValue = Math.max(
    0,
    Math.min(100, Math.round((progress.current / progress.total) * 100))
  );

  const metrics = [
    {
      key: designMdMessages.metrics.colors,
      value: getMetricValue(sourceSnapshot?.localPaintStyles.length ?? 0)
    },
    {
      key: designMdMessages.metrics.textStyles,
      value: getMetricValue(sourceSnapshot?.localTextStyles.length ?? 0)
    },
    {
      key: designMdMessages.metrics.variables,
      value: getMetricValue(sourceSnapshot?.localVariables.length ?? 0)
    },
    {
      key: designMdMessages.metrics.effects,
      value: getMetricValue(sourceSnapshot?.localEffectStyles.length ?? 0)
    }
  ];

  const markdownContent = artifacts?.markdown?.content ?? '';
  const tokensContent = artifacts?.dtcgJson?.content ?? '';
  const tailwindV4CssContent = artifacts?.tailwindV4Css?.content ?? '';
  const hasZip = artifacts?.zipBase64 != null;

  return (
    <main className="dark min-h-screen overflow-x-hidden bg-background p-2 text-foreground">
      <section className="w-full min-w-0 overflow-x-hidden rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
            {designMdMessages.badge.figmaDetected}
          </span>
          {status === DESIGN_MD_UI_STATUS.SETTINGS ? (
            <Button size="sm" variant="ghost" onClick={actions.showIdle}>
              {designMdMessages.settings.back}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={actions.showSettings}>
              {designMdMessages.idle.settings}
            </Button>
          )}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {metrics.map(metric => (
            <article
              key={metric.key}
              className="rounded-md border border-border bg-background p-2"
            >
              <p className="text-[10px] uppercase text-muted-foreground">{metric.key}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </article>
          ))}
        </div>

        {status === DESIGN_MD_UI_STATUS.IDLE ? (
          <section className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold">{designMdMessages.idle.title}</h1>
              <p className="text-sm text-muted-foreground">{designMdMessages.idle.description}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={extractCurrentDesignPage}>
                {designMdMessages.idle.generate}
              </Button>
              <Button className="w-full" variant="secondary" onClick={actions.showSettings}>
                {designMdMessages.idle.settings}
              </Button>
            </div>
          </section>
        ) : null}

        {status === DESIGN_MD_UI_STATUS.SETTINGS ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{designMdMessages.settings.title}</h2>
              <p className="text-sm text-muted-foreground">
                {designMdMessages.settings.description}
              </p>
            </div>
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs uppercase text-muted-foreground">
                {designMdMessages.settings.sourceSection}
              </p>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="collection-id">
                  {designMdMessages.settings.primaryCollection}
                </label>
                <input
                  id="collection-id"
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={settings?.primaryCollectionId ?? ''}
                  onChange={event => {
                    const nextSettings = createUpdatedSettings(settings, {
                      primaryCollectionId: event.target.value.length > 0 ? event.target.value : null
                    });

                    if (nextSettings != null) {
                      actions.setSettings(nextSettings);
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{designMdMessages.settings.defaultMode}</p>
                <p className="rounded border border-border px-2 py-1 text-sm text-muted-foreground">
                  {designMdMessages.settings.defaultModeUnavailable}
                </p>
              </div>
            </div>
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs uppercase text-muted-foreground">
                {designMdMessages.settings.outputSection}
              </p>

              {[
                {
                  key: 'includeComponents',
                  label: designMdMessages.settings.includeComponents
                },
                { key: 'includeTokens', label: designMdMessages.settings.includeTokens },
                {
                  key: 'includeTailwindV4',
                  label: designMdMessages.settings.includeTailwindV4
                },
                {
                  key: 'includeWarnings',
                  label: designMdMessages.settings.includeWarnings
                },
                { key: 'includeZip', label: designMdMessages.settings.includeZip }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      settings?.[
                        item.key as
                          | 'includeComponents'
                          | 'includeTokens'
                          | 'includeTailwindV4'
                          | 'includeWarnings'
                          | 'includeZip'
                      ]
                    )}
                    onChange={event => {
                      const nextSettings = createUpdatedSettings(settings, {
                        [item.key]: event.target.checked
                      });

                      if (nextSettings != null) {
                        actions.setSettings(nextSettings);
                      }
                    }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (settings != null) {
                    saveDesignMdSettings(settings);
                  }
                }}
              >
                {designMdMessages.settings.save}
              </Button>
              <Button variant="secondary" onClick={actions.showIdle}>
                {messages.common.actions.cancel}
              </Button>
            </div>
          </section>
        ) : null}

        {status === DESIGN_MD_UI_STATUS.GENERATING ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{designMdMessages.generating.title}</h2>
              <p className="text-sm text-muted-foreground">
                {designMdMessages.generating.description}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {progress.label.length > 0
                  ? resolveStepLabel(progress.label)
                  : designMdMessages.generating.waiting}
              </p>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progressValue}%</p>
            </div>

            <ul className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              {Object.values(designMdMessages.generating.steps).map(step => (
                <li key={step} className="rounded border border-border px-2 py-1">
                  {step}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {status === DESIGN_MD_UI_STATUS.COMPLETED ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{designMdMessages.preview.title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="w-full"
                variant={activeTab === DESIGN_MD_PREVIEW_TAB.MARKDOWN ? 'default' : 'secondary'}
                onClick={() => actions.setTab(DESIGN_MD_PREVIEW_TAB.MARKDOWN)}
              >
                {designMdMessages.preview.tabs.markdown}
              </Button>
              <Button
                size="sm"
                className="w-full"
                variant={activeTab === DESIGN_MD_PREVIEW_TAB.TOKENS ? 'default' : 'secondary'}
                onClick={() => actions.setTab(DESIGN_MD_PREVIEW_TAB.TOKENS)}
              >
                {designMdMessages.preview.tabs.tokens}
              </Button>
              <Button
                size="sm"
                className="w-full"
                variant={activeTab === DESIGN_MD_PREVIEW_TAB.LINT ? 'default' : 'secondary'}
                onClick={() => actions.setTab(DESIGN_MD_PREVIEW_TAB.LINT)}
              >
                {designMdMessages.preview.tabs.lint}
              </Button>
              <Button
                size="sm"
                className="w-full"
                variant={
                  activeTab === DESIGN_MD_PREVIEW_TAB.TAILWIND_V4 ? 'default' : 'secondary'
                }
                onClick={() => actions.setTab(DESIGN_MD_PREVIEW_TAB.TAILWIND_V4)}
              >
                {designMdMessages.preview.tabs.tailwindV4}
              </Button>
            </div>

            {activeTab === DESIGN_MD_PREVIEW_TAB.MARKDOWN ? (
              <pre className="max-h-[220px] w-full min-w-0 overflow-auto rounded border border-border bg-background p-3 text-xs whitespace-pre-wrap break-words">
                {markdownContent}
              </pre>
            ) : null}

            {activeTab === DESIGN_MD_PREVIEW_TAB.TOKENS ? (
              <pre className="max-h-[220px] w-full min-w-0 overflow-auto rounded border border-border bg-background p-3 text-xs whitespace-pre-wrap break-words">
                {tokensContent}
              </pre>
            ) : null}

            {activeTab === DESIGN_MD_PREVIEW_TAB.TAILWIND_V4 ? (
              <pre className="max-h-[220px] w-full min-w-0 overflow-auto rounded border border-border bg-background p-3 text-xs whitespace-pre-wrap break-words">
                {tailwindV4CssContent}
              </pre>
            ) : null}

            {activeTab === DESIGN_MD_PREVIEW_TAB.LINT ? (
              <div className="space-y-2 rounded border border-border bg-background p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {designMdMessages.preview.lint.counts}: {issueCount.errors} error(s), {issueCount.warnings}{' '}
                  warning(s), {issueCount.info} info.
                </p>
                {issues.length === 0 ? (
                  <p className="text-sm">{designMdMessages.preview.lint.clean}</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {issues.map(issue => (
                      <li key={issue.id} className="rounded border border-border px-2 py-1">
                        <strong className="uppercase">{issue.severity}</strong> · {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className="space-y-2 rounded-md border border-border p-3">
              <h3 className="text-xs uppercase text-muted-foreground">
                {designMdMessages.preview.downloads.title}
              </h3>
              {hasBlockingErrors ? (
                <p className="text-xs text-destructive">
                  {designMdMessages.preview.downloads.blockedByErrors}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="secondary"
                  disabled={hasBlockingErrors || artifacts?.markdown == null}
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
                  {designMdMessages.preview.downloads.markdown}
                </Button>
                <Button
                  variant="secondary"
                  disabled={hasBlockingErrors || artifacts?.dtcgJson == null}
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
                  {designMdMessages.preview.downloads.tokens}
                </Button>
                <Button
                  variant="secondary"
                  disabled={hasBlockingErrors || artifacts?.tailwindV4Css == null}
                  onClick={() => {
                    if (artifacts?.tailwindV4Css != null) {
                      downloadText(
                        artifacts.tailwindV4Css.content,
                        artifacts.tailwindV4Css.fileName,
                        artifacts.tailwindV4Css.mimeType
                      );
                    }
                  }}
                >
                  {designMdMessages.preview.downloads.tailwindV4}
                </Button>
                <Button
                  variant="secondary"
                  disabled={hasBlockingErrors || !hasZip}
                  onClick={() => {
                    if (artifacts?.zipBase64 != null) {
                      downloadZipBase64(artifacts.zipBase64, 'design-md-artifacts.zip');
                    }
                  }}
                >
                  {hasZip
                    ? designMdMessages.preview.downloads.zip
                    : designMdMessages.preview.downloads.zipUnavailable}
                </Button>
              </div>
            </div>
            <Button onClick={extractCurrentDesignPage}>{messages.common.actions.retry}</Button>
          </section>
        ) : null}

        {status === DESIGN_MD_UI_STATUS.FAILED ? (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">{designMdMessages.failed.title}</h2>
            <p className="text-sm text-muted-foreground">{designMdMessages.failed.description}</p>
            <p className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {errorMessage}
            </p>
            <Button onClick={extractCurrentDesignPage}>{designMdMessages.failed.retry}</Button>
          </section>
        ) : null}
      </section>
    </main>
  );
}
