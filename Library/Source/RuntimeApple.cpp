#include "Babylon/RuntimeApple.h"
#include "RuntimeImpl.h"
//#include <filesystem>

namespace Babylon
{

    RuntimeApple::RuntimeApple(void* nativeWindowPtr)
        : RuntimeApple{nativeWindowPtr, "."} // todo : use parent module path. std::filesystem or std::experimental::filesystem not supported
    {
    }

    RuntimeApple::RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl)
        : Runtime{std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl)}
    {
        // Apple Stub
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
