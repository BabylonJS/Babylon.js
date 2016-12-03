var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var PauseScheduleTool = (function (_super) {
        __extends(PauseScheduleTool, _super);
        function PauseScheduleTool(parent, inspector) {
            _super.call(this, 'fa-pause', parent, inspector, 'Pause the automatic update of properties');
            this._isPause = false;
        }
        // Action : refresh the whole panel
        PauseScheduleTool.prototype.action = function () {
            if (this._isPause) {
                INSPECTOR.Scheduler.getInstance().pause = false;
                this._updateIcon('fa-pause');
            }
            else {
                INSPECTOR.Scheduler.getInstance().pause = true;
                this._updateIcon('fa-play');
            }
            this._isPause = !this._isPause;
        };
        return PauseScheduleTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PauseScheduleTool = PauseScheduleTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=PauseScheduleTool.js.map