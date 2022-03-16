export class Tools {
    public static LookForItem(item: any, selectedEntity: any): boolean {
        if (item === selectedEntity) {
            return true;
        }

        const children = item.getChildren ? item.getChildren() : item.children;
        if (children && item.getClassName() !== "MultiMaterial") {
            for (var child of children) {
                if (Tools.LookForItem(child, selectedEntity)) {
                    return true;
                }
            }
        }

        return false;
    }

    private static _RecursiveRemoveHiddenMeshesAndHoistChildren(items: Array<any>) {
        let result: Array<any> = [];
        for (let i of items) {
            // If the mesh is hidden, add it's children that are not hidden, this will handle the case of bounding box parenting for bounding box gizmo
            if (i.reservedDataStore && i.reservedDataStore.hidden && i.getChildMeshes) {
                Tools._RecursiveRemoveHiddenMeshesAndHoistChildren(i.getChildMeshes()).forEach((m) => {
                    result.push(m);
                });
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

        return finalArray.sort((a: any, b: any) => {
            const lowerCaseA = (a.name || "").toLowerCase();
            const lowerCaseB = (b.name || "").toLowerCase();

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