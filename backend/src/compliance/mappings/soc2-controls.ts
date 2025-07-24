// backend/src/compliance/mappings/soc2-controls.ts
import { SecurityControl, TrustService } from '@shared/types';

export interface ControlDefinition {
  id: SecurityControl;
  name: string;
  description: string;
  trust_service: TrustService;
  testing_procedures: string[];
  evidence_requirements: string[];
  common_vulnerabilities: string[];
}

export const SOC2_CONTROLS: Record<SecurityControl, ControlDefinition> = {
  [SecurityControl.CC5_1]: {
    id: SecurityControl.CC5_1,
    name: 'Selection and Development of Controls',
    description: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review control selection methodology',
      'Verify risk assessment process',
      'Test control implementation'
    ],
    evidence_requirements: [
      'Risk assessment documentation',
      'Control matrix',
      'Implementation evidence'
    ],
    common_vulnerabilities: ['security_misconfiguration', 'insufficient_logging']
  },
  [SecurityControl.CC5_2]: {
    id: SecurityControl.CC5_2,
    name: 'Internal Control Monitoring',
    description: 'The entity deploys control activities through policies that establish what is expected and procedures that put policies into place.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review monitoring procedures',
      'Test alert mechanisms',
      'Verify incident response'
    ],
    evidence_requirements: [
      'Monitoring logs',
      'Alert screenshots',
      'Incident reports'
    ],
    common_vulnerabilities: ['insufficient_logging']
  },
  [SecurityControl.CC6_1]: {
    id: SecurityControl.CC6_1,
    name: 'Logical and Physical Access Controls',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test authentication mechanisms',
      'Verify access control lists',
      'Review permission structures',
      'Test for broken access control'
    ],
    evidence_requirements: [
      'Access control matrix',
      'Authentication test results',
      'Permission audit logs'
    ],
    common_vulnerabilities: ['broken_access_control', 'broken_authentication', 'idor']
  },
  [SecurityControl.CC6_2]: {
    id: SecurityControl.CC6_2,
    name: 'Prior to Issuing System Credentials',
    description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review user provisioning process',
      'Test identity verification',
      'Verify approval workflows'
    ],
    evidence_requirements: [
      'User onboarding records',
      'Approval documentation',
      'Identity verification logs'
    ],
    common_vulnerabilities: ['broken_authentication', 'default_credentials']
  },
  [SecurityControl.CC6_3]: {
    id: SecurityControl.CC6_3,
    name: 'Removal of Access',
    description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test deprovisioning process',
      'Verify timely access removal',
      'Check for orphaned accounts'
    ],
    evidence_requirements: [
      'Termination checklists',
      'Access removal logs',
      'Periodic access reviews'
    ],
    common_vulnerabilities: ['broken_access_control']
  },
  [SecurityControl.CC6_4]: {
    id: SecurityControl.CC6_4,
    name: 'Access Restrictions',
    description: 'The entity restricts physical access to facilities and protected information assets to authorized personnel to meet the entity\'s objectives.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review physical access controls',
      'Test badge access systems',
      'Verify visitor logs'
    ],
    evidence_requirements: [
      'Physical access logs',
      'Badge system reports',
      'Visitor records'
    ],
    common_vulnerabilities: ['broken_access_control']
  },
  [SecurityControl.CC6_5]: {
    id: SecurityControl.CC6_5,
    name: 'Data Disposal',
    description: 'The entity discontinues logical and physical protections over physical assets only after the entity has identified and removed or destroyed information that might have been stored.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review data disposal procedures',
      'Test data wiping processes',
      'Verify destruction certificates'
    ],
    evidence_requirements: [
      'Data disposal policy',
      'Destruction certificates',
      'Wiping tool logs'
    ],
    common_vulnerabilities: ['sensitive_data_exposure']
  },
  [SecurityControl.CC6_6]: {
    id: SecurityControl.CC6_6,
    name: 'Vulnerability Management',
    description: 'The entity implements a process to identify, evaluate, and update information about system vulnerabilities and security threats that could affect the entity\'s objectives.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Perform vulnerability scanning',
      'Test patch management',
      'Verify threat intelligence integration'
    ],
    evidence_requirements: [
      'Vulnerability scan reports',
      'Patch management logs',
      'Threat intelligence feeds'
    ],
    common_vulnerabilities: ['missing_patches', 'security_misconfiguration', 'sql_injection', 'xss', 'xxe']
  },
  [SecurityControl.CC6_7]: {
    id: SecurityControl.CC6_7,
    name: 'Data Transmission',
    description: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test encryption in transit',
      'Verify secure protocols',
      'Check for data leakage'
    ],
    evidence_requirements: [
      'SSL/TLS configuration',
      'Network traffic analysis',
      'Data flow diagrams'
    ],
    common_vulnerabilities: ['weak_encryption', 'clickjacking']
  },
  [SecurityControl.CC6_8]: {
    id: SecurityControl.CC6_8,
    name: 'Malicious Software Prevention',
    description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test antivirus deployment',
      'Verify malware detection',
      'Check application whitelisting'
    ],
    evidence_requirements: [
      '
