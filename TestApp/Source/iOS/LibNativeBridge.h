#pragma once

#include <Foundation/Foundation.h>


@interface LibNativeBridge : NSObject

- (instancetype)init;
- (void)dealloc;

- (void)init:(void*)CALayerPtr width:(int)inWidth height:(int)inHeight;
- (void)resize:(int)inWidth height:(int)inHeight;
- (void)setInputs:(int)inX y:(int)inY tap:(bool)inTap;

@end

