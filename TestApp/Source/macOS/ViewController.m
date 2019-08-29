//
//  ViewController.m
//  TestApp.macOS
//
//  Created by Cedric Guillemet on 8/7/19.
//  Copyright © 2019 Babylon team. All rights reserved.
//

#import "ViewController.h"
#include "Helper.h"

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    InitRuntime();
}


- (void)setRepresentedObject:(id)representedObject {
    [super setRepresentedObject:representedObject];

    // Update the view, if already loaded.
}


@end
