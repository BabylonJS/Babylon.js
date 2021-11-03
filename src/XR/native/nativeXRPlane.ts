/** @hidden */
export class NativeXRPlane implements XRPlane {
    private _nativeImpl: XRPlane;
    public polygon: DOMPointReadOnly[] = [];
    public lastChangedTime: number;

    public get polygonData() {
        return this._nativeImpl.polygonData;
    }

    public get orientation() {
        return this._nativeImpl.orientation;
    }

    public get planeSpace() {
        return this._nativeImpl.planeSpace;
    }

    public update(timestamp: number) {
        const polygonData = this._nativeImpl.polygonData;
        const numPoints = polygonData.length / 3;
        while (this.polygon.length < numPoints) {
            this.polygon.push(<DOMPointReadOnly>{ x: 0, y: 0, z: 0, w: 1 });
        }
        this.polygon.length = numPoints;

        for (let pointIdx = 0; pointIdx < numPoints; pointIdx++) {
            const pointDataIdx = pointIdx * 3;
            const polygonPoint = this.polygon[pointIdx] as any;
            polygonPoint.x = polygonData[pointDataIdx + 0];
            polygonPoint.y = polygonData[pointDataIdx + 1];
            polygonPoint.z = polygonData[pointDataIdx + 2];
        }

        this.lastChangedTime = timestamp;
    }

    public get parentSceneObject() {
        return this._nativeImpl.parentSceneObject;
    }
}