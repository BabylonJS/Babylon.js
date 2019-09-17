#include <napi/js_native_api.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScriptCore.h"
#include "js_native_api_JavaScriptCore.h"
#include <string>
#include <vector>
#include <map>
#include <napi/napi.h>

struct VFTableEntry
{
    napi_callback cb;
    void *data;
};

struct VFTable
{
    napi_env env;
    std::vector<VFTableEntry> vfTable;
};

struct JSC_cbInfo
{
  napi_callback cb;
  void* data;
    JSClassRef classRef;
    napi_env env;
    VFTable vfTable;
};

struct CallbackInfo
{
    napi_value newTarget;
    napi_value thisArg;
    napi_value* argv;
    void* data;
    uint16_t argc;
    bool isConstructCall{ false };
};

std::map<JSObjectRef, JSC_cbInfo*> constructorCB;
std::map<JSValueRef, VFTable*> vfTable;

void dumpException(napi_env env, JSValueRef exception)
{
    char errorStr[1024];
    size_t errorStrSize{ 0 };
    // Getting error string
    OpaqueJSValue *exceptionValue = const_cast<OpaqueJSValue*>(exception);
    napi_get_value_string_utf8(env, reinterpret_cast<napi_value>(exceptionValue), errorStr, sizeof(errorStr), &errorStrSize);
}

napi_status napi_create_double(napi_env env,
                               double value,
                               napi_value* result) {
    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeNumber(env->m_globalContext, value));
    *result = reinterpret_cast<napi_value>(jsValue);
    return napi_ok;
}

napi_status napi_create_error(napi_env env,
                              napi_value code,
                              napi_value msg,
                              napi_value* result) {
    JSObjectRef errorObject = JSObjectMakeError(env->m_globalContext, 0, NULL, NULL);
    *result = reinterpret_cast<napi_value>(errorObject);
    return napi_ok;
}

struct RefInfo
{
    JSValueRef value;
    uint32_t count;
};

napi_status napi_create_reference(napi_env env,
                                  napi_value v,
                                  uint32_t initial_refcount,
                                  napi_ref* result) {
    auto value = reinterpret_cast<JSValueRef>(v);
    auto info = new RefInfo
    {
        value,
        initial_refcount
    };
    
    if (info->count != 0)
    {
        //CHECK_JSRT(JsAddRef(value, nullptr)); todo
    }
    
    *result = reinterpret_cast<napi_ref>(info);
    return napi_ok;
}


napi_status napi_delete_reference(napi_env env, napi_ref ref) {
    auto info = reinterpret_cast<RefInfo*>(ref);
    
    if (info->count != 0)
    {
        //CHECK_JSRT(JsRelease(info->value, nullptr));
    }
    
    delete info;
    return napi_ok; // NC
}

napi_status napi_get_reference_value(napi_env env,
                                     napi_ref ref,
                                     napi_value* result) {
    auto info = reinterpret_cast<RefInfo*>(ref);
    if (info->count == 0)
    {
        *result = nullptr;
    }
    else
    {
        *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(info->value));
    }
    return napi_ok;
}


napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result) {
    std::string string(str, length);
    JSStringRef statement = JSStringCreateWithUTF8CString(string.c_str());
    *result = reinterpret_cast<napi_value>(statement);
    return napi_ok;
}

napi_status napi_create_type_error(napi_env env,
                                   napi_value code,
                                   napi_value msg,
                                   napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_boolean(napi_env env, bool value, napi_value* result) {

    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeBoolean(env->m_globalContext, value));
    *result = reinterpret_cast<napi_value>(jsValue);
    return napi_ok;
}

napi_status napi_get_last_error_info(napi_env env,
                                     const napi_extended_error_info** result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_undefined(napi_env env, napi_value* result) {
    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeUndefined(env->m_globalContext));
    *result = reinterpret_cast<napi_value>(jsValue);
    return napi_ok;
}

napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result) {
    JSStringRef stringRef = JSValueToStringCopy(env->m_globalContext, reinterpret_cast<JSValueRef>(value), NULL);
    if (!buf && result)
    {
        // get only string length
        *result = JSStringGetLength(stringRef);
        return napi_ok;
    }
    size_t length = JSStringGetUTF8CString(stringRef, buf, bufsize);
    if (result)
    {
        *result = length;
    }
    JSStringRelease(stringRef);
    return napi_ok;
}

