#pragma once

#include <jni.h>
#include "JavaWrappers.h"

namespace android::global
{
    void Initialize(JavaVM* javaVM, jobject appContext);

    JNIEnv* GetEnvForCurrentThread();

    android::content::Context GetAppContext();
}
