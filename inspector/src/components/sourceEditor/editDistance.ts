// Derived from jsdiff by Kevin Decker et al
// https://github.com/kpdecker/jsdiff/blob/master/src/diff/base.js
// BSD licensed. https://github.com/kpdecker/jsdiff/blob/master/LICENSE

function clonePath(path: any) {
  return { newPos: path.newPos, components: path.components.slice(0) };
}

interface IDiffOptions {
  ignoreWhitespace?: boolean;
  newlineIsToken?: boolean;
  comparator?: (a: string, b: string) => boolean;
  ignoreCase?: boolean;
}

interface DiffPathComponent {
  newPos: number;
  components: DiffOutputComponent[];
}
interface DiffOutputComponent {
  count: number;
  added?: boolean;
  removed?: boolean;
  value?: string;
}
type DiffPath = (DiffPathComponent|undefined)[];

class Diff {
  constructor(readonly options: IDiffOptions = {}) {
  }

  public useLongestToken = false;

  diff(oldStringRaw: string, newStringRaw: string): DiffOutputComponent[] {

    const oldString = this.removeEmpty(this.tokenize(oldStringRaw));
    const newString = this.removeEmpty(this.tokenize(newStringRaw));

    let newLen = newString.length, oldLen = oldString.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    let bestPath = [{ newPos: -1, components: [] }] as DiffPath;

    // Seed editLength = 0, i.e. the content starts with the same values
    let oldPos = this.extractCommon(bestPath[0]!, newString, oldString, 0);
    if (bestPath[0]!.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return [{value: this.join(newString), count: newString.length}];
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    const execEditLength = (): DiffOutputComponent[]|undefined => {
      for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        let basePath: any;
        let addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        let canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canAdd || (canRemove && addPath!.newPos < removePath!.newPos)) {
          basePath = clonePath(removePath);
          this.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list
          basePath!.newPos++;
          this.pushComponent(basePath!.components, true, undefined);
        }

        oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

        // If we have hit the end of both strings, then we are done
        if (basePath!.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
          return buildValues(this, basePath!.components, newString, oldString, this.useLongestToken);
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
      return undefined;
    }

    // Performs the length of edit iteration. Loops over execEditLength until a value
    // is produced.
    while (editLength <= maxEditLength) {
      let ret = execEditLength();
      if (ret) {
        return ret;
      }
    }

    return [];
  }

  pushComponent(components: DiffOutputComponent[], added: boolean|undefined, removed: boolean|undefined) {
    let last = components[components.length - 1];
    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = {count: last.count + 1, added: added, removed: removed };
    } else {
      components.push({count: 1, added: added, removed: removed });
    }
  }
  extractCommon(basePath: DiffPathComponent, newString: string[], oldString: string[], diagonalPath: number) {
    let newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,

        commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({count: commonCount});
    }

    basePath.newPos = newPos;
    return oldPos;
  }

  equals(left: string, right: string) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right
        || (this.options.ignoreCase && left.toLowerCase() === right.toLowerCase());
    }
  }
  removeEmpty(array: any[]) {
    let ret = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  tokenize(value: string): string[] {
    let retLines = [],
        linesAndNewlines = value.split(/(\n|\r\n)/);
  
    // Ignore the final empty token that occurs if the string ends with a new line
    if (!linesAndNewlines[linesAndNewlines.length - 1]) {
      linesAndNewlines.pop();
    }
  
    // Merge the content and line separators into single tokens
    for (let i = 0; i < linesAndNewlines.length; i++) {
      let line = linesAndNewlines[i];
  
      if (i % 2 && !this.options.newlineIsToken) {
        retLines[retLines.length - 1] += line;
      } else {
        if (this.options.ignoreWhitespace) {
          line = line.trim();
        }
        retLines.push(line);
      }
    }
  
    return retLines;
  }
  join(chars: string[]): string {
    return chars.join('');
  }
};

function buildValues(diff: Diff, components: DiffOutputComponent[], newString: string[], oldString: string[], useLongestToken: boolean) {
  let componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    let component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        let value = newString.slice(newPos, newPos + component.count);
        value = value.map((value, i) => {
          let oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        let tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.
  let lastComponent = components[componentLen - 1];
  if (componentLen > 1
      && typeof lastComponent.value === 'string'
      && (lastComponent.added || lastComponent.removed)
      && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

export function fastEditDistance(sourceA: string, sourceB: string): number {
  let additions = 0;
  let removals = 0;
  
  const d = new Diff({
    ignoreWhitespace: true,
    newlineIsToken: true,
  });
  const result = d.diff(sourceA, sourceB);
  for (const row of result) {
    if (row.added) {
      additions += row.count;
    } else if (row.removed) {
      removals += row.count;
    }
  }
  return Math.max(additions, removals);
}