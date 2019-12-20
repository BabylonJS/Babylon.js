#include "Babylon/RuntimeApple.h"
#include "RuntimeImpl.h"
#include "NativeEngine.h"

namespace Babylon
{

    RuntimeApple::RuntimeApple(void* nativeWindowPtr, float width, float height)
        : RuntimeApple{nativeWindowPtr, ".", width, height} // todo : use parent module path. std::filesystem or std::experimental::filesystem not supported
    {
    }

    RuntimeApple::RuntimeApple(void* nativeWindowPtr, const std::string& rootUrl, float width, float height)
        : Runtime{std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl)}
    {
        NativeEngine::InitializeWindow(nativeWindowPtr, width, height);
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }
}
