#include "LibNativeBridge.h"
#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

std::unique_ptr<babylon::RuntimeApple> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

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

@implementation LibNativeBridge

- (instancetype)init
{
    self = [super init];
    return self;
}

- (void)dealloc
{
    
}

- (void)init:( void* )CALayerPtr width:(int)inWidth height:(int)inHeight
{
    babylon::Runtime::RegisterLogOutput(MacLogMessage);
    babylon::Runtime::RegisterWarnOutput(MacWarnMessage);
    babylon::Runtime::RegisterErrorOutput(MacErrorMessage);
    
    NSBundle *main = [NSBundle mainBundle];
    NSURL * resourceUrl = [main resourceURL];
    runtime = std::make_unique<babylon::RuntimeApple>(CALayerPtr, [[NSString stringWithFormat:@"file://%s", [resourceUrl fileSystemRepresentation]] UTF8String]);
    
    inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
    InputManager::Initialize(*runtime, *inputBuffer);
    
    runtime->LoadScript("babylon.max.js");
    runtime->LoadScript("babylon.glTF2FileLoader.js");
    runtime->LoadScript("experience.js");
}

- (void)setInputs:(int)x y:(int)y tap:(bool)tap
{
    
}

@end

