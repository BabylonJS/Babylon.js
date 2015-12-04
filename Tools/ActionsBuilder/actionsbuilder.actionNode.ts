module ActionsBuilder {
    export class Node {
        public rect: Rect = null;
        public text: Text = null;
        public line: Path = null;

        public detached: boolean = false;
        public minimized: boolean = false;

        constructor()
        { }

        /**
        * Returns if the point (x, y) is inside the text or rect
        * @param x: the x position of the point
        * @param y: the y position of the point
        */
        public isPointInside(x: number, y: number): boolean {
            return this.rect.isPointInside(x, y) || this.text.isPointInside(x, y);
        }
    }

    export class Action {
        public node: Node;
        public parent: Action = null;
        public children: Array<Action> = new Array<Action>();

        public name: string = "";
        public type: number = Type.OBJECT;

        public properties: Array<ElementProperty> = new Array<ElementProperty>();
        public propertiesResults: Array<ElementPropertyResult> = new Array<ElementPropertyResult>();

        public combineArray: Array<Action> = null;
        public hub: Action = null;
        public combineAction: Action = null;

        /**
        * Constructor
        * @param node: The associated node to draw in the viewer
        */
        constructor(node: Node) {
            this.node = node;
        }
        
        /*
        * Removes a combined action from the combine array
        * @param action: the action to remove
        */
        public removeCombinedAction(action: Action): boolean {
            if (action === null || this.combineArray === null) {
                return false;
            }

            var index = this.combineArray.indexOf(action);
            if (index !== -1) {
                this.combineArray.splice(index, 1);
            }

            return false;
        }

        /*
        * Adds a child
        * @param child: the action to add as child
        */
        public addChild(child: Action): boolean {
            if (child === null) {
                return false;
            }

            this.children.push(child);
            child.parent = this;

            return true;
        }

        /*
        * Removes the given action to children
        * @param child: the child to remove
        */
        public removeChild(child: Action): boolean {
            var indice = this.children.indexOf(child);

            if (indice !== -1) {
                this.children.splice(indice, 1);
                return true;
            }

            return false;
        }

        /*
        * Clears the children's array
        */
        public clearChildren(): void {
            this.children = new Array<Action>();
        }

    }
}