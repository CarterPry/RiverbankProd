FROM kalilinux/kali-rolling:latest

# Update and install essential packages
RUN apt-get update && apt-get install -y \
    # Core tools
    nmap \
    nikto \
    sqlmap \
    burpsuite \
    zaproxy \
    metasploit-framework \
    testssl.sh \
    wpscan \
    # Additional tools
    hydra \
    john \
    hashcat \
    aircrack-ng \
    wireshark \
    gobuster \
    ffuf \
    nuclei \
    # Python and dependencies
    python3 \
    python3-pip \
    # Network tools
    net-tools \
    iputils-ping \
    dnsutils \
    curl \
    wget \
    # Development tools
    git \
    vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir \
    requests \
    beautifulsoup4 \
    lxml \
    paramiko \
    scapy

# Create working directory
WORKDIR /app

# Create results directory
RUN mkdir -p /app/results

# Set up non-root user for security
RUN useradd -m -s /bin/bash pentester
RUN chown -R pentester:pentester /app

# Copy custom scripts if any
COPY scripts/ /app/scripts/

# Set permissions
RUN chmod +x /app/scripts/*

# Default to non-root user (can be overridden for specific tools)
USER pentester

# Default command
CMD ["/bin/bash"] 