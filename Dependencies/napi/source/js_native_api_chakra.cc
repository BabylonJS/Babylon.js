#include "js_native_api_chakra.h"
#include <napi/js_native_api.h>
#include <array>
#include <cassert>
#include <cmath>
#include <vector>
#include <string>
#include <stdexcept>

namespace {
constexpr UINT CP_LATIN1 = 28591;

std::wstring NarrowToWide(std::string_view value, UINT codePage = CP_UTF8) {
  if (value.size() == 0) {
    return {};
  }

  int requiredSize = ::MultiByteToWideChar(codePage, 0, value.data(), static_cast<int>(value.size()), nullptr, 0);
  assert(requiredSize != 0);
  std::wstring wstr(requiredSize, 0);
  int result = ::MultiByteToWideChar(codePage, 0, value.data(), static_cast<int>(value.size()), &wstr[0], requiredSize);
  assert(result != 0);
  return std::move(wstr);
}

JsErrorCode JsCreateString(_In_ const char* content, _In_ size_t length, _Out_ JsValueRef* value) {
  auto str = (length == NAPI_AUTO_LENGTH ? NarrowToWide({ content }) : NarrowToWide({ content, length }));
  return JsPointerToString(str.data(), str.size(), value);
}

JsErrorCode JsCopyString(_In_ JsValueRef value, _Out_opt_ char* buffer, _In_ size_t bufferSize, _Out_opt_ size_t* length, UINT codePage = CP_UTF8) {
  const wchar_t* stringValue;
  size_t stringLength;
  CHECK_JSRT_ERROR_CODE(JsStringToPointer(value, &stringValue, &stringLength));

  if (length != nullptr) {
    *length = stringLength;
  }

  if (buffer != nullptr) {
    int result = ::WideCharToMultiByte(codePage, 0, stringValue, static_cast<int>(stringLength), buffer, static_cast<int>(bufferSize), nullptr, nullptr);
    assert(result != 0);
  }

  return JsErrorCode::JsNoError;
}

JsErrorCode JsCopyStringUtf16(_In_ JsValueRef value, _Out_opt_ char16_t* buffer, _In_ size_t bufferSize, _Out_opt_ size_t* length) {
  const wchar_t* stringValue;
  size_t stringLength;
  CHECK_JSRT_ERROR_CODE(JsStringToPointer(value, &stringValue, &stringLength));

  if (length != nullptr) {
    *length = stringLength;
  }

  if (buffer != nullptr) {
    static_assert(sizeof(char16_t) == sizeof(wchar_t));
    memcpy_s(buffer, bufferSize, stringValue, stringLength * sizeof(wchar_t));
  }

  return JsErrorCode::JsNoError;
}

JsErrorCode JsCreatePropertyId(_In_z_ const char* name, _In_ size_t length, _Out_ JsPropertyIdRef* propertyId) {
  auto str = (length == NAPI_AUTO_LENGTH ? NarrowToWide({ name }) : NarrowToWide({ name, length }));
  return JsGetPropertyIdFromName(str.data(), propertyId);
}

JsErrorCode JsCreatePromise(JsValueRef* promise, JsValueRef* resolve, JsValueRef* reject) {
  JsValueRef global{};
  CHECK_JSRT_ERROR_CODE(JsGetGlobalObject(&global));

  JsPropertyIdRef promiseConstructorId{};
  CHECK_JSRT_ERROR_CODE(JsGetPropertyIdFromName(L"Promise", &promiseConstructorId));

  JsValueRef promiseConstructor{};
  CHECK_JSRT_ERROR_CODE(JsGetProperty(global, promiseConstructorId, &promiseConstructor));

  struct CallbackStruct {
    static JsValueRef CALLBACK Callback(JsValueRef callee, bool isConstructCall, JsValueRef* arguments, unsigned short argumentCount, void* callbackState) {
      return (reinterpret_cast<CallbackStruct*>(callbackState))->Callback(callee, isConstructCall, arguments, argumentCount);
    }

    JsValueRef Callback(JsValueRef callee, bool isConstructCall, JsValueRef* arguments, unsigned short argumentCount) {
      *resolve = arguments[1];
      *reject = arguments[2];

      return JS_INVALID_REFERENCE;
    }

    JsValueRef* resolve{};
    JsValueRef* reject{};
  } cbs{ resolve, reject };

  JsValueRef callbackFunction{};
  CHECK_JSRT_ERROR_CODE(JsCreateFunction(&CallbackStruct::Callback, &cbs, &callbackFunction));

  JsValueRef args[2];
  CHECK_JSRT_ERROR_CODE(JsGetUndefinedValue(&args[0]));
  args[1] = callbackFunction;
  CHECK_JSRT_ERROR_CODE(JsConstructObject(promiseConstructor, args, 2, promise));

  return JsErrorCode::JsNoError;
}

// Callback Info struct as per JSRT native function.
struct CallbackInfo {
  napi_value newTarget;
  napi_value thisArg;
  napi_value* argv;
  void* data;
  uint16_t argc;
  bool isConstructCall;
};

// Adapter for JSRT external data + finalize callback.
class ExternalData {
 public:
  ExternalData(napi_env env, void* data, napi_finalize finalize_cb, void* hint)
    : _env(env)
    , _data(data)
    , _cb(finalize_cb)
    , _hint(hint) {
  }

  void* Data() {
    return _data;
  }

  // JsFinalizeCallback
  static void CALLBACK Finalize(void* callbackState) {
    ExternalData* externalData =
      reinterpret_cast<ExternalData*>(callbackState);
    if (externalData != nullptr) {
      if (externalData->_cb != nullptr) {
        externalData->_cb(
          externalData->_env, externalData->_data, externalData->_hint);
      }

      delete externalData;
    }
  }

 private:
  napi_env _env;
  void* _data;
  napi_finalize _cb;
  void* _hint;
};

// Adapter for JSRT external callback + callback data.
class ExternalCallback {
 public:
  ExternalCallback(napi_env env, napi_callback cb, void* data)
    : _env(env), _cb(cb), _data(data) {
  }

  // JsNativeFunction
  static JsValueRef CALLBACK Callback(JsValueRef callee, bool isConstructCall, JsValueRef* arguments, unsigned short argumentCount, void* callbackState) {
    ExternalCallback* externalCallback =
      reinterpret_cast<ExternalCallback*>(callbackState);

    // Make sure any errors encountered last time we were in N-API are gone.
    napi_clear_last_error(externalCallback->_env);

    CallbackInfo cbInfo;
    cbInfo.thisArg = reinterpret_cast<napi_value>(arguments[0]);
    cbInfo.newTarget = reinterpret_cast<napi_value>(externalCallback->newTarget);
    cbInfo.isConstructCall = isConstructCall;
    cbInfo.argc = argumentCount - 1;
    cbInfo.argv = reinterpret_cast<napi_value*>(arguments + 1);
    cbInfo.data = externalCallback->_data;

    napi_value result = externalCallback->_cb(
      externalCallback->_env, reinterpret_cast<napi_callback_info>(&cbInfo));
    return reinterpret_cast<JsValueRef>(result);
  }

  // JsObjectBeforeCollectCallback
  static void CALLBACK Finalize(JsRef ref, void* callbackState) {
    ExternalCallback* externalCallback =
      reinterpret_cast<ExternalCallback*>(callbackState);
    delete externalCallback;
  }

  // Value for 'new.target'
  JsValueRef newTarget;

