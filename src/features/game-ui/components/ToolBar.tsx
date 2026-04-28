/**
 * ToolBar — allows the player to select a tool for the current scenario.
 *
 * Only tools unlocked by the scenario config are shown.
 * Keyboard shortcuts: T = Tweezers, C = Comb.
 */

import { useEffect, type ReactElement } from 'react';
import type { ToolType } from '@config/ScenarioConfig';

interface ToolBarProps {
  /** Tools available in the current scenario. */
  readonly availableTools: readonly ToolType[];
  /** Currently active tool. */
  readonly activeTool: ToolType;
  /** Called when the player selects a different tool. */
  readonly onToolSelect: (tool: ToolType) => void;
}

const TOOL_META: Record<ToolType, { label: string; icon: string; shortcut: string }> = {
  tweezers: { label: 'Tweezers', icon: '🥢', shortcut: 'T' },
  comb: { label: 'Comb', icon: '🪮', shortcut: 'C' },
  spray: { label: 'Spray', icon: '💨', shortcut: 'S' },
  magnifier: { label: 'Magnifier', icon: '🔍', shortcut: 'M' },
};

/**
 * Bottom toolbar — tool selection buttons with keyboard shortcut support.
 *
 * @param props - Available tools, active selection, and selection handler.
 */
export function ToolBar({ availableTools, activeTool, onToolSelect }: ToolBarProps): ReactElement {
  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement) return;
      const key = e.key.toUpperCase();
      for (const tool of availableTools) {
        if (TOOL_META[tool].shortcut === key) {
          onToolSelect(tool);
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); };
  }, [availableTools, onToolSelect]);

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 bg-gray-900 rounded-b">
      {availableTools.map((tool) => {
        const { label, icon, shortcut } = TOOL_META[tool];
        const isActive = activeTool === tool;
        return (
          <button
            key={tool}
            onClick={() => { onToolSelect(tool); }}
            aria-pressed={isActive}
            aria-label={`${label} (${shortcut})`}
            className={[
              'flex flex-col items-center px-6 py-3 rounded transition-all select-none',
              isActive
                ? 'bg-amber-500 text-white shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
            ].join(' ')}
          >
            <span className="text-5xl leading-none">{icon}</span>
            <span className="text-sm font-medium mt-1.5">
              {label} <kbd className="text-xs opacity-60 font-mono">[{shortcut}]</kbd>
            </span>
          </button>
        );
      })}
      {availableTools.length > 1 && (
        <span className="text-gray-600 text-xs ml-2 select-none" aria-hidden>
          ↕ scroll
        </span>
      )}
    </div>
  );
}