napi_status napi_is_exception_pending(napi_env env, bool* result) {
    // stub
    *result = false;
    return napi_ok;
}


JSValueRef JSCFunctionCallback(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception)
{
    auto iter = constructorCB.find(function);
    assert(iter != constructorCB.end());
    JSC_cbInfo *cbInfo = iter->second;
    
    CallbackInfo callbackInfo;
    callbackInfo.argc = argumentCount;
    OpaqueJSValue ** valueRef = const_cast<OpaqueJSValue **>(arguments);
    callbackInfo.argv = reinterpret_cast<napi_value*>(valueRef);
    callbackInfo.data = cbInfo->data;
    callbackInfo.thisArg = reinterpret_cast<napi_value>(thisObject);
    napi_value retValue = cbInfo->cb(cbInfo->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
    
    return reinterpret_cast<JSValueRef>(retValue);
}

napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* callback_data,
                                 napi_value* result) {

    auto context = env->m_globalContext;
    //JSObjectRef globalObject = JSContextGetGlobalObject(context);
    JSStringRef str = JSStringCreateWithUTF8CString(utf8name);
    JSObjectRef function = JSObjectMakeFunctionWithCallback(context, str, JSCFunctionCallback);
    JSC_cbInfo *cbInfo = new JSC_cbInfo{cb, callback_data, nullptr, env};
    constructorCB[function] = cbInfo;
    *result = reinterpret_cast<napi_value>(function);
    JSStringRelease(str);
    return napi_ok;
}

napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               size_t argc,
                               const napi_value* argv,
                               napi_value* result) {
    auto context = env->m_globalContext;
    
    std::vector<JSValueRef> args(argc + 1);
    args[0] = reinterpret_cast<JSValueRef>(recv);
    for (size_t i = 0; i < argc; i++) {
        args[i + 1] = reinterpret_cast<JSValueRef>(argv[i]);
    }
    
    JSObjectRef globalObject = JSContextGetGlobalObject(context);
    JSValueRef jsResult = JSObjectCallAsFunction(context, reinterpret_cast<JSObjectRef>(func), /*JSObjectRef thisObject*/globalObject, argc+1, args.data(), NULL);
    
    if (result != nullptr) {
        *result = reinterpret_cast<napi_value>(const_cast<OpaqueJSValue*>(jsResult));
    }
    return napi_ok;
}

napi_status napi_open_escapable_handle_scope(napi_env env,
                                             napi_escapable_handle_scope* result) {
    *result = nullptr;
    return napi_ok;
}

napi_status napi_close_escapable_handle_scope(napi_env env,
                                              napi_escapable_handle_scope scope) {
    return napi_ok;
}

napi_status napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
    *result = nullptr;
    return napi_ok;
}

napi_status napi_close_handle_scope(napi_env env, napi_handle_scope) {
    return napi_ok;
}

napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result) {
    *result = escapee;
    return napi_ok;
}

napi_status napi_coerce_to_string(napi_env env,
                                  napi_value v,
                                  napi_value* result) {
    //JSStringRef stringRef = JSValueToStringCopy(env->m_globalContext, reinterpret_cast<JSValueRef>(v), NULL);
    //*result = JSStringGetUTF8CString(stringRef, buf, bufsize);
    //JSStringRelease(stringRef);
    //*result = reinterpret_cast<napi_value>(stringRef);
    *result = v;
    return napi_ok;
}

napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result) {
    *result = NULL;
    return napi_ok;
}

template<int functionIndex> JSValueRef JSCStaticMethod(JSContextRef ctx, JSObjectRef function, JSObjectRef object, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception){
    // vf table
    auto iter = vfTable.find(object);
    assert(iter != vfTable.end());
    
    const VFTable& vfTable = *iter->second;
    const VFTableEntry& entry = vfTable.vfTable[functionIndex];
    
    /*
    char errorStr[1024];
    size_t errorStrSize{ 0 };
    
        OpaqueJSValue *exceptionValue = const_cast<OpaqueJSValue*>(function);
        napi_get_value_string_utf8(constructorCB.begin()->second->env, reinterpret_cast<napi_value>(exceptionValue), errorStr, sizeof(errorStr), &errorStrSize);
        */
    
    CallbackInfo callbackInfo;
    callbackInfo.argc = argumentCount;
    auto jsValueRefs = const_cast<JSValueRef*>(arguments);
    auto jsValues = const_cast<OpaqueJSValue**>(jsValueRefs);
    callbackInfo.argv = reinterpret_cast<napi_value*>(jsValues);
    callbackInfo.thisArg = reinterpret_cast<napi_value>(object);
    callbackInfo.data = entry.data;
    entry.cb(vfTable.env, reinterpret_cast<napi_callback_info>(&callbackInfo));
    
    return JSValueMakeUndefined(ctx);
}

