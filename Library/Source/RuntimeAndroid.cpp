#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
#include "NativeEngine.h"

namespace Babylon
{

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr)
        : RuntimeAndroid{nativeWindowPtr, "."} // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl)
        : Runtime{std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl)}
    {
        int32_t width  = ANativeWindow_getWidth(nativeWindowPtr);
        int32_t height = ANativeWindow_getHeight(nativeWindowPtr);
        NativeEngine::InitializeWindow(nativeWindowPtr, width, height);
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
