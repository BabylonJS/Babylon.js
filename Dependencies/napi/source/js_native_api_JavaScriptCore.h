struct napi_env__ {
    JSGlobalContextRef m_globalContext;
};

// This does not call napi_set_last_error because the expression
// is assumed to be a NAPI function call that already did.
#define CHECK_NAPI(expr)                  \
  do {                                    \
    napi_status status = (expr);          \
    if (status != napi_ok) return status; \
  } while (0)
