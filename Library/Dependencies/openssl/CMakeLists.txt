cmake_minimum_required(VERSION 3.15)
project( openssl )

include_directories ( BEFORE SYSTEM
    ${CMAKE_CURRENT_BINARY_DIR}/crypto
    ${CMAKE_CURRENT_BINARY_DIR}/ssl
    ${CMAKE_CURRENT_BINARY_DIR}/include
    crypto . )

add_definitions( -DOPENSSL_NO_ASM )
add_definitions( -DOPENSSL_NO_STATIC_ENGINE )
#add_definitions( "-DOPENSSLDIR=\"/usr/local/ssl\"" )
#add_definitions( "-DENGINESDIR=\"/usr/local/engines-1.1\"" )


#configure_file("${CMAKE_CURRENT_LIST_DIR}/include/openssl/opensslv.h.in" "${CMAKE_CURRENT_LIST_DIR}/include/openssl/opensslv.h")
#configure_file("${CMAKE_CURRENT_LIST_DIR}/include/openssl/opensslconf.h.in" "${CMAKE_CURRENT_LIST_DIR}/include/openssl/opensslconf.h.h" COPYONLY)

#add_subdirectory(crypto)
#add_subdirectory(ssl)

#set(OPENSSL_INCLUDE_DIR "${CMAKE_CURRENT_LIST_DIR}")
#set(OPENSSL_ROOT_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl")
#set(OPENSSL_CRYPTO_LIBRARY crypto.a)

