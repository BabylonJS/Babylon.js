#import "ViewController.h"
#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

std::unique_ptr<babylon::RuntimeApple> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

}

void MacLogMessage(const char *outputString)
{
    NSLog(@"%s", outputString);
}

void MacWarnMessage(const char *outputString)
{
    NSLog(@"%s", outputString);
}

void MacErrorMessage(const char *outputString)
{
    NSLog(@"%s", outputString);
}

- (void)viewDidAppear {
    [super viewDidAppear];
    
    babylon::Runtime::RegisterLogOutput(MacLogMessage);
    babylon::Runtime::RegisterWarnOutput(MacWarnMessage);
    babylon::Runtime::RegisterErrorOutput(MacErrorMessage);

    NSBundle *main = [NSBundle mainBundle];
    NSURL * resourceUrl = [main resourceURL];

    NSWindow* nativeWindow = [[self view] window];
    runtime = std::make_unique<babylon::RuntimeApple>((__bridge void*)nativeWindow, [resourceUrl fileSystemRepresentation]);

    inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
    InputManager::Initialize(*runtime, *inputBuffer);
    
    runtime->LoadScript("Scripts/babylon.max.js");
    runtime->LoadScript("Scripts/babylon.glTF2FileLoader.js");
    runtime->LoadScript("Scripts/experience.js");
}

- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}


@end
