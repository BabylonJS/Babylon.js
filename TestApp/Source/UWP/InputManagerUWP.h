#pragma once

#include <Runtime/Runtime.h>
#include <Napi/Napi.h>

class InputManagerUWP final : public Napi::ObjectWrap<InputManagerUWP>
{
public:
    class InputBuffer
    {
    public:
        InputBuffer(babylon::Runtime& rt)
            : m_runtime{ rt }
        {}
        InputBuffer(const InputBuffer&) = delete;
        InputBuffer& operator=(const InputBuffer&) = delete;

        void SetPointerPosition(int x, int y)
        {
            m_runtime.Execute([x, y, this](const auto&)
            {
                m_pointerX = x;
                m_pointerY = y;
            });
        }

        void SetPointerDown(bool isPointerDown)
        {
            m_runtime.Execute([isPointerDown, this](const auto&)
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
        babylon::Runtime& m_runtime;

        int m_pointerX{};
        int m_pointerY{};
        bool m_isPointerDown{};
    };

    static void Initialize(babylon::Runtime& rt, InputBuffer& inputBuffer)
    {
        rt.Execute([data = &inputBuffer](const auto& runtime)
        {
            auto& env = runtime.Env();
            Napi::HandleScope scope{ env };

            Napi::Function func = DefineClass(
                env,
                "InputManager",
                {
                    InstanceAccessor("pointerX", &InputManagerUWP::PointerX, nullptr),
                    InstanceAccessor("pointerY", &InputManagerUWP::PointerY, nullptr),
                    InstanceAccessor("isPointerDown", &InputManagerUWP::IsPointerDown, nullptr),
                },
                data);

            InputManagerUWP::constructor = Napi::Persistent(func);
            InputManagerUWP::constructor.SuppressDestruct();

            env.Global().Set("InputManager", func);
        });
    }

    explicit InputManagerUWP(const Napi::CallbackInfo& info);

private:
    static inline Napi::FunctionReference constructor{};

    InputBuffer* m_buffer{};

    Napi::Value PointerX(const Napi::CallbackInfo&);
    Napi::Value PointerY(const Napi::CallbackInfo&);
    Napi::Value IsPointerDown(const Napi::CallbackInfo&);
};