void JSCFinalize(JSObjectRef object){
    //FilesystemPrivate *fs = static_cast<FilesystemPrivate*>(JSObjectGetPrivate(object));
    //delete fs;
    // todo
}

JSObjectRef JSCCallAsConstructor(JSContextRef ctx, JSObjectRef constructor, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception){
    /*FilesystemPrivate *fs = new FilesystemPrivate();
    
    JSStringRef pathString = JSValueToStringCopy(ctx, arguments[0], nullptr);
    setAttributes(fs, JSStringToStdString(pathString));
    JSObjectSetPrivate(constructor, static_cast<void*>(fs));
    */
    auto iter = constructorCB.find(constructor);
    assert(iter != constructorCB.end());
    JSC_cbInfo *cbInfo = iter->second;
    
    
    assert(JSObjectIsConstructor(ctx, constructor));
    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSObjectMake(ctx, cbInfo->classRef, NULL));
    napi_value value = reinterpret_cast<napi_value>(jsValue);
    
    vfTable[jsValue] = &cbInfo->vfTable;
    
    // callback will wrap the pointer itself
    CallbackInfo callbackInfo;
    callbackInfo.argc = argumentCount;
    auto jsValueRefs = const_cast<JSValueRef*>(arguments);
    auto jsValues = const_cast<OpaqueJSValue**>(jsValueRefs);
    callbackInfo.argv = reinterpret_cast<napi_value*>(jsValues);
    callbackInfo.thisArg = value;
    callbackInfo.data = cbInfo->data;
    callbackInfo.isConstructCall = true;
    cbInfo->cb(cbInfo->env, reinterpret_cast<napi_callback_info>(&callbackInfo));
    
    return jsValue;
}

bool JSCSetProperty(JSContextRef ctx, JSObjectRef object, JSStringRef propertyName, JSValueRef value, JSValueRef* exception)
{
    return false;
}

JSValueRef JSCGetProperty(JSContextRef ctx, JSObjectRef object, JSStringRef propertyName, JSValueRef* exception)
{
    auto iter = constructorCB.find(object);
    assert(iter != constructorCB.end());
    return JSValueMakeUndefined(ctx);
}

