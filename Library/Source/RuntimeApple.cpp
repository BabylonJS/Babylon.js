#include "Babylon/RuntimeApple.h"
#include "RuntimeImpl.h"
//#include <filesystem>

namespace Babylon
{
    RuntimeApple::RuntimeApple(void* nativeWindowPtr, LogCallback callback)
    : RuntimeApple{nativeWindowPtr, ".", std::move(callback) } // todo : use parent module path. std::filesystem or std::experimental::filesystem not supported
    {
    }

    RuntimeApple::RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl, LogCallback callback)
        : Runtime{ std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl, std::move(callback)) }
    {
        // Apple Stub
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
