# VM Testing

1. Download vmware workstation: [vmware.com/products/desktop-hypervisor/workstation-and-fusion](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion)
2. Sign up for an account and download.
3. Run installer and follow prompts.
4. Download Windows 11 ISO: [microsoft.com/en-ca/software-download/windows11](https://www.microsoft.com/en-ca/software-download/windows11)
5. Download Ubuntu 24.04 ISO: [ubuntu.com/download/desktop](https://ubuntu.com/download/desktop)
6. Create new VM in VMware Workstation:
    - Select "Typical (recommended)" configuration.
    - Choose "Installer disc image file (iso)" and select downloaded ISO.
    - Customize hardware configuration:
        - Memory: 8 GB
        - Processors: 2 (4 if your host allows)
        - Network: NAT (default)
        - USB Controller: Enabled
        - Firmware type: UEFI
        - TPM: Enabled (VMware will auto-add if prompted)
        - Disk: 64 GB, single file
7. Once created run the VM and follow OS installation prompts.
    - For Windows 11 hit SATA boot from CD ROM then hit enter when it says hit enter to boot from cd (paraphrased i should chage to have more accurate wording.
      - When you see “Let’s connect you to a network” and it will not continue:
        - Press Shift + F10 (This opens a command prompt.)
        - In the command window, type: `OOBE\BYPASSNRO` and press Enter.
        - The VM will reboot automatically.
        - Continue with the installation, hitting skip for any error prompts.
      - Microsoft has patched the ability to bypass network requirements in recent builds and you must sign in with a Microsoft account to continue installation (create a burner account if needed).
      - Once on the desktop, install VMware Tools from the VM menu. If file explorer doesn't open automatically, navigate to the virtual CD drive and run the installer.
    - For Ubuntu just follow prompts.
8. Immediately after each has been installed freeze them and do not intstall anyting to them (i.e. no python or tooling, etc)