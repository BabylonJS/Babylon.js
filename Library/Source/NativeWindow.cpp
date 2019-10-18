#include "NativeWindow.h"

namespace babylon
{
    Napi::ObjectReference NativeWindow::Create(Napi::Env& env, void* windowPtr, size_t width, size_t height)
    {
        constexpr auto JS_CLASS_NAME = "NativeWindow";

        Napi::HandleScope scope{ env };

        Napi::Function constructor = DefineClass(
            env,
            JS_CLASS_NAME,
            {
                // If JavaScript methods/accessors are introduced, they go here
            });

        return Napi::Persistent(constructor.New({ Napi::External<void>::New(env, windowPtr), Napi::Number::From(env, width), Napi::Number::From(env, height) }));
    }

    NativeWindow::NativeWindow(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<NativeWindow>{ info }
        , m_windowPtr{ info[0].As<Napi::External<void>>().Data() }
        , m_width{ static_cast<size_t>(info[1].As<Napi::Number>().Uint32Value()) }
        , m_height{ static_cast<size_t>(info[2].As<Napi::Number>().Uint32Value()) }
    {}

    void NativeWindow::Resize(size_t newWidth, size_t newHeight)
    {
        if (newWidth != m_width || newHeight != m_height)
        {
            m_width = newWidth;
            m_height = newHeight;

            std::scoped_lock lock{ m_mutex };
            for (const auto& callback : m_onResizeCallbacks)
            {
                callback(m_width, m_height);
            }
        }
    }

    NativeWindow::OnResizeCallbackTicket NativeWindow::AddOnResizeCallback(OnResizeCallback&& callback)
    {
        std::scoped_lock lock{ m_mutex };
        return m_onResizeCallbacks.insert(callback, m_mutex);
    }

    void* NativeWindow::GetWindowPtr() const
    {
        return m_windowPtr;
    }

    size_t NativeWindow::GetWidth() const
    {
        return m_width;
    }

    size_t NativeWindow::GetHeight() const
    {
        return m_height;
    }
}
