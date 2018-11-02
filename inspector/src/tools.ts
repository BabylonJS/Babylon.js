export class Tools {
    public static LookForItem(item: any, selectedEntity: any): boolean {
        if (item === selectedEntity) {
            return true;
        }

        if (item.getChildren) {
            for (var child of item.getChildren()) {
                if (Tools.LookForItem(child, selectedEntity)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static SortAndFilter(items: any[]): any[] {
        return items.filter((i) => !i.metadata || !i.metadata.hidden).sort((a: any, b: any) => {
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