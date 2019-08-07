#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
//#include <filesystem>

namespace babylon
{

    RuntimeAndroid::RuntimeAndroid(void* nativeWindowPtr)
        : RuntimeAndroid{nativeWindowPtr, GetUrlFromPath(".") } // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(void* nativeWindowPtr, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl) }
    {
        // android stub
    }

    void RuntimeImpl::ThreadProcedure()
    {
        // android stub
    }

}