napi_status napi_define_class(napi_env env,
                              const char* utf8name,
                              size_t length,
                              napi_callback cb,
                              void* data,
                              size_t property_count,
                              const napi_property_descriptor* properties,
                              napi_value* result) {
    auto context = env->m_globalContext;
    JSObjectRef globalObj = JSContextGetGlobalObject(env->m_globalContext);
    
    
    JSStringRef str = JSStringCreateWithUTF8CString(utf8name);

    JSClassDefinition classDefinition = kJSClassDefinitionEmpty;
    classDefinition.className = utf8name;
    classDefinition.attributes = kJSClassAttributeNone;
    /*classDefinition.staticFunctions = staticFunctions;
    classDefinition.staticValues = staticValues;
    */
    classDefinition.finalize = JSCFinalize;
    //classDefinition.callAsConstructor = JSCCallAsConstructor;
        

    int instancePropertyCount = 0;
    int staticPropertyCount = 0;
    for (size_t i = 0; i < property_count; i++) {
        if ((properties[i].attributes & napi_static) != 0) {
          staticPropertyCount++;
        } else {
          instancePropertyCount++;
        }
    }

    std::vector<napi_property_descriptor> staticDescriptors;
    std::vector<napi_property_descriptor> instanceDescriptors;
    staticDescriptors.reserve(staticPropertyCount);
    instanceDescriptors.reserve(instancePropertyCount);

    for (size_t i = 0; i < property_count; i++) {
        if ((properties[i].attributes & napi_static) != 0) {
          staticDescriptors.push_back(properties[i]);
        } else {
          instanceDescriptors.push_back(properties[i]);
        }
    }

    JSStaticValue* staticValues = new JSStaticValue[staticPropertyCount+1];
    for (auto i = 0;i<staticPropertyCount;i++)
    {
        staticValues[i] = {instanceDescriptors[i].utf8name, JSCGetProperty, JSCSetProperty, kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete};
    }
    staticValues[staticPropertyCount] = {0, 0, 0, 0};
    
    classDefinition.staticValues = staticValues;
    
    
    JSStaticFunction *staticFunctions = new JSStaticFunction[instancePropertyCount+1];
    assert(instancePropertyCount<60);
    VFTable vfTable;
    vfTable.env = env;
    vfTable.vfTable.resize(instancePropertyCount);
    for (auto i = 0;i<instancePropertyCount;i++)
    {
        JSObjectCallAsFunctionCallback method{ nullptr };
        if (i == 0) method = JSCStaticMethod<0>;
        if (i == 1) method = JSCStaticMethod<1>;
        if (i == 2) method = JSCStaticMethod<2>;
        if (i == 3) method = JSCStaticMethod<3>;
        if (i == 4) method = JSCStaticMethod<4>;
        if (i == 5) method = JSCStaticMethod<5>;
        if (i == 6) method = JSCStaticMethod<6>;
        if (i == 7) method = JSCStaticMethod<7>;
        if (i == 8) method = JSCStaticMethod<8>;
        if (i == 9) method = JSCStaticMethod<9>;
        if (i == 10) method = JSCStaticMethod<10>;
        if (i == 11) method = JSCStaticMethod<11>;
        if (i == 12) method = JSCStaticMethod<12>;
        if (i == 13) method = JSCStaticMethod<13>;
        if (i == 14) method = JSCStaticMethod<14>;
        if (i == 15) method = JSCStaticMethod<15>;
        if (i == 16) method = JSCStaticMethod<16>;
        if (i == 17) method = JSCStaticMethod<17>;
        if (i == 18) method = JSCStaticMethod<18>;
        if (i == 19) method = JSCStaticMethod<19>;
        if (i == 20) method = JSCStaticMethod<20>;
        if (i == 21) method = JSCStaticMethod<21>;
        if (i == 22) method = JSCStaticMethod<22>;
        if (i == 23) method = JSCStaticMethod<23>;
        if (i == 24) method = JSCStaticMethod<24>;
        if (i == 25) method = JSCStaticMethod<25>;
        if (i == 26) method = JSCStaticMethod<26>;
        if (i == 27) method = JSCStaticMethod<27>;
        if (i == 28) method = JSCStaticMethod<28>;
        if (i == 29) method = JSCStaticMethod<29>;
        if (i == 30) method = JSCStaticMethod<30>;
        if (i == 31) method = JSCStaticMethod<31>;
        if (i == 32) method = JSCStaticMethod<32>;
        if (i == 33) method = JSCStaticMethod<33>;
        if (i == 34) method = JSCStaticMethod<34>;
        if (i == 35) method = JSCStaticMethod<35>;
        if (i == 36) method = JSCStaticMethod<36>;
        if (i == 37) method = JSCStaticMethod<37>;
        if (i == 38) method = JSCStaticMethod<38>;
        if (i == 39) method = JSCStaticMethod<39>;
        if (i == 40) method = JSCStaticMethod<40>;
        if (i == 41) method = JSCStaticMethod<41>;
        if (i == 42) method = JSCStaticMethod<42>;
        if (i == 43) method = JSCStaticMethod<43>;
        if (i == 44) method = JSCStaticMethod<44>;
        if (i == 45) method = JSCStaticMethod<45>;
        if (i == 46) method = JSCStaticMethod<46>;
        if (i == 47) method = JSCStaticMethod<47>;
        if (i == 48) method = JSCStaticMethod<48>;
        if (i == 49) method = JSCStaticMethod<49>;
        if (i == 50) method = JSCStaticMethod<50>;
        if (i == 51) method = JSCStaticMethod<51>;
        if (i == 52) method = JSCStaticMethod<52>;
        if (i == 53) method = JSCStaticMethod<53>;
        if (i == 54) method = JSCStaticMethod<54>;
        if (i == 55) method = JSCStaticMethod<55>;
        if (i == 56) method = JSCStaticMethod<56>;
        if (i == 57) method = JSCStaticMethod<57>;
        if (i == 58) method = JSCStaticMethod<58>;
        if (i == 59) method = JSCStaticMethod<59>;
        staticFunctions[i] = {instanceDescriptors[i].utf8name, method, kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete};
        vfTable.vfTable[i] = {instanceDescriptors[i].method, instanceDescriptors[i].data};
    }
    staticFunctions[instancePropertyCount] = {0, 0, 0};

    classDefinition.staticFunctions = staticFunctions;


    JSClassRef classDef = JSClassCreate(&classDefinition);
    JSObjectRef ctor = JSObjectMakeConstructor(context, classDef, JSCCallAsConstructor);
    JSObjectSetProperty(context, globalObj, str, ctor, kJSPropertyAttributeNone, nullptr);
    
    
    JSObjectRef classObj = JSObjectMake(context, classDef, NULL);
    //JSObjectSetProperty(context, globalObj, str, classObj, kJSPropertyAttributeNone, NULL);

    JSC_cbInfo *cbInfo = new JSC_cbInfo{cb, data, classDef, env, vfTable};
    constructorCB[ctor] = cbInfo;
    //assert(JSObjectSetPrivate(classObj, static_cast<void*>(cbInfo)));
#if 0

  JSValueRef constructor;
  JSValueRef prototype = nullptr;
/*
  jsrtimpl::ExternalCallback* externalCallback =
    new jsrtimpl::ExternalCallback(env, cb, data);
  if (externalCallback == nullptr) {
    return napi_set_last_error(napi_generic_failure);
  }

  
  CHECK_JSRT(JsCreateEnhancedFunction(jsrtimpl::ExternalCallback::Callback,
                                      namestring,
                                      externalCallback,
                                      &constructor));

  CHECK_JSRT(JsSetObjectBeforeCollectCallback(
    constructor, externalCallback, jsrtimpl::ExternalCallback::Finalize));

  JsPropertyIdRef pid = nullptr;
  
  CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("prototype"), &pid));
  CHECK_JSRT(JsGetProperty(constructor, pid, &prototype));

  CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("constructor"), &pid));
  CHECK_JSRT(JsSetProperty(prototype, pid, constructor, false));
*/
  int instancePropertyCount = 0;
  int staticPropertyCount = 0;
  for (size_t i = 0; i < property_count; i++) {
    if ((properties[i].attributes & napi_static) != 0) {
      staticPropertyCount++;
    } else {
      instancePropertyCount++;
    }
  }

  std::vector<napi_property_descriptor> staticDescriptors;
  std::vector<napi_property_descriptor> instanceDescriptors;
  staticDescriptors.reserve(staticPropertyCount);
  instanceDescriptors.reserve(instancePropertyCount);

  for (size_t i = 0; i < property_count; i++) {
    if ((properties[i].attributes & napi_static) != 0) {
      staticDescriptors.push_back(properties[i]);
    } else {
      instanceDescriptors.push_back(properties[i]);
    }
  }

  if (staticPropertyCount > 0) {
    /*CHECK_NAPI*/(napi_define_properties(env,
                                      reinterpret_cast<napi_value>(classObj),
                                      staticDescriptors.size(),
                                      staticDescriptors.data()));
  }

  if (instancePropertyCount > 0) {
    /*CHECK_NAPI*/(napi_define_properties(env,
                                      reinterpret_cast<napi_value>(classObj),
                                      instanceDescriptors.size(),
                                      instanceDescriptors.data()));
  }

  //*result = reinterpret_cast<napi_value>(constructor);

#endif
    //JSStringRelease(str);
    *result = reinterpret_cast<napi_value>(ctor);
    return napi_ok;
}

