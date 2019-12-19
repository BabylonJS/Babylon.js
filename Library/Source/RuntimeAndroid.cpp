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
        NativeEngine::InitializeDeviceContext(nativeWindowPtr, 32, 32);
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
