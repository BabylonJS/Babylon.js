export class Tools {
    public static LookForItem(item: any, selectedEntity: any): boolean {
        if (item === selectedEntity) {
            return true;
        }

        const children = item.getChildren ? item.getChildren() : item.children;
        if (children) {
            for (var child of children) {
                if (Tools.LookForItem(child, selectedEntity)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static SortAndFilter(parent: any, items: any[]): any[] {
        if (!items) {
            return [];
        }

        const finalArray = new Array<any>();
        items.forEach((i:any)=>{
            // If the mesh is hidden, add it's children, this will handle the case of bounding box parenting for bounding box gizmo
            if(i.reservedDataStore && i.reservedDataStore.hidden){
                i.getChildMeshes().forEach((m:any) => {
                    finalArray.push(m);
                });
            }else{
                finalArray.push(i);
            }
        })


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