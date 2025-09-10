#!/usr/bin/env node

// Demo script to showcase HTTP version selection improvements
const chalk = require('chalk');

console.log(chalk.blue.bold('🚀 HTTP Tool - Enhanced HTTP Version Selection Demo\n'));

console.log(chalk.yellow('📋 Available HTTP Version Options:'));
console.log(chalk.cyan('  --http 1, 1.1, http1     ') + 'HTTP/1.1 only (better for simple targets)');
console.log(chalk.cyan('  --http 2, 2.0, http2     ') + 'HTTP/2 only (better for modern servers)');
console.log(chalk.cyan('  --http mix, both         ') + 'Both HTTP/1.1 and HTTP/2 (maximum compatibility)');
console.log(chalk.cyan('  --http 2 (default)       ') + 'Default: HTTP/2 only\n');

console.log(chalk.yellow('⚡ Performance Options:'));
console.log(chalk.cyan('  --performance low        ') + 'Low resource usage, slower requests');
console.log(chalk.cyan('  --performance balanced   ') + 'Balanced performance (default)');
console.log(chalk.cyan('  --performance high       ') + 'High performance, more resource usage\n');

console.log(chalk.yellow('🧠 Adaptive Options:'));
console.log(chalk.cyan('  --adaptive              ') + 'Enable adaptive HTTP version selection\n');

console.log(chalk.yellow('🔧 Example Commands:'));
console.log(chalk.green('  # HTTP/1.1 only for simple targets:'));
console.log('  node http_tool.js GET "http://target.com" 60 4 20 proxy.txt --http 1\n');

console.log(chalk.green('  # HTTP/2 only for modern servers:'));
console.log('  node http_tool.js GET "https://target.com" 60 4 20 proxy.txt --http 2\n');

console.log(chalk.green('  # Mixed mode for maximum compatibility:'));
console.log('  node http_tool.js GET "https://target.com" 60 4 20 proxy.txt --http mix\n');

console.log(chalk.green('  # High performance mode:'));
console.log('  node http_tool.js GET "https://target.com" 60 4 20 proxy.txt --http 2 --performance high\n');

console.log(chalk.green('  # Adaptive mode with TLS 1.3:'));
console.log('  node http_tool.js GET "https://target.com" 60 4 20 proxy.txt --adaptive --tls 13\n');

console.log(chalk.magenta.bold('✨ Key Improvements:'));
console.log(chalk.white('  • Enhanced HTTP version selection with better validation'));
console.log(chalk.white('  • Performance-optimized configurations for each HTTP version'));
console.log(chalk.white('  • Adaptive selection based on target characteristics'));
console.log(chalk.white('  • Improved connection pooling and resource management'));
console.log(chalk.white('  • Better error handling and fallback mechanisms'));
console.log(chalk.white('  • More granular control over request behavior\n'));

console.log(chalk.blue('📊 Performance Comparison:'));
console.log(chalk.white('  HTTP/1.1: Smaller batches, longer delays, fewer connections'));
console.log(chalk.white('  HTTP/2:   Larger batches, shorter delays, more connections'));
console.log(chalk.white('  Mixed:    Weighted selection (70% HTTP/2, 30% HTTP/1.1)\n'));

console.log(chalk.green.bold('🎯 Recommendations:'));
console.log(chalk.white('  • Use HTTP/1.1 for simple targets or older servers'));
console.log(chalk.white('  • Use HTTP/2 for modern CDNs and cloud services'));
console.log(chalk.white('  • Use mixed mode for maximum compatibility'));
console.log(chalk.white('  • Use adaptive mode for unknown targets'));
console.log(chalk.white('  • Use high performance mode for powerful servers\n'));

console.log(chalk.cyan('For more information, run: node http_tool.js'));