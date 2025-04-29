export class Tools {
    public static LookForItem(item: any, selectedEntity: any): boolean {
        if (item === selectedEntity) {
            return true;
        }

        const children = item.getChildren ? item.getChildren() : item.children;
        if (children && item.getClassName() !== "MultiMaterial") {
            for (const child of children) {
                if (Tools.LookForItem(child, selectedEntity)) {
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

    public static GetNameString(obj: any) {
        if (obj?.name?.toString) {
            return obj.name.toString();
        }
        return "";
    }

    public static SortAndFilter(parent: any, items: any[]): any[] {
        if (!items) {
            return [];
        }

        const finalArray = Tools._RecursiveRemoveHiddenMeshesAndHoistChildren(items);

        if (parent && parent.reservedDataStore && parent.reservedDataStore.detachedChildren) {
            finalArray.push(...parent.reservedDataStore.detachedChildren);
        }

        return finalArray.sort((a: any, b: any) => {
            const lowerCaseA = Tools.GetNameString(a).toLowerCase();
            const lowerCaseB = Tools.GetNameString(b).toLowerCase();

            if (lowerCaseA === lowerCaseB) {
                return 0;
            }

            if (lowerCaseA > lowerCaseB) {
                return 1;
            }

            return -1;
        });
    }
}
