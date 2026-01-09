/**
 * Core DOM-based text replacement utilities for the screenplay editor.
 *
 * The functions in this module are intentionally isolated from React so
 * they can be shared between the legacy `src/components/editor` bridge and
 * any future Node or worker hosts. Keeping these helpers pure and DOM-only
 * increases their reusability across editor surfaces (web, desktop, or
 * collaborative clients).
 */
export function applyRegexReplacementToTextNodes(
  root: HTMLElement,
  patternSource: string,
  patternFlags: string,
  replacement: string,
  replaceAll: boolean
): number {
  const combinedFlags = Array.from(new Set((patternFlags + 'g').split(''))).join('');
  const maxReplacements = replaceAll ? Number.POSITIVE_INFINITY : 1;
  const TEXT_NODE = 3;

  let remaining = maxReplacements;
  let replacementsApplied = 0;

  const traverse = (node: any) => {
    if (!node || remaining === 0) return;

    if (typeof node.nodeType === 'number' && node.nodeType === TEXT_NODE) {
      const originalText = node.nodeValue ?? node.textContent ?? '';
      if (!originalText) {
        return;
      }

      const regex = new RegExp(patternSource, combinedFlags);
      let nodeChanged = false;

      const updatedText = originalText.replace(regex, (match: string) => {
        if (remaining === 0) {
          return match;
        }

        nodeChanged = true;
        replacementsApplied += 1;

        if (remaining !== Number.POSITIVE_INFINITY) {
          remaining -= 1;
        }

        return replacement;
      });

      if (nodeChanged) {
        if ('nodeValue' in node) {
          node.nodeValue = updatedText;
        } else if ('textContent' in node) {
          node.textContent = updatedText;
        }
      }

      return;
    }

    const children: any[] = Array.isArray(node?.childNodes)
      ? node.childNodes
      : Array.from(node?.childNodes ?? []);

    for (const child of children) {
      if (remaining === 0) break;
      traverse(child);
    }
  };

  traverse(root);

  return replacementsApplied;
}
