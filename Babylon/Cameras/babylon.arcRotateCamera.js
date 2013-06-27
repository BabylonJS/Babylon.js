var BABYLON = BABYLON || {};

(function () {
    BABYLON.ArcRotateCamera = function (name, alpha, beta, radius, target, scene) {
        this.name = name;
        this.id = name;
        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;
        this.target = target;

        this._scene = scene;

        scene.cameras.push(this);
        
        if (!scene.activeCamera) {
            scene.activeCamera = this;
        }

        this.getViewMatrix();
        
        // Animations
        this.animations = [];
    };
    
    BABYLON.ArcRotateCamera.prototype = Object.create(BABYLON.Camera.prototype);

    // Members
    BABYLON.ArcRotateCamera.prototype.inertialAlphaOffset = 0;
    BABYLON.ArcRotateCamera.prototype.inertialBetaOffset = 0;

    // Methods
    BABYLON.ArcRotateCamera.prototype.attachControl = function(canvas) {
        var previousPosition;
        var that = this;
        
        this._onPointerDown = function (evt) {
            previousPosition = {
                x: evt.clientX,
                y: evt.clientY
            };

            evt.preventDefault();
        };

        this._onPointerUp = function (evt) {
            previousPosition = null;
            evt.preventDefault();
        };

        this._onPointerMove = function (evt) {
            if (!previousPosition) {
                return;
            }

            var offsetX = evt.clientX - previousPosition.x;
            var offsetY = evt.clientY - previousPosition.y;

            that.inertialAlphaOffset -= offsetX / 1000;
            that.inertialBetaOffset -= offsetY / 1000;

            previousPosition = {
                x: evt.clientX,
                y: evt.clientY
            };

            evt.preventDefault();
        };

        this._wheel = function(event) {
            var delta = 0;
            if (event.wheelDelta) {
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = -event.detail / 3;
            }

            if (delta)
                that.radius -= delta;

            if (event.preventDefault)
                event.preventDefault();
        };

        canvas.addEventListener("pointerdown", this._onPointerDown);
        canvas.addEventListener("pointerup", this._onPointerUp);
        canvas.addEventListener("pointerout", this._onPointerUp);
        canvas.addEventListener("pointermove", this._onPointerMove);
        window.addEventListener('mousewheel', this._wheel);
    };
    
    BABYLON.ArcRotateCamera.prototype.detachControl = function (canvas) {
        canvas.removeEventListener("pointerdown", this._onPointerDown);
        canvas.removeEventListener("pointerup", this._onPointerUp);
        canvas.removeEventListener("pointerout", this._onPointerUp);
        canvas.removeEventListener("pointermove", this._onPointerMove);
        window.removeEventListener('mousewheel', this._wheel);
    };

    BABYLON.ArcRotateCamera.prototype._update = function() {
        // Inertia
        if (this.inertialAlphaOffset != 0 || this.inertialBetaOffset != 0) {

            this.alpha += this.inertialAlphaOffset;
            this.beta += this.inertialBetaOffset;

            this.inertialAlphaOffset *= this.inertia;
            this.inertialBetaOffset *= this.inertia;

            if (Math.abs(this.inertialAlphaOffset) < BABYLON.Engine.epsilon)
                this.inertialAlphaOffset = 0;

            if (Math.abs(this.inertialBetaOffset) < BABYLON.Engine.epsilon)
                this.inertialBetaOffset = 0;
        }
    };

    BABYLON.ArcRotateCamera.prototype.setPosition = function(position) {
        var radiusv3 = position.subtract(this.target.position ? this.target.position : this.target);
        this.radius = radiusv3.length();

        this.alpha = Math.atan(radiusv3.z / radiusv3.x);
        this.beta = Math.acos(radiusv3.y / this.radius);
    };

    BABYLON.ArcRotateCamera.prototype.getViewMatrix = function () {
        // Compute
        if (this.beta > Math.PI)
            this.beta = Math.PI;

        if (this.beta <= 0)
            this.beta = 0.01;

        var cosa = Math.cos(this.alpha);
        var sina = Math.sin(this.alpha);
        var cosb = Math.cos(this.beta);
        var sinb = Math.sin(this.beta);

        this.position = this.target.add(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb));
        return new BABYLON.Matrix.LookAtLH(this.position, this.target, BABYLON.Vector3.Up());
    };
})();