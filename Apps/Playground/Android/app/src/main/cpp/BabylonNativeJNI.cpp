#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <memory>
#include <android/native_window.h> // requires ndk r5 or newer
#include <android/native_window_jni.h> // requires ndk r5 or newer
#include <android/log.h>

#include <Babylon/Platform.h>
#include <Babylon/AppRuntime.h>
#include <Babylon/Plugins/NativeEngine.h>
#include <Babylon/Plugins/NativeWindow.h>
#include <Babylon/Polyfills/Console.h>
#include <Babylon/Polyfills/Window.h>
#include <Babylon/ScriptLoader.h>
#include <Babylon/XMLHttpRequest.h>
#include <InputManager.h>

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>

extern "C"
{
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_initEngine(JNIEnv* env, jobject obj, jobject assetManager);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_finishEngine(JNIEnv* env, jobject obj);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_surfaceCreated(JNIEnv* env, jobject obj, jobject surface, jobject appContext);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_activityOnPause(JNIEnv* env);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_activityOnResume(JNIEnv* env);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height, jobject surface);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_loadScript(JNIEnv* env, jobject obj, jstring path);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_eval(JNIEnv* env, jobject obj, jstring source, jstring sourceURL);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_setTouchInfo(JNIEnv* env, jobject obj, jfloat dx, jfloat dy, jboolean down);
};

namespace
{
    std::unique_ptr<Babylon::AppRuntime> g_runtime{};
    std::unique_ptr<InputManager::InputBuffer> g_inputBuffer{};
    std::unique_ptr<Babylon::ScriptLoader> g_scriptLoader{};
}

// TODO : this is a workaround for asset loading on Android. To remove when the plugin system is in place.
AAssetManager* g_assetManager = nullptr;

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_initEngine(JNIEnv* env, jobject obj, jobject assetManager)
{
    // TODO : this is a workaround for asset loading on Android. To remove when the plugin system is in place.
    g_assetManager = AAssetManager_fromJava(env, assetManager);
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_finishEngine(JNIEnv* env, jobject obj)
{
    g_scriptLoader.reset();
    g_inputBuffer.reset();
    g_runtime.reset();
    Babylon::Plugins::NativeEngine::DeinitializeGraphics();
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_surfaceCreated(JNIEnv* env, jobject obj, jobject surface, jobject appContext)
{
    if (!g_runtime)
    {
        g_runtime = std::make_unique<Babylon::AppRuntime>("");

        JavaVM* javaVM{};
        if (env->GetJavaVM(&javaVM) != JNI_OK)
        {
            throw std::runtime_error("Failed to get Java VM");
        }

        // TODO: This should be cleaned up via env->DeleteGlobalRef
        auto globalAppContext = env->NewGlobalRef(appContext);

        ANativeWindow* window = ANativeWindow_fromSurface(env, surface);
        int32_t width  = ANativeWindow_getWidth(window);
        int32_t height = ANativeWindow_getHeight(window);

        g_runtime->Dispatch([javaVM, globalAppContext, window, width, height](Napi::Env env)
        {
            Babylon::Polyfills::Console::Initialize(env, [](const char* message, Babylon::Polyfills::Console::LogLevel level)
            {
                switch (level)
                {
                case Babylon::Polyfills::Console::LogLevel::Log:
                    __android_log_write(ANDROID_LOG_INFO, "BabylonNative", message);
                    break;
                case Babylon::Polyfills::Console::LogLevel::Warn:
                    __android_log_write(ANDROID_LOG_WARN, "BabylonNative", message);
                    break;
                case Babylon::Polyfills::Console::LogLevel::Error:
                    __android_log_write(ANDROID_LOG_ERROR, "BabylonNative", message);
                    break;
                }
            });

            Babylon::Platform::Initialize(env, javaVM, globalAppContext);

            Babylon::Plugins::NativeWindow::Initialize(env, window, width, height);

            Babylon::Plugins::NativeEngine::InitializeGraphics(window, width, height);
            Babylon::Plugins::NativeEngine::Initialize(env);

            Babylon::Polyfills::Window::Initialize(env);

            Babylon::InitializeXMLHttpRequest(env, g_runtime->RootUrl());

            auto& jsRuntime = Babylon::JsRuntime::GetFromJavaScript(env);

            g_inputBuffer = std::make_unique<InputManager::InputBuffer>(jsRuntime);
            InputManager::Initialize(jsRuntime, *g_inputBuffer);
        });

        g_scriptLoader = std::make_unique<Babylon::ScriptLoader>(*g_runtime, g_runtime->RootUrl());
        g_scriptLoader->Eval("document = {}", "");
        g_scriptLoader->LoadScript("Scripts/ammo.js");
        g_scriptLoader->LoadScript("Scripts/recast.js");
        g_scriptLoader->LoadScript("Scripts/babylon.max.js");
        g_scriptLoader->LoadScript("Scripts/babylon.glTF2FileLoader.js");
        g_scriptLoader->LoadScript("Scripts/babylonjs.materials.js");
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height, jobject surface)
{
    if (g_runtime)
    {
        ANativeWindow *window = ANativeWindow_fromSurface(env, surface);
        g_runtime->Dispatch([window, width, height](Napi::Env env)
        {
            Babylon::Plugins::NativeEngine::Reinitialize(env, window, static_cast<size_t>(width), static_cast<size_t>(height));
        });
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_loadScript(JNIEnv* env, jobject obj, jstring path)
{
    if (g_scriptLoader)
    {
        jboolean iscopy;
        g_scriptLoader->LoadScript(env->GetStringUTFChars(path, &iscopy));
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_eval(JNIEnv* env, jobject obj, jstring source, jstring sourceURL)
{
    if (g_runtime)
    {
        jboolean iscopy;
        std::string url = env->GetStringUTFChars(sourceURL, &iscopy);
        std::string src = env->GetStringUTFChars(source, &iscopy);
        g_scriptLoader->Eval(std::move(src), std::move(url));
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_setTouchInfo(JNIEnv* env, jobject obj, jfloat x, jfloat y, jboolean down)
{
    if (g_inputBuffer != nullptr)
    {
        g_inputBuffer->SetPointerPosition(x, y);
        g_inputBuffer->SetPointerDown(down);
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_activityOnPause(JNIEnv* env)
{
    if (g_runtime)
    {
        g_runtime->Suspend();
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_activityOnResume(JNIEnv* env)
{
    if (g_runtime)
    {
        g_runtime->Resume();
    }
}
