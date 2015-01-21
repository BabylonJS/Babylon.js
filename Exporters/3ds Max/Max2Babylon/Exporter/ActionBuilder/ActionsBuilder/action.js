/// <reference path="raphael.js" />
/// <reference path="viewer.js" />
/// <reference path="actionKinds.js" />

var AB;
(function (AB) {

    var Node = (function () {
        function Node() {
            this.rect = null;
            this.text = null;
            this.line = null;

            this.action = null;
        }

        Node.prototype.attr = function(element, attribute, value) {
            if (value)
                element.attr(attribute, value);
            else
                return element.attr(attribute);
        }

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

            this.name = '';
            this.type = AB.ActionsBuilder.Type.OBJECT;
            this.propertiesResults = new Array();
            this.properties = new Array();
        }

        Action.prototype.addChild = function (object) {
            if (object == null)
                return false;

            this.children.push(object);
            object.parent = this;

            return true;
        }

        Action.prototype.removeChild = function (object) {
            var indice = this.children.indexOf(object);

            if (indice != 1) {
                this.children.splice(indice, 1);
                return true;
            }

            return false;
        }

        Action.prototype.clearChildren = function () {
            this.children = new Array();
        }

        return Action;

    })();

    AB.Action = Action;
    AB.Node = Node;

})(AB || (AB = { }));