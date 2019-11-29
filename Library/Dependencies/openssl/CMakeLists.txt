cmake_minimum_required(VERSION 3.15)
project( openssl )

add_definitions( -DOPENSSL_NO_ASM )
add_definitions( -DOPENSSL_NO_STATIC_ENGINE )
add_definitions( -DOPENSSLDIR="/usr/local/ssl" )
add_definitions( -DENGINESDIR="lib/engines-3" )
add_definitions( -DMODULESDIR="lib/ossl-modules" )
add_definitions( -DSIXTY_FOUR_BIT_LONG) # depends on ABI

set(CRYPTO_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl/crypto")
set(PROVIDERS_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl/providers")
set(SSL_DIR "${CMAKE_CURRENT_LIST_DIR}/openssl/ssl")
set(CIPHERS_DIR "${PROVIDERS_DIR}/implementations/ciphers")
set(KDFS_DIR "${PROVIDERS_DIR}/implementations/kdfs")
set(KEY_DIR "${PROVIDERS_DIR}/implementations/keymgmt")

# crypto

set(keySRC 
  "${KEY_DIR}/dh_kmgmt.c"
  "${KEY_DIR}/dsa_kmgmt.c"
  "${KEY_DIR}/rsa_kmgmt.c")

set (kdfsSRC 
  "${KDFS_DIR}/hkdf.c"
  "${KDFS_DIR}/kbkdf.c"
  "${KDFS_DIR}/krb5kdf.c"
  "${KDFS_DIR}/pbkdf2.c"
  "${KDFS_DIR}/pbkdf2_fips.c"
  "${KDFS_DIR}/scrypt.c"
  "${KDFS_DIR}/sshkdf.c"
  "${KDFS_DIR}/sskdf.c"
  "${KDFS_DIR}/tls1_prf.c"
  "${KDFS_DIR}/x942kdf.c")

set( cipherSRC "${CIPHERS_DIR}/cipher_aes.c"
  "${CIPHERS_DIR}/cipher_aes_ccm.c"
  "${CIPHERS_DIR}/cipher_aes_ccm_hw.c"
  "${CIPHERS_DIR}/cipher_aes_gcm.c"
  "${CIPHERS_DIR}/cipher_aes_gcm_hw.c"
  "${CIPHERS_DIR}/cipher_aes_hw.c"
  "${CIPHERS_DIR}/cipher_aes_ocb.c"
  "${CIPHERS_DIR}/cipher_aes_ocb_hw.c"
  "${CIPHERS_DIR}/cipher_aes_siv.c"
  "${CIPHERS_DIR}/cipher_aes_siv_hw.c"
  "${CIPHERS_DIR}/cipher_aes_wrp.c"
  "${CIPHERS_DIR}/cipher_aes_xts.c"
  "${CIPHERS_DIR}/cipher_aes_xts_fips.c"
  "${CIPHERS_DIR}/cipher_aes_xts_hw.c"
  "${CIPHERS_DIR}/cipher_aria.c"
  "${CIPHERS_DIR}/cipher_aria_ccm.c"
  "${CIPHERS_DIR}/cipher_aria_ccm_hw.c"
  "${CIPHERS_DIR}/cipher_aria_gcm.c"
  "${CIPHERS_DIR}/cipher_aria_gcm_hw.c"
  "${CIPHERS_DIR}/cipher_aria_hw.c"
  "${CIPHERS_DIR}/cipher_blowfish.c"
  "${CIPHERS_DIR}/cipher_blowfish_hw.c"
  "${CIPHERS_DIR}/cipher_camellia.c"
  "${CIPHERS_DIR}/cipher_camellia_hw.c"
  "${CIPHERS_DIR}/cipher_cast5.c"
  "${CIPHERS_DIR}/cipher_cast5_hw.c"
  "${CIPHERS_DIR}/cipher_chacha20.c"
  "${CIPHERS_DIR}/cipher_chacha20_hw.c"
  "${CIPHERS_DIR}/cipher_chacha20_poly1305.c"
  "${CIPHERS_DIR}/cipher_chacha20_poly1305_hw.c"
  "${CIPHERS_DIR}/cipher_des.c"
  "${CIPHERS_DIR}/cipher_desx.c"
  "${CIPHERS_DIR}/cipher_desx_hw.c"
  "${CIPHERS_DIR}/cipher_des_hw.c"
  "${CIPHERS_DIR}/cipher_idea.c"
  "${CIPHERS_DIR}/cipher_idea_hw.c"
  "${CIPHERS_DIR}/cipher_rc2.c"
  "${CIPHERS_DIR}/cipher_rc2_hw.c"
  "${CIPHERS_DIR}/cipher_rc4.c"
  "${CIPHERS_DIR}/cipher_rc4_hmac_md5.c"
  "${CIPHERS_DIR}/cipher_rc4_hmac_md5_hw.c"
  "${CIPHERS_DIR}/cipher_rc4_hw.c"
  #"${CIPHERS_DIR}/cipher_rc5.c"
  #"${CIPHERS_DIR}/cipher_rc5_hw.c"
  "${CIPHERS_DIR}/cipher_seed.c"
  "${CIPHERS_DIR}/cipher_seed_hw.c"
  "${CIPHERS_DIR}/cipher_sm4.c"
  "${CIPHERS_DIR}/cipher_sm4_hw.c"
  "${CIPHERS_DIR}/cipher_tdes.c"
  "${CIPHERS_DIR}/cipher_tdes_default.c"
  "${CIPHERS_DIR}/cipher_tdes_default_hw.c"
  "${CIPHERS_DIR}/cipher_tdes_hw.c"
  "${CIPHERS_DIR}/cipher_tdes_wrap.c"
  "${CIPHERS_DIR}/cipher_tdes_wrap_hw.c")

set(providerSRC "${PROVIDERS_DIR}/common/provider_err.c"
  "${PROVIDERS_DIR}/common/nid_to_name.c"
  "${PROVIDERS_DIR}/common/provider_util.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_common.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_ccm.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_gcm.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_gcm_hw.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_common_hw.c"
  "${PROVIDERS_DIR}/common/ciphers/cipher_ccm_hw.c"
  "${PROVIDERS_DIR}/common/ciphers/block.c"
  "${PROVIDERS_DIR}/defltprov.c"
  "${PROVIDERS_DIR}/implementations/digests/md5_sha1_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/sha2_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/sha3_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/blake2_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/blake2b_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/blake2s_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/md5_prov.c"
  "${PROVIDERS_DIR}/implementations/digests/sm3_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/cmac_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/poly1305_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/kmac_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/hmac_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/blake2b_mac.c"
  "${PROVIDERS_DIR}/implementations/macs/blake2s_mac.c"
  "${PROVIDERS_DIR}/implementations/macs/gmac_prov.c"
  "${PROVIDERS_DIR}/implementations/macs/siphash_prov.c"
  "${PROVIDERS_DIR}/implementations/asymciphers/rsa_enc.c"
  "${PROVIDERS_DIR}/implementations/signature/dsa.c"
  "${PROVIDERS_DIR}/implementations/exchange/dh_exch.c"
  "${PROVIDERS_DIR}/common/digests/digest_common.c")

set(cryptoSRC "${CRYPTO_DIR}/asn1_dsa.c" 
  "${CRYPTO_DIR}/bsearch.c" 
  "${CRYPTO_DIR}/cpt_err.c" 
  "${CRYPTO_DIR}/cryptlib.c"
  "${CRYPTO_DIR}/ctype.c"
  "${CRYPTO_DIR}/cversion.c"
  "${CRYPTO_DIR}/context.c"
  "${CRYPTO_DIR}/core_namemap.c"
  "${CRYPTO_DIR}/core_algorithm.c"
  "${CRYPTO_DIR}/core_fetch.c"
  "${CRYPTO_DIR}/ebcdic.c"
  "${CRYPTO_DIR}/ex_data.c"
  "${CRYPTO_DIR}/init.c"
  "${CRYPTO_DIR}/initthread.c"
  "${CRYPTO_DIR}/info.c"
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
  "${CRYPTO_DIR}/params.c"
  "${CRYPTO_DIR}/param_build.c"
  "${CRYPTO_DIR}/params_from_text.c"
  "${CRYPTO_DIR}/provider_conf.c"
  "${CRYPTO_DIR}/provider_core.c"
  "${CRYPTO_DIR}/provider_predefined.c"
  "${CRYPTO_DIR}/packet.c"
  "${CRYPTO_DIR}/uid.c"
  "${CRYPTO_DIR}/getenv.c" 
  "${CRYPTO_DIR}/sparse_array.c" 
  "${CRYPTO_DIR}/trace.c"
  "${CRYPTO_DIR}/ec/ec_key.c" 
  "${CRYPTO_DIR}/ec/ec_pmeth.c" 
  "${CRYPTO_DIR}/ec/ecdh_ossl.c" 
  "${CRYPTO_DIR}/ec/ecdsa_ossl.c" 
  "${CRYPTO_DIR}/ec/ecdsa_sign.c" 
  "${CRYPTO_DIR}/ec/ecdsa_vrf.c" 
  "${CRYPTO_DIR}/ec/ecp_mont.c" 
  "${CRYPTO_DIR}/ec/ecp_smpl.c" 
  "${CRYPTO_DIR}/ec/ec2_smpl.c" 
  "${CRYPTO_DIR}/ec/ecdh_kdf.c" 
  "${CRYPTO_DIR}/ec/ec_lib.c" 
  "${CRYPTO_DIR}/ec/ec_asn1.c" 
  "${CRYPTO_DIR}/ec/ec_mult.c" 
  "${CRYPTO_DIR}/ec/ec_kmeth.c" 
  "${CRYPTO_DIR}/ec/ec_cvt.c" 
  "${CRYPTO_DIR}/ec/ec_oct.c" 
  "${CRYPTO_DIR}/ec/ec2_oct.c" 
  "${CRYPTO_DIR}/ec/ecp_oct.c" 
  "${CRYPTO_DIR}/ec/ecp_nist.c" 
  "${CRYPTO_DIR}/ec/ec_curve.c" 
  "${CRYPTO_DIR}/ec/ec_err.c" 
  "${CRYPTO_DIR}/ec/ec_cvt.c" 
  "${CRYPTO_DIR}/ec/ecx_meth.c" 
  "${CRYPTO_DIR}/ec/ec_ameth.c" 
  "${CRYPTO_DIR}/ec/curve25519.c" 
  "${CRYPTO_DIR}/ec/eck_prn.c" 
  "${CRYPTO_DIR}/ec/ec_check.c" 
  "${CRYPTO_DIR}/ec/ec_print.c" 
  "${CRYPTO_DIR}/ec/curve448/curve448.c" 
  "${CRYPTO_DIR}/ec/curve448/eddsa.c"
  "${CRYPTO_DIR}/ec/curve448/scalar.c" 
  "${CRYPTO_DIR}/ec/curve448/curve448_tables.c" 
  "${CRYPTO_DIR}/ec/curve448/arch_32/f_impl.c" 
  "${CRYPTO_DIR}/ec/curve448/f_generic.c" 
  "${CRYPTO_DIR}/poly1305/poly1305.c" 
  "${CRYPTO_DIR}/poly1305/poly1305_ameth.c")

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
file(GLOB_RECURSE ctSRC "${CRYPTO_DIR}/ct/*.c")
file(GLOB_RECURSE desSRC "${CRYPTO_DIR}/des/*.c")
file(GLOB_RECURSE dhSRC "${CRYPTO_DIR}/dh/*.c")
file(GLOB_RECURSE dsaSRC "${CRYPTO_DIR}/dsa/*.c")
file(GLOB_RECURSE dsoSRC "${CRYPTO_DIR}/dso/*.c")
#file(GLOB_RECURSE ecSRC "${CRYPTO_DIR}/ec/*.c")
file(GLOB_RECURSE engineSRC "${CRYPTO_DIR}/engine/*.c")
file(GLOB_RECURSE errSRC "${CRYPTO_DIR}/err/*.c")
file(GLOB_RECURSE essSRC "${CRYPTO_DIR}/ess/*.c")
file(GLOB_RECURSE evpSRC "${CRYPTO_DIR}/evp/*.c")
file(GLOB_RECURSE hmacSRC "${CRYPTO_DIR}/hmac/*.c")
file(GLOB_RECURSE ideaSRC "${CRYPTO_DIR}/idea/*.c")
file(GLOB_RECURSE kdfSRC "${CRYPTO_DIR}/kdf/*.c")
file(GLOB_RECURSE lhashSRC "${CRYPTO_DIR}/lhash/*.c")
#file(GLOB_RECURSE md2SRC "${CRYPTO_DIR}/md2/*.c")
file(GLOB_RECURSE md4SRC "${CRYPTO_DIR}/md4/*.c")
file(GLOB_RECURSE md5SRC "${CRYPTO_DIR}/md5/*.c")
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
file(GLOB_RECURSE randSRC "${CRYPTO_DIR}/rand/*.c")
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
file(GLOB_RECURSE x509SRC "${CRYPTO_DIR}/x509/*.c")

set( CMAKE_THREAD_PREFER_PTHREAD TRUE )
find_package ( Threads )
if( NOT Threads_FOUND )
  set(THREADSRC "${CRYPTO_DIR}/threads_none.c" )
elseif( WIN32 )
  set(THREADSRC "${CRYPTO_DIR}/threads_win.c" )
else()
  set(THREADSRC "${CRYPTO_DIR}/threads_pthread.c" )
endif()

add_library( crypto ${cryptoSRC} 
  ${THREADSRC} 
  ${aesSRC}
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

set(OPENSSL_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/openssl/include" 
  "${CMAKE_CURRENT_LIST_DIR}/openssl" 
  "${CMAKE_CURRENT_LIST_DIR}" 
  "${CMAKE_CURRENT_LIST_DIR}/.." 
  "${CMAKE_CURRENT_LIST_DIR}/openssl/providers/implementations/include"
  "${CMAKE_CURRENT_LIST_DIR}/openssl/providers/common/include"
  "${CMAKE_CURRENT_LIST_DIR}/openssl/crypto/ec/curve448/arch_32"
  "${CMAKE_CURRENT_LIST_DIR}/openssl/crypto/ec/curve448"
  "${CMAKE_CURRENT_LIST_DIR}/openssl/crypto")

target_include_directories(crypto PRIVATE "${OPENSSL_INCLUDE_DIRS}")

## SSL

file(GLOB_RECURSE sslSRC "${SSL_DIR}/*.c")

add_library(ssl ${sslSRC} 
  ${compSRC} 
  ${x509SRC} 
  ${cryptoSRC} 
  ${ctSRC} 
  ${asyncSRC} 
  ${shaSRC} 
  ${srpSRC} 
  ${txt_dbSRC} 
  ${bnSRC} 
  ${bioSRC} 
  ${ocspSRC} 
  ${evpSRC} 
  ${cipherSRC} 
  ${kdfsSRC} 
  ${keySRC} 
  ${providerSRC} 
  ${md5SRC} 
  ${cmacSRC} 
  ${siphashSRC})
target_include_directories(ssl PRIVATE "${OPENSSL_INCLUDE_DIRS}")

set(SSLCONF_DESTINATION "${CMAKE_CURRENT_LIST_DIR}/openssl/include/openssl")
file(COPY "${CMAKE_CURRENT_LIST_DIR}/opensslconf.h" DESTINATION "${SSLCONF_DESTINATION}")
file(COPY "${CMAKE_CURRENT_LIST_DIR}/opensslv.h" DESTINATION "${SSLCONF_DESTINATION}")
