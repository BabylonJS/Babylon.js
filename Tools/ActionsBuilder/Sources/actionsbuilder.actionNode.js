var ActionsBuilder;
(function (ActionsBuilder) {
    var Node = (function () {
        function Node() {
            this.rect = null;
            this.text = null;
            this.line = null;
            this.detached = false;
            this.minimized = false;
        }
        /**
        * Returns if the point (x, y) is inside the text or rect
        * @param x: the x position of the point
        * @param y: the y position of the point
        */
        Node.prototype.isPointInside = function (x, y) {
            return this.rect.isPointInside(x, y) || this.text.isPointInside(x, y);
        };
        return Node;
    })();
    ActionsBuilder.Node = Node;
    var Action = (function () {
        /**
        * Constructor
        * @param node: The associated node to draw in the viewer
        */
        function Action(node) {
            this.parent = null;
            this.children = new Array();
            this.name = "";
            this.type = ActionsBuilder.Type.OBJECT;
            this.properties = new Array();
            this.propertiesResults = new Array();
            this.combineArray = null;
            this.hub = null;
            this.combineAction = null;
            this.node = node;
        }
        /*
        * Removes a combined action from the combine array
        * @param action: the action to remove
        */
        Action.prototype.removeCombinedAction = function (action) {
            if (action === null || this.combineArray === null) {
                return false;
            }
            var index = this.combineArray.indexOf(action);
            if (index !== -1) {
                this.combineArray.splice(index, 1);
            }
            return false;
        };
        /*
        * Adds a child
        * @param child: the action to add as child
        */
        Action.prototype.addChild = function (child) {
            if (child === null) {
                return false;
            }
            this.children.push(child);
            child.parent = this;
            return true;
        };
        /*
        * Removes the given action to children
        * @param child: the child to remove
        */
        Action.prototype.removeChild = function (child) {
            var indice = this.children.indexOf(child);
            if (indice !== -1) {
                this.children.splice(indice, 1);
                return true;
            }
            return false;
        };
        /*
        * Clears the children's array
        */
        Action.prototype.clearChildren = function () {
            this.children = new Array();
        };
        return Action;
    })();
    ActionsBuilder.Action = Action;
})(ActionsBuilder || (ActionsBuilder = {}));
//# sourceMappingURL=actionsbuilder.actionNode.js.map