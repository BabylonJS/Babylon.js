/// <reference path="raphael.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    var Utils = (function () {
        function Utils(viewer) {
            // Members
            this.viewer = viewer;
        }

        // Removes the selected node
        Utils.prototype.onRemoveNode = function () {
            if (!this.viewer.selectedNode)
                return;

            var node = this.viewer.selectedNode;

            if (node.type == AB.ActionsBuilder.Type.FLOW_CONTROL && node.parent.combine)
                this.viewer.selectedNode = node.parent;

            node.parent.removeChild(node);
            this.viewer._removeAction(node, false);

            if (node.combine) {
                // Remove hub
                var hub = node.hub;

                node.parent.removeChild(hub.action);
                this.viewer._removeAction(hub.action, false);

                if (hub.action.children.length > 0)
                    node.hub.action.children[0].parent = node.parent;
            }

            this.viewer.update();
            this.viewer.parametersManager.clearParameters();

            this.viewer.selectedNode = null;
        }

        // Removes the selected branch (starting from the selected node)
        Utils.prototype.onRemoveBranch = function () {
            if (!this.viewer.selectedNode)
                return;

            var node = this.viewer.selectedNode;

            if (node.type == AB.ActionsBuilder.Type.FLOW_CONTROL && node.parent.combine)
                this.selectedNode = node.parent;

            node.parent.removeChild(this.selectedNode);
            this.viewer._removeAction(node, true);

            this.viewer.update();
            this.viewer.parametersManager.clearParameters();

            this.viewer.selectedNode = null;
        }

        // Detaches the selected node
        // forceDetach: forces the Detach Color (green) for children of the selected node
        // forceAttach: same as forceDetach but for the original node color
        Utils.prototype.onDetachNode = function (forceDetach, forceAttach) {
            if (!this.viewer.selectedNode)
                return;

            var node = this.viewer.selectedNode;

            if (forceDetach == null) forceDetach = false;
            if (forceAttach == null) forceAttach = false;

            var detached = node.node.detached;
            if (forceAttach)
                detached = false;
            else if (forceDetach)
                detached = true;
            else
                detached = !detached;

            node.node.detached = detached;

            var scope = this;
            var resetColor = function (root, color) {
                var col = color == null ? scope.viewer.getNodeColor(root, scope.viewer.isParentDetached(root)) : color;
                root.node.attr(root.node.rect, "fill", col);

                if (root.node.line)
                    root.node.attr(root.node.line, "stroke", col);

                if (root.combine) {
                    for (var i = 0; i < root.combineArray.length; i++) {
                        resetColor(root.combineArray[i], color);
                    }
                }

                for (var i = 0; i < root.children.length; i++) {
                    resetColor(root.children[i], color);
                }
            };

            this.viewer._setLine(node);
            resetColor(node, !detached ? null : this.viewer.getNodeColor(node));
        }

        // Disconnects all triggers
        Utils.prototype.onDetachAll = function (forceDetach, forceAttach) {
            var scope = this;

            var detach = function (root) {
                scope.viewer.selectedNode = root;
                scope.onDetachNode(forceDetach, forceAttach);
            };

            for (var i = 0; i < this.viewer.root.action.children.length; i++)
                detach(this.viewer.root.action.children[i]);
        }

        // Copies the selected node structure (except root node) to the
        // clipboard
        Utils.prototype.onCopyStructure = function () {
            if (!this.viewer.selectedNode)
                return;

            var structure = this.viewer.createJSON(this.viewer.selectedNode);
            var asText = JSON.stringify(structure);

            window.clipboardData.setData("text", asText);
        }

        // Pastes the previously copied structure (onCopyStructure) to
        // the selected node
        Utils.prototype.onPasteStructure = function () {
            if (!this.viewer.selectedNode)
                return;

            var asText = window.clipboardData.getData("text");
            var isJson = asText.length > 0 && asText[0] == "{" && asText[asText.length - 1] == "}";
            var structure = JSON.parse(asText);
            var node = this.viewer.selectedNode;

            if (structure.type == AB.ActionsBuilder.Type.TRIGGER && node.node != this.viewer.root) {
                alert("You can't paste a trigger if the selected node isn't the root object");
                return;
            }

            if (structure.type != AB.ActionsBuilder.Type.TRIGGER && node.node == this.viewer.root) {
                alert("You can't paste an action or condition if the selected node is the root object");
                return;
            }

            this.viewer.loadFromJSON(structure, node);
            this.viewer.update();
        }

        // Reduces the select node's width
        Utils.prototype.onReduce = function (forceExpand, forceReduce) {
            if (!this.viewer.selectedNode)
                return;

            if (forceExpand == null) forceExpand = false;
            if (forceReduce == null) forceReduce = false;

            var node = this.viewer.selectedNode.node;
            var width = node.attr(node.rect, "width");

            if ((width >= Graph.NODE_WIDTH && !forceExpand) || forceReduce) {
                node.text.hide();
                node.rect.stop();
            }
            else {
                node.text.show();
                node.attr(node.rect, "opacity", 1.0);
            }

            node.attr(node.rect, "width", (width >= Graph.NODE_WIDTH * this.viewer.zoom && !forceExpand) || forceReduce ? Graph.NODE_MINIMIZED_WIDTH * this.viewer.zoom : Graph.NODE_WIDTH * this.viewer.zoom);
            node.minimized = !node.minimized;

            this.viewer.update();
        }

        // Reduces all graph's nodes
        Utils.prototype.onReduceAll = function (forceExpand) {
            if (forceExpand == null)
                forceExpand = false;

            var scope = this;

            var reduce = function (root) {
                scope.viewer.selectedNode = root;
                scope.onReduce(forceExpand, forceExpand ? false : true);

                if (root.combine) {
                    for (var i = 0; i < root.combineArray.length; i++)
                        reduce(root.combineArray[i]);
                }

                for (var i = 0; i < root.children.length; i++)
                    reduce(root.children[i]);

            };

            for (var i = 0; i < this.viewer.root.action.children.length; i++)
                reduce(this.viewer.root.action.children[i]);

            this.viewer.selectedNode = null;
        }

        return Utils;

    })();

    AB.Utils = Utils;

})(AB || (AB = {}));