napi_status napi_get_array_length(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length) {
    assert(0);
    return napi_ok;
}


napi_status napi_get_cb_info(
    napi_env env,               // [in] NAPI environment handle
    napi_callback_info cbinfo,  // [in] Opaque callback-info handle
    size_t* argc,      // [in-out] Specifies the size of the provided argv array
                       // and receives the actual count of args.
    napi_value* argv,  // [out] Array of values
    napi_value* this_arg,  // [out] Receives the JS 'this' arg for the call
    void** data) {         // [out] Receives the data pointer for the callback.
  
    CallbackInfo * callbackInfo = reinterpret_cast<CallbackInfo*>(cbinfo);
    if (this_arg) {
        *this_arg = callbackInfo->thisArg;
    }
    if (argc) {
        *argc = callbackInfo->argc;
    }
    //*argv = callbackInfo->argv;
    if (data) {
        *data = callbackInfo->data;
    }
    if (argv != nullptr) {
        //CHECK_ARG(argc);
        
        size_t i = 0;
        size_t min = std::min(*argc, static_cast<size_t>(callbackInfo->argc));
        
        for (; i < min; i++) {
            argv[i] = callbackInfo->argv[i];
        }
        
        if (i < *argc) {
            napi_value undefined;
            napi_get_undefined(env, &undefined);
            for (; i < *argc; i++) {
                argv[i] = undefined;
            }
        }
    }
    
    return napi_ok;
}

napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_get_global(napi_env env, napi_value* result) {

    JSObjectRef contextObject = JSContextGetGlobalObject(env->m_globalContext);
    *result = reinterpret_cast<napi_value>(contextObject);
    return napi_ok;
}

napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result) {
    const CallbackInfo* info = reinterpret_cast<CallbackInfo*>(cbinfo);
    if (info->isConstructCall) {
        *result = info->newTarget;
    } else {
        *result = nullptr;
    }
    return napi_ok;
}

napi_status napi_get_null(napi_env env, napi_value* result) {

    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSValueMakeNull(env->m_globalContext));
    *result = reinterpret_cast<napi_value>(jsValue);
    return napi_ok;
}

napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset) {
    JSValueRef exception;
    auto context = env->m_globalContext;
    JSObjectRef array = reinterpret_cast<JSObjectRef>(typedarray);
    JSObjectRef typedObject = JSObjectGetTypedArrayBuffer(context, array, NULL);
    void* arrayData = JSObjectGetArrayBufferBytesPtr(context, typedObject, &exception); // temporary
    if (!arrayData)
    {
        dumpException(env, exception);
    }
    
    
    size_t arrayByteOffset = JSObjectGetTypedArrayByteOffset(context, array, NULL);
    size_t elementCount = JSObjectGetTypedArrayLength(context, array, nullptr);
    JSTypedArrayType jsType = JSValueGetTypedArrayType(context, array, nullptr);
    if (type != nullptr) {
        switch (jsType) {
            case kJSTypedArrayTypeInt8Array:
                *type = napi_int8_array;
                break;
            case kJSTypedArrayTypeUint8Array:
                *type = napi_uint8_array;
                break;
            case kJSTypedArrayTypeUint8ClampedArray:
                *type = napi_uint8_clamped_array;
                break;
            case kJSTypedArrayTypeInt16Array:
                *type = napi_int16_array;
                break;
            case kJSTypedArrayTypeUint16Array:
                *type = napi_uint16_array;
                break;
            case kJSTypedArrayTypeInt32Array:
                *type = napi_int32_array;
                break;
            case kJSTypedArrayTypeUint32Array:
                *type = napi_uint32_array;
                break;
            case kJSTypedArrayTypeFloat32Array:
                *type = napi_float32_array;
                break;
            case kJSTypedArrayTypeFloat64Array:
                *type = napi_float64_array;
                break;
            default:
                assert(0);
                //return napi_set_last_error(napi_generic_failure);
        }
    }

    if (length != nullptr) {
        *length = elementCount;//static_cast<size_t>(byteLength / elementSize);
    }
    
    if (data != nullptr) {
        *data = static_cast<uint8_t*>(arrayData);
    }
    
    if (arraybuffer != nullptr) {
        *arraybuffer = reinterpret_cast<napi_value>(typedObject);
    }
    
    if (byte_offset != nullptr) {
        *byte_offset = arrayByteOffset;
    }
    
    return napi_ok;
}                                         

napi_status napi_get_value_bool(napi_env env, napi_value v, bool* result) {
    bool boolean = JSValueToBoolean(env->m_globalContext, reinterpret_cast<JSValueRef>(v));
    *result = boolean;
    return napi_ok;
}

napi_status napi_get_value_double(napi_env env, napi_value v, double* result) {
    double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), NULL);
    *result = dblValue;
    return napi_ok;
}

napi_status napi_get_value_int32(napi_env env, napi_value v, int32_t* result) {
    double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), NULL);
    *result = int32_t(dblValue);
    return napi_ok;
}

