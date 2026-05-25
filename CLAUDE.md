# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Figma Plugin** built with React 19, TypeScript 5, Vite 5, and Tailwind CSS v4. It runs in **two isolated execution contexts** (Figma sandbox + UI iframe) that communicate through typed messages. The UI follows Atomic Design for component structure and uses Zustand for client state and Zod for validation.

**Tech Stack**: React 19, TypeScript 5, Vite 5, Tailwind CSS v4, shadcn/ui, Zustand 5, Zod 4, monorepo-networker, Storybook 8

## 🔴 CRITICAL — READ FIRST

**BEFORE doing anything else, you MUST read:**

`.claude/knowledge/critical-constraints.md`

This document contains non-negotiable rules for the Figma plugin dual-context architecture. Violating these rules will break the plugin.

## Commands

```bash
pnpm dev              # Watch mode: plugin + UI in parallel
pnpm dev:ui-only      # UI-only Vite dev server (port 5173)
pnpm build            # Full production build
pnpm lint             # ESLint across project
pnpm format           # Prettier format
pnpm types            # TypeScript type check
pnpm storybook        # Storybook dev server (port 6006)
```

No test runner is configured — Storybook is the visual documentation layer.

## MCP Configuration

Enable only what the current task needs:

| Server     | Purpose                                              |
| ---------- | ---------------------------------------------------- |
| **figma**  | Design inspection, variables, screenshots from Figma |
| **pencil** | Read/write `.pen` design files                       |

## Documentation Map

Load strategically — don't read everything upfront!

**Always Read First:**

- `.claude/knowledge/critical-constraints.md` — Non-negotiable rules

**Load As Needed (use Grep for sections):**

- `.claude/knowledge/architecture-patterns.md` — Dual-context model, IPC patterns, UX flow
- `.claude/knowledge/tech-stack.md` — Tech versions, commands, key dependencies
- `.claude/knowledge/file-structure.md` — Naming conventions, path aliases, directory layout
- `.claude/knowledge/business-logic.md` — Plugin flow, screen transitions, user roles

**Strategy**: Use Grep to search specific sections instead of reading full files.

```
❌ Read: architecture-patterns.md
✅ Grep: pattern="## IPC Pattern", path=".claude/knowledge/architecture-patterns.md", -A=20
```

## Coding Rules

Auto-applied rules (based on file paths) in `.claude/rules/`:

| Rule                              | Applies to          | Description                                            |
| --------------------------------- | ------------------- | ------------------------------------------------------ |
| `code-quality.md`                 | `src/**/*.{ts,tsx}` | ESLint conventions, TypeScript strictness, no `any`    |
| `naming-conventions.md`           | `src/**/*.{ts,tsx}` | kebab-case files, PascalCase components, file suffixes |
| `folder-structure.md`             | `src/**/*.{ts,tsx}` | plugin/ui/common layer rules, Atomic Design layout     |
| `text-management.md`              | `src/**/*.{ts,tsx}` | messages.ts pattern, no hardcoded strings              |
| `styling.md`                      | `src/**/*.{ts,tsx}` | Tailwind v4 + @apply, mobile-first                     |
| `project-characteristics.md`      | `src/**/*.{ts,tsx}` | Figma plugin patterns, Zustand, monorepo-networker     |
| `document-component-storybook.md` | `src/**/*.{ts,tsx}` | Storybook story structure                              |

## Available Skills

| Skill                | Trigger                                          |
| -------------------- | ------------------------------------------------ |
| `atomic-design`      | Building, splitting, or refactoring a component  |
| `commit-conventions` | Making a git commit                              |
| `frontend-design`    | Creating new UI screens or visual designs        |
| `react-19`           | Writing React components (no manual memoization) |
| `tailwind-4`         | Adding or modifying styles                       |
| `typescript`         | TypeScript type work, interfaces, generics       |
| `zod-4`              | Form validation, Zod schemas                     |

## Available Commands

| Command          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `/figma-to-code` | Convert Figma designs to code following project styles |
| `/ui-to-json`    | Convert UI to JSON representation                      |
