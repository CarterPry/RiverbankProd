// backend/src/layers/translation.ts
import { AttackType } from '@shared/types';
import { logger } from '../utils/logger';

interface CommandTemplate {
  tool: string;
  baseCommand: string[];
  parameterMapping: Record<string, string>;
  requiredParams: string[];
  timeout?: number;
}

const attackCommandMap: Record<AttackType, CommandTemplate> = {
  [AttackType.PORT_SCANNING]: {
    tool: 'nmap',
    baseCommand: ['nmap'],
    parameterMapping: {
      target: '',
      ports: '-p',
      flags: '',
    },
    requiredParams: ['target'],
    timeout: 60000,
  },
  [AttackType.SQL_INJECTION]: {
    tool: 'sqlmap',
    baseCommand: ['sqlmap', '--batch'],
    parameterMapping: {
      target: '-u',
      data: '--data',
      cookie: '--cookie',
      level: '--level',
      risk: '--risk',
    },
    requiredParams: ['target'],
    timeout: 300000,
  },
  [AttackType.XSS]: {
    tool: 'xsstrike',
    baseCommand: ['python3', '/opt/XSStrike/xsstrike.py'],
    parameterMapping: {
      target: '-u',
      crawl: '--crawl',
      blind: '--blind',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.CLICKJACKING]: {
    tool: 'nikto',
    baseCommand: ['nikto'],
    parameterMapping: {
      target: '-h',
      ssl: '-ssl',
      port: '-p',
    },
    requiredParams: ['target'],
    timeout: 120000,
  },
  [AttackType.SSL_VULNERABILITIES]: {
    tool: 'testssl',
    baseCommand: ['testssl.sh'],
    parameterMapping: {
      target: '',
      severity: '--severity',
      protocols: '--protocols',
      vulnerable: '--vulnerable',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.AUTHENTICATION_BYPASS]: {
    tool: 'hydra',
    baseCommand: ['hydra'],
    parameterMapping: {
      target: '',
      username: '-l',
      userlist: '-L',
      password: '-p',
      passlist: '-P',
      service: '',
      threads: '-t',
    },
    requiredParams: ['target', 'service'],
    timeout: 300000,
  },
  [AttackType.DIRECTORY_TRAVERSAL]: {
    tool: 'gobuster',
    baseCommand: ['gobuster', 'dir'],
    parameterMapping: {
      target: '-u',
      wordlist: '-w',
      extensions: '-x',
      threads: '-t',
    },
    requiredParams: ['target', 'wordlist'],
    timeout: 180000,
  },
  [AttackType.CSRF]: {
    tool: 'burpsuite',
    baseCommand: ['burp-rest-api', '--headless'],
    parameterMapping: {
      target: '--target',
      config: '--config',
    },
    requiredParams: ['target'],
    timeout: 240000,
  },
  [AttackType.XXE]: {
    tool: 'xxeinjector',
    baseCommand: ['python', '/opt/XXEinjector/XXEinjector.py'],
    parameterMapping: {
      target: '--url',
      file: '--file',
      method: '--method',
    },
    requiredParams: ['target'],
    timeout: 120000,
  },
  [AttackType.SSRF]: {
    tool: 'ssrfmap',
    baseCommand: ['python3', '/opt/SSRFmap/ssrfmap.py'],
    parameterMapping: {
      target: '-u',
      data: '-d',
      modules: '-m',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.COMMAND_INJECTION]: {
    tool: 'commix',
    baseCommand: ['commix'],
    parameterMapping: {
      target: '-u',
      data: '--data',
      technique: '--technique',
      batch: '--batch',
    },
    requiredParams: ['target'],
    timeout: 240000,
  },
  [AttackType.FILE_UPLOAD]: {
    tool: 'fuxploider',
    baseCommand: ['python3', '/opt/fuxploider/fuxploider.py'],
    parameterMapping: {
      target: '-u',
      proxy: '--proxy',
      threads: '--threads',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.LDAP_INJECTION]: {
    tool: 'ldapdomaindump',
    baseCommand: ['ldapdomaindump'],
    parameterMapping: {
      target: '',
      user: '-u',
      password: '-p',
      authtype: '--authtype',
    },
    requiredParams: ['target'],
    timeout: 120000,
  },
  [AttackType.VULNERABILITY_SCANNING]: {
    tool: 'nikto',
    baseCommand: ['nikto'],
    parameterMapping: {
      target: '-h',
      port: '-p',
      ssl: '-ssl',
      tuning: '-Tuning',
    },
    requiredParams: ['target'],
    timeout: 300000,
  },
  [AttackType.DOS_ATTACKS]: {
    tool: 'hping3',
    baseCommand: ['hping3'],
    parameterMapping: {
      target: '',
      flood: '--flood',
      port: '-p',
      syn: '-S',
    },
    requiredParams: ['target'],
    timeout: 60000,
  },
  [AttackType.SESSION_MANAGEMENT]: {
    tool: 'burpsuite',
    baseCommand: ['burp-rest-api', '--headless'],
    parameterMapping: {
      target: '--target',
      config: '--config',
      scope: '--scope',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.PRIVILEGE_ESCALATION]: {
    tool: 'metasploit',
    baseCommand: ['msfconsole', '-q', '-x'],
    parameterMapping: {
      target: 'set RHOSTS',
      exploit: 'use',
      payload: 'set payload',
    },
    requiredParams: ['target', 'exploit'],
    timeout: 300000,
  },
  [AttackType.DATA_EXFILTRATION]: {
    tool: 'dnscat2',
    baseCommand: ['dnscat2-client'],
    parameterMapping: {
      target: '',
      domain: '--domain',
      secret: '--secret',
    },
    requiredParams: ['target'],
    timeout: 180000,
  },
  [AttackType.IDOR]: {
    tool: 'autorize',
    baseCommand: ['python3', '/opt/autorize/autorize.py'],
    parameterMapping: {
      target: '-u',
      cookies: '--cookies',
      headers: '--headers',
    },
    requiredParams: ['target'],
    timeout: 240000,
  },
  [AttackType.BUFFER_OVERFLOW]: {
    tool: 'spike',
    baseCommand: ['generic_send_tcp'],
    parameterMapping: {
      target: '',
      port: '',
      script: '',
    },
    requiredParams: ['target', 'port', 'script'],
    timeout: 120000,
  },
  [AttackType.LATERAL_MOVEMENT]: {
    tool: 'crackmapexec',
    baseCommand: ['crackmapexec'],
    parameterMapping: {
      target: '',
      username: '-u',
      password: '-p',
      protocol: '',
    },
    requiredParams: ['target', 'protocol'],
    timeout: 240000,
  },
};

export async function mapAttackToCommand(
  attackType: AttackType,
  parameters: Record<string, any>
): Promise<string> {
  const template = attackCommandMap[attackType];
  if (!template) {
    throw new Error(`No command mapping for attack type: ${attackType}`);
  }

  // Validate required parameters
  for (const param of template.requiredParams) {
    if (!parameters[param]) {
      throw new Error(`Missing required parameter for ${attackType}: ${param}`);
    }
  }

  // Build command
  const commandParts = [...template.baseCommand];

  // Add parameters
  for (const [param, value] of Object.entries(parameters)) {
    const flag = template.parameterMapping[param];
    if (flag !== undefined) {
      if (flag) {
        commandParts.push(flag);
      }
      if (value !== true) {
        commandParts.push(String(value));
      }
    }
  }

  // Special handling for certain tools
  const command = handleSpecialCases(attackType, commandParts, parameters);

  logger.debug('Translated attack to command', {
    attackType,
    command: command.join(' '),
  });

  return command.join(' ');
}

function handleSpecialCases(
  attackType: AttackType,
  commandParts: string[],
  parameters: Record<string, any>
): string[] {
  switch (attackType) {
    case AttackType.PORT_SCANNING:
      // Add default nmap flags if not specified
      if (!parameters.flags) {
        commandParts.push('-sV', '-sC', '-T4');
      }
      break;

    case AttackType.SQL_INJECTION:
      // Set default risk and level if not specified
      if (!parameters.level) {
        commandParts.push('--level', '3');
      }
      if (!parameters.risk) {
        commandParts.push('--risk', '2');
      }
      break;

    case AttackType.AUTHENTICATION_BYPASS:
      // Handle service-specific syntax for hydra
      if (parameters.service) {
        commandParts.push(`${parameters.service}://${parameters.target}`);
      }
      break;

    case AttackType.DIRECTORY_TRAVERSAL:
      // Use default wordlist if not specified
      if (!parameters.wordlist) {
        commandParts.push('-w', '/usr/share/wordlists/dirb/common.txt');
      }
      break;

    case AttackType.PRIVILEGE_ESCALATION:
      // Format Metasploit commands
      const msf_commands = [];
      if (parameters.exploit) {
        msf_commands.push(`use ${parameters.exploit}`);
      }
      msf_commands.push(`set RHOSTS ${parameters.target}`);
      if (parameters.payload) {
        msf_commands.push(`set payload ${parameters.payload}`);
      }
      msf_commands.push('run');
      return ['msfconsole', '-q', '-x', msf_commands.join('; ')];
  }

  return commandParts;
}

export function getTimeoutForAttack(attackType: AttackType): number {
  return attackCommandMap[attackType]?.timeout || 300000; // Default 5 minutes
}

export function getToolForAttack(attackType: AttackType): string {
  return attackCommandMap[attackType]?.tool || 'unknown';
} 