//-------------------------------------------------------------------------------------
// scoped.h
//  
// Utility header with helper classes for exception-safe handling of resources
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//-------------------------------------------------------------------------------------

#if defined(_MSC_VER) && (_MSC_VER > 1000)
#pragma once
#endif

#include <assert.h>
#include <memory>
#include <malloc.h>

//---------------------------------------------------------------------------------
struct aligned_deleter { void operator()(void* p) { _aligned_free(p); } };

typedef std::unique_ptr<float, aligned_deleter> ScopedAlignedArrayFloat;

typedef std::unique_ptr<DirectX::XMVECTOR, aligned_deleter> ScopedAlignedArrayXMVECTOR;

//---------------------------------------------------------------------------------
struct handle_closer { void operator()(HANDLE h) { assert(h != INVALID_HANDLE_VALUE); if (h) CloseHandle(h); } };

typedef public std::unique_ptr<void, handle_closer> ScopedHandle;

inline HANDLE safe_handle( HANDLE h ) { return (h == INVALID_HANDLE_VALUE) ? 0 : h; }
