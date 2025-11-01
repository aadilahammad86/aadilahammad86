# Initial Setup for Grafana Stack Monitoring (Ubuntu|GCP)

This script installs and configures Grafana (port 3000) and Prometheus (custom port 5050) as robust `systemd` services.

## Part 1: Install and Configure Grafana (Port 3000)

### 1.1 Add Grafana Repository and Key

```bash
# Install necessary tools if not already present
sudo apt-get install -y apt-transport-https software-properties-common wget

# Create keyrings directory (standard practice for modern Debian/Ubuntu)
sudo mkdir -p /etc/apt/keyrings/

# Download and add the Grafana GPG key
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null

# Add the Grafana stable repository to sources list
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list

# Update package lists to include the new repository
sudo apt-get update
```

### 1.2 Install Grafana Package

```bash
# Install Grafana (the installer automatically starts the grafana-server service)
sudo apt-get install grafana
```

### 1.3 Harden Grafana Permissions (Optional but Recommended)

```bash
# Change ownership of config directory to the 'grafana' user/group
sudo chown -R grafana:grafana /etc/grafana

# Set permissions for the config directory (owner can read/write/execute, group can read/execute)
sudo chmod -R 750 /etc/grafana

# Add the current user ('ubuntu') to the 'grafana' group (allows local user to read logs/config if needed)
sudo usermod -aG grafana ubuntu

# Apply new group changes (you may also log out and back in)
source ~/.zshrc
```

---

## Part 2: Install and Configure Prometheus (Custom Port 5050)

### 2.1 Download and Prepare Files

```bash
# Download the Prometheus binary archive
wget https://github.com/prometheus/prometheus/releases/download/v3.7.3/prometheus-3.7.3.linux-amd64.tar.gz

# Extract the archive
tar xvf prometheus-3.7.3.linux-amd64.tar.gz

# Navigate into the extracted directory to prepare the config (Optional: cd is already in your history)
cd prometheus-3.7.3.linux-amd64
```

### 2.2 Configure Prometheus to Use Port 5050

```bash
# Modify prometheus.yml to scrape metrics from the desired custom port (5050)
# Use nano or similar editor: nano prometheus.yml
# CHANGE: targets: ["localhost:9090"]  TO: targets: ["localhost:5050"]
# The output confirms the change:
cat prometheus.yml
# ...
# static_configs:
#   - targets: ["localhost:5050"] 
# ...
```

### 2.3 Set up Prometheus Directories, User, and Permissions

```bash
# Change back to home directory (important for copy paths)
cd ~

# Create directories for configuration and persistent data
sudo mkdir -p /etc/prometheus /var/lib/prometheus

# Copy binaries to standard system path
sudo cp prometheus-3.7.3.linux-amd64/prometheus /usr/local/bin/
sudo cp prometheus-3.7.3.linux-amd64/promtool /usr/local/bin/

# Copy configuration file to its system directory
sudo cp prometheus-3.7.3.linux-amd64/prometheus.yml /etc/prometheus/ 

# Create a dedicated, non-login system user for security
sudo useradd --no-create-home --shell /bin/false prometheus

# Set ownership of the binaries and configuration directories to the new 'prometheus' user
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool
sudo chown -R prometheus:prometheus /etc/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus
```

### 2.4 Create and Start the Prometheus Systemd Service

```bash
# Create the service file
sudo nano /etc/systemd/system/prometheus.service
```

Paste the following content into the file:

```ini
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
Restart=always

# NOTE: The --web.listen-address=:5050 ensures the Prometheus server listens on 5050
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.listen-address=:5050 \
    --web.external-url=http://localhost:5050

[Install]
WantedBy=multi-user.target
```

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Start the Prometheus service
sudo systemctl start prometheus

# Enable Prometheus to start automatically at boot
sudo systemctl enable prometheus

# Verify the service status
sudo systemctl status prometheus
# (Should show "Active: active (running)")
```

---

## Part 3: Final Access and Integration Steps

### 3.1 Google Cloud Platform (GCP) Firewall

Ensure your GCP firewall rule allows inbound TCP traffic on the following ports:
*   **3000** (Grafana)
*   **5050** (Prometheus)

### 3.2 Access and Integrate

1.  **Access Grafana:** Open your browser to `http://<YOUR_PUBLIC_IP>:3000`. Log in with `admin`/`admin`.
2.  **Access Prometheus:** Open your browser to `http://<YOUR_PUBLIC_IP>:5050`.

3.  **Connect Data Source in Grafana:**
    *   In the Grafana UI, go to **Connections** > **Data Sources**.
    *   Click **Add data source** and select **Prometheus**.
    *   Set the **HTTP URL** to: `http://localhost:5050`
    *   Click **Save & Test**. The connection should succeed.
