We now proceed to **Step 2: Remote Configuration on the Prometheus Server (GCP VM)**.

---

## Step 2: Configure Central Prometheus Server to Scrape Remote Windows Host

This step involves modifying the `prometheus.yml` configuration file on your central GCP VM (where Prometheus is running on port **5050**) to instruct it to find and scrape metrics from your remote Windows Server (which is listening on port **9182**).

We will assume the following details for your remote Windows server:
*   **Remote Server IP:** `<REMOTE_WINDOWS_SERVER_IP>`
*   **Exporter Port:** `9182`

### 2.1 Edit the Prometheus Configuration File (On GCP VM)

Use your command line to edit the Prometheus configuration file, which is located at `/etc/prometheus/prometheus.yml` since you set it up as a service.

```bash
# SSH into your GCP VM and run:
sudo nano /etc/prometheus/prometheus.yml
```

### 2.2 Add a New Scrape Job

In the `scrape_configs:` section of the file, add a new job block named `windows` below your existing `prometheus` job.

**(Existing `prometheus.yml` fragment):**

```yaml
# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:5050"]
        labels:
          app: "prometheus"

# <-- ADD THE NEW WINDOWS JOB HERE
```

**(New configuration block to add):**

```yaml
  # Job for scraping the remote Windows server
  - job_name: "windows"
    static_configs:
      - targets: ["<REMOTE_WINDOWS_SERVER_IP>:9182"]
        labels:
          server: "remote-windows-host-1"
```

**CRITICAL: Replace `<REMOTE_WINDOWS_SERVER_IP>`** with the actual public IP address or FQDN of your remote Windows server.

### 2.3 Save and Restart Prometheus Service (On GCP VM)

After saving the `prometheus.yml` file, you must reload the Prometheus service so it reads the new configuration.

```bash
# Reload the configuration file gracefully
sudo systemctl reload prometheus

# Verify the status to ensure the reload succeeded
sudo systemctl status prometheus
# Look for a message indicating the configuration was reloaded successfully.
```

### 2.4 Verification in Prometheus UI

1.  Open the Prometheus web interface in your browser: `http://<YOUR_GCP_VM_IP>:5050`
2.  Navigate to **Status** > **Targets**.
3.  You should now see two targets:
    *   **`prometheus`** (State: UP)
    *   **`windows`** (Target: `<REMOTE_WINDOWS_SERVER_IP>:9182`)

If the Windows target shows **UP**, your central Prometheus server is successfully connecting to the Windows Exporter!

---

## Next Steps

If the target status is **UP**, you have successfully linked your central monitoring hub to your remote Windows server.

The final step would be ensuring the networking layer is fully open:

*   **Step 3:** Confirming your Windows machine's Firewall is open on **9182**, and importantly, that any network boundary (like VPC/VPN settings if in a private network, or just the public IP) allows traffic from the GCP VM. (You already ran the firewall command in the previous step, which is good).
