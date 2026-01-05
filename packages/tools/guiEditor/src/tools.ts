import type { Control } from "gui/2D/controls/control";
import type { Grid } from "gui/2D/controls/grid";
import { Vector2 } from "core/Maths/math";

export class Tools {
    public static LookForItems(item: any, selectedEntities: any[], firstIteration: boolean = true): boolean {
        if (selectedEntities.length == 0) {
            return false;
        }

        if (!firstIteration && selectedEntities.includes(item)) {
            return true;
        }

        const children = item.getChildren ? item.getChildren() : item.children;
        if (children) {
            for (const child of children) {
                if (Tools.LookForItems(child, selectedEntities, false)) {
                    return true;
                }
            }
        }

        return false;
    }

    private static _RecursiveRemoveHiddenMeshesAndHoistChildren(items: Array<any>) {
        const result: Array<any> = [];
        for (const i of items) {
            // If the mesh is hidden, add it's children that are not hidden, this will handle the case of bounding box parenting for bounding box gizmo
            if (i.reservedDataStore && i.reservedDataStore.hidden && i.getChildMeshes) {
                const meshes = Tools._RecursiveRemoveHiddenMeshesAndHoistChildren(i.getChildMeshes());
                for (const m of meshes) {
                    result.push(m);
                }
            } else if (!i.reservedDataStore || !i.reservedDataStore.hidden) {
                result.push(i);
            }
        }
        return result;
    }

    public static SortAndFilter(parent: any, items: any[]): any[] {
        if (!items) {
            return [];
        }

        const finalArray = Tools._RecursiveRemoveHiddenMeshesAndHoistChildren(items);

        if (parent && parent.reservedDataStore && parent.reservedDataStore.detachedChildren) {
            finalArray.push(...parent.reservedDataStore.detachedChildren);
        }
        return finalArray.reverse();
    }

    public static GetCellInfo(grid: Grid, control: Control) {
        const cellInfo = grid.getChildCellInfo(control);
        let rowNumber = parseInt(cellInfo.substring(0, cellInfo.search(":")));
        if (isNaN(rowNumber)) {
            rowNumber = 0;
        }
        let columnNumber = parseInt(cellInfo.substring(cellInfo.search(":") + 1));
        if (isNaN(columnNumber)) {
            columnNumber = 0;
        }
        return new Vector2(rowNumber, columnNumber);
    }

    public static ReorderGrid(grid: Grid, index: number, control: Control, cell: Vector2) {
        const tags: Vector2[] = [];
        const controls: Control[] = [];
        const length = grid.children.length;
        for (let i = index; i < length; ++i) {
            const control = grid.children[index];
            controls.push(control);
            tags.push(Tools.GetCellInfo(grid, control));
            grid.removeControl(control);
        }
        grid.addControl(control, cell.x, cell.y);
        for (let i = 0; i < controls.length; ++i) {
            grid.addControl(controls[i], tags[i].x, tags[i].y);
        }
    }
}