napi_status napi_get_value_uint32(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {
    double dblValue = JSValueToNumber(env->m_globalContext, reinterpret_cast<JSValueRef>(v), NULL);
    *result = uint32_t(dblValue);
    return napi_ok;
}

napi_status napi_run_script(napi_env env,
                            napi_value script,
                            const char* sourceUrl,
                            napi_value* result) {
    JSStringRef statement = reinterpret_cast<JSStringRef>(script);
    JSValueRef exception;
    OpaqueJSValue *retValue = const_cast<OpaqueJSValue*>(JSEvaluateScript(env->m_globalContext, statement, nullptr, nullptr, 1, &exception));
    if (!retValue)
    {
        dumpException(env, exception);
    }
    *result = reinterpret_cast<napi_value>(retValue);
    return napi_ok;
}

napi_status napi_typeof(napi_env env, napi_value vv, napi_valuetype* result) {

    JSType valueType = JSValueGetType(env->m_globalContext, reinterpret_cast<JSValueRef>(vv));
    switch (valueType) {
        case kJSTypeUndefined: *result = napi_undefined; break;
        case kJSTypeNull: *result = napi_null; break;
        case kJSTypeNumber: *result = napi_number; break;
        case kJSTypeString: *result = napi_string; break;
        case kJSTypeBoolean: *result = napi_boolean; break;
        case kJSTypeObject: *result = napi_object; break;
        default:
            assert(0);
        //case JsSymbol: *result = napi_symbol; break;
        //case JsError: *result = napi_object; break;
        /*
        default:
            bool hasExternalData;
            if (JsHasExternalData(value, &hasExternalData) != JsNoError) {
                hasExternalData = false;
            }
            
            *result = hasExternalData ? napi_external : napi_object;
            break;*/
    }
    return napi_ok;
}


napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result) {
    JSObjectRef object = reinterpret_cast<JSObjectRef>(js_object);
    assert(JSObjectSetPrivate(object, native_object));
    return napi_ok;
}


napi_status napi_unwrap(napi_env env, napi_value js_object, void** result) {
    JSObjectRef object = reinterpret_cast<JSObjectRef>(js_object);
    *result = JSObjectGetPrivate(object);
    return napi_ok;
}

napi_status napi_throw_type_error(napi_env env,
                                  const char* code,
                                  const char* msg) {
    assert(0);
    return napi_ok;
}

napi_status napi_throw(napi_env env, napi_value error) {
    assert(0);
    return napi_ok;
}

napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result) {
    assert(0);
    return napi_ok;
}

napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value value) {
    auto context = env->m_globalContext;
    JSObjectRef globalObject = JSContextGetGlobalObject(context);
    JSStringRef propertyName = JSStringCreateWithUTF8CString(utf8name);
    JSValueRef jsValue = reinterpret_cast<JSValueRef>(value);
    JSObjectSetProperty(context, globalObject, propertyName, jsValue, kJSPropertyAttributeNone, NULL/*&exception*/);
    JSStringRelease(propertyName);
    return napi_ok;
}

napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value v) {
    assert(0);
    return napi_ok;
}

napi_status napi_new_instance(napi_env env,
                              napi_value constructor,
                              size_t argc,
                              const napi_value* argv,
                              napi_value* result) {
    JSObjectRef ctor = reinterpret_cast<JSObjectRef>(constructor);

    auto iter = constructorCB.find(ctor);
    assert(iter != constructorCB.end());

    JSC_cbInfo *cbInfo = iter->second;
    
    assert(JSObjectIsConstructor(env->m_globalContext, ctor));
    OpaqueJSValue* jsValue = const_cast<OpaqueJSValue*>(JSObjectCallAsConstructor(env->m_globalContext, ctor, argc, reinterpret_cast<const JSValueRef*>(argv), NULL));
    napi_value value = reinterpret_cast<napi_value>(jsValue);
    
    *result = value;
    return napi_ok;
}

JSValueRef JSObjectCallAsFunctionCallbackDefault (JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception)
{
    assert(0);
    return JSValueMakeNull(ctx);
}

