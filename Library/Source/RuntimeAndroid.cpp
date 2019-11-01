#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
//#include <filesystem>

namespace babylon
{

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, LogCallback callback)
        : RuntimeAndroid{ nativeWindowPtr, ".", std::move(callback) } // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl, LogCallback callback)
        : Runtime{ std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl, std::move(callback)) }
    {
        // android stub
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }

}