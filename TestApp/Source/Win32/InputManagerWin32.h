#pragma once

#include <Napi/napi.h>
#include <Runtime/Runtime.h>

class InputManagerWin32 final : public Napi::ObjectWrap<InputManagerWin32>
{
public:
    static void Initialize(babylon::Runtime& rt)
    {
        rt.Execute([](const auto& runtime)
        {
            auto& env = runtime.Env();
            Napi::HandleScope scope{ env };

            Napi::Function func = DefineClass(
                env,
                "InputManager",
                {
                    InstanceAccessor("pointerX", &InputManagerWin32::PointerX, nullptr),
                    InstanceAccessor("pointerY", &InputManagerWin32::PointerY, nullptr),
                    InstanceAccessor("isPointerDown", &InputManagerWin32::IsPointerDown, nullptr),
                },
                nullptr);

            InputManagerWin32::constructor = Napi::Persistent(func);
            InputManagerWin32::constructor.SuppressDestruct();

            env.Global().Set("InputManager", func);
        });
    }

    explicit InputManagerWin32(const Napi::CallbackInfo& info);

private:
    static inline Napi::FunctionReference constructor{};

    Napi::Value PointerX(const Napi::CallbackInfo&);
    Napi::Value PointerY(const Napi::CallbackInfo&);
    Napi::Value IsPointerDown(const Napi::CallbackInfo&);
};
