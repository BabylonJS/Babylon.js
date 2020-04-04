#import "ViewController.h"

#import <Babylon/AppRuntime.h>
#import <Babylon/Plugins/NativeEngine.h>
#import <Babylon/Plugins/NativeWindow.h>
#import <Babylon/Polyfills/Window.h>
#import <Babylon/ScriptLoader.h>
#import <Babylon/XMLHttpRequest.h>
#import <Shared/InputManager.h>
#import "Babylon/XMLHttpRequestApple.h"


std::unique_ptr<Babylon::AppRuntime> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
}

- (void)refreshBabylon {
    // reset
    runtime.reset();
    inputBuffer.reset();

    // parse command line arguments
    NSArray *arguments = [[NSProcessInfo processInfo] arguments];
    arguments = [arguments subarrayWithRange:NSMakeRange(1, arguments.count - 1)];
    __block std::vector<std::string> scripts;
    scripts.reserve([arguments count]);
    [arguments enumerateObjectsUsingBlock:^(NSString * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        scripts.push_back([obj UTF8String]);
    }];

    // Create the AppRuntime
    {
        NSBundle *main = [NSBundle mainBundle];
        NSURL * resourceUrl = [main resourceURL];
        std::string rootUrl = [[NSString stringWithFormat:@"file://%s", [resourceUrl fileSystemRepresentation]] UTF8String];
        runtime = std::make_unique<Babylon::AppRuntime>(std::move(rootUrl));
    }
    
    // Initialize NativeWindow plugin
    NSSize size = [self view].frame.size;
    float width = size.width;
    float height = size.height;
    NSWindow* nativeWindow = [[self view] window];
    void* windowPtr = (__bridge void*)nativeWindow;
    Babylon::Plugins::NativeEngine::InitializeGraphics(windowPtr, width, height);

    runtime->Dispatch([windowPtr, width, height](Napi::Env env)
    {
        Babylon::Polyfills::Window::Initialize(env);
    
        Babylon::Plugins::NativeWindow::Initialize(env, windowPtr, width, height);
        Babylon::Plugins::NativeEngine::Initialize(env);
        
        InitializeXMLHttpRequest(env);

        auto& jsRuntime = Babylon::JsRuntime::GetFromJavaScript(env);
        inputBuffer = std::make_unique<InputManager::InputBuffer>(jsRuntime);
        InputManager::Initialize(jsRuntime, *inputBuffer);
    });
    
    Babylon::ScriptLoader loader{ *runtime, runtime->RootUrl() };
    loader.Eval("document = {}", "");
    loader.LoadScript("ammo.js");
    loader.LoadScript("recast.js");
    loader.LoadScript("babylon.max.js");
    loader.LoadScript("babylon.glTF2FileLoader.js");
    loader.LoadScript("babylonjs.materials.js");
    
    if (scripts.empty())
    {
        loader.LoadScript("experience.js");
    }
    else
    {
        for (const auto& script : scripts)
        {
            loader.LoadScript(script);
        }

        loader.LoadScript("playground_runner.js");
    }
}

- (void)viewDidAppear {
    [super viewDidAppear];
    
    [self refreshBabylon];
}

- (void)viewDidDisappear {
    [super viewDidDisappear];

    inputBuffer.reset();
    runtime.reset();
    Babylon::Plugins::NativeEngine::DeinitializeGraphics();
}

- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}

- (void)viewDidLayout {
    [super viewDidLayout];
    if (runtime)
    {
        NSSize size = [self view].frame.size;
        float width = size.width;
        float height = size.height;
        runtime->Dispatch([width, height](Napi::Env env)
        {
            Babylon::Plugins::NativeWindow::UpdateSize(env, static_cast<size_t>(width), static_cast<size_t>(height));
        });
    }
}

- (void)mouseDown:(NSEvent *)theEvent {
    if (inputBuffer)
    {
        inputBuffer->SetPointerDown(true);
    }
}

- (void)mouseDragged:(NSEvent *)theEvent {
    if (inputBuffer)
    {
        NSPoint eventLocation = [theEvent locationInWindow];
        inputBuffer->SetPointerPosition(eventLocation.x, eventLocation.y);
    }
}

- (void)mouseUp:(NSEvent *)theEvent {
    if (inputBuffer)
    {
        inputBuffer->SetPointerDown(false);
    }
}

-(IBAction) refresh:(id)sender
{
    [self refreshBabylon];
}

@end
