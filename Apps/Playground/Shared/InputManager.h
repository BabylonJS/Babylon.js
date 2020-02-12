#pragma once

#include <Babylon/Runtime.h>
#include <napi/napi.h>
#include <napi/env.h>
#include <functional>

class InputManager final : public Napi::ObjectWrap<InputManager>
{
public:
    class InputBuffer
    {
    public:
        InputBuffer(Babylon::Runtime& runtime)
            : m_runtime{ runtime }
        {}
        InputBuffer(const InputBuffer&) = delete;
        InputBuffer& operator=(const InputBuffer&) = delete;

        void SetPointerPosition(int x, int y)
        {
            m_runtime.Dispatch([x, y, this](Napi::Env)
            {
                m_pointerX = x;
                m_pointerY = y;
            });
        }

        void SetPointerDown(bool isPointerDown)
        {
            m_runtime.Dispatch([isPointerDown, this](Napi::Env)
            {
                m_isPointerDown = isPointerDown;
            });
        }

        int GetPointerX() const
        {
            return m_pointerX;
        }

        int GetPointerY() const
        {
            return m_pointerY;
        }

        bool IsPointerDown() const
        {
            return m_isPointerDown;
        }

    private:
        Babylon::Runtime& m_runtime;

        int m_pointerX{};
        int m_pointerY{};
        bool m_isPointerDown{};
    };

    static void Initialize(Babylon::Runtime& runtime, InputBuffer& inputBuffer)
    {
        runtime.Dispatch([data = &inputBuffer](Napi::Env env)
        {
            Napi::HandleScope scope{ env };

            Napi::Function func = DefineClass(
                env,
                "InputManager",
                {
                    InstanceAccessor("pointerX", &InputManager::PointerX, nullptr),
                    InstanceAccessor("pointerY", &InputManager::PointerY, nullptr),
                    InstanceAccessor("isPointerDown", &InputManager::IsPointerDown, nullptr),
                },
                data);

            env.Global().Set("InputManager", func);
        });
    }

    explicit InputManager(const Napi::CallbackInfo& info);

private:
    InputBuffer* m_buffer{};

    Napi::Value PointerX(const Napi::CallbackInfo&);
    Napi::Value PointerY(const Napi::CallbackInfo&);
    Napi::Value IsPointerDown(const Napi::CallbackInfo&);
};
