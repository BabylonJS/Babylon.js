import { Nullable } from "../../types";

/** @hidden */
interface IWebGPURenderItem {
    run(renderPass: GPURenderPassEncoder): void;
    clone(): IWebGPURenderItem;
}

/** @hidden */
export class WebGPURenderItemViewport implements IWebGPURenderItem {
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    public constructor(x: number, y: number, w: number, h: number) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.w = Math.floor(w);
        this.h = Math.floor(h);
    }

    public run(renderPass: GPURenderPassEncoder) {
        renderPass.setViewport(this.x, this.y, this.w, this.h, 0, 1);
    }

    public clone(): WebGPURenderItemViewport {
        return new WebGPURenderItemViewport(this.x, this.y, this.w, this.h);
    }
}

/** @hidden */
export class WebGPURenderItemScissor implements IWebGPURenderItem {
    public constructor(public x: number, public y: number, public w: number, public h: number) {
    }

    public run(renderPass: GPURenderPassEncoder) {
        renderPass.setScissorRect(this.x, this.y, this.w, this.h);
    }

    public clone(): WebGPURenderItemScissor {
        return new WebGPURenderItemScissor(this.x, this.y, this.w, this.h);
    }
}

/** @hidden */
export class WebGPURenderItemStencilRef implements IWebGPURenderItem {
    public constructor(public ref: number) {
    }

    public run(renderPass: GPURenderPassEncoder) {
        renderPass.setStencilReference(this.ref);
    }

    public clone(): WebGPURenderItemStencilRef {
        return new WebGPURenderItemStencilRef(this.ref);
    }
}

/** @hidden */
export class WebGPURenderItemBlendColor implements IWebGPURenderItem {
    public constructor(public color: Nullable<number>[]) {
    }

    public run(renderPass: GPURenderPassEncoder) {
        renderPass.setBlendConstant(this.color as GPUColor);
    }

    public clone(): WebGPURenderItemBlendColor {
        return new WebGPURenderItemBlendColor(this.color);
    }
}

class WebGPURenderItemBundles implements IWebGPURenderItem {
    public bundles: GPURenderBundle[];

    public constructor() {
        this.bundles = [];
    }

    public run(renderPass: GPURenderPassEncoder) {
        renderPass.executeBundles(this.bundles);
    }

    public clone(): WebGPURenderItemBundles {
        const cloned = new WebGPURenderItemBundles();
        cloned.bundles = this.bundles;
        return cloned;
    }
}

/** @hidden */
export class WebGPUBundleList {
    private _device: GPUDevice;
    private _bundleEncoder: GPURenderBundleEncoder | undefined;

    private _list: IWebGPURenderItem[];
    private _listLength: number;

    private _currentItemIsBundle: boolean;
    private _currentBundleList: GPURenderBundle[];

    public numDrawCalls = 0;

    public constructor(device: GPUDevice) {
        this._device = device;
        this._list = new Array(10);
        this._listLength = 0;
    }

    public addBundle(bundle?: GPURenderBundle): void {
        if (!this._currentItemIsBundle) {
            const item = new WebGPURenderItemBundles();

            this._list[this._listLength++] = item;
            this._currentBundleList = item.bundles;
            this._currentItemIsBundle = true;
        }
        if (bundle) {
            this._currentBundleList.push(bundle);
        }
    }

    private _finishBundle(): void {
        if (this._currentItemIsBundle && this._bundleEncoder) {
            this._currentBundleList.push(this._bundleEncoder.finish());
            this._bundleEncoder = undefined;
            this._currentItemIsBundle = false;
        }
    }

    public addItem(item: IWebGPURenderItem) {
        this._finishBundle();
        this._list[this._listLength++] = item;
        this._currentItemIsBundle = false;
    }

    public getBundleEncoder(colorFormats: GPUTextureFormat[], depthStencilFormat: GPUTextureFormat | undefined, sampleCount: number): GPURenderBundleEncoder {
        if (!this._currentItemIsBundle) {
            this.addBundle();
            this._bundleEncoder = this._device.createRenderBundleEncoder({
                colorFormats,
                depthStencilFormat,
                sampleCount,
            });
        }
        return this._bundleEncoder!;
    }

    public close(): void {
        this._finishBundle();
    }

    public run(renderPass: GPURenderPassEncoder) {
        this.close();
        for (let i = 0; i < this._listLength; ++i) {
            this._list[i].run(renderPass);
        }
    }

    public reset() {
        this._listLength = 0;
        this._currentItemIsBundle = false;
        this.numDrawCalls = 0;
    }

    public clone(): WebGPUBundleList {
        this.close();

        const cloned = new WebGPUBundleList(this._device);

        cloned._list = new Array(this._listLength);
        cloned._listLength = this._listLength;
        cloned.numDrawCalls = this.numDrawCalls;

        for (let i = 0; i < this._listLength; ++i) {
            cloned._list[i] = this._list[i].clone();
        }

        return cloned;
    }
}
