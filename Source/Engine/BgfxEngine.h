#include <Napi/napi.h>

#include <memory>

namespace babylon
{
    class RuntimeImpl;

    class BgfxEngine final
    {
    public:
        BgfxEngine(void* nativeWindowPtr, RuntimeImpl&);
        ~BgfxEngine();

        void Initialize(Napi::Env& env);
        void UpdateSize(float width, float height);
        void UpdateRenderTarget();
        void Suspend();

    private:
        class Impl;
        std::unique_ptr<Impl> m_impl;
    };
}
