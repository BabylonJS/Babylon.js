#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <memory>
#include <android/native_window.h> // requires ndk r5 or newer
#include <android/native_window_jni.h> // requires ndk r5 or newer
#include <android/log.h>

#include <Babylon/AppRuntime.h>
#include <Babylon/Console.h>
#include <Babylon/NativeEngine.h>
#include <Babylon/NativeWindow.h>
#include <Babylon/ScriptLoader.h>
#include <Babylon/XMLHttpRequest.h>
#include <InputManager.h>

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>

extern "C" {
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_initEngine(JNIEnv* env, jobject obj, jobject assetMgr, jobject appContext);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_finishEngine(JNIEnv* env, jobject obj);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_surfaceCreated(JNIEnv* env, jobject obj, jobject surface);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_activityOnPause(JNIEnv* env);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_activityOnResume(JNIEnv* env);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height, jobject surface);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_loadScript(JNIEnv* env, jobject obj, jstring path);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_eval(JNIEnv* env, jobject obj, jstring source, jstring sourceURL);
    JNIEXPORT void JNICALL Java_BabylonNative_Wrapper_setTouchInfo(JNIEnv* env, jobject obj, jfloat dx, jfloat dy, jboolean down);
};

std::unique_ptr<Babylon::AppRuntime> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};
std::unique_ptr<Babylon::ScriptLoader> loader{};

AAssetManager *g_assetMgrNative = nullptr;

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_initEngine(JNIEnv* env, jobject obj,
                                      jobject assetMgr, jobject appContext)
{
    auto asset_manager = AAssetManager_fromJava(env, assetMgr);
    g_assetMgrNative = asset_manager;
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_finishEngine(JNIEnv* env, jobject obj)
{
    loader.reset();
    inputBuffer.reset();
    runtime.reset();
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_surfaceCreated(JNIEnv* env, jobject obj, jobject surface)
{
    if (!runtime)
    {
        runtime = std::make_unique<Babylon::AppRuntime>("");

        runtime->Dispatch([](Napi::Env env)
        {
            Babylon::Console::CreateInstance(env, [](const char* message, Babylon::Console::LogLevel level)
            {
                switch (level)
                {
                case Babylon::Console::LogLevel::Log:
                    __android_log_write(ANDROID_LOG_INFO, "BabylonNative", message);
                    break;
                case Babylon::Console::LogLevel::Warn:
                    __android_log_write(ANDROID_LOG_WARN, "BabylonNative", message);
                    break;
                case Babylon::Console::LogLevel::Error:
                    __android_log_write(ANDROID_LOG_ERROR, "BabylonNative", message);
                    break;
                }
            });
        });

        ANativeWindow *window = ANativeWindow_fromSurface(env, surface);
        int32_t width  = ANativeWindow_getWidth(window);
        int32_t height = ANativeWindow_getHeight(window);
        runtime->Dispatch([window, width, height](Napi::Env env)
        {
            Babylon::NativeWindow::Initialize(env, window, width, height);
        });
        
        Babylon::InitializeNativeEngine(*runtime, window, width, height);
        
        // Initialize XMLHttpRequest plugin.
        Babylon::InitializeXMLHttpRequest(*runtime, runtime->RootUrl());

        inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
        InputManager::Initialize(*runtime, *inputBuffer);
        
        loader = std::make_unique<Babylon::ScriptLoader>(*runtime, runtime->RootUrl());
        loader->LoadScript("Scripts/babylon.max.js");
        loader->LoadScript("Scripts/babylon.glTF2FileLoader.js");
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height, jobject surface)
{
    if (runtime)
    {
        ANativeWindow *window = ANativeWindow_fromSurface(env, surface);
        Babylon::ReinitializeNativeEngine(*runtime, window, static_cast<size_t>(width), static_cast<size_t>(height));
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_loadScript(JNIEnv* env, jobject obj, jstring path)
{
    if (loader)
    {
        jboolean iscopy;
        loader->LoadScript(env->GetStringUTFChars(path, &iscopy));
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_eval(JNIEnv* env, jobject obj, jstring source, jstring sourceURL)
{
    if (runtime)
    {
        jboolean iscopy;
        std::string url = env->GetStringUTFChars(sourceURL, &iscopy);
        std::string src = env->GetStringUTFChars(source, &iscopy);
        loader->Eval(std::move(src), std::move(url));
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_setTouchInfo(JNIEnv* env, jobject obj, jfloat x, jfloat y, jboolean down)
{
    if (inputBuffer != nullptr)
    {
        inputBuffer->SetPointerPosition(x, y);
        inputBuffer->SetPointerDown(down);
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_activityOnPause(JNIEnv* env)
{
    if (runtime)
    {
        runtime->Suspend();
    }
}

JNIEXPORT void JNICALL
Java_BabylonNative_Wrapper_activityOnResume(JNIEnv* env)
{
    if (runtime)
    {
        runtime->Resume();
    }
}