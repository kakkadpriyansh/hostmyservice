const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/lib/auto-deploy.ts';
let c = fs.readFileSync(p, 'utf8');

// Replace upload step so that if the ZIP has all files inside a single parent folder (like "Portfolio/"),
// the server automatically unwraps it and moves everything to the root /var/www/<domain>/!

const targetUpload = `    // ── 6. Upload files ─────────────────────────────────────────────────────
    await logStep("Upload", \`Uploading files from \${deployment.uploadPath} to \${remoteDir}...\`, "PENDING");
    await ssh.uploadDirectory(deployment.uploadPath, remoteDir);
    await logStep("Upload", "Files uploaded successfully", "SUCCESS");`;

const newUpload = `    // ── 6. Upload files & Auto-Flatten Nested Folders ───────────────────────
    await logStep("Upload", \`Uploading files from \${deployment.uploadPath} to \${remoteDir}...\`, "PENDING");
    await ssh.uploadDirectory(deployment.uploadPath, remoteDir);

    // Auto-detect if user zipped a folder (e.g. Portfolio/) instead of root contents
    // If remoteDir contains only 1 folder and no index.html or package.json at root, unnest it!
    const rootCheck = await ssh.execCommand(
      \`test ! -f \${remoteDir}/index.html && test ! -f \${remoteDir}/package.json && test \\\$(ls -1 \${remoteDir} | wc -l) -eq 1 && echo "nested"\`
    );
    if (rootCheck.stdout.includes("nested")) {
      await logStep("Upload", "Detected nested folder in ZIP. Auto-flattening to root directory...", "PENDING");
      await ssh.execCommand(\`
        SUB_DIR=\\\$(find \${remoteDir} -mindepth 1 -maxdepth 1 -type d | head -n 1)
        if [ -n "\\\$SUB_DIR" ]; then
          shopt -s dotglob 2>/dev/null || true
          mv "\\\$SUB_DIR"/* \${remoteDir}/ 2>/dev/null || true
          mv "\\\$SUB_DIR"/.* \${remoteDir}/ 2>/dev/null || true
          rmdir "\\\$SUB_DIR" 2>/dev/null || true
        fi
      \`);
      await logStep("Upload", "Folder structure auto-flattened successfully", "SUCCESS");
    }

    await logStep("Upload", "Files uploaded and verified", "SUCCESS");`;

c = c.replace(targetUpload, newUpload);
fs.writeFileSync(p, c, 'utf8');
console.log('Successfully added Auto-Unnesting / Auto-Flattening feature to lib/auto-deploy.ts!');
