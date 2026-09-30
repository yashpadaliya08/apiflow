export interface DiffLine {
  type: 'added' | 'removed' | 'same';
  text: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

/**
 * Lightweight, fast LCS-based line diffing for formatted JSON.
 */
export function computeJsonDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  // Simple and robust line-by-line comparison
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diff.push({
        type: 'same',
        text: oldLines[i],
        lineNumberOld: i + 1,
        lineNumberNew: j + 1,
      });
      i++;
      j++;
    } else if (j < newLines.length && (!oldLines.slice(i).includes(newLines[j]) || (oldLines.slice(i).indexOf(newLines[j]) > newLines.slice(j).indexOf(oldLines[i]) && newLines.slice(j).includes(oldLines[i])))) {
      diff.push({
        type: 'added',
        text: newLines[j],
        lineNumberNew: j + 1,
      });
      j++;
    } else if (i < oldLines.length) {
      diff.push({
        type: 'removed',
        text: oldLines[i],
        lineNumberOld: i + 1,
      });
      i++;
    } else if (j < newLines.length) {
      diff.push({
        type: 'added',
        text: newLines[j],
        lineNumberNew: j + 1,
      });
      j++;
    }
  }

  return diff;
}