set(CRYPTO_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl/crypto")
set(SSL_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl/ssl")

# crypto
set( cryptoSRC
  "${CRYPTO_DIR}/cpt_err.c" 
  "${CRYPTO_DIR}/cryptlib.c"
  "${CRYPTO_DIR}/ctype.c"
  "${CRYPTO_DIR}/cversion.c"
  "${CRYPTO_DIR}/ebcdic.c"
  "${CRYPTO_DIR}/ex_data.c"
  "${CRYPTO_DIR}/init.c"
  "${CRYPTO_DIR}/mem.c"
  "${CRYPTO_DIR}/mem_clr.c"
  "${CRYPTO_DIR}/mem_dbg.c"
  "${CRYPTO_DIR}/mem_sec.c"
  "${CRYPTO_DIR}/o_dir.c"
  "${CRYPTO_DIR}/o_fips.c"
  "${CRYPTO_DIR}/o_fopen.c"
  "${CRYPTO_DIR}/o_init.c"
  "${CRYPTO_DIR}/o_str.c"
  "${CRYPTO_DIR}/o_time.c"
  "${CRYPTO_DIR}/uid.c"
  "${CRYPTO_DIR}/getenv.c" )

include_directories( BEFORE SYSTEM include modes ec/curve448 ec/curve448/arch_32 )

if( BUILD_SHARED_LIBS )
  add_definitions( -DOPENSSL_BUILD_SHLIBCRYPTO )
endif()

file(GLOB_RECURSE aesSRC "${CRYPTO_DIR}/aes/*.c")
file(GLOB_RECURSE ariaSRC "${CRYPTO_DIR}/aria/*.c")
file(GLOB_RECURSE asn1SRC "${CRYPTO_DIR}/asn1/*.c")
file(GLOB_RECURSE asyncSRC "${CRYPTO_DIR}/async/*.c")
file(GLOB_RECURSE bfSRC "${CRYPTO_DIR}/bf/*.c")
file(GLOB_RECURSE bioSRC "${CRYPTO_DIR}/bio/*.c")
file(GLOB bnSRC "${CRYPTO_DIR}/bn/*.c")
file(GLOB_RECURSE bufferSRC "${CRYPTO_DIR}/buffer/*.c")
file(GLOB_RECURSE camelliaSRC "${CRYPTO_DIR}/camellia/*.c")
file(GLOB_RECURSE castSRC "${CRYPTO_DIR}/cast/*.c")
file(GLOB_RECURSE chachaSRC "${CRYPTO_DIR}/chacha/*.c")
file(GLOB_RECURSE cmacSRC "${CRYPTO_DIR}/cmac/*.c")
file(GLOB_RECURSE cmpSRC "${CRYPTO_DIR}/cmp/*.c")
file(GLOB_RECURSE cmsSRC "${CRYPTO_DIR}/cms/*.c")
file(GLOB_RECURSE compSRC "${CRYPTO_DIR}/comp/*.c")
file(GLOB_RECURSE confSRC "${CRYPTO_DIR}/conf/*.c")
file(GLOB_RECURSE crmfSRC "${CRYPTO_DIR}/crmf/*.c")
#file(GLOB_RECURSE ctSRC "${CRYPTO_DIR}/ct/*.c")
file(GLOB_RECURSE desSRC "${CRYPTO_DIR}/des/*.c")
file(GLOB_RECURSE dhSRC "${CRYPTO_DIR}/dh/*.c")
file(GLOB_RECURSE dsaSRC "${CRYPTO_DIR}/dsa/*.c")
file(GLOB_RECURSE dsoSRC "${CRYPTO_DIR}/dso/*.c")
#file(GLOB_RECURSE ecSRC "${CRYPTO_DIR}/ec/*.c")
#file(GLOB_RECURSE engineSRC "${CRYPTO_DIR}/engine/*.c")
#file(GLOB_RECURSE errSRC "${CRYPTO_DIR}/err/*.c")
file(GLOB_RECURSE essSRC "${CRYPTO_DIR}/ess/*.c")
#file(GLOB_RECURSE evpSRC "${CRYPTO_DIR}/evp/*.c")
file(GLOB_RECURSE hmacSRC "${CRYPTO_DIR}/hmac/*.c")
file(GLOB_RECURSE ideaSRC "${CRYPTO_DIR}/idea/*.c")
file(GLOB_RECURSE kdfSRC "${CRYPTO_DIR}/kdf/*.c")
file(GLOB_RECURSE lhashSRC "${CRYPTO_DIR}/lhash/*.c")
#file(GLOB_RECURSE md2SRC "${CRYPTO_DIR}/md2/*.c")
file(GLOB_RECURSE md4SRC "${CRYPTO_DIR}/md4/*.c")
#file(GLOB_RECURSE md5SRC "${CRYPTO_DIR}/md5/*.c")
file(GLOB_RECURSE mdc2SRC "${CRYPTO_DIR}/mdc2/*.c")
file(GLOB_RECURSE modesSRC "${CRYPTO_DIR}/modes/*.c")
file(GLOB_RECURSE objectsSRC "${CRYPTO_DIR}/objects/*.c")
file(GLOB_RECURSE ocspSRC "${CRYPTO_DIR}/ocsp/*.c")
file(GLOB_RECURSE pemSRC "${CRYPTO_DIR}/pem/*.c")
file(GLOB_RECURSE perlasmSRC "${CRYPTO_DIR}/perlasm/*.c")
file(GLOB_RECURSE pkcs12SRC "${CRYPTO_DIR}/pkcs12/*.c")
file(GLOB_RECURSE pkcs7SRC "${CRYPTO_DIR}/pkcs7/*.c")
#file(GLOB_RECURSE poly1305SRC "${CRYPTO_DIR}/poly1305/*.c")
file(GLOB_RECURSE propertySRC "${CRYPTO_DIR}/property/*.c")
#file(GLOB_RECURSE randSRC "${CRYPTO_DIR}/rand/*.c")
file(GLOB_RECURSE rc2SRC "${CRYPTO_DIR}/rc2/*.c")
file(GLOB_RECURSE rc4SRC "${CRYPTO_DIR}/rc4/*.c")
#file(GLOB_RECURSE rc5SRC "${CRYPTO_DIR}/rc5/*.c")
file(GLOB_RECURSE ripemdSRC "${CRYPTO_DIR}/ripemd/*.c")
file(GLOB_RECURSE rsaSRC "${CRYPTO_DIR}/rsa/*.c")
file(GLOB_RECURSE seedSRC "${CRYPTO_DIR}/seed/*.c")
file(GLOB_RECURSE shaSRC "${CRYPTO_DIR}/sha/*.c")
file(GLOB_RECURSE siphashSRC "${CRYPTO_DIR}/siphash/*.c")
file(GLOB_RECURSE sm2SRC "${CRYPTO_DIR}/sm2/*.c")
file(GLOB_RECURSE sm3SRC "${CRYPTO_DIR}/sm3/*.c")
file(GLOB_RECURSE sm4SRC "${CRYPTO_DIR}/sm4/*.c")
file(GLOB_RECURSE srpSRC "${CRYPTO_DIR}/srp/*.c")
file(GLOB_RECURSE stackSRC "${CRYPTO_DIR}/stack/*.c")
file(GLOB_RECURSE storeSRC "${CRYPTO_DIR}/store/*.c")
file(GLOB_RECURSE tsSRC "${CRYPTO_DIR}/ts/*.c")
file(GLOB_RECURSE txt_dbSRC "${CRYPTO_DIR}/txt_db/*.c")
file(GLOB_RECURSE uiSRC "${CRYPTO_DIR}/ui/*.c")
file(GLOB_RECURSE whrlpoolSRC "${CRYPTO_DIR}/whrlpool/*.c")
#file(GLOB_RECURSE x509SRC "${CRYPTO_DIR}/x509/*.c")

set( CMAKE_THREAD_PREFER_PTHREAD TRUE )
find_package ( Threads )
if( NOT Threads_FOUND )
  set(THREADSRC "${CRYPTO_DIR}/threads_none.c" )
elseif( WIN32 )
  set(THREADSRC "${CRYPTO_DIR}/threads_win.c" )
else()
  set(THREADSRC "${CRYPTO_DIR}/threads_pthread.c" )
endif()

add_library( crypto ${cryptoSRC} ${THREADSRC} ${aesSRC}
	${ariaSRC}
	${asn1SRC}
	${asyncSRC}
	${bfSRC}
	${bioSRC}
	${bnSRC}
	${bufferSRC}
	${camelliaSRC}
	${castSRC}
	${chachaSRC}
	${cmacSRC}
	${cmpSRC}
	${cmsSRC}
	${compSRC}
	${confSRC}
	${crmfSRC}
	${ctSRC}
	${desSRC}
	${dhSRC}
	${dsaSRC}
	${dsoSRC}
	${ecSRC}
	${engineSRC}
	${errSRC}
	${essSRC}
	${evpSRC}
	${hmacSRC}
	${ideaSRC}
	${kdfSRC}
	${lhashSRC}
	${md2SRC}
	${md4SRC}
	${md5SRC}
	${mdc2SRC}
	${modesSRC}
	${objectsSRC}
	${ocspSRC}
	${pemSRC}
	${perlasmSRC}
	${pkcs12SRC}
	${pkcs7SRC}
	${poly1305SRC}
	${propertySRC}
	${randSRC}
	${rc2SRC}
	${rc4SRC}
	${rc5SRC}
	${ripemdSRC}
	${rsaSRC}
	${seedSRC}
	${shaSRC}
	${siphashSRC}
	${sm2SRC}
	${sm3SRC}
	${sm4SRC}
	${srpSRC}
	${stackSRC}
	${storeSRC}
	${tsSRC}
	${txt_dbSRC}
	${uiSRC}
	${whrlpoolSRC}
	${x509SRC})

set(OPENSSL_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/openssl/include" "${CMAKE_CURRENT_LIST_DIR}/openssl" "${CMAKE_CURRENT_LIST_DIR}" "${CMAKE_CURRENT_LIST_DIR}/..")
target_include_directories(crypto PRIVATE "${OPENSSL_INCLUDE_DIRS}")

## SSL

file(GLOB_RECURSE sslSRC "${SSL_DIR}/*.c")

add_library( ssl ${sslSRC} )
target_include_directories(ssl PRIVATE "${OPENSSL_INCLUDE_DIRS}")
