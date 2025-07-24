// backend/src/mcp-server/tools/tools.ts
import { ToolDefinition } from '@shared/types';

export const tools: Record<string, ToolDefinition> = {
  scan_ports: {
    name: 'scan_ports',
    description: 'Scan network ports to identify open services and potential vulnerabilities',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'nmap {{target}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target domain or IP address to scan',
        validation: {
          pattern: '^[a-zA-Z0-9.-]+$',
        },
      },
      {
        name: 'ports',
        type: 'string',
        required: false,
        default: '1-65535',
        description: 'Port range to scan (e.g., "80,443" or "1-1000")',
      },
      {
        name: 'flags',
        type: 'array',
        required: false,
        default: ['-sV', '-sC', '-T4'],
        description: 'Additional nmap flags',
      },
    ],
    output_parser: 'nmap',
    timeout_ms: 60000,
  },

  test_vulnerability: {
    name: 'test_vulnerability',
    description: 'Test for specific vulnerabilities based on attack type',
    docker_image: 'kalilinux/kali-rolling',
    command_template: '{{command}}',
    parameters: [
      {
        name: 'attack_type',
        type: 'string',
        required: true,
        description: 'Type of vulnerability to test for',
        validation: {
          enum: [
            'sql_injection',
            'xss',
            'csrf',
            'clickjacking',
            'authentication_bypass',
            'directory_traversal',
            'file_upload',
            'xxe',
            'ssrf',
            'command_injection',
            'ldap_injection',
          ],
        },
      },
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL or endpoint',
      },
      {
        name: 'options',
        type: 'object',
        required: false,
        description: 'Attack-specific options',
      },
    ],
    timeout_ms: 300000,
  },

  check_ssl: {
    name: 'check_ssl',
    description: 'Check SSL/TLS configuration and vulnerabilities',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'testssl.sh {{target}}:{{port}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target domain or IP',
      },
      {
        name: 'port',
        type: 'number',
        required: false,
        default: 443,
        description: 'SSL/TLS port',
        validation: {
          min: 1,
          max: 65535,
        },
      },
      {
        name: 'protocols',
        type: 'array',
        required: false,
        description: 'Protocols to test',
        default: ['ssl2', 'ssl3', 'tls1', 'tls1_1', 'tls1_2', 'tls1_3'],
      },
    ],
    output_parser: 'testssl',
    timeout_ms: 120000,
  },

  test_authentication: {
    name: 'test_authentication',
    description: 'Test authentication mechanisms for weaknesses',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'hydra {{target}} {{service}} {{credentials}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target host',
      },
      {
        name: 'service',
        type: 'string',
        required: true,
        description: 'Service to attack (e.g., ssh, http-post-form)',
        validation: {
          enum: [
            'ssh',
            'ftp',
            'http-get',
            'http-post',
            'http-post-form',
            'https-get',
            'https-post',
            'https-post-form',
            'mysql',
            'postgres',
            'rdp',
            'smb',
            'smtp',
            'telnet',
          ],
        },
      },
      {
        name: 'username',
        type: 'string',
        required: false,
        description: 'Single username to test',
      },
      {
        name: 'wordlist',
        type: 'string',
        required: false,
        default: '/usr/share/wordlists/rockyou.txt',
        description: 'Path to password wordlist',
      },
    ],
    timeout_ms: 300000,
  },

  analyze_headers: {
    name: 'analyze_headers',
    description: 'Analyze HTTP headers for security issues including clickjacking',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'nikto -h {{target}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL',
      },
      {
        name: 'headers',
        type: 'array',
        required: false,
        description: 'Specific headers to check',
        default: [
          'X-Frame-Options',
          'Content-Security-Policy',
          'X-Content-Type-Options',
          'Strict-Transport-Security',
          'X-XSS-Protection',
        ],
      },
    ],
    output_parser: 'nikto',
    timeout_ms: 30000,
  },

  test_sqli: {
    name: 'test_sqli',
    description: 'Test for SQL injection vulnerabilities',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'sqlmap -u {{target}} {{flags}} --batch',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL with parameters',
      },
      {
        name: 'data',
        type: 'string',
        required: false,
        description: 'POST data to test',
      },
      {
        name: 'level',
        type: 'number',
        required: false,
        default: 3,
        description: 'Test level (1-5)',
        validation: {
          min: 1,
          max: 5,
        },
      },
      {
        name: 'risk',
        type: 'number',
        required: false,
        default: 2,
        description: 'Risk level (1-3)',
        validation: {
          min: 1,
          max: 3,
        },
      },
    ],
    output_parser: 'sqlmap',
    timeout_ms: 300000,
  },

  test_xss: {
    name: 'test_xss',
    description: 'Test for Cross-Site Scripting vulnerabilities',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'python3 /opt/XSStrike/xsstrike.py -u {{target}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL',
      },
      {
        name: 'crawl',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable crawling',
      },
      {
        name: 'blind',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Test for blind XSS',
      },
    ],
    output_parser: 'xsstrike',
    timeout_ms: 180000,
  },

  directory_scan: {
    name: 'directory_scan',
    description: 'Scan for hidden directories and files',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'gobuster dir -u {{target}} -w {{wordlist}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL',
      },
      {
        name: 'wordlist',
        type: 'string',
        required: false,
        default: '/usr/share/wordlists/dirb/common.txt',
        description: 'Path to wordlist',
      },
      {
        name: 'extensions',
        type: 'string',
        required: false,
        description: 'File extensions to check (e.g., "php,asp,txt")',
      },
      {
        name: 'threads',
        type: 'number',
        required: false,
        default: 10,
        description: 'Number of threads',
        validation: {
          min: 1,
          max: 50,
        },
      },
    ],
    output_parser: 'gobuster',
    timeout_ms: 180000,
  },

  vulnerability_scan: {
    name: 'vulnerability_scan',
    description: 'Comprehensive vulnerability scan',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'nikto -h {{target}} -Tuning {{tuning}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target URL or IP',
      },
      {
        name: 'tuning',
        type: 'string',
        required: false,
        default: '123456789',
        description: 'Nikto tuning options',
      },
      {
        name: 'ssl',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Force SSL',
      },
    ],
    output_parser: 'nikto',
    timeout_ms: 300000,
  },

  test_file_upload: {
    name: 'test_file_upload',
    description: 'Test file upload functionality for vulnerabilities',
    docker_image: 'kalilinux/kali-rolling',
    command_template: 'python3 /opt/fuxploider/fuxploider.py -u {{target}} {{flags}}',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'File upload endpoint URL',
      },
      {
        name: 'proxy',
        type: 'string',
        required: false,
        description: 'Proxy URL for requests',
      },
      {
        name: 'threads',
        type: 'number',
        required: false,
        default: 5,
        description: 'Number of threads',
        validation: {
          min: 1,
          max: 20,
        },
      },
    ],
    output_parser: 'fuxploider',
    timeout_ms: 180000,
  },
};

// Export tool names for validation
export const toolNames = Object.keys(tools);

// Helper function to get tool by name
export function getTool(name: string): ToolDefinition | undefined {
  return tools[name];
}

// Helper function to validate tool exists
export function isValidTool(name: string): boolean {
  return name in tools;
} 