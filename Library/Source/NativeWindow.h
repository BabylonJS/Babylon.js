#pragma once

#include "napi/napi.h"

#include <arcana/containers/ticketed_collection.h>

namespace babylon
{
    class NativeWindow : public Napi::ObjectWrap<NativeWindow>
    {
    public:
        static Napi::Object Create(Napi::Env& env, void* windowPtr, size_t width, size_t height);

        NativeWindow(const Napi::CallbackInfo& info);

        void Resize(size_t newWidth, size_t newHeight);

        using OnResizeCallback = std::function<void(size_t, size_t)>;
        using OnResizeCallbackTicket = arcana::ticketed_collection<OnResizeCallback>::ticket;
        OnResizeCallbackTicket AddOnResizeCallback(OnResizeCallback&& callback);

        void* GetWindowPtr() const;
        size_t GetWidth() const;
        size_t GetHeight() const;

    private:
        void* m_windowPtr{};
        size_t m_width{};
        size_t m_height{};

        std::mutex m_mutex{};
        arcana::ticketed_collection<std::function<void(size_t, size_t)>> m_onResizeCallbacks{};
    };
}
