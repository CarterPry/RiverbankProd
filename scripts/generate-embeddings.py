#!/usr/bin/env python3
"""
Generate embeddings for SOC 2 controls and attack patterns.
This script creates vector embeddings used for intelligent attack correlation.
"""

import json
import os
import sys
from typing import Dict, List, Tuple
import requests
import numpy as np
from datetime import datetime

# Configuration
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
MODEL = os.getenv('OLLAMA_MODEL', 'llama2')
OUTPUT_DIR = 'database/embeddings'

# SOC 2 Trust Service Criteria definitions
TSC_DEFINITIONS = {
    'CC1': 'Control Environment',
    'CC2': 'Communication and Information',
    'CC3': 'Risk Assessment',
    'CC4': 'Monitoring Activities',
    'CC5': 'Control Activities',
    'CC6': 'Logical and Physical Access Controls',
    'CC7': 'System Operations',
    'CC8': 'Change Management',
    'CC9': 'Risk Mitigation',
    'A1': 'Availability',
    'C1': 'Confidentiality',
    'P1': 'Processing Integrity',
    'P2': 'Privacy'
}

# Common Criteria control definitions
CC_CONTROLS = {
    'CC5.1': 'Selection and Development of Control Activities',
    'CC5.2': 'Deployment of Control Activities Through Policies and Procedures',
    'CC6.1': 'Logical Access Controls',
    'CC6.2': 'Prior to Issuing System Credentials',
    'CC6.3': 'Registration and Authorization of New Users',
    'CC6.4': 'Access Credentials to Protected Assets',
    'CC6.5': 'Discontinue Access',
    'CC6.6': 'Logical Access Security Measures',
    'CC6.7': 'External System Access',
    'CC6.8': 'Prevention and Detection of Unauthorized Access',
    'CC7.1': 'Detection and Monitoring of Configuration Changes',
    'CC7.2': 'Monitoring of System Performance',
    'CC7.3': 'Backup and Recovery',
    'CC7.4': 'Incident Response'
}

# Attack patterns and their descriptions
ATTACK_PATTERNS = {
    'sql_injection': 'SQL injection attacks to bypass authentication or extract data',
    'xss': 'Cross-site scripting to execute malicious scripts',
    'csrf': 'Cross-site request forgery to perform unauthorized actions',
    'clickjacking': 'UI redressing attacks to trick users into unintended actions',
    'authentication_bypass': 'Techniques to bypass authentication mechanisms',
    'session_management': 'Attacks on session handling and management',
    'privilege_escalation': 'Gaining elevated access rights',
    'data_exfiltration': 'Unauthorized data extraction techniques',
    'dos_attacks': 'Denial of service attacks affecting availability',
    'port_scanning': 'Network reconnaissance through port scanning',
    'vulnerability_scanning': 'Automated vulnerability identification',
    'ssl_vulnerabilities': 'Attacks on SSL/TLS implementations',
    'directory_traversal': 'Path traversal to access restricted files',
    'file_upload': 'Malicious file upload exploitation',
    'xxe': 'XML external entity injection attacks',
    'ssrf': 'Server-side request forgery attacks',
    'ldap_injection': 'LDAP query manipulation',
    'command_injection': 'OS command injection attacks',
    'buffer_overflow': 'Memory corruption vulnerabilities',
    'lateral_movement': 'Moving through network after initial compromise'
}

def get_embedding(text: str) -> List[float]:
    """Get embedding vector from Ollama."""
    try:
        response = requests.post(
            f'{OLLAMA_URL}/api/embeddings',
            json={'model': MODEL, 'prompt': text}
        )
        response.raise_for_status()
        return response.json()['embedding']
    except Exception as e:
        print(f"Error getting embedding for '{text}': {e}")
        return []

def compute_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not vec1 or not vec2:
        return 0.0
    
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    dot_product = np.dot(vec1, vec2)
    norm_product = np.linalg.norm(vec1) * np.linalg.norm(vec2)
    
    if norm_product == 0:
        return 0.0
    
    return float(dot_product / norm_product)

def generate_control_embeddings() -> Dict[str, List[float]]:
    """Generate embeddings for all SOC 2 controls."""
    print("Generating embeddings for SOC 2 controls...")
    embeddings = {}
    
    # TSC embeddings
    for tsc_id, description in TSC_DEFINITIONS.items():
        full_text = f"SOC 2 Trust Service Criteria {tsc_id}: {description}"
        embeddings[tsc_id] = get_embedding(full_text)
        print(f"  Generated embedding for {tsc_id}")
    
    # CC control embeddings
    for cc_id, description in CC_CONTROLS.items():
        full_text = f"SOC 2 Common Criteria {cc_id}: {description}"
        embeddings[cc_id] = get_embedding(full_text)
        print(f"  Generated embedding for {cc_id}")
    
    return embeddings

