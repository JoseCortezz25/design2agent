import { create } from 'zustand';
import {
  DESIGN_MD_ISSUE_SEVERITY,
  type DesignMdArtifactBundle,
  type DesignMdIssue,
  type DesignMdPipelineProgressPayload,
  type DesignMdSettings,
  type DesignMdSourceSnapshot
} from '@common/design-md/domain.types';

export const DESIGN_MD_UI_STATUS = {
  IDLE: 'idle',
  SETTINGS: 'settings',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type DesignMdUiStatus =
  (typeof DESIGN_MD_UI_STATUS)[keyof typeof DESIGN_MD_UI_STATUS];

export const DESIGN_MD_PREVIEW_TAB = {
  MARKDOWN: 'markdown',
  TOKENS: 'tokens',
  TAILWIND_V4: 'tailwind-v4',
  LINT: 'lint'
} as const;

export type DesignMdPreviewTab =
  (typeof DESIGN_MD_PREVIEW_TAB)[keyof typeof DESIGN_MD_PREVIEW_TAB];

interface DesignMdProgressState {
  current: number;
  total: number;
  label: string;
}

interface DesignMdState {
  status: DesignMdUiStatus;
  activeTab: DesignMdPreviewTab;
  settings: DesignMdSettings | null;
  sourceSnapshot: DesignMdSourceSnapshot | null;
  artifacts: DesignMdArtifactBundle | null;
  issues: DesignMdIssue[];
  progress: DesignMdProgressState;
  errorMessage: string | null;
  currentRequestId: string | null;
  actions: {
    startGeneration: (requestId: string) => void;
    showSettings: () => void;
    showIdle: () => void;
    setSettings: (settings: DesignMdSettings) => void;
    setSourceSnapshot: (sourceSnapshot: DesignMdSourceSnapshot) => void;
    setProgress: (payload: DesignMdPipelineProgressPayload) => void;
    addIssue: (issue: DesignMdIssue) => void;
    complete: (artifacts: DesignMdArtifactBundle, requestId: string) => void;
    fail: (message: string) => void;
    setTab: (tab: DesignMdPreviewTab) => void;
  };
}

const initialProgress: DesignMdProgressState = {
  current: 0,
  total: 5,
  label: ''
};

export const useDesignMdStore = create<DesignMdState>((set, get) => ({
  status: DESIGN_MD_UI_STATUS.IDLE,
  activeTab: DESIGN_MD_PREVIEW_TAB.MARKDOWN,
  settings: null,
  sourceSnapshot: null,
  artifacts: null,
  issues: [],
  progress: initialProgress,
  errorMessage: null,
  currentRequestId: null,
  actions: {
    startGeneration: requestId => {
      set({
        status: DESIGN_MD_UI_STATUS.GENERATING,
        currentRequestId: requestId,
        artifacts: null,
        issues: [],
        errorMessage: null,
        progress: initialProgress,
        activeTab: DESIGN_MD_PREVIEW_TAB.MARKDOWN
      });
    },
    showSettings: () => set({ status: DESIGN_MD_UI_STATUS.SETTINGS }),
    showIdle: () => set({ status: DESIGN_MD_UI_STATUS.IDLE, errorMessage: null }),
    setSettings: settings => set({ settings }),
    setSourceSnapshot: sourceSnapshot => set({ sourceSnapshot }),
    setProgress: payload => {
      if (payload.requestId !== get().currentRequestId) {
        return;
      }

      set({
        progress: {
          current: payload.current,
          total: payload.total,
          label: payload.label
        }
      });
    },
    addIssue: issue => {
      set(state => ({ issues: [...state.issues, issue] }));
    },
    complete: (artifacts, requestId) => {
      if (requestId !== get().currentRequestId) {
        return;
      }

      set(state => ({
        status: DESIGN_MD_UI_STATUS.COMPLETED,
        artifacts,
        issues: [...state.issues, ...artifacts.issues],
        errorMessage: null,
        activeTab: DESIGN_MD_PREVIEW_TAB.MARKDOWN
      }));
    },
    fail: message => {
      set({
        status: DESIGN_MD_UI_STATUS.FAILED,
        errorMessage: message
      });
    },
    setTab: tab => set({ activeTab: tab })
  }
}));

export function selectHasBlockingErrors(state: DesignMdState) {
  return state.issues.some(
    issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.ERROR
  );
}
