### Phase 2: Monitoring Remote Windows Servers

This is the critical step in making your monitoring stack useful: deploying the agents on the machines you want to observe.

We will proceed with **Step 1: Install Exporter on Remote Windows Server**, using the best-practice tool, the **Prometheus Windows Exporter (WMI Exporter)**, managed by the **NSSM** service utility.

**Note:** All of the following commands must be executed **on your remote Windows Server**, preferably using PowerShell run as Administrator.

---

## Step 1: Preparation and Download (On Windows Server)

We will use the custom metrics port `9182` for the Windows Exporter.

### 1.1 Create Installation Directory

Create a centralized location for the binaries.

```powershell
# Create the main installation folder
New-Item -Path "C:\Program Files\" -Name "windows_exporter" -ItemType "Directory" -Force
cd "C:\Program Files\windows_exporter"
```

### 1.2 Download Exporter and NSSM

We download the Windows Exporter and NSSM directly into the installation folder.
Download the latest stable MSI installer (Only if the exporter is exe or zip)
```powershell
Invoke-WebRequest -Uri "https://github.com/prometheus-community/windows_exporter/releases/download/v0.31.3/windows_exporter-0.31.3-amd64.msi" -OutFile "windows_exporter.msi"
```

# Download NSSM (Non-Sucking Service Manager) for general utility
```powershell
Invoke-WebRequest -Uri "http://nssm.cc/release/nssm-2.24.zip" -OutFile "nssm.zip"
```

# Unzip NSSM only (Only if the Exporter is an EXE or a ZIP)
```powershell
Expand-Archive -Path ".\nssm.zip" -DestinationPath "." -Force
```

Install the Windows Exporter MSI. 
It sets LISTEN_PORT=9182 and enables the required collectors, including 'iis'.
/quiet /norestart ensures silent installation without forcing a reboot.
```powershell
Start-Process msiexec -ArgumentList "/i `"$PWD\windows_exporter.msi`" LISTEN_PORT=9182 ENABLED_COLLECTORS=cpu,logical_disk,net,os,service,system,process,iis /quiet /norestart /l*v `"$env:TEMP\windows_exporter_install.log`"" -Wait -NoNewWindow
```
To check the log you can use: 
```powershell
notepad $env:TEMP\windows_exporter_install.log
```

Verify the service is running and accessible
```powershell
Get-Service windows_exporter
```

Test the metrics endpoint (Should return Status Code 200/OK)
```powershell
Invoke-WebRequest -Uri "http://localhost:9182/metrics"
```

## Phase 2: Exporter Configuration and Tuning (Skip this entire step if the exporter is msi and go to Phase 4.2)

By default, the Windows Exporter collects a massive amount of metrics, which can be inefficient. We should always specify exactly which collectors to use via a configuration file.

### 2.1 Create the Configuration File (`config.yml`)

Create a file named `config.yml` in `C:\Program Files\windows_exporter\` and paste the minimal, essential configuration below.

```powershell
# Use PowerShell to create the config file (or use Notepad)
"
collectors:
  enabled: cpu,cs,logical_disk,net,os,service,system,process
" | Out-File .\config.yml
```

### 2.2 Final Exe Path Location

*   **Executable:** `C:\Program Files\windows_exporter\windows_exporter.exe`
*   **NSSM Path:** `C:\Program Files\windows_exporter\nssm-2.24\win64\nssm.exe` (Assuming you are on a 64-bit Windows OS, which is standard)

## Phase 3: Install as a Windows Service using NSSM

We use NSSM to install the exporter as a persistent service, ensuring it runs under the local system account and restarts automatically.

```powershell
# Change directory to where NSSM executable is
cd "C:\Program Files\windows_exporter\nssm-2.24\win64"

# Define the full path to the exporter executable
$ExporterPath = "C:\Program Files\windows_exporter\windows_exporter.exe"

# Define the arguments: listen on port 9182 and point to our custom config file
$Arguments = "--web.listen-address=:9182 --collector.config C:\Program Files\windows_exporter\config.yml"

# Install the service via NSSM
.\nssm install "windows_exporter" $ExporterPath $Arguments
```

When you run the `nssm install` command, a GUI window will likely pop up. Verify the paths and arguments look correct:
*   **Path:** `C:\Program Files\windows_exporter\windows_exporter.exe`
*   **Arguments:** `--web.listen-address=:9182 --collector.config C:\Program Files\windows_exporter\config.yml`

## Phase 4: Start and Verify the Exporter

### 4.1 Start the Service

```powershell
# Start the service
net start windows_exporter
```

### 4.2 Verify Local Access

Check that the exporter is serving metrics locally on the Windows machine.

```powershell
Invoke-WebRequest http://localhost:9182/metrics
```
If successful, you will see a large block of text containing metrics, proving the exporter is running and collecting data.

### 4.3 Configure Windows Firewall

Before your GCP Prometheus server can connect, you must open port **9182** in the Windows Firewall on the remote server.
Create a new firewall rule to allow inbound and outbound traffic on TCP port 9182
```powershell 
New-NetFirewallRule -DisplayName "windows_exporter" -Direction Inbound -LocalPort 9182 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "windows_exporter" -Direction Outbound -LocalPort 9182 -Protocol TCP -Action Allow
```

The remote Windows server is now configured and ready to be scraped by the central Prometheus server!