def generate_attack_embeddings() -> Dict[str, List[float]]:
    """Generate embeddings for all attack patterns."""
    print("\nGenerating embeddings for attack patterns...")
    embeddings = {}
    
    for attack_id, description in ATTACK_PATTERNS.items():
        full_text = f"Security attack pattern {attack_id}: {description}"
        embeddings[attack_id] = get_embedding(full_text)
        print(f"  Generated embedding for {attack_id}")
    
    return embeddings

def compute_correlation_matrix(
    control_embeddings: Dict[str, List[float]],
    attack_embeddings: Dict[str, List[float]]
) -> Dict[str, Dict[str, float]]:
    """Compute correlation matrix between controls and attacks."""
    print("\nComputing correlation matrix...")
    matrix = {}
    
    for control_id, control_vec in control_embeddings.items():
        matrix[control_id] = {}
        
        for attack_id, attack_vec in attack_embeddings.items():
            similarity = compute_similarity(control_vec, attack_vec)
            if similarity > 0.3:  # Only store significant correlations
                matrix[control_id][attack_id] = similarity
    
    return matrix

def save_results(
    control_embeddings: Dict[str, List[float]],
    attack_embeddings: Dict[str, List[float]],
    correlation_matrix: Dict[str, Dict[str, float]]
):
    """Save all results to JSON files."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save embeddings
    with open(f'{OUTPUT_DIR}/control_embeddings.json', 'w') as f:
        json.dump(control_embeddings, f, indent=2)
    print(f"\nSaved control embeddings to {OUTPUT_DIR}/control_embeddings.json")
    
    with open(f'{OUTPUT_DIR}/attack_embeddings.json', 'w') as f:
        json.dump(attack_embeddings, f, indent=2)
    print(f"Saved attack embeddings to {OUTPUT_DIR}/attack_embeddings.json")
    
    # Save correlation matrix
    with open(f'{OUTPUT_DIR}/correlation_matrix.json', 'w') as f:
        json.dump(correlation_matrix, f, indent=2)
    print(f"Saved correlation matrix to {OUTPUT_DIR}/correlation_matrix.json")
    
    # Save metadata
    metadata = {
        'generated_at': datetime.now().isoformat(),
        'model': MODEL,
        'ollama_url': OLLAMA_URL,
        'control_count': len(control_embeddings),
        'attack_count': len(attack_embeddings),
        'total_correlations': sum(len(attacks) for attacks in correlation_matrix.values())
    }
    
    with open(f'{OUTPUT_DIR}/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {OUTPUT_DIR}/metadata.json")

def main():
    """Main execution function."""
    print("SOC 2 Embeddings Generator")
    print("=" * 50)
    
    # Check Ollama availability
    try:
        response = requests.get(f'{OLLAMA_URL}/api/tags')
        response.raise_for_status()
    except Exception as e:
        print(f"Error: Cannot connect to Ollama at {OLLAMA_URL}")
        print(f"Please ensure Ollama is running and accessible.")
        sys.exit(1)
    
    # Generate embeddings
    control_embeddings = generate_control_embeddings()
    attack_embeddings = generate_attack_embeddings()
    
    # Compute correlations
    correlation_matrix = compute_correlation_matrix(
        control_embeddings,
        attack_embeddings
    )
    
    # Save results
    save_results(control_embeddings, attack_embeddings, correlation_matrix)
    
    print("\n" + "=" * 50)
    print("Embeddings generation complete!")
    
    # Print summary statistics
    print("\nSummary:")
    print(f"  Controls processed: {len(control_embeddings)}")
    print(f"  Attacks processed: {len(attack_embeddings)}")
    print(f"  Significant correlations: {sum(len(attacks) for attacks in correlation_matrix.values())}")
    
    # Print top correlations
    print("\nTop 10 strongest correlations:")
    all_correlations = []
    for control_id, attacks in correlation_matrix.items():
        for attack_id, score in attacks.items():
            all_correlations.append((control_id, attack_id, score))
    
    all_correlations.sort(key=lambda x: x[2], reverse=True)
    for i, (control, attack, score) in enumerate(all_correlations[:10]):
        print(f"  {i+1}. {control} ↔ {attack}: {score:.3f}")

if __name__ == '__main__':
    main() 