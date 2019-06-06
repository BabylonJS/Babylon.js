#include "InputManagerWin32.h"

#include <Windows.h>

InputManagerWin32::InputManagerWin32(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<InputManagerWin32>{ info }
{}

Napi::Value InputManagerWin32::PointerX(const Napi::CallbackInfo& info)
{
    POINT point{};
    GetCursorPos(&point);
    return Napi::Value::From(info.Env(), point.x);
}

Napi::Value InputManagerWin32::PointerY(const Napi::CallbackInfo& info)
{
    POINT point{};
    GetCursorPos(&point);
    return Napi::Value::From(info.Env(), point.y);
}

Napi::Value InputManagerWin32::IsPointerDown(const Napi::CallbackInfo& info)
{
    bool buttonDown = GetKeyState(VK_LBUTTON) < 0;
    return Napi::Value::From(info.Env(), buttonDown);
}
