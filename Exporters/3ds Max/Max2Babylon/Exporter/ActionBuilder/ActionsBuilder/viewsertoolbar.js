/// <reference path="raphael.js" />
/// <reference path="actionKinds.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    var ToolBar = (function () {
        function ToolBar(viewer) {
            // Members
            this.element = document.getElementById("ToolbarList");
            this.viewer = viewer;

            // Configure
            this._attachControl();
        }

        //
        // Private methods
        //
        // Attaches controls to each button
        ToolBar.prototype._attachControl = function () {
            var scope = this;
            var events = new Array();

            // Create event handlers and add them to the events array
            var onReduce = function () {
                scope.viewer.utils.onReduceAll(false);
            };
            events.push(onReduce);

            var onExpand = function () {
                scope.viewer.utils.onReduceAll(true);
            };
            events.push(onExpand);

            var onDisconnect = function () {
                scope.viewer.utils.onDetachAll(true, false);
            };
            events.push(onDisconnect);

            var onReconnect = function () {
                scope.viewer.utils.onDetachAll(false, true);
            };
            events.push(onReconnect);

            var onDeZoom = function () {
                if (scope.viewer.zoom > 0.0)
                    scope.viewer.zoom -= 0.1;

                scope.viewer.update();
            };
            events.push(onDeZoom);

            var onZoom = function () {
                if (scope.viewer.zoom < 1.0)
                    scope.viewer.zoom += 0.1;

                scope.viewer.update();
            };
            events.push(onZoom);

            // Add events
            var onEvent = function (id, element) {
                return function (event) {
                    element.style.backgroundColor = "rgb(155, 155, 155)";
                    events[id](event);
                    setTimeout(function () {
                        element.style.backgroundColor = "rgb(0, 0, 0)";
                    }, 100);
                };
            };

            var list = this.element.getElementsByTagName("li");
            for (var i = 0; i < events.length; i++) {
                list[i].addEventListener("click", onEvent(i, list[i]));
            }
        }

        ToolBar.VIEW_HEIGHT = 40;

        return ToolBar;
    })();

    AB.ToolBar = ToolBar;

})(AB || (AB = {}));