 private:
  napi_env _env;
  napi_callback _cb;
  void* _data;
};

JsErrorCode JsPropertyIdFromKey(JsValueRef key, JsPropertyIdRef* propertyId) {
  JsValueType keyType;
  CHECK_JSRT_ERROR_CODE(JsGetValueType(key, &keyType));

  if (keyType == JsString) {
    const wchar_t* stringValue;
    size_t stringLength;
    CHECK_JSRT_ERROR_CODE(JsStringToPointer(key, &stringValue, &stringLength));
    CHECK_JSRT_ERROR_CODE(JsGetPropertyIdFromName(stringValue, propertyId));
  } else if (keyType == JsSymbol) {
    CHECK_JSRT_ERROR_CODE(JsGetPropertyIdFromSymbol(key, propertyId));
  } else {
    return JsErrorCode::JsErrorInvalidArgument;
  }
  return JsErrorCode::JsNoError;
}

JsErrorCode JsPropertyIdFromPropertyDescriptor(const napi_property_descriptor* p, JsPropertyIdRef* propertyId) {
  if (p->utf8name != nullptr) {
    return JsCreatePropertyId(p->utf8name, strlen(p->utf8name), propertyId);
  } else {
    return JsPropertyIdFromKey(p->name, propertyId);
  }
}

JsErrorCode JsNameValueFromPropertyDescriptor(const napi_property_descriptor* p, napi_value* name) {
  if (p->utf8name != nullptr) {
    return JsCreateString(
      p->utf8name,
      NAPI_AUTO_LENGTH,
      reinterpret_cast<JsValueRef*>(name));
  } else {
    *name = p->name;
    return JsErrorCode::JsNoError;
  }
}

inline napi_status FindWrapper(napi_env env, JsValueRef obj, JsValueRef* wrapper, JsValueRef* parent = nullptr) {
  // Search the object's prototype chain for the wrapper with external data.
  // Usually the wrapper would be the first in the chain, but it is OK for
  // other objects to be inserted in the prototype chain.
  JsValueRef candidate = obj;
  JsValueRef current = JS_INVALID_REFERENCE;
  bool hasExternalData = false;

  JsValueRef nullValue = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsGetNullValue(&nullValue));

  do {
    current = candidate;

    CHECK_JSRT(env, JsGetPrototype(current, &candidate));
    if (candidate == JS_INVALID_REFERENCE || candidate == nullValue) {
      if (parent != nullptr) {
        *parent = JS_INVALID_REFERENCE;
      }

      *wrapper = JS_INVALID_REFERENCE;
      return napi_ok;
    }

    CHECK_JSRT(env, JsHasExternalData(candidate, &hasExternalData));
  } while (!hasExternalData);

  if (parent != nullptr) {
    *parent = current;
  }

  *wrapper = candidate;

  return napi_ok;
}

inline napi_status Unwrap(napi_env env, JsValueRef obj, ExternalData** externalData, JsValueRef* wrapper = nullptr, JsValueRef* parent = nullptr) {
  JsValueRef candidate = JS_INVALID_REFERENCE;
  JsValueRef candidateParent = JS_INVALID_REFERENCE;
  CHECK_NAPI(FindWrapper(env, obj, &candidate, &candidateParent));
  RETURN_STATUS_IF_FALSE(env, candidate != JS_INVALID_REFERENCE, napi_invalid_arg);

  CHECK_JSRT(env, JsGetExternalData(candidate,
                               reinterpret_cast<void**>(externalData)));

  if (wrapper != nullptr) {
    *wrapper = candidate;
  }

  if (parent != nullptr) {
    *parent = candidateParent;
  }

  return napi_ok;
}

static napi_status SetErrorCode(napi_env env, JsValueRef error, napi_value code, const char* codeString) {
  if ((code != nullptr) || (codeString != nullptr)) {
    JsValueRef codeValue = reinterpret_cast<JsValueRef>(code);
    if (codeValue != JS_INVALID_REFERENCE) {
      JsValueType valueType = JsUndefined;
      CHECK_JSRT(env, JsGetValueType(codeValue, &valueType));
      RETURN_STATUS_IF_FALSE(env, valueType == JsString, napi_string_expected);
    } else {
      CHECK_JSRT(env, JsCreateString(codeString, NAPI_AUTO_LENGTH, &codeValue));
    }

    JsPropertyIdRef codePropId = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("code"), &codePropId));

    CHECK_JSRT(env, JsSetProperty(error, codePropId, codeValue, true));

    JsValueRef nameArray = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreateArray(0, &nameArray));

    JsPropertyIdRef pushPropId = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("push"), &pushPropId));

    JsValueRef pushFunction = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsGetProperty(nameArray, pushPropId, &pushFunction));

    JsPropertyIdRef namePropId = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("name"), &namePropId));

    bool hasProp = false;
    CHECK_JSRT(env, JsHasProperty(error, namePropId, &hasProp));

    JsValueRef nameValue = JS_INVALID_REFERENCE;
    std::array<JsValueRef, 2> args = { nameArray, JS_INVALID_REFERENCE };

    if (hasProp) {
      CHECK_JSRT(env, JsGetProperty(error, namePropId, &nameValue));

      args[1] = nameValue;
      CHECK_JSRT(env,
        JsCallFunction(pushFunction,
                       args.data(),
                       static_cast<unsigned short>(args.size()),
                       nullptr));
    }

    const char* openBracket = " [";
    JsValueRef openBracketValue = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreateString(openBracket, NAPI_AUTO_LENGTH, &openBracketValue));

    args[1] = openBracketValue;
    CHECK_JSRT(env, JsCallFunction(pushFunction, args.data(), static_cast<unsigned short>(args.size()), nullptr));

    args[1] = codeValue;
    CHECK_JSRT(env, JsCallFunction(pushFunction, args.data(), static_cast<unsigned short>(args.size()), nullptr));

    const char* closeBracket = "]";
    JsValueRef closeBracketValue = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreateString(closeBracket, NAPI_AUTO_LENGTH, &closeBracketValue));

    args[1] = closeBracketValue;
    CHECK_JSRT(env, JsCallFunction(pushFunction, args.data(), static_cast<unsigned short>(args.size()), nullptr));

    JsValueRef emptyValue = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreateString("", 0, &emptyValue));

    const char* joinPropIdName = "join";
    JsPropertyIdRef joinPropId = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsCreatePropertyId(joinPropIdName,
                                  strlen(joinPropIdName),
                                  &joinPropId));

    JsValueRef joinFunction = JS_INVALID_REFERENCE;
    CHECK_JSRT(env, JsGetProperty(nameArray, joinPropId, &joinFunction));

    args[1] = emptyValue;
    CHECK_JSRT(env,
      JsCallFunction(joinFunction,
                     args.data(),
                     static_cast<unsigned short>(args.size()),
                     &nameValue));

    CHECK_JSRT(env, JsSetProperty(error, namePropId, nameValue, true));
  }
  return napi_ok;
}

napi_status ConcludeDeferred(napi_env env, napi_deferred deferred, const char* property, napi_value result) {
  // We do not check if property is OK, because that's not coming from outside.
  CHECK_ARG(env, deferred);
  CHECK_ARG(env, result);

  napi_value container, resolver, js_null;
  napi_ref ref = reinterpret_cast<napi_ref>(deferred);

  CHECK_NAPI(napi_get_reference_value(env, ref, &container));
  CHECK_NAPI(napi_get_named_property(env, container, property, &resolver));
  CHECK_NAPI(napi_get_null(env, &js_null));
  CHECK_NAPI(napi_call_function(env, js_null, resolver, 1, &result, nullptr));
  CHECK_NAPI(napi_delete_reference(env, ref));

  return napi_ok;
}

napi_status CreatePropertyFunction(napi_env env,
                                   napi_value property_name,
                                   napi_callback cb,
                                   void* callback_data,
                                   napi_value* result) {
  CHECK_ARG(env, result);

  ExternalCallback* externalCallback =
    new ExternalCallback(env, cb, callback_data);
  if (externalCallback == nullptr) {
    return napi_set_last_error(env, napi_generic_failure);
  }

  napi_valuetype nameType;
  CHECK_NAPI(napi_typeof(env, property_name, &nameType));

  JsValueRef function;
  JsValueRef name = JS_INVALID_REFERENCE;
  if (nameType == napi_string) {
    name = property_name;
  }

  CHECK_JSRT(env, JsCreateNamedFunction(
    name,
    ExternalCallback::Callback,
    externalCallback,
    &function));

  externalCallback->newTarget = function;

  CHECK_JSRT(env, JsSetObjectBeforeCollectCallback(
    function, externalCallback, ExternalCallback::Finalize));

  *result = reinterpret_cast<napi_value>(function);
  return napi_ok;
}

struct RefInfo
{
    JsValueRef value;
    uint32_t count;
};

struct DataViewInfo {
  JsValueRef dataView;
  JsValueRef arrayBuffer;
  size_t byteOffset;
  size_t byteLength;

  static void CALLBACK Finalize(_In_opt_ void* data) {
    delete reinterpret_cast<DataViewInfo*>(data);
  }
};

} // end anonymous namespace

// Warning: Keep in-sync with napi_status enum
static const char* error_messages[] = {
  nullptr,
  "Invalid argument",
  "An object was expected",
  "A string was expected",
  "A string or symbol was expected",
  "A function was expected",
  "A number was expected",
  "A boolean was expected",
  "An array was expected",
  "Unknown failure",
  "An exception is pending",
  "The async work item was cancelled",
  "napi_escape_handle already called on scope",
  "Invalid handle scope usage",
  "Invalid callback scope usage",
  "Thread-safe function queue is full",
  "Thread-safe function handle is closing",
  "A bigint was expected",
};

napi_status napi_get_last_error_info(napi_env env,
                                     const napi_extended_error_info** result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  // you must update this assert to reference the last message
  // in the napi_status enum each time a new error message is added.
  // We don't have a napi_status_last as this would result in an ABI
  // change each time a message was added.
  static_assert(
    std::size(error_messages) == napi_bigint_expected + 1,
    "Count of error messages must match count of error values");
  assert(env->last_error.error_code <= napi_callback_scope_mismatch);

  // Wait until someone requests the last error information to fetch the error
  // message string
  env->last_error.error_message =
    error_messages[env->last_error.error_code];

  *result = &env->last_error;
  return napi_ok;
}

napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* callback_data,
                                 napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  ExternalCallback* externalCallback =
    new ExternalCallback(env, cb, callback_data);
  if (externalCallback == nullptr) {
    return napi_set_last_error(env, napi_generic_failure);
  }

  JsValueRef function;
  JsValueRef name = JS_INVALID_REFERENCE;
  if (utf8name != nullptr) {
    CHECK_JSRT(env, JsCreateString(
      utf8name,
      length,
      &name));
  }

  CHECK_JSRT(env, JsCreateNamedFunction(
    name,
    ExternalCallback::Callback,
    externalCallback,
    &function));

  externalCallback->newTarget = function;

  CHECK_JSRT(env, JsSetObjectBeforeCollectCallback(
    function, externalCallback, ExternalCallback::Finalize));

  *result = reinterpret_cast<napi_value>(function);
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
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  napi_value namestring;
  CHECK_NAPI(napi_create_string_utf8(env, utf8name, length, &namestring));

  ExternalCallback* externalCallback =
    new ExternalCallback(env, cb, data);
  if (externalCallback == nullptr) {
    return napi_set_last_error(env, napi_generic_failure);
  }

  JsValueRef constructor;
  CHECK_JSRT(env, JsCreateNamedFunction(
    namestring,
    ExternalCallback::Callback,
    externalCallback,
    &constructor));

  externalCallback->newTarget = constructor;

  CHECK_JSRT(env, JsSetObjectBeforeCollectCallback(
    constructor, externalCallback, ExternalCallback::Finalize));

  JsPropertyIdRef pid = nullptr;
  JsValueRef prototype = nullptr;
  CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("prototype"), &pid));
  CHECK_JSRT(env, JsGetProperty(constructor, pid, &prototype));

  CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("constructor"), &pid));
  CHECK_JSRT(env, JsSetProperty(prototype, pid, constructor, false));

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
    CHECK_NAPI(napi_define_properties(env,
                                      reinterpret_cast<napi_value>(constructor),
                                      staticDescriptors.size(),
                                      staticDescriptors.data()));
  }

  if (instancePropertyCount > 0) {
    CHECK_NAPI(napi_define_properties(env,
                                      reinterpret_cast<napi_value>(prototype),
                                      instanceDescriptors.size(),
                                      instanceDescriptors.data()));
  }

  *result = reinterpret_cast<napi_value>(constructor);
  return napi_ok;
}

napi_status napi_get_property_names(napi_env env,
                                    napi_value object,
                                    napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsValueRef propertyNames;
  CHECK_JSRT(env, JsGetOwnPropertyNames(obj, &propertyNames));
  *result = reinterpret_cast<napi_value>(propertyNames);
  return napi_ok;
}

napi_status napi_set_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value value) {
  CHECK_ENV(env);
  CHECK_ARG(env, key);
  CHECK_ARG(env, value);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsPropertyIdFromKey(key, &propertyId));
  JsValueRef js_value = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env, JsSetProperty(obj, propertyId, js_value, true));
  return napi_ok;
}

napi_status napi_has_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_ARG(env, key);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsPropertyIdFromKey(key, &propertyId));
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsHasProperty(obj, propertyId, result));
  return napi_ok;
}

napi_status napi_get_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, key);
  CHECK_ARG(env, result);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsPropertyIdFromKey(key, &propertyId));
  CHECK_JSRT(env, JsGetProperty(obj, propertyId, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_delete_property(napi_env env,
                                 napi_value object,
                                 napi_value key,
                                 bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  *result = false;

  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsPropertyIdRef propertyId;
  JsValueRef deletePropertyResult;
  CHECK_JSRT(env, JsPropertyIdFromKey(key, &propertyId));
  CHECK_JSRT(env, JsDeleteProperty(obj, propertyId, false /* isStrictMode */, &deletePropertyResult));
  CHECK_JSRT(env, JsBooleanToBool(deletePropertyResult, result));

  return napi_ok;
}

NAPI_EXTERN napi_status napi_has_own_property(napi_env env,
                                              napi_value object,
                                              napi_value key,
                                              bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef hasOwnPropertyResult;
  std::array<JsValueRef, 2> hasOwnPropertyFuncArgs{ object, key };
  CHECK_JSRT(env, JsCallFunction(env->has_own_property_function, hasOwnPropertyFuncArgs.data(), static_cast<unsigned short>(hasOwnPropertyFuncArgs.size()), &hasOwnPropertyResult));
  CHECK_JSRT(env, JsBooleanToBool(hasOwnPropertyResult, result));
  return napi_ok;
}

napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value value) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsCreatePropertyId(utf8name, NAPI_AUTO_LENGTH, &propertyId));
  JsValueRef js_value = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env, JsSetProperty(obj, propertyId, js_value, true));
  return napi_ok;
}

napi_status napi_has_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsCreatePropertyId(utf8name, strlen(utf8name), &propertyId));
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsHasProperty(obj, propertyId, result));
  return napi_ok;
}

napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8name,
                                    napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsPropertyIdRef propertyId;
  CHECK_JSRT(env, JsCreatePropertyId(utf8name, strlen(utf8name), &propertyId));
  CHECK_JSRT(env,
    JsGetProperty(obj, propertyId, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value value) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  JsValueRef jsIndex = nullptr;
  CHECK_JSRT(env, JsIntToNumber(index, &jsIndex));
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env, JsSetIndexedProperty(obj, jsIndex, jsValue));
  return napi_ok;
}

napi_status napi_has_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef index = nullptr;
  CHECK_JSRT(env, JsIntToNumber(i, &index));
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsHasIndexedProperty(obj, index, result));
  return napi_ok;
}

napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t i,
                             napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef index = nullptr;
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsIntToNumber(i, &index));
  CHECK_JSRT(env,
    JsGetIndexedProperty(obj, index, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_delete_element(napi_env env,
                                napi_value object,
                                uint32_t index,
                                bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef indexValue = nullptr;
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsIntToNumber(index, &indexValue));
  CHECK_JSRT(env, JsDeleteIndexedProperty(obj, indexValue));
  *result = true;
  return napi_ok;
}

napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties) {
  CHECK_ENV(env);
  if (property_count > 0) {
    CHECK_ARG(env, properties);
  }

  JsPropertyIdRef configurableProperty;
  CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("configurable"),
                                &configurableProperty));

  JsPropertyIdRef enumerableProperty;
  CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("enumerable"),
                                &enumerableProperty));

  for (size_t i = 0; i < property_count; i++) {
    const napi_property_descriptor* p = properties + i;

    JsValueRef descriptor;
    CHECK_JSRT(env, JsCreateObject(&descriptor));

    JsValueRef configurable;
    CHECK_JSRT(env, JsBoolToBoolean((p->attributes & napi_configurable), &configurable));
    CHECK_JSRT(env, JsSetProperty(descriptor, configurableProperty, configurable, true));

    JsValueRef enumerable;
    CHECK_JSRT(env, JsBoolToBoolean((p->attributes & napi_enumerable), &enumerable));
    CHECK_JSRT(env, JsSetProperty(descriptor, enumerableProperty, enumerable, true));

    if (p->getter != nullptr || p->setter != nullptr) {
      napi_value property_name;
      CHECK_JSRT(env,
        JsNameValueFromPropertyDescriptor(p, &property_name));

      if (p->getter != nullptr) {
        JsPropertyIdRef getProperty;
        CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("get"), &getProperty));
        JsValueRef getter;
        CHECK_NAPI(CreatePropertyFunction(env, property_name,
          p->getter, p->data, reinterpret_cast<napi_value*>(&getter)));
        CHECK_JSRT(env, JsSetProperty(descriptor, getProperty, getter, true));
      }

      if (p->setter != nullptr) {
        JsPropertyIdRef setProperty;
        CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("set"), &setProperty));
        JsValueRef setter;
        CHECK_NAPI(CreatePropertyFunction(env, property_name,
          p->setter, p->data, reinterpret_cast<napi_value*>(&setter)));
        CHECK_JSRT(env, JsSetProperty(descriptor, setProperty, setter, true));
      }
    } else if (p->method != nullptr) {
      napi_value property_name;
      CHECK_JSRT(env,
        JsNameValueFromPropertyDescriptor(p, &property_name));

      JsPropertyIdRef valueProperty;
      CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("value"), &valueProperty));
      JsValueRef method;
      CHECK_NAPI(CreatePropertyFunction(env, property_name,
        p->method, p->data, reinterpret_cast<napi_value*>(&method)));
      CHECK_JSRT(env, JsSetProperty(descriptor, valueProperty, method, true));
    } else {
      RETURN_STATUS_IF_FALSE(env, p->value != nullptr, napi_invalid_arg);

      JsPropertyIdRef writableProperty;
      CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("writable"),
                                    &writableProperty));
      JsValueRef writable;
      CHECK_JSRT(env, JsBoolToBoolean((p->attributes & napi_writable), &writable));
      CHECK_JSRT(env, JsSetProperty(descriptor, writableProperty, writable, true));

      JsPropertyIdRef valueProperty;
      CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("value"), &valueProperty));
      CHECK_JSRT(env, JsSetProperty(descriptor, valueProperty,
        reinterpret_cast<JsValueRef>(p->value), true));
    }

    JsPropertyIdRef nameProperty;
    CHECK_JSRT(env, JsPropertyIdFromPropertyDescriptor(p, &nameProperty));
    bool result;
    CHECK_JSRT(env, JsDefineProperty(
      reinterpret_cast<JsValueRef>(object),
      reinterpret_cast<JsPropertyIdRef>(nameProperty),
      reinterpret_cast<JsValueRef>(descriptor),
      &result));
  }

  return napi_ok;
}

napi_status napi_is_array(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  JsValueType type = JsUndefined;
  CHECK_JSRT(env, JsGetValueType(jsValue, &type));
  *result = (type == JsArray);
  return napi_ok;
}

napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsPropertyIdRef propertyIdRef;
  CHECK_JSRT(env, JsCreatePropertyId(STR_AND_LENGTH("length"), &propertyIdRef));
  JsValueRef lengthRef;
  JsValueRef arrayRef = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env, JsGetProperty(arrayRef, propertyIdRef, &lengthRef));
  double sizeInDouble;
  CHECK_JSRT(env, JsNumberToDouble(lengthRef, &sizeInDouble));
  *result = static_cast<uint32_t>(sizeInDouble);
  return napi_ok;
}

napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, lhs);
  CHECK_ARG(env, rhs);
  CHECK_ARG(env, result);
  JsValueRef object1 = reinterpret_cast<JsValueRef>(lhs);
  JsValueRef object2 = reinterpret_cast<JsValueRef>(rhs);
  CHECK_JSRT(env, JsStrictEquals(object1, object2, result));
  return napi_ok;
}

napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  CHECK_JSRT(env, JsGetPrototype(obj, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_object(napi_env env, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsCreateObject(reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_array(napi_env env, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  unsigned int length = 0;
  CHECK_JSRT(env, JsCreateArray(length, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsCreateArray(static_cast<unsigned int>(length), reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_string_latin1(napi_env env,
                                      const char* str,
                                      size_t length,
                                      napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  std::wstring wstr = NarrowToWide({ str, length }, CP_LATIN1);
  CHECK_JSRT(env, JsPointerToString(
    wstr.data(),
    wstr.size(),
    reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsCreateString(
    str,
    length,
    reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  static_assert(sizeof(char16_t) == sizeof(wchar_t));
  CHECK_JSRT(env, JsPointerToString(
    reinterpret_cast<const wchar_t*>(str),
    length,
    reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_double(napi_env env,
                               double value,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsDoubleToNumber(value, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_int32(napi_env env,
                              int32_t value,
                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsIntToNumber(value, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_uint32(napi_env env,
                               uint32_t value,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsDoubleToNumber(static_cast<double>(value),
                              reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_int64(napi_env env,
                              int64_t value,
                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsDoubleToNumber(static_cast<double>(value),
                              reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_get_boolean(napi_env env, bool value, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsBoolToBoolean(value, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  JsValueRef js_description = reinterpret_cast<JsValueRef>(description);
  CHECK_JSRT(env,
    JsCreateSymbol(js_description, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_create_error(napi_env env,
                              napi_value code,
                              napi_value msg,
                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, msg);
  CHECK_ARG(env, result);
  JsValueRef message = reinterpret_cast<JsValueRef>(msg);

  JsValueRef error = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsCreateError(message, &error));
  CHECK_NAPI(SetErrorCode(env, error, code, nullptr));

  *result = reinterpret_cast<napi_value>(error);
  return napi_ok;
}

napi_status napi_create_type_error(napi_env env,
                                   napi_value code,
                                   napi_value msg,
                                   napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, msg);
  CHECK_ARG(env, result);
  JsValueRef message = reinterpret_cast<JsValueRef>(msg);

  JsValueRef error = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsCreateTypeError(message,  &error));
  CHECK_NAPI(SetErrorCode(env, error, code, nullptr));

  *result = reinterpret_cast<napi_value>(error);
  return napi_ok;
}

napi_status napi_create_range_error(napi_env env,
                                    napi_value code,
                                    napi_value msg,
                                    napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, msg);
  CHECK_ARG(env, result);
  JsValueRef message = reinterpret_cast<JsValueRef>(msg);

  JsValueRef error = JS_INVALID_REFERENCE;
  CHECK_JSRT(env,
    JsCreateRangeError(message,  &error));
  CHECK_NAPI(SetErrorCode(env, error, code, nullptr));

  *result = reinterpret_cast<napi_value>(error);
  return napi_ok;
}

napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  JsValueType valueType = JsUndefined;
  CHECK_JSRT(env, JsGetValueType(jsValue, &valueType));

  switch (valueType) {
    case JsUndefined: *result = napi_undefined; break;
    case JsNull: *result = napi_null; break;
    case JsNumber: *result = napi_number; break;
    case JsString: *result = napi_string; break;
    case JsBoolean: *result = napi_boolean; break;
    case JsFunction: *result = napi_function; break;
    case JsSymbol: *result = napi_symbol; break;
    case JsError: *result = napi_object; break;

    default:
      bool hasExternalData;
      if (JsHasExternalData(jsValue, &hasExternalData) != JsNoError) {
        hasExternalData = false;
      }

      *result = hasExternalData ? napi_external : napi_object;
      break;
  }
  return napi_ok;
}

napi_status napi_get_undefined(napi_env env, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsGetUndefinedValue(reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_get_null(napi_env env, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsGetNullValue(reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_get_cb_info(napi_env env,              // [in] NAPI environment handle
                             napi_callback_info cbinfo, // [in] Opaque callback-info handle
                             size_t* argc,              // [in-out] Specifies the size of the provided argv array
                                                        // and receives the actual count of args.
                             napi_value* argv,          // [out] Array of values
                             napi_value* this_arg,      // [out] Receives the JS 'this' arg for the call
                             void** data) {             // [out] Receives the data pointer for the callback.
  CHECK_ENV(env);
  CHECK_ARG(env, cbinfo);
  const CallbackInfo* info = reinterpret_cast<CallbackInfo*>(cbinfo);

  if (argv != nullptr) {
    CHECK_ARG(env, argc);

    size_t i = 0;
    size_t min = std::min(*argc, static_cast<size_t>(info->argc));

    for (; i < min; i++) {
      argv[i] = info->argv[i];
    }

    if (i < *argc) {
      napi_value undefined;
      CHECK_JSRT(env,
        JsGetUndefinedValue(reinterpret_cast<JsValueRef*>(&undefined)));
      for (; i < *argc; i++) {
        argv[i] = undefined;
      }
    }
  }

  if (argc != nullptr) {
    *argc = info->argc;
  }

  if (this_arg != nullptr) {
    *this_arg = info->thisArg;
  }

  if (data != nullptr) {
    *data = info->data;
  }

  return napi_ok;
}

napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, cbinfo);
  CHECK_ARG(env, result);

  const CallbackInfo* info = reinterpret_cast<CallbackInfo*>(cbinfo);
  if (info->isConstructCall) {
    *result = info->newTarget;
  } else {
    *result = nullptr;
  }

  return napi_ok;
}

napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               size_t argc,
                               const napi_value* argv,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, recv);
  if (argc > 0) {
    CHECK_ARG(env, argv);
  }

  JsValueRef object = reinterpret_cast<JsValueRef>(recv);
  JsValueRef function = reinterpret_cast<JsValueRef>(func);
  std::vector<JsValueRef> args(argc + 1);
  args[0] = object;
  for (size_t i = 0; i < argc; i++) {
    args[i + 1] = reinterpret_cast<JsValueRef>(argv[i]);
  }
  JsValueRef returnValue;
  CHECK_JSRT(env, JsCallFunction(
    function,
    args.data(),
    static_cast<uint16_t>(argc + 1),
    &returnValue));
  if (result != nullptr) {
    *result = reinterpret_cast<napi_value>(returnValue);
  }
  return napi_ok;
}

napi_status napi_get_global(napi_env env, napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsGetGlobalObject(reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_throw(napi_env env, napi_value error) {
  CHECK_ENV(env);
  JsValueRef exception = reinterpret_cast<JsValueRef>(error);
  CHECK_JSRT(env, JsSetException(exception));
  return napi_ok;
}

napi_status napi_throw_error(napi_env env,
                             const char* code,
                             const char* msg) {
  CHECK_ENV(env);
  JsValueRef strRef;
  JsValueRef exception;
  size_t length = strlen(msg);
  CHECK_JSRT(env, JsCreateString(msg, length, &strRef));
  CHECK_JSRT(env, JsCreateError(strRef, &exception));
  CHECK_NAPI(SetErrorCode(env, exception, nullptr, code));
  CHECK_JSRT(env, JsSetException(exception));
  return napi_ok;
}

napi_status napi_throw_type_error(napi_env env,
                                  const char* code,
                                  const char* msg) {
  CHECK_ENV(env);
  JsValueRef strRef;
  JsValueRef exception;
  size_t length = strlen(msg);
  CHECK_JSRT(env, JsCreateString(msg, length, &strRef));
  CHECK_JSRT(env, JsCreateTypeError(strRef, &exception));
  CHECK_NAPI(SetErrorCode(env, exception, nullptr, code));
  CHECK_JSRT(env, JsSetException(exception));
  return napi_ok;
}

napi_status napi_throw_range_error(napi_env env,
                                   const char* code,
                                   const char* msg) {
  CHECK_ENV(env);
  JsValueRef strRef;
  JsValueRef exception;
  size_t length = strlen(msg);
  CHECK_JSRT(env, JsCreateString(msg, length, &strRef));
  CHECK_JSRT(env, JsCreateRangeError(strRef, &exception));
  CHECK_NAPI(SetErrorCode(env, exception, nullptr, code));
  CHECK_JSRT(env, JsSetException(exception));
  return napi_ok;
}

napi_status napi_is_error(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueType valueType;
  CHECK_JSRT(env, JsGetValueType(value, &valueType));
  *result = (valueType == JsError);
  return napi_ok;
}

napi_status napi_get_value_double(napi_env env, napi_value value, double* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT_EXPECTED(env, JsNumberToDouble(jsValue, result), napi_number_expected);
  return napi_ok;
}

napi_status napi_get_value_int32(napi_env env, napi_value v, int32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, v);
  CHECK_ARG(env, result);
  JsValueRef value = reinterpret_cast<JsValueRef>(v);
  int valueInt;
  CHECK_JSRT_EXPECTED(env, JsNumberToInt(value, &valueInt), napi_number_expected);
  *result = static_cast<int32_t>(valueInt);
  return napi_ok;
}

napi_status napi_get_value_uint32(napi_env env, napi_value value, uint32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  int valueInt;
  CHECK_JSRT_EXPECTED(env, JsNumberToInt(jsValue, &valueInt), napi_number_expected);
  *result = static_cast<uint32_t>(valueInt);
  return napi_ok;
}

napi_status napi_get_value_int64(napi_env env, napi_value value, int64_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);

  double valueDouble;
  CHECK_JSRT_EXPECTED(env, JsNumberToDouble(jsValue, &valueDouble),
                      napi_number_expected);

  if (std::isfinite(valueDouble)) {
    *result = static_cast<int64_t>(valueDouble);
  } else {
    *result = 0;
  }

  return napi_ok;
}

napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT_EXPECTED(env, JsBooleanToBool(jsValue, result), napi_boolean_expected);
  return napi_ok;
}

// Copies a JavaScript string into a LATIN-1 string buffer. The result is the
// number of bytes (excluding the null terminator) copied into buf.
// A sufficient buffer size should be greater than the length of string,
// reserving space for null terminator.
// If bufsize is insufficient, the string will be truncated and null terminated.
// If buf is NULL, this method returns the length of the string (in bytes)
// via the result parameter.
// The result argument is optional unless buf is NULL.
napi_status napi_get_value_string_latin1(napi_env env,
                                         napi_value value,
                                         char* buf,
                                         size_t bufsize,
                                         size_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);

  if (!buf) {
    CHECK_ARG(env, result);
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, nullptr, 0, result, CP_LATIN1),
      napi_string_expected);
  } else {
    size_t count = 0;
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, nullptr, 0, &count),
      napi_string_expected);

    if (bufsize <= count) {
      // if bufsize == count there is no space for null terminator
      // Slow path: must implement truncation here.
      char* fullBuffer = static_cast<char*>(malloc(count));
      //CHAKRA_VERIFY(fullBuffer != nullptr);

      CHECK_JSRT_EXPECTED(env,
        JsCopyString(jsValue, fullBuffer, count, nullptr),
        napi_string_expected);
      memmove(buf, fullBuffer, sizeof(char) * bufsize);
      free(fullBuffer);

      // Truncate string to the start of the last codepoint
      if (bufsize > 0 &&
          (((buf[bufsize-1] & 0x80) == 0)
            || UTF8_MULTIBYTE_START(buf[bufsize-1]))
        ) {
        // Last byte is a single byte codepoint or
        // starts a multibyte codepoint
        bufsize -= 1;
      } else if (bufsize > 1 && UTF8_MULTIBYTE_START(buf[bufsize-2])) {
        // Second last byte starts a multibyte codepoint,
        bufsize -= 2;
      } else if (bufsize > 2 && UTF8_MULTIBYTE_START(buf[bufsize-3])) {
        // Third last byte starts a multibyte codepoint
        bufsize -= 3;
      } else if (bufsize > 3 && UTF8_MULTIBYTE_START(buf[bufsize-4])) {
        // Fourth last byte starts a multibyte codepoint
        bufsize -= 4;
      }

      buf[bufsize] = '\0';

      if (result) {
        *result = bufsize;
      }

      return napi_ok;
    }

    // Fastpath, result fits in the buffer
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, buf, bufsize-1, &count),
      napi_string_expected);

    buf[count] = 0;

    if (result != nullptr) {
      *result = count;
    }
  }

  return napi_ok;
}

// Copies a JavaScript string into a UTF-8 string buffer. The result is the
// number of bytes (excluding the null terminator) copied into buf.
// A sufficient buffer size should be greater than the length of string,
// reserving space for null terminator.
// If bufsize is insufficient, the string will be truncated and null terminated.
// If buf is NULL, this method returns the length of the string (in bytes)
// via the result parameter.
// The result argument is optional unless buf is NULL.
napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);

  if (!buf) {
    CHECK_ARG(env, result);
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, nullptr, 0, result),
      napi_string_expected);
  } else {
    size_t count = 0;
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, nullptr, 0, &count),
      napi_string_expected);

    if (bufsize <= count) {
      // if bufsize == count there is no space for null terminator
      // Slow path: must implement truncation here.
      char* fullBuffer = static_cast<char*>(malloc(count));
      //CHAKRA_VERIFY(fullBuffer != nullptr);

      CHECK_JSRT_EXPECTED(env,
        JsCopyString(jsValue, fullBuffer, count, nullptr),
        napi_string_expected);
      memmove(buf, fullBuffer, sizeof(char) * bufsize);
      free(fullBuffer);

      // Truncate string to the start of the last codepoint
      if (bufsize > 0 &&
          (((buf[bufsize-1] & 0x80) == 0)
           || UTF8_MULTIBYTE_START(buf[bufsize-1]))
        ) {
        // Last byte is a single byte codepoint or
        // starts a multibyte codepoint
        bufsize -= 1;
      } else if (bufsize > 1 && UTF8_MULTIBYTE_START(buf[bufsize-2])) {
        // Second last byte starts a multibyte codepoint,
        bufsize -= 2;
      } else if (bufsize > 2 && UTF8_MULTIBYTE_START(buf[bufsize-3])) {
        // Third last byte starts a multibyte codepoint
        bufsize -= 3;
      } else if (bufsize > 3 && UTF8_MULTIBYTE_START(buf[bufsize-4])) {
        // Fourth last byte starts a multibyte codepoint
        bufsize -= 4;
      }

      buf[bufsize] = '\0';

      if (result) {
        *result = bufsize;
      }

      return napi_ok;
    }

    // Fastpath, result fits in the buffer
    CHECK_JSRT_EXPECTED(env,
      JsCopyString(jsValue, buf, bufsize-1, &count),
      napi_string_expected);

    buf[count] = 0;

    if (result != nullptr) {
      *result = count;
    }
  }

  return napi_ok;
}

// Copies a JavaScript string into a UTF-16 string buffer. The result is the
// number of 2-byte code units (excluding the null terminator) copied into buf.
// A sufficient buffer size should be greater than the length of string,
// reserving space for null terminator.
// If bufsize is insufficient, the string will be truncated and null terminated.
// If buf is NULL, this method returns the length of the string (in 2-byte
// code units) via the result parameter.
// The result argument is optional unless buf is NULL.
napi_status napi_get_value_string_utf16(napi_env env,
                                        napi_value value,
                                        char16_t* buf,
                                        size_t bufsize,
                                        size_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);

  if (!buf) {
    CHECK_ARG(env, result);

    CHECK_JSRT_EXPECTED(env,
      JsCopyStringUtf16(jsValue, nullptr, 0, result),
      napi_string_expected);
  } else {
    size_t copied = 0;
    CHECK_JSRT_EXPECTED(env,
      JsCopyStringUtf16(
        jsValue,
        buf,
        bufsize - 1,
        &copied),
      napi_string_expected);

    if (copied < bufsize - 1) {
      buf[copied] = 0;
    } else {
      buf[bufsize - 1] = 0;
    }

    if (result != nullptr) {
      *result = copied;
    }
  }

  return napi_ok;
}

napi_status napi_coerce_to_bool(napi_env env,
                                napi_value v,
                                napi_value* result) {
  CHECK_ARG(env, result);
  JsValueRef value = reinterpret_cast<JsValueRef>(v);
  CHECK_JSRT(env,
    JsConvertValueToBoolean(value, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env,
    JsConvertValueToNumber(jsValue, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env,
    JsConvertValueToObject(jsValue, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);
  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  CHECK_JSRT(env,
    JsConvertValueToString(jsValue, reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, js_object);

  JsValueRef value = reinterpret_cast<JsValueRef>(js_object);

  JsValueRef wrapper = JS_INVALID_REFERENCE;
  CHECK_NAPI(FindWrapper(env, value, &wrapper));
  RETURN_STATUS_IF_FALSE(env, wrapper == JS_INVALID_REFERENCE, napi_invalid_arg);

  ExternalData* externalData = new ExternalData(
    env, native_object, finalize_cb, finalize_hint);
  if (externalData == nullptr) return napi_set_last_error(env, napi_generic_failure);

  // Create an external object that will hold the external data pointer.
  JsValueRef external = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsCreateExternalObject(
    externalData, ExternalData::Finalize, &external));

  // Insert the external object into the value's prototype chain.
  JsValueRef valuePrototype = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsGetPrototype(value, &valuePrototype));
  CHECK_JSRT(env, JsSetPrototype(external, valuePrototype));
  CHECK_JSRT(env, JsSetPrototype(value, external));

  if (result != nullptr) {
    CHECK_NAPI(napi_create_reference(env, js_object, 0, result));
  }

  return napi_ok;
}

napi_status napi_unwrap(napi_env env, napi_value js_object, void** result) {
  CHECK_ENV(env);
  CHECK_ARG(env, js_object);

  JsValueRef value = reinterpret_cast<JsValueRef>(js_object);

  ExternalData* externalData = nullptr;
  CHECK_NAPI(Unwrap(env, value, &externalData));

  *result = (externalData != nullptr ? externalData->Data() : nullptr);

  return napi_ok;
}

napi_status napi_remove_wrap(napi_env env, napi_value js_object, void** result) {
  CHECK_ENV(env);
  CHECK_ARG(env, js_object);

  JsValueRef value = reinterpret_cast<JsValueRef>(js_object);

  ExternalData* externalData = nullptr;
  JsValueRef parent = JS_INVALID_REFERENCE;
  JsValueRef wrapper = JS_INVALID_REFERENCE;
  CHECK_NAPI(Unwrap(env, value, &externalData, &wrapper, &parent));
  RETURN_STATUS_IF_FALSE(env, parent != JS_INVALID_REFERENCE, napi_invalid_arg);
  RETURN_STATUS_IF_FALSE(env, wrapper != JS_INVALID_REFERENCE, napi_invalid_arg);

  // Remove the external from the prototype chain
  JsValueRef wrapperProto = JS_INVALID_REFERENCE;
  CHECK_JSRT(env, JsGetPrototype(wrapper, &wrapperProto));
  CHECK_JSRT(env, JsSetPrototype(parent, wrapperProto));

  // Clear the external data from the object
  CHECK_JSRT(env, JsSetExternalData(wrapper, nullptr));

  if (externalData != nullptr) {
    *result = externalData->Data();
    delete externalData;
  } else {
    *result = nullptr;
  }

  return napi_ok;
}

napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  ExternalData* externalData = new ExternalData(
    env, data, finalize_cb, finalize_hint);
  if (externalData == nullptr) return napi_set_last_error(env, napi_generic_failure);

  CHECK_JSRT(env, JsCreateExternalObject(
    externalData,
    ExternalData::Finalize,
    reinterpret_cast<JsValueRef*>(result)));

  return napi_ok;
}

napi_status napi_get_value_external(napi_env env, napi_value value, void** result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  ExternalData* externalData;
  CHECK_JSRT(env, JsGetExternalData(
    reinterpret_cast<JsValueRef>(value),
    reinterpret_cast<void**>(&externalData)));

  *result = (externalData != nullptr ? externalData->Data() : nullptr);

  return napi_ok;
}

// Set initial_refcount to 0 for a weak reference, >0 for a strong reference.
napi_status napi_create_reference(napi_env env,
                                  napi_value value,
                                  uint32_t initial_refcount,
                                  napi_ref* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  auto jsValue = reinterpret_cast<JsValueRef>(value);
  auto info = new RefInfo{ reinterpret_cast<JsValueRef>(value), initial_refcount };
  if (info == nullptr) {
    return napi_set_last_error(env, napi_generic_failure);
  }

  if (info->count != 0)
  {
    CHECK_JSRT(env, JsAddRef(jsValue, nullptr));
  }

  *result = reinterpret_cast<napi_ref>(info);
  return napi_ok;
}

// Deletes a reference. The referenced value is released, and may be GC'd
// unless there are other references to it.
napi_status napi_delete_reference(napi_env env, napi_ref ref) {
  CHECK_ENV(env);
  CHECK_ARG(env, ref);

  auto info = reinterpret_cast<RefInfo*>(ref);

  if (info->count != 0) {
    CHECK_JSRT(env, JsRelease(info->value, nullptr));
  }

  delete info;

  return napi_ok;
}

// Increments the reference count, optionally returning the resulting count.
// After this call the reference will be a strong reference because its refcount
// is >0, and the referenced object is effectively "pinned". Calling this when
// the refcount is 0 and the target is unavailable results in an error.
napi_status napi_reference_ref(napi_env env, napi_ref ref, uint32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, ref);
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (info->count++ == 0) {
    CHECK_JSRT(env, JsAddRef(info->value, nullptr));
  }
  if (result != nullptr) {
    *result = info->count;
  }
  return napi_ok;
}

// Decrements the reference count, optionally returning the resulting count.
// If the result is 0 the reference is now weak and the object may be GC'd at
// any time if there are no other references. Calling this when the refcount
// is already 0 results in an error.
napi_status napi_reference_unref(napi_env env, napi_ref ref, uint32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, ref);
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (--info->count == 0) {
    CHECK_JSRT(env, JsRelease(info->value, nullptr));
  }
  if (result != nullptr) {
    *result = info->count;
  }
  return napi_ok;
}

// Attempts to get a referenced value. If the reference is weak, the value
// might no longer be available, in that case the call is still successful but
// the result is NULL.
napi_status napi_get_reference_value(napi_env env,
                                     napi_ref ref,
                                     napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, ref);
  CHECK_ARG(env, result);
  auto info = reinterpret_cast<RefInfo*>(ref);
  if (info->count == 0) {
      *result = nullptr;
  } else {
      *result = reinterpret_cast<napi_value>(info->value);
  }
  return napi_ok;
}

// Stub implementation of handle scope apis for JSRT.
napi_status napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  *result = reinterpret_cast<napi_handle_scope>(1);
  return napi_ok;
}

// Stub implementation of handle scope apis for JSRT.
napi_status napi_close_handle_scope(napi_env env, napi_handle_scope scope) {
  CHECK_ENV(env);
  CHECK_ARG(env, scope);
  return napi_ok;
}

// Stub implementation of handle scope apis for JSRT.
napi_status napi_open_escapable_handle_scope(
  napi_env env,
  napi_escapable_handle_scope* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  *result = reinterpret_cast<napi_escapable_handle_scope>(1);
  return napi_ok;
}

// Stub implementation of handle scope apis for JSRT.
napi_status napi_close_escapable_handle_scope(
  napi_env env,
  napi_escapable_handle_scope scope) {
  CHECK_ENV(env);
  CHECK_ARG(env, scope);
  return napi_ok;
}

// Stub implementation of handle scope apis for JSRT.
// This one will return escapee value as this is called from leveldown db.
napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, scope);
  CHECK_ARG(env, escapee);
  CHECK_ARG(env, result);
  *result = escapee;
  return napi_ok;
}

