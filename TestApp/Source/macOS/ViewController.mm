//
//  ViewController.m
//  TestApp.macOS
//
//  Created by Cedric Guillemet on 8/7/19.
//  Copyright © 2019 Babylon team. All rights reserved.
//

#import "ViewController.h"
#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

std::unique_ptr<babylon::RuntimeApple> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

}

- (void)viewDidAppear {
    [super viewDidAppear];
    
    NSWindow* nativeWindow = [[self view] window];
    runtime = std::make_unique<babylon::RuntimeApple>((__bridge void*)nativeWindow, "file:///Users/cedricguillemet/dev/BabylonJS/BabylonNative/TestApp");
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
