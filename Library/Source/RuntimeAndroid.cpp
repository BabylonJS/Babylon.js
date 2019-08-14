#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
//#include <filesystem>

namespace babylon
{

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr)
        : RuntimeAndroid{nativeWindowPtr, GetUrlFromPath(".") } // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl) }
    {
        // android stub
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }

}