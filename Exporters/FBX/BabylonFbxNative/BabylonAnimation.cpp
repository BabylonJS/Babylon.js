#include "stdafx.h"
#include "BabylonAnimation.h"


BabylonAnimationBase::BabylonAnimationBase(int loopBehavior, int fps, const std::wstring& name, const std::wstring& animatedProperty, bool autoAnimate, int autoAnimateFrom, int autoAnimateTo, bool autoAnimateLoop) :
loopBehavior(loopBehavior), framePerSecond(fps), name(name), property(animatedProperty), autoAnimate(autoAnimate), autoAnimateFrom(autoAnimateFrom), autoAnimateTo(autoAnimateTo), autoAnimateLoop(autoAnimateLoop)
{
}
