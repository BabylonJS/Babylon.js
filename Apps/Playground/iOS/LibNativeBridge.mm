#include "LibNativeBridge.h"
/*
#import <Babylon/AppRuntime.h>
#import <Babylon/ScriptLoader.h>
#import <Babylon/Plugins/NativeEngine.h>
#import <Babylon/Plugins/NativeWindow.h>
#import <Babylon/Polyfills/Window.h>
#import <Babylon/Polyfills/XMLHttpRequest.h>
#import <Shared/InputManager.h>

std::unique_ptr<Babylon::AppRuntime> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};
*/
@implementation LibNativeBridge

- (instancetype)init
{
    self = [super init];
    return self;
}

- (void)dealloc
{
}

- (void)init:(void*)CALayerPtr width:(int)inWidth height:(int)inHeight
{
    /*
    runtime.reset();
    inputBuffer.reset();

    // Create the AppRuntime
    runtime = std::make_unique<Babylon::AppRuntime>();

    // Initialize NativeWindow plugin
    float width = inWidth;
    float height = inHeight;
    void* windowPtr = CALayerPtr;
    Babylon::Plugins::NativeEngine::InitializeGraphics(windowPtr, width, height);

    runtime->Dispatch([windowPtr, width, height](Napi::Env env)
    {
        Babylon::Polyfills::Window::Initialize(env);
        Babylon::Polyfills::XMLHttpRequest::Initialize(env);

        Babylon::Plugins::NativeWindow::Initialize(env, windowPtr, width, height);
        Babylon::Plugins::NativeEngine::Initialize(env);

        auto& jsRuntime = Babylon::JsRuntime::GetFromJavaScript(env);
        inputBuffer = std::make_unique<InputManager::InputBuffer>(jsRuntime);
        InputManager::Initialize(jsRuntime, *inputBuffer);
    });

    Babylon::ScriptLoader loader{ *runtime };
    loader.Eval("document = {}", "");
    loader.LoadScript("app:///ammo.js");
    loader.LoadScript("app:///recast.js");
    loader.LoadScript("app:///babylon.max.js");
    loader.LoadScript("app:///babylon.glTF2FileLoader.js");
    loader.LoadScript("app:///babylonjs.materials.js");
    loader.LoadScript("app:///experience.js");
    */
}

- (void)resize:(int)inWidth height:(int)inHeight
{
    /*
    if (runtime) 
    {
        runtime->Dispatch([inWidth, inHeight](Napi::Env env)
        {
            Babylon::Plugins::NativeWindow::UpdateSize(env, static_cast<size_t>(inWidth), static_cast<size_t>(inHeight));
        });
    }
    */
}

- (void)setInputs:(int)x y:(int)y tap:(bool)tap
{
    /*
    if (inputBuffer)
    {
        inputBuffer->SetPointerPosition(x, y);
        inputBuffer->SetPointerDown(tap);
    }*/
}

@end
