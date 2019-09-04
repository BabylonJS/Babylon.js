#include <napi/js_native_api.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScriptCore.h"
#include "js_native_api_JavaScriptCore.h"
#include <string>
#include <vector>

// This does not call napi_set_last_error because the expression
// is assumed to be a NAPI function call that already did.
#define CHECK_NAPI(expr)                                                \
  do {                                                                  \
    napi_status status = (expr);                                        \
    if (status != napi_ok) return status;                               \
  } while (0)

napi_status napi_close_escapable_handle_scope(napi_env env,
  napi_escapable_handle_scope scope) {
    // stub
    return napi_ok;
}

napi_status napi_create_double(napi_env env,
                               double value,
                               napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_error(napi_env env,
                              napi_value code,
                              napi_value msg,
                              napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_reference(napi_env env,
                                  napi_value v,
                                  uint32_t initial_refcount,
                                  napi_ref* result) {
    // stub
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
    // stub
    return napi_ok;
}

napi_status napi_delete_reference(napi_env env, napi_ref ref) {
    // stub
    return napi_ok;
}

napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_boolean(napi_env env, bool value, napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_last_error_info(napi_env env,
                                     const napi_extended_error_info** result) {
    // stub
    return napi_ok;
}

napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_reference_value(napi_env env,
                                     napi_ref ref,
                                     napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_undefined(napi_env env, napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result) {
    // stub
    return napi_ok;
}

napi_status napi_is_exception_pending(napi_env env, bool* result) {
    // stub
    return napi_ok;
}

napi_status napi_open_escapable_handle_scope(napi_env env,
  napi_escapable_handle_scope* result) {
    // stub
    return napi_ok;
}

napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result) {
    // stub
    return napi_ok;
}

napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* callback_data,
                                 napi_value* result) {
    // stub
    return napi_ok;
}

napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               size_t argc,
                               const napi_value* argv,
                               napi_value* result) {

  return napi_ok;
}

napi_status napi_close_handle_scope(napi_env env, napi_handle_scope) {
  return napi_ok;
}

napi_status napi_coerce_to_string(napi_env env,
                                  napi_value v,
                                  napi_value* result) {
  return napi_ok;
}

napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result) {
  return napi_ok;
}

napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result) {
  return napi_ok;
}

napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result) {
  return napi_ok;
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


  JSStringRef str = JSStringCreateWithUTF8CString(utf8name);

  JSClassDefinition classDefinition = kJSClassDefinitionEmpty;


  JSClassRef classDef = JSClassCreate(&classDefinition);
  JSObjectRef classObj = JSObjectMake(context, classDef, context);
  JSObjectRef globalObj = JSContextGetGlobalObject(env->m_globalContext);

  JSObjectSetProperty(context, globalObj, str, classObj, kJSPropertyAttributeNone, NULL);

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
                                      nullptr,//reinterpret_cast<napi_value>(constructor),
                                      staticDescriptors.size(),
                                      staticDescriptors.data()));
  }

  if (instancePropertyCount > 0) {
    /*CHECK_NAPI*/(napi_define_properties(env,
                                      nullptr,//reinterpret_cast<napi_value>(prototype),
                                      instanceDescriptors.size(),
                                      instanceDescriptors.data()));
  }

  //*result = reinterpret_cast<napi_value>(constructor);


  JSStringRelease(str);

  return napi_ok;
}

napi_status napi_get_array_length(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {

  return napi_ok;
}

napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length) {
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
  
  return napi_ok;
}

napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value* result) {
  return napi_ok;
}

napi_status napi_get_global(napi_env env, napi_value* result) {

  return napi_ok;
}

napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result) {
  return napi_ok;
}

napi_status napi_get_null(napi_env env, napi_value* result) {

  return napi_ok;
}

napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset) {
  return napi_ok;
}                                         

napi_status napi_get_value_bool(napi_env env, napi_value v, bool* result) {
  return napi_ok;
}

napi_status napi_get_value_double(napi_env env, napi_value v, double* result) {

  return napi_ok;
}

napi_status napi_get_value_int32(napi_env env, napi_value v, int32_t* result) {

  return napi_ok;
}

napi_status napi_get_value_uint32(napi_env env,
                                  napi_value v,
                                  uint32_t* result) {
  return napi_ok;
}

napi_status napi_run_script(napi_env env,
                            napi_value script,
                            const char* sourceUrl,
                            napi_value* result) {

  JSStringRef statement = reinterpret_cast<JSStringRef>(script);
  JSValueRef retValue = JSEvaluateScript(env->m_globalContext, statement, nullptr, nullptr, 1,nullptr);
  return napi_ok;
}

napi_status napi_typeof(napi_env env, napi_value vv, napi_valuetype* result) {

  return napi_ok;
}

napi_status napi_unwrap(napi_env env, napi_value js_object, void** result) {
  return napi_ok;
}

napi_status napi_throw_type_error(napi_env env,
                                  const char* code,
                                  const char* msg) {
  return napi_ok;
}

napi_status napi_throw(napi_env env, napi_value error) {
  return napi_ok;
}

napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result) {

  return napi_ok;
}

napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value value) {
  return napi_ok;
}

napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value v) {
  return napi_ok;
}

napi_status napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
  return napi_ok;
}

napi_status napi_new_instance(napi_env env,
                              napi_value constructor,
                              size_t argc,
                              const napi_value* argv,
                              napi_value* result) {
  return napi_ok;
}


napi_status napi_define_properties(napi_env env,
                                   const napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties) {


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
      }

      if (p->setter != nullptr) {
        /*JsPropertyIdRef setProperty;
        CHECK_JSRT(JsCreatePropertyId(STR_AND_LENGTH("set"), &setProperty));
        JsValueRef setter;
        CHECK_NAPI(napi_create_property_function(env, property_name,
          p->setter, p->data, reinterpret_cast<napi_value*>(&setter)));
        CHECK_JSRT(JsSetProperty(descriptor, setProperty, setter, true));*/
      }
    } else if (p->method != nullptr) {
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
  }



  return napi_ok;
}

napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result) {
  return napi_ok;
}

napi_status napi_get_value_external(napi_env env, napi_value v, void** result) {
  return napi_ok;
}

napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result) {
  return napi_ok;
}
