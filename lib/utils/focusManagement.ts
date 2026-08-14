/**
 * Focus Management Utilities
 * Provides helpers for managing focus in modals and complex interactions
 */

export interface FocusTrapOptions {
  onEscape?: () => void;
}

/**
 * Hook to manage focus trap in modals
 * Keeps focus within the modal element and restores focus on close
 */
export function useFocusTrap(options: FocusTrapOptions = {}) {
  const getFocusableElements = (element: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'input[type="password"]:not([disabled])',
      'input[type="email"]:not([disabled])',
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];

    return Array.from(element.querySelectorAll(focusableSelectors.join(",")));
  };

  const handleKeyDown = (event: KeyboardEvent, element: HTMLElement) => {
    if (event.key === "Escape") {
      options.onEscape?.();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(element);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  return { handleKeyDown, getFocusableElements };
}

/**
 * Announce content to screen readers
 * Useful for dynamic updates
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    announcement.remove();
  }, 1000);
}

/**
 * Save and restore focus
 * Useful for modal open/close
 */
export class FocusManager {
  private previouslyFocusedElement: HTMLElement | null = null;

  saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  restoreFocus(): void {
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      this.previouslyFocusedElement.focus();
    }
  }

  reset(): void {
    this.previouslyFocusedElement = null;
  }
}
