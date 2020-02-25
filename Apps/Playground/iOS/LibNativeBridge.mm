#include "LibNativeBridge.h"

#import <Babylon/AppRuntime.h>
#import <Babylon/Console.h>
#import <Babylon/NativeEngine.h>
#import <Babylon/NativeWindow.h>
#import <Babylon/ScriptLoader.h>
#import <Babylon/XMLHttpRequest.h>
#import <Shared/InputManager.h>

std::unique_ptr<Babylon::AppRuntime> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

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
    // Create the AppRuntime
    runtime.reset();
    {
        NSBundle *main = [NSBundle mainBundle];
        NSURL * resourceUrl = [main resourceURL];
        std::string rootUrl = [[NSString stringWithFormat:@"file://%s", [resourceUrl fileSystemRepresentation]] UTF8String];
        runtime = std::make_unique<Babylon::AppRuntime>(std::move(rootUrl));
    }
    
    // Initialize console plugin
    runtime->Dispatch([](Napi::Env env)
    {
        Babylon::Console::CreateInstance(env, [](const char* message, auto)
        {
            NSLog(@"%s", message);
        });
    });
    
    // Initialize NativeWindow plugin
    float width = inWidth;
    float height = inHeight;
    void* windowPtr = CALayerPtr;
    runtime->Dispatch([windowPtr, width, height](Napi::Env env)
    {
        Babylon::NativeWindow::Initialize(env, windowPtr, width, height);
    });
    
    Babylon::InitializeNativeEngine(*runtime, windowPtr, width, height);
    
    // Initialize XMLHttpRequest plugin.
    Babylon::InitializeXMLHttpRequest(*runtime, runtime->RootUrl());

    inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
    InputManager::Initialize(*runtime, *inputBuffer);
    
    Babylon::ScriptLoader loader{ *runtime, runtime->RootUrl() };
    loader.LoadScript("babylon.max.js");
    loader.LoadScript("babylon.glTF2FileLoader.js");
    loader.LoadScript("experience.js");
}

- (void)resize:(int)inWidth height:(int)inHeight
{
    if (runtime) 
    {
        runtime->Dispatch([inWidth, inHeight](Napi::Env env)
        {
            auto& window = Babylon::NativeWindow::GetFromJavaScript(env);
            window.Resize(static_cast<size_t>(inWidth), static_cast<size_t>(inHeight));
        });
    }
}

- (void)setInputs:(int)x y:(int)y tap:(bool)tap
{
    if (inputBuffer)
    {
        inputBuffer->SetPointerPosition(x, y);
        inputBuffer->SetPointerDown(tap);
    }
}

@end