napi_status napi_new_instance(napi_env env,
                              napi_value constructor,
                              size_t argc,
                              const napi_value* argv,
                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, constructor);
  if (argc > 0) {
    CHECK_ARG(env, argv);
  }
  CHECK_ARG(env, result);
  JsValueRef function = reinterpret_cast<JsValueRef>(constructor);
  std::vector<JsValueRef> args(argc + 1);
  CHECK_JSRT(env, JsGetUndefinedValue(&args[0]));
  for (size_t i = 0; i < argc; i++) {
    args[i + 1] = reinterpret_cast<JsValueRef>(argv[i]);
  }
  CHECK_JSRT(env, JsConstructObject(
    function,
    args.data(),
    static_cast<uint16_t>(argc + 1),
    reinterpret_cast<JsValueRef*>(result)));
  return napi_ok;
}

napi_status napi_instanceof(napi_env env,
                            napi_value object,
                            napi_value c,
                            bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, object);
  CHECK_ARG(env, result);
  JsValueRef obj = reinterpret_cast<JsValueRef>(object);
  JsValueRef constructor = reinterpret_cast<JsValueRef>(c);

  // FIXME: Remove this type check when we switch to a version of Chakracore
  // where passing an integer into JsInstanceOf as the constructor parameter
  // does not cause a segfault. The need for this if-statement is removed in at
  // least Chakracore 1.4.0, but maybe in an earlier version too.
  napi_valuetype valuetype;
  CHECK_NAPI(napi_typeof(env, c, &valuetype));
  if (valuetype != napi_function) {
    napi_throw_type_error(env,
                          "ERR_NAPI_CONS_FUNCTION",
                          "constructor must be a function");

    return napi_set_last_error(env, napi_invalid_arg);
  }

  CHECK_JSRT(env, JsInstanceOf(obj, constructor, result));
  return napi_ok;
}

