# Authyntic Site Deployment Guide

This repository contains the static marketing site for Authyntic. Use the following steps to deploy the site to a cPanel-managed host.

## Prerequisites
- cPanel account credentials with access to the target hosting environment.
- A domain or subdomain already pointed at the hosting account (optional but recommended).
- This repository cloned locally or downloaded as a ZIP archive.

## Option 1: Deploy with Git Version Control (recommended)
1. **Enable Git Version Control**
   - Log into cPanel and open the **Git Version Control** tool.
   - Click **Create** and choose the option to *Clone a Repository*.
   - Paste the HTTPS URL for this repository.
   - Choose the target directory inside your home folder (e.g., `~/public_html` for your primary domain or a subdirectory for an addon domain).
2. **Initial Deploy**
   - After cPanel clones the repo, open **File Manager** and confirm the files appear under the directory you selected.
   - If deploying to a subdirectory, ensure the domain or subdomain's document root points to that path.
3. **Update After Changes**
   - When you push updates to the repository, revisit **Git Version Control** in cPanel.
   - Open the repository entry and click **Pull or Deploy** to fetch and publish the latest commit.

## Option 2: Deploy with File Manager (manual upload)
1. **Create an Archive**
   - From your local machine, run `zip -r authyntic_site.zip .` inside the project directory (or use your OS zip utility).
2. **Upload**
   - Log into cPanel and open **File Manager**.
   - Navigate to the document root you want to use (e.g., `public_html`).
   - Click **Upload** and select the generated `authyntic_site.zip` file.
3. **Extract**
   - Once uploaded, select the ZIP file in File Manager and click **Extract**.
   - Confirm the contents (e.g., `index.html`, `css/`, `assets/`) now exist in the directory.
4. **Clean Up**
   - Delete the ZIP file after extraction to keep the directory tidy.

## Option 3: Deploy with FTP/SFTP
1. **Connect**
   - Use an FTP or SFTP client (such as FileZilla) with your cPanel credentials.
   - Connect to the server and navigate to the desired document root.
2. **Upload Files**
   - Transfer the entire contents of the repository (including folders like `css`, `js`, and `assets`).
   - Ensure directory structure remains intact.

## Post-Deployment Checklist
- Visit your domain to verify the site loads and assets resolve correctly.
- Clear CDN or browser caches if you do not see updates immediately.
- Enable SSL via **cPanel > SSL/TLS > Manage SSL** or **Let's Encrypt** if available.
- Configure redirects or additional domains via **cPanel > Domains** as needed.

## Local Preview
Before deploying, you can verify the site locally:
```bash
python -m http.server 8000
```
Visit `http://localhost:8000` in your browser to review the site.

## Maintaining the Site
- Keep commits small and descriptive for easier tracking.
- Use branches for larger changes and merge them after review.
- Consider enabling **Automatic Deployment** in cPanel's Git tool if you want each push to publish automatically.

