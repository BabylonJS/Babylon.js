interface Navigator  {
    /** http://stackoverflow.com/questions/13641692/how-to-use-getusermedia-from-typesecript */
    isCocoonJS : boolean;
}

declare module Cocoon {
    class Ad{
        public hideBanner() : void;  
        public loadBanner() : void;
        public loadInterstitial() : void;
        public setBannerLayout(bannerLayout : string) : void; // problem example wrong
        public showBanner() : void;
        public showInterstitial() : void;
        public on(event : string, callback: () => void) : void;
        public static TOP_CENTER : string;
        public static BOTTOM_CENTER : string;
    }
    class App{
        public exit() : void;  
        public exitCallback(callback: () => boolean) : void;
        public forward(code : string) : void;
        public forwardAsync(javaScriptCode : string, callback: () => void) : void; 
        public hideTheWebView() :void;
        public load(path : string, storageType : Cocoon.App.StorageType) : void;
        public loadInTheWebView(path : string, cb : Array<() => void>, storageType : Cocoon.App.StorageType) : void;
        public openURL(url : string) : void;
        public pause() : void;  
        public reload() : void;
        public reloadWebView() : void;
        public resume() : void;
        public showTheWebView(x : number, y : number, width : number, height : number) : void;
        public on(event : string, callback: () => void) : void;
    }
    class Camera{
        public getAllCamerasInfo() : Array<Cocoon.Camera.CameraInfo>;
        public getCameraInfoByIndex(cameraIndex : number) : Cocoon.Camera.CameraInfo;
        public getNumberOfCameras() : number;
        public isCapturing(cameraIndex : number) : boolean;
        public start(params : any) : any; // not sure what params is, example does not help
        public stop(cameraIndex : number) : void;
    }
    class Device{
        public autoLock(enabled : boolean)
        public getDeviceId() : string;
        public getDeviceInfo() : Cocoon.Device.DeviceInfo;
        public getOrientation() : number;
        public setOrientation(preferredOrientation : number) : void;

    }
    class Dialog{
        public confirm(params, callback : (boolean) => void) : void;
        public prompt(param, callbacks)
    }
    class Motion{
        public getAccelerometerInterval() : number;
        public getGyroscopeInterval() : number;
        public setAccelerometerInterval(seconds : number) : void;
        public setGyroscopeInterval(seconds : number) : void;
    }
    class Multiplayer{
//        public 
    }
    class Notification{
//        public 
    }
    class Proxify{
        public static audio() : void;
        public static console() : void;
        public static deproxifyConsole() : void;
        public static xhr() : void;
    }
    class Social{
//        public 
    }
    class Store{
//        public 
    }
    class Touch{
        public static disable() : void;
        public static disableInWebView() : void;
        public static enable() : void;
        public static enableInWebView() : void;
    }
    class Utils{
        public captureScreen(fileName : string, storageType? : Cocoon.App.StorageType, captureType? : Cocoon.Utils.CaptureType) : string;
        public captureScreenAsync(fileName : string, storageType? : Cocoon.App.StorageType, captureType? : Cocoon.Utils.CaptureType, callback? : () => void) : void;
        public existsPath(path : string, storageType? : Cocoon.App.StorageType) : boolean;
        public logMemoryInfo() : void;
        public markAsMusic(filePath : string) : void;
        public setAntialias(antialias : boolean) : void;
        public setTextCacheSize(size : number) : void;
        public setTextureReduction(sizeThreshold : number, applyTo? : any, forbidFor? : any) : void;
    }
    class WebView{
        public hide() : void;
        public show(x? : number, y? : number, width? : number, height? : number) : void;    
    }
}

declare module Cocoon.App{
    class StorageType{
        public static PORTRAIT : string; // ????
        public static INTERNAL_STORAGE : string;
        public static EXTERNAL_STORAGE : string;
        public static TEMPORARY_STORAGE : string;
    }
}

declare module Cocoon.Camera{
    class CameraInfo{
        public cameraIndex : number;
//        public supportedVideoSizes : Array<Cocoon.Size>;  // !!!!!!!!!!!!!!!!!!!!!!!!!!! could not find Cocoon.Size
        public supportedVideoFrameRates: Array<number>;
        public supportedImageFormats : Array<Cocoon.Camera.CaptureFormatType>;
    }
    
    class CameraType{
        public static FRONT : string;
        public static BACK : string;
    }
    
    class CaptureFormatType{
        public static JPEG : string;
        public static RGB_565 : string;
        public static NV21 : string;
        public static NV16 : string;  
        public static YUY2 : string;
        public static YV12 : string;
        public static BGRA32 : string;
    }
}

declare module Cocoon.Device{
    class DeviceInfo{
        /** The operating system name (ios, android,...). */
        public os : string;  
        /** The operating system version (4.2.2, 5.0,...). */
        public version : string;  
        /** The operating system screen density in dpi. */
        public dpi : string;  
        /** The device manufacturer (apple, samsung, lg,...). */
        brand : string;  
        /** The device model (iPhone 4S, SAMSUNG-SGH-I997, SAMSUNG-SGH-I997R, etc). */
        public model : string;  
        /** The phone IMEI. Android: The phone IMEI is returned or null if the device has not telepohny. iOS: null is returned as we cannot get the IMEI in iOS, no public API available for that yet. */
        public imei : string;  
        /** The platform Id. */
        public platformId : string;  
        /** The Odin generated id: https://code.google.com/p/odinmobile/ */
        public odin : string;  
        /** The OpenUDID generated Id: https://github.com/ylechelle/OpenUDID */
        public openudid : string;       
    }
    
    class Orientations{
        public static PORTRAIT : string 
        public static PORTRAIT_UPSIDE_DOWN : string;
        public static LANDSCAPE_LEFT : string;
        public static LANDSCAPE_RIGHT : string;
        public static LANDSCAPE : string;
        public static BOTH : string;
    }
}

declare module Cocoon.Dialog{
    class keyboardType{
        public static TEXT : string;
        public static NUMBER : string;
        public static PHONE : string;
        public static EMAIL : string;
        public static URL : string;
    }
}

declare module Cocoon.Multiplayer{
    class Match{
        constructor(nativeExtensionName : string, extensionName : string, matchID: number);
        public disconnect() : void;
        public getExpectedPlayerCount() : number;
        public getLocalPlayerID() : Cocoon.Multiplayer.PlayerInfo;
        public getPlayerIDs() : Array<Cocoon.Multiplayer.PlayerInfo>;
        public requestPlayersInfo(callback) : void;
        public sendData(data, playerIDs, sendMode) : boolean;
        public sendDataToAllPlayers(data, sendMode) : boolean
    }
    class ConnectionState{
        
    }
    class PlayerInfo{
        public userID : string;
        public userName : string;
    }
    class SendDataMode{
        public static RELIABLE : string;
        public static UNRELIABLE : string;
    }
}

declare module Cocoon.Utils{
    class CaptureType{
        public static EVERYTHING : string;
        public static COCOONJS_GL_SURFACE : string;
        public static JUST_SYSTEM_VIEWS : string;
    }
}

declare module Coocoon.Widget{
    class WebDialog{
        public close() : void;  
        public eval() : void;  
        public show(url : string, closeCallback: () => void) : void;  
    }    
}