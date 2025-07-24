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
      'Antivirus logs',
      'Malware detection reports',
      'Whitelisting policies'
    ],
    common_vulnerabilities: ['malware', 'file_upload']
  },
  [SecurityControl.CC7_1]: {
    id: SecurityControl.CC7_1,
    name: 'Detection and Monitoring of Configuration Changes',
    description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review change detection systems',
      'Test configuration monitoring',
      'Verify vulnerability scanning'
    ],
    evidence_requirements: [
      'Configuration change logs',
      'Monitoring alerts',
      'Vulnerability scan results'
    ],
    common_vulnerabilities: ['security_misconfiguration']
  },
  [SecurityControl.CC7_2]: {
    id: SecurityControl.CC7_2,
    name: 'Monitoring of System Performance',
    description: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity\'s ability to meet its objectives.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test performance monitoring',
      'Verify anomaly detection',
      'Review alert thresholds'
    ],
    evidence_requirements: [
      'Performance metrics',
      'Anomaly detection logs',
      'Alert history'
    ],
    common_vulnerabilities: ['dos_attacks']
  },
  [SecurityControl.CC7_3]: {
    id: SecurityControl.CC7_3,
    name: 'Backup and Recovery',
    description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test backup procedures',
      'Verify recovery capabilities',
      'Review incident response'
    ],
    evidence_requirements: [
      'Backup logs',
      'Recovery test results',
      'Incident reports'
    ],
    common_vulnerabilities: ['backup_failure']
  },
  [SecurityControl.CC7_4]: {
    id: SecurityControl.CC7_4,
    name: 'Incident Response',
    description: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Test incident response procedures',
      'Verify communication protocols',
      'Review remediation processes'
    ],
    evidence_requirements: [
      'Incident response plan',
      'Incident tickets',
      'Post-mortem reports'
    ],
    common_vulnerabilities: ['incident_response']
  },
  [SecurityControl.CC8_1]: {
    id: SecurityControl.CC8_1,
    name: 'Change Management',
    description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review change management process',
      'Test approval workflows',
      'Verify change documentation'
    ],
    evidence_requirements: [
      'Change requests',
      'Approval records',
      'Test results'
    ],
    common_vulnerabilities: ['unauthorized_changes']
  },
  [SecurityControl.CC9_1]: {
    id: SecurityControl.CC9_1,
    name: 'Risk Mitigation',
    description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review risk assessment',
      'Test mitigation controls',
      'Verify business continuity plans'
    ],
    evidence_requirements: [
      'Risk assessment reports',
      'Mitigation strategies',
      'BCP documentation'
    ],
    common_vulnerabilities: ['business_disruption']
  },
  [SecurityControl.CC9_2]: {
    id: SecurityControl.CC9_2,
    name: 'Vendor Management',
    description: 'The entity assesses and manages risks associated with vendors and business partners.',
    trust_service: TrustService.SECURITY,
    testing_procedures: [
      'Review vendor assessments',
      'Test vendor controls',
      'Verify contract terms'
    ],
    evidence_requirements: [
      'Vendor assessments',
      'Contract reviews',
      'Vendor audit reports'
    ],
    common_vulnerabilities: ['supply_chain']
  },
  [SecurityControl.A1_1]: {
    id: SecurityControl.A1_1,
    name: 'Availability Commitments',
    description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.',
    trust_service: TrustService.AVAILABILITY,
    testing_procedures: [
      'Test capacity monitoring',
      'Verify scaling capabilities',
      'Review performance metrics'
    ],
    evidence_requirements: [
      'Capacity reports',
      'Performance metrics',
      'Scaling policies'
    ],
    common_vulnerabilities: ['dos_attacks', 'resource_exhaustion']
  },
  [SecurityControl.A1_2]: {
    id: SecurityControl.A1_2,
    name: 'Environmental Threats',
    description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
    trust_service: TrustService.AVAILABILITY,
    testing_procedures: [
      'Test disaster recovery',
      'Verify backup procedures',
      'Review environmental controls'
    ],
    evidence_requirements: [
      'DR test results',
      'Backup verification',
      'Environmental monitoring'
    ],
    common_vulnerabilities: ['environmental_failure']
  },
  [SecurityControl.A1_3]: {
    id: SecurityControl.A1_3,
    name: 'Recovery Testing',
    description: 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.',
    trust_service: TrustService.AVAILABILITY,
    testing_procedures: [
      'Execute recovery tests',
      'Verify RTO/RPO compliance',
      'Test failover procedures'
    ],
    evidence_requirements: [
      'Recovery test reports',
      'RTO/RPO metrics',
      'Failover logs'
    ],
    common_vulnerabilities: ['recovery_failure']
  },
  [SecurityControl.C1_1]: {
    id: SecurityControl.C1_1,
    name: 'Confidentiality Commitments',
    description: 'The entity discloses its confidential information to third parties only after appropriate approval.',
    trust_service: TrustService.CONFIDENTIALITY,
    testing_procedures: [
      'Review data classification',
      'Test access controls',
      'Verify disclosure procedures'
    ],
    evidence_requirements: [
      'Data classification policy',
      'Access logs',
      'Disclosure approvals'
    ],
    common_vulnerabilities: ['data_leakage', 'unauthorized_disclosure']
  },
  [SecurityControl.C1_2]: {
    id: SecurityControl.C1_2,
    name: 'Data Retention and Disposal',
    description: 'The entity retains confidential information to meet its objectives and disposes of it in accordance with established policies.',
    trust_service: TrustService.CONFIDENTIALITY,
    testing_procedures: [
      'Review retention policies',
      'Test disposal procedures',
      'Verify data destruction'
    ],
    evidence_requirements: [
      'Retention schedules',
      'Disposal records',
      'Destruction certificates'
    ],
    common_vulnerabilities: ['improper_disposal']
  },
  [SecurityControl.PI1_1]: {
    id: SecurityControl.PI1_1,
    name: 'Processing Integrity',
    description: 'The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing.',
    trust_service: TrustService.PROCESSING_INTEGRITY,
    testing_procedures: [
      'Test data validation',
      'Verify processing accuracy',
      'Review quality controls'
    ],
    evidence_requirements: [
      'Validation rules',
      'Processing logs',
      'Quality metrics'
    ],
    common_vulnerabilities: ['data_corruption', 'processing_errors']
  },
  [SecurityControl.P1_1]: {
    id: SecurityControl.P1_1,
    name: 'Privacy Notice',
    description: 'The entity provides notice to data subjects about its privacy practices.',
    trust_service: TrustService.PRIVACY,
    testing_procedures: [
      'Review privacy notices',
      'Test consent mechanisms',
      'Verify data subject rights'
    ],
    evidence_requirements: [
      'Privacy policy',
      'Consent records',
      'Rights fulfillment logs'
    ],
    common_vulnerabilities: ['privacy_violation']
  },
  [SecurityControl.P2_1]: {
    id: SecurityControl.P2_1,
    name: 'Data Subject Rights',
    description: 'The entity provides data subjects with access to their personal information for review and correction.',
    trust_service: TrustService.PRIVACY,
    testing_procedures: [
      'Test access request process',
      'Verify correction procedures',
      'Review deletion capabilities'
    ],
    evidence_requirements: [
      'Access request logs',
      'Correction records',
      'Deletion confirmations'
    ],
    common_vulnerabilities: ['access_denial', 'data_retention']
  }
};

// Helper functions for working with controls
export function getControlsByTrustService(trustService: TrustService): ControlDefinition[] {
  return Object.values(SOC2_CONTROLS).filter(
    control => control.trust_service === trustService
  );
}

export function getControlsByVulnerability(vulnerability: string): ControlDefinition[] {
  return Object.values(SOC2_CONTROLS).filter(
    control => control.common_vulnerabilities.includes(vulnerability)
  );
}

export function getRequiredEvidence(controlId: SecurityControl): string[] {
  return SOC2_CONTROLS[controlId]?.evidence_requirements || [];
}

export function getTestProcedures(controlId: SecurityControl): string[] {
  return SOC2_CONTROLS[controlId]?.testing_procedures || [];
}
