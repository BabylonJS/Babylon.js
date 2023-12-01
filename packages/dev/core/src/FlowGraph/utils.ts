import type { Node } from "../node";

/**
 * Returns if mesh1 is a descendant of mesh2
 * @param mesh1
 * @param mesh2
 * @returns
 */
export function _isADescendantOf(mesh1: Node, mesh2: Node): boolean {
    if (mesh1.parent === null) {
        return false;
    }
    const parent = mesh1.parent;
    if (parent === mesh2) {
        return true;
    }
    return _isADescendantOf(parent, mesh2);
}
