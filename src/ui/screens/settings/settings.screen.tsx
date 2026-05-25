import type { DesignMdSettings } from '@common/design-md/domain.types';
import { ScreenContent } from '@ui/components/layout/screen-content';
import { Button } from '@ui/components/ui/button';
import { messages } from '@ui/config/messages';
import { useDesignMdActions } from '@ui/screens/design-md/use-design-md-actions';
import { settingsMessages } from '@ui/screens/settings/messages';
import { createUpdatedSettings } from '@ui/screens/settings/settings-screen.util';

const SETTINGS_CHECKBOX_KEYS = {
  INCLUDE_COMPONENTS: 'includeComponents',
  INCLUDE_TOKENS: 'includeTokens',
  INCLUDE_TAILWIND_V4: 'includeTailwindV4',
  INCLUDE_WARNINGS: 'includeWarnings',
  INCLUDE_ZIP: 'includeZip'
} as const;

type SettingsCheckboxKey =
  (typeof SETTINGS_CHECKBOX_KEYS)[keyof typeof SETTINGS_CHECKBOX_KEYS];

interface SettingsScreenProps {
  settings: DesignMdSettings | null;
  onSetSettings: (settings: DesignMdSettings) => void;
  onShowHome: () => void;
}

interface DesignMdSettingsOption {
  key: SettingsCheckboxKey;
  label: string;
}

const settingsOptions: DesignMdSettingsOption[] = [
  {
    key: SETTINGS_CHECKBOX_KEYS.INCLUDE_COMPONENTS,
    label: settingsMessages.includeComponents
  },
  {
    key: SETTINGS_CHECKBOX_KEYS.INCLUDE_TOKENS,
    label: settingsMessages.includeTokens
  },
  {
    key: SETTINGS_CHECKBOX_KEYS.INCLUDE_TAILWIND_V4,
    label: settingsMessages.includeTailwindV4
  },
  {
    key: SETTINGS_CHECKBOX_KEYS.INCLUDE_WARNINGS,
    label: settingsMessages.includeWarnings
  },
  {
    key: SETTINGS_CHECKBOX_KEYS.INCLUDE_ZIP,
    label: settingsMessages.includeZip
  }
];

export function SettingsScreen({
  settings,
  onSetSettings,
  onShowHome
}: SettingsScreenProps) {
  const { persistDesignMdSettings } = useDesignMdActions();

  return (
    <ScreenContent>
      <div className="space-y-2">
        <h2 className="text-foreground text-2xl font-bold tracking-[-0.02em]">
          {settingsMessages.title}
        </h2>
        <p className="text-foreground/72 max-w-[34ch] text-sm leading-6">
          {settingsMessages.description}
        </p>
      </div>

      <div className="space-y-10">
        <section className="space-y-5">
          <div className="space-y-1">
            <p className="text-foreground text-[11px] font-bold tracking-[0.28em] uppercase">
              {settingsMessages.sourceSection}
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label
                className="text-foreground text-sm font-semibold tracking-[0.01em]"
                htmlFor="collection-id"
              >
                {settingsMessages.primaryCollection}
              </label>
              <input
                id="collection-id"
                className="border-border/70 text-foreground placeholder:text-foreground/35 focus:border-primary w-full border-0 border-b bg-transparent px-0 pb-3 text-base outline-none transition-colors"
                value={settings?.primaryCollectionId ?? ''}
                onChange={event => {
                  const nextSettings = createUpdatedSettings(settings, {
                    primaryCollectionId:
                      event.target.value.length > 0 ? event.target.value : null
                  });

                  if (nextSettings != null) {
                    onSetSettings(nextSettings);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-foreground text-sm font-semibold tracking-[0.01em]">
                {settingsMessages.defaultMode}
              </p>
              <p className="text-foreground/60 text-sm leading-6">
                {settingsMessages.defaultModeUnavailable}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <p className="text-foreground text-[11px] font-bold tracking-[0.28em] uppercase">
              {settingsMessages.outputSection}
            </p>
          </div>

          <div className="space-y-5">
            {settingsOptions.map(item => (
              <label
                key={item.key}
                className="flex min-h-12 items-start gap-3.5"
              >
                <input
                  type="checkbox"
                  className="accent-primary mt-1 size-4 shrink-0"
                  checked={Boolean(settings?.[item.key])}
                  onChange={event => {
                    const nextSettings = createUpdatedSettings(settings, {
                      [item.key]: event.target.checked
                    });

                    if (nextSettings != null) {
                      onSetSettings(nextSettings);
                    }
                  }}
                />

                <span className="text-foreground text-sm leading-6 font-medium">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          className="flex-1"
          onClick={() => {
            if (settings != null) {
              persistDesignMdSettings(settings);
            }
          }}
        >
          {settingsMessages.save}
        </Button>
        <Button className="flex-1" variant="secondary" onClick={onShowHome}>
          {messages.common.actions.cancel}
        </Button>
      </div>
    </ScreenContent>
  );
}
