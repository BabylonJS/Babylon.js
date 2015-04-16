/// <reference path="raphael.js" />
/// <reference path="viewer.js" />
/// <reference path="actionKinds.js" />

var AB;
(function (AB) {

    var Node = (function () {
        function Node() {
            // Members
            this.rect = null;
            this.text = null;
            this.line = null;

            this.action = null;

            this.detached = false;
            this.minimized = false;
        }

        // Get node's object attribute
        // element: The element to get the attribute
        // attribute: the attribute name "text, "width", etc.
        // value: optional, if not reading mode but writing mode
        Node.prototype.attr = function(element, attribute, value) {
            if (value)
                element.attr(attribute, value);
            else
                return element.attr(attribute);
        }

        // Returns the point at (x, y) is inside the node
        // x: the x position of the point
        // y: the y position of the point
        Node.prototype.isPointInside = function (x, y) {
            return this.rect.isPointInside(x, y) || this.text.isPointInside(x, y);
        }

        return Node;
    })();

    var Action = (function() {
        function Action(node) {
            // Graph related
            this.parent = null;
            this.children = new Array();
            this.node = node;

            // Action
            this.name = "";
            this.type = AB.ActionsBuilder.Type.OBJECT;
            this.propertiesResults = new Array();
            this.properties = new Array();

            // Extra
            this.combine = false;
            this.combineArray = new Array();
            this.hub = null;
        }

        // Adds a child to the action
        // object: the child
        Action.prototype.addChild = function (object) {
            if (object == null)
                return false;

            this.children.push(object);
            object.parent = this;

            return true;
        }

        // Removes a child from the action
        // object: the child to remove
        Action.prototype.removeChild = function (object) {
            var indice = this.children.indexOf(object);

            if (indice != -1) {
                this.children.splice(indice, 1);
                return true;
            }

            return false;
        }

        // Clears all the children of the action
        Action.prototype.clearChildren = function () {
            this.children = new Array();
        }

        return Action;

    })();

    AB.Action = Action;
    AB.Node = Node;

})(AB || (AB = { }));