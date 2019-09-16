#import "ViewController.h"
#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

std::unique_ptr<babylon::RuntimeApple> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    NSBundle *main = [NSBundle mainBundle];
    NSURL * resourceUrl = [main resourceURL];
    runtime = std::make_unique<babylon::RuntimeApple>(nullptr, [resourceUrl fileSystemRepresentation]);
    inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
    InputManager::Initialize(*runtime, *inputBuffer);
}


- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}


@end
