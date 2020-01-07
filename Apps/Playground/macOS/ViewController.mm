#import "ViewController.h"
#import <Babylon/Console.h>
#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

std::unique_ptr<Babylon::RuntimeApple> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

}

- (void)viewDidAppear {
    [super viewDidAppear];

    NSBundle *main = [NSBundle mainBundle];
    NSURL * resourceUrl = [main resourceURL];

    NSWindow* nativeWindow = [[self view] window];
    runtime = std::make_unique<Babylon::RuntimeApple>(
        (__bridge void*)nativeWindow, [[NSString stringWithFormat:@"file://%s", [resourceUrl fileSystemRepresentation]] UTF8String]);
    
    runtime->Dispatch([](Babylon::Env& env)
    {
        Babylon::Console::CreateInstance(env, [](const char* message, auto)
        {
            NSLog(@"%s", message);
        });
    });

    inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
    InputManager::Initialize(*runtime, *inputBuffer);
    
    runtime->LoadScript("babylon.max.js");
    runtime->LoadScript("babylon.glTF2FileLoader.js");
    runtime->LoadScript("experience.js");
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
        runtime->UpdateSize(size.width, size.height);
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

@end