napi_status napi_define_properties(napi_env env,
                                   const napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties) {
    return napi_ok;
JSObjectRef obj = reinterpret_cast<JSObjectRef>(object);
auto context = env->m_globalContext;

for (size_t i = 0; i < property_count; i++) {
    const napi_property_descriptor* p = properties + i;

    /*JsValueRef descriptor;
    CHECK_JSRT(JsCreateObject(&descriptor));

    JsValueRef configurable;
    CHECK_JSRT(
      JsBoolToBoolean((p->attributes & napi_configurable), &configurable));
    CHECK_JSRT(
      JsSetProperty(descriptor, configurableProperty, configurable, true));

    JsValueRef enumerable;
    CHECK_JSRT(JsBoolToBoolean((p->attributes & napi_enumerable), &enumerable));
    CHECK_JSRT(JsSetProperty(descriptor, enumerableProperty, enumerable, true));
*/
    JSStringRef str;
    if (p->utf8name)
    {
     str = JSStringCreateWithUTF8CString(p->utf8name);
    }
    else //if(p->name)
    {
        str = reinterpret_cast<JSStringRef>(p->name);
    }

    if (p->getter != nullptr || p->setter != nullptr) {
      /*napi_value property_name;
      CHECK_NAPI(
        jsrtimpl::JsNameValueFromPropertyDescriptor(p, &property_name));
*/
      if (p->getter != nullptr) {
  /*      JsPropertyIdRef getProperty;
        CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("get"), &getProperty));
        JsValueRef getter;
        CHECK_NAPI(napi_create_property_function(env, property_name,
          p->getter, p->data, reinterpret_cast<napi_value*>(&getter)));
        CHECK_JSRT(JsSetProperty(descriptor, getProperty, getter, true));*/
          
          JSObjectRef funcObj = JSObjectMakeFunctionWithCallback(context, str, JSObjectCallAsFunctionCallbackDefault);
          JSObjectSetProperty(context, obj, str, funcObj, kJSPropertyAttributeNone, NULL/*&exception*/);
      }

      if (p->setter != nullptr) {
        /*JsPropertyIdRef setProperty;
        CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("set"), &setProperty));
        JsValueRef setter;
        CHECK_NAPI(napi_create_property_function(env, property_name,
          p->setter, p->data, reinterpret_cast<napi_value*>(&setter)));
        CHECK_JSRT(JsSetProperty(descriptor, setProperty, setter, true));*/
          JSObjectRef funcObj = JSObjectMakeFunctionWithCallback(context, str, JSObjectCallAsFunctionCallbackDefault);
          JSObjectSetProperty(context, obj, str, funcObj, kJSPropertyAttributeNone, NULL/*&exception*/);
      }
    } else if (p->method != nullptr) {
      JSObjectRef funcObj = JSObjectMakeFunctionWithCallback(context, str, JSObjectCallAsFunctionCallbackDefault);
      JSObjectSetProperty(context, obj, str, funcObj, kJSPropertyAttributeNone, NULL/*&exception*/);
      /*napi_value property_name;
      CHECK_NAPI(
        jsrtimpl::JsNameValueFromPropertyDescriptor(p, &property_name));

      JsPropertyIdRef valueProperty;
      CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("value"), &valueProperty));
      JsValueRef method;
      CHECK_NAPI(napi_create_property_function(env, property_name,
        p->method, p->data, reinterpret_cast<napi_value*>(&method)));
      CHECK_JSRT(JsSetProperty(descriptor, valueProperty, method, true));*/
    } else {
      /*RETURN_STATUS_IF_FALSE(p->value != nullptr, napi_invalid_arg);

      JsPropertyIdRef writableProperty;
      CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("writable"),
                                    &writableProperty));
      JsValueRef writable;
      CHECK_JSRT(JsBoolToBoolean((p->attributes & napi_writable), &writable));
      CHECK_JSRT(JsSetProperty(descriptor, writableProperty, writable, true));

      JsPropertyIdRef valueProperty;
      CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("value"), &valueProperty));
      CHECK_JSRT(JsSetProperty(descriptor, valueProperty,
        reinterpret_cast<JsValueRef>(p->value), true));*/
    }

    /*JsPropertyIdRef nameProperty;
    CHECK_NAPI(jsrtimpl::JsPropertyIdFromPropertyDescriptor(p, &nameProperty));
    bool result;
    CHECK_JSRT(JsDefineProperty(
      reinterpret_cast<JsValueRef>(object),
      reinterpret_cast<JsPropertyIdRef>(nameProperty),
      reinterpret_cast<JsValueRef>(descriptor),
      &result));
      */
    if (p->utf8name)
    {
     //JSStringRelease(str);
    }
  }



    return napi_ok;
}

napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result) {

    JSObjectRef jsObject = JSObjectMake(env->m_globalContext, NULL, data);
    *result = reinterpret_cast<napi_value>(jsObject);
    return napi_ok;
}

napi_status napi_get_value_external(napi_env env, napi_value v, void** result) {
    assert(0);
    return napi_ok;
}

napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result) {
    assert(0);
    return napi_ok;
}