napi_status napi_is_exception_pending(napi_env env, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  CHECK_JSRT(env, JsHasException(result));
  return napi_ok;
}

napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  bool hasException;
  CHECK_JSRT(env, JsHasException(&hasException));
  if (hasException) {
    CHECK_JSRT(env, JsGetAndClearException(reinterpret_cast<JsValueRef*>(result)));
  } else {
    CHECK_NAPI(napi_get_undefined(env, result));
  }

  return napi_ok;
}

napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  JsValueType valueType;
  CHECK_JSRT(env, JsGetValueType(jsValue, &valueType));

  *result = (valueType == JsArrayBuffer);
  return napi_ok;
}

napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  JsValueRef arrayBuffer;
  CHECK_JSRT(env,
    JsCreateArrayBuffer(static_cast<unsigned int>(byte_length), &arrayBuffer));

  if (data != nullptr) {
    CHECK_JSRT(env, JsGetArrayBufferStorage(
      arrayBuffer,
      reinterpret_cast<BYTE**>(data),
      reinterpret_cast<unsigned int*>(&byte_length)));
  }

  *result = reinterpret_cast<napi_value>(arrayBuffer);
  return napi_ok;
}

napi_status napi_create_external_arraybuffer(napi_env env,
                                             void* external_data,
                                             size_t byte_length,
                                             napi_finalize finalize_cb,
                                             void* finalize_hint,
                                             napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);

  ExternalData* externalData = new ExternalData(
    env, external_data, finalize_cb, finalize_hint);
  if (externalData == nullptr) return napi_set_last_error(env, napi_generic_failure);

  JsValueRef arrayBuffer;
  CHECK_JSRT(env, JsCreateExternalArrayBuffer(
    external_data,
    static_cast<unsigned int>(byte_length),
    ExternalData::Finalize,
    externalData,
    &arrayBuffer));

  *result = reinterpret_cast<napi_value>(arrayBuffer);
  return napi_ok;
}

napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length) {
  CHECK_ENV(env);
  CHECK_ARG(env, arraybuffer);

  BYTE* storageData;
  unsigned int storageLength;
  CHECK_JSRT(env, JsGetArrayBufferStorage(
    reinterpret_cast<JsValueRef>(arraybuffer),
    &storageData,
    &storageLength));

  if (data != nullptr) {
    *data = reinterpret_cast<void*>(storageData);
  }

  if (byte_length != nullptr) {
    *byte_length = static_cast<size_t>(storageLength);
  }

  return napi_ok;
}

napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  JsValueType valueType;
  CHECK_JSRT(env, JsGetValueType(jsValue, &valueType));

  *result = (valueType == JsTypedArray);
  return napi_ok;
}

napi_status napi_create_typedarray(napi_env env,
                                   napi_typedarray_type type,
                                   size_t length,
                                   napi_value arraybuffer,
                                   size_t byte_offset,
                                   napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, arraybuffer);
  CHECK_ARG(env, result);

  JsTypedArrayType jsType;
  switch (type) {
    case napi_int8_array:
      jsType = JsArrayTypeInt8;
      break;
    case napi_uint8_array:
      jsType = JsArrayTypeUint8;
      break;
    case napi_uint8_clamped_array:
      jsType = JsArrayTypeUint8Clamped;
      break;
    case napi_int16_array:
      jsType = JsArrayTypeInt16;
      break;
    case napi_uint16_array:
      jsType = JsArrayTypeUint16;
      break;
    case napi_int32_array:
      jsType = JsArrayTypeInt32;
      break;
    case napi_uint32_array:
      jsType = JsArrayTypeUint32;
      break;
    case napi_float32_array:
      jsType = JsArrayTypeFloat32;
      break;
    case napi_float64_array:
      jsType = JsArrayTypeFloat64;
      break;
    default:
      return napi_set_last_error(env, napi_invalid_arg);
  }

  JsValueRef jsArrayBuffer = reinterpret_cast<JsValueRef>(arraybuffer);

  CHECK_JSRT(env, JsCreateTypedArray(
    jsType,
    jsArrayBuffer,
    static_cast<unsigned int>(byte_offset),
    static_cast<unsigned int>(length),
    reinterpret_cast<JsValueRef*>(result)));

  return napi_ok;
}

napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset) {
  CHECK_ENV(env);
  CHECK_ARG(env, typedarray);

  JsTypedArrayType jsType;
  JsValueRef jsArrayBuffer;
  unsigned int byteOffset;
  unsigned int byteLength;
  BYTE* bufferData;
  unsigned int bufferLength;
  int elementSize;

  CHECK_JSRT(env, JsGetTypedArrayInfo(
    reinterpret_cast<JsValueRef>(typedarray),
    &jsType,
    &jsArrayBuffer,
    &byteOffset,
    &byteLength));

  CHECK_JSRT(env, JsGetTypedArrayStorage(
    reinterpret_cast<JsValueRef>(typedarray),
    &bufferData,
    &bufferLength,
    &jsType,
    &elementSize));

  if (type != nullptr) {
    switch (jsType) {
      case JsArrayTypeInt8:
        *type = napi_int8_array;
        break;
      case JsArrayTypeUint8:
        *type = napi_uint8_array;
        break;
      case JsArrayTypeUint8Clamped:
        *type = napi_uint8_clamped_array;
        break;
      case JsArrayTypeInt16:
        *type = napi_int16_array;
        break;
      case JsArrayTypeUint16:
        *type = napi_uint16_array;
        break;
      case JsArrayTypeInt32:
        *type = napi_int32_array;
        break;
      case JsArrayTypeUint32:
        *type = napi_uint32_array;
        break;
      case JsArrayTypeFloat32:
        *type = napi_float32_array;
        break;
      case JsArrayTypeFloat64:
        *type = napi_float64_array;
        break;
      default:
        return napi_set_last_error(env, napi_generic_failure);
    }
  }

  if (length != nullptr) {
    *length = static_cast<size_t>(byteLength / elementSize);
  }

  if (data != nullptr) {
    *data = static_cast<uint8_t*>(bufferData);
  }

  if (arraybuffer != nullptr) {
    *arraybuffer = reinterpret_cast<napi_value>(jsArrayBuffer);
  }

  if (byte_offset != nullptr) {
    *byte_offset = static_cast<size_t>(byteOffset);
  }

  return napi_ok;
}

napi_status napi_create_dataview(napi_env env,
                                 size_t byte_length,
                                 napi_value arraybuffer,
                                 size_t byte_offset,
                                 napi_value* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, arraybuffer);
  CHECK_ARG(env, result);

  JsValueRef jsArrayBuffer = reinterpret_cast<JsValueRef>(arraybuffer);

  BYTE* unused = nullptr;
  unsigned int bufferLength = 0;

  CHECK_JSRT(env, JsGetArrayBufferStorage(
    jsArrayBuffer,
    &unused,
    &bufferLength));

  if (byte_length + byte_offset > bufferLength) {
    napi_throw_range_error(
      env,
      "ERR_NAPI_INVALID_DATAVIEW_ARGS",
      "byte_offset + byte_length should be less than or "
       "equal to the size in bytes of the array passed in");
    return napi_set_last_error(env, napi_pending_exception);
  }

  JsValueRef jsDataView;
  CHECK_JSRT(env, JsCreateDataView(
    jsArrayBuffer,
    static_cast<unsigned int>(byte_offset),
    static_cast<unsigned int>(byte_length),
    &jsDataView));

  auto dataViewInfo = new DataViewInfo{ jsDataView, jsArrayBuffer, byte_offset, byte_length };
  CHECK_JSRT(env, JsCreateExternalObject(dataViewInfo, DataViewInfo::Finalize, reinterpret_cast<JsValueRef*>(result)));

  return napi_ok;
}

napi_status napi_is_dataview(napi_env env, napi_value value, bool* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, value);
  CHECK_ARG(env, result);

  JsValueRef jsValue = reinterpret_cast<JsValueRef>(value);
  JsValueType valueType;
  CHECK_JSRT(env, JsGetValueType(jsValue, &valueType));

  *result = (valueType == JsDataView);
  return napi_ok;
}

napi_status napi_get_dataview_info(napi_env env,
                                   napi_value dataview,
                                   size_t* byte_length,
                                   void** data,
                                   napi_value* arraybuffer,
                                   size_t* byte_offset) {
  CHECK_ENV(env);
  CHECK_ARG(env, dataview);

  BYTE* bufferData = nullptr;
  unsigned int bufferLength = 0;

  JsValueRef jsExternalObject = reinterpret_cast<JsValueRef>(dataview);

  DataViewInfo* dataViewInfo;
  CHECK_JSRT(env, JsGetExternalData(
    jsExternalObject,
    reinterpret_cast<void**>(&dataViewInfo)));

  CHECK_JSRT(env, JsGetDataViewStorage(
    dataViewInfo->dataView,
    &bufferData,
    &bufferLength));

  if (byte_length != nullptr) {
    *byte_length = dataViewInfo->byteLength;
  }

  if (data != nullptr) {
    *data = static_cast<uint8_t*>(bufferData);
  }

  if (arraybuffer != nullptr) {
    *arraybuffer = reinterpret_cast<napi_value>(dataViewInfo->arrayBuffer);
  }

  if (byte_offset != nullptr) {
    *byte_offset = dataViewInfo->byteOffset;
  }

  return napi_ok;
}

napi_status napi_get_version(napi_env env, uint32_t* result) {
  CHECK_ENV(env);
  CHECK_ARG(env, result);
  *result = NAPI_VERSION;
  return napi_ok;
}

napi_status napi_create_promise(napi_env env,
                                napi_deferred* deferred,
                                napi_value* promise) {
  CHECK_ARG(env, deferred);
  CHECK_ARG(env, promise);

  JsValueRef js_promise, resolve, reject, container;
  napi_ref ref;
  napi_value js_deferred;

  CHECK_JSRT(env, JsCreatePromise(&js_promise, &resolve, &reject));

  CHECK_JSRT(env, JsCreateObject(&container));
  js_deferred = reinterpret_cast<napi_value>(container);

  CHECK_NAPI(napi_set_named_property(env, js_deferred, "resolve",
    reinterpret_cast<napi_value>(resolve)));
  CHECK_NAPI(napi_set_named_property(env, js_deferred, "reject",
    reinterpret_cast<napi_value>(reject)));

  CHECK_NAPI(napi_create_reference(env, js_deferred, 1, &ref));

  *deferred = reinterpret_cast<napi_deferred>(ref);
  *promise = reinterpret_cast<napi_value>(js_promise);

  return napi_ok;
}

napi_status napi_resolve_deferred(napi_env env,
                                  napi_deferred deferred,
                                  napi_value resolution) {
  return ConcludeDeferred(env, deferred, "resolve", resolution);
}

napi_status napi_reject_deferred(napi_env env,
                                 napi_deferred deferred,
                                 napi_value rejection) {
  return ConcludeDeferred(env, deferred, "reject", rejection);
}

napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise) {
  CHECK_ARG(env, promise);
  CHECK_ARG(env, is_promise);

  napi_value global, promise_ctor;

  CHECK_NAPI(napi_get_global(env, &global));
  CHECK_NAPI(napi_get_named_property(env, global, "Promise", &promise_ctor));
  CHECK_NAPI(napi_instanceof(env, promise, promise_ctor, is_promise));

  return napi_ok;
}

napi_status napi_run_script(napi_env env,
                            napi_value script,
                            napi_value* result) {
  CHECK_ARG(env, script);
  CHECK_ARG(env, result);

  JsValueRef scriptVar = reinterpret_cast<JsValueRef>(script);

  const wchar_t* scriptStr;
  size_t scriptStrLen;
  CHECK_JSRT(env, JsStringToPointer(scriptVar, &scriptStr, &scriptStrLen));
  CHECK_JSRT_EXPECTED(env, JsRunScript(scriptStr, ++env->source_context, L"Unknown", reinterpret_cast<JsValueRef*>(result)), napi_string_expected);

  return napi_ok;
}

napi_status napi_run_script(napi_env env,
                            napi_value script,
                            const char* source_url,
                            napi_value* result) {
  CHECK_ARG(env, script);
  CHECK_ARG(env, result);
  JsValueRef scriptVar = reinterpret_cast<JsValueRef>(script);

  const wchar_t* scriptStr;
  size_t scriptStrLen;
  CHECK_JSRT(env, JsStringToPointer(scriptVar, &scriptStr, &scriptStrLen));
  CHECK_JSRT_EXPECTED(env, JsRunScript(scriptStr, ++env->source_context, NarrowToWide({ source_url }).data(), reinterpret_cast<JsValueRef*>(result)), napi_string_expected);

  return napi_ok;
}

napi_status napi_add_finalizer(napi_env env,
                               napi_value js_object,
                               void* native_object,
                               napi_finalize finalize_cb,
                               void* finalize_hint,
                               napi_ref* result) {
  throw std::runtime_error("not impl");
}

napi_status napi_adjust_external_memory(napi_env env,
                                        int64_t change_in_bytes,
                                        int64_t* adjusted_value) {
  CHECK_ARG(env, adjusted_value);

  // TODO(jackhorton): Determine if Chakra needs or is able to do anything here
  // For now, we can lie and say that we always adjusted more memory
  *adjusted_value = change_in_bytes;

  return napi_ok;
}
