const express = require('express');
const cors = require('cors');
const osu = require('node-os-utils');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 7475;
const USER_HOME = os.homedir();

// ─── UTILITY HELPERS ───────────────────────────────────────────
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { shell: 'powershell.exe', maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stdout.trim());
        });
    });
}

function runCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { shell: 'cmd.exe', maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stdout.trim());
        });
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── APP REGISTRY — maps voice keywords to actual Windows programs ─────
const APP_MAP = {
    'chrome': 'start chrome',
    'google chrome': 'start chrome',
    'browser': 'start chrome',
    'firefox': 'start firefox',
    'edge': 'start msedge',
    'microsoft edge': 'start msedge',
    'notepad': 'start notepad',
    'calculator': 'start calc',
    'calc': 'start calc',
    'paint': 'start mspaint',
    'word': 'start winword',
    'excel': 'start excel',
    'powerpoint': 'start powerpnt',
    'outlook': 'start outlook',
    'file explorer': 'start explorer',
    'explorer': 'start explorer',
    'task manager': 'start taskmgr',
    'settings': 'start ms-settings:',
    'command prompt': 'start cmd',
    'cmd': 'start cmd',
    'terminal': 'start wt',
    'powershell': 'start powershell',
    'spotify': 'start spotify:',
    'discord': 'start discord:',
    'whatsapp': 'start whatsapp:',
    'steam': 'start steam:',
    'vs code': 'start code',
    'visual studio code': 'start code',
    'vscode': 'start code',
    'youtube': 'start "" "https://www.youtube.com"',
    'snipping tool': 'start snippingtool',
    'control panel': 'start control',
    'device manager': 'start devmgmt.msc',
    'camera': 'start microsoft.windows.camera:',
    'photos': 'start ms-photos:',
    'maps': 'start bingmaps:',
    'clock': 'start ms-clock:',
    'alarm': 'start ms-clock:',
    'store': 'start ms-windows-store:',
    'microsoft store': 'start ms-windows-store:',
    'mail': 'start outlookmail:',
    'teams': 'start msteams:',
    'microsoft teams': 'start msteams:',
    'onenote': 'start onenote:',
    'whiteboard': 'start ms-whiteboard-cmd:',
    'magnifier': 'start magnify',
    'narrator': 'start narrator',
    'remote desktop': 'start mstsc',
};

// ─── FOLDER SHORTCUTS ──────────────────────────────────────────
const FOLDER_MAP = {
    'desktop': path.join(USER_HOME, 'Desktop'),
    'documents': path.join(USER_HOME, 'Documents'),
    'downloads': path.join(USER_HOME, 'Downloads'),
    'pictures': path.join(USER_HOME, 'Pictures'),
    'videos': path.join(USER_HOME, 'Videos'),
    'music': path.join(USER_HOME, 'Music'),
    'appdata': path.join(USER_HOME, 'AppData'),
};

// ─── MAIN ROUTE ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send(`<h1>JARVIS Brain Module: ONLINE</h1>
    <p>Active since: ${new Date().toLocaleString()}</p>
    <p>Commands available: ${Object.keys(APP_MAP).length + 40}+</p>
    <p>Access HUD via <b>http://localhost:5173</b></p>`);
});

app.post('/api/ask', async (req, res) => {
    const { text } = req.body;
    const t = text.toLowerCase().trim();

    let response = "I didn't quite catch that, sir. Could you rephrase?";
    let mode = 'normal';
    let action = null;

    try {
        // ─── GREETINGS & IDENTITY ────────────────────────────────
        if (t.includes('how are you') || t.includes('how are u')) {
            response = "I am functioning perfectly, sir. All systems are operating at peak efficiency. How can I help you today?";
        }
        else if (t.includes('functionable') || t.includes('functional')) {
            response = "All systems are nominal and my core processing is fully functional, sir.";
        }
        else if (t.includes('are you jarvis') || t.includes('are u jarvis') || t.includes('who is this')) {
            response = "Indeed I am, sir. J.A.R.V.I.S., at your service.";
        }
        else if (t.includes('are you there') || t.includes('you there')) {
            response = "For you, sir, always.";
        }
        else if (t.match(/^(hello|hey|hi|good morning|good evening|good afternoon)/)) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
            response = `${greeting}, sir. All systems are fully operational. How may I assist you?`;
        }
        else if (t.includes('what systems') || t.includes('which systems') || t.includes('what systems are fully operational')) {
            response = "Core processing, memory management, visual interfaces, and network uplinks are fully functional, sir.";
        }
        else if (t.includes('who are you') || t.includes('what are you')) {
            response = "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Your personal AI assistant with full access to this machine, sir.";
        }
        else if (t.includes('thank')) {
            response = "Happy to help, sir. That's what I'm here for.";
        }

        // ─── COMBAT MODE ─────────────────────────────────────────
        else if (t.includes('combat mode') || t.includes('engage combat')) {
            response = "Combat mode engaged. Switching to tactical HUD. All non-essential processes suppressed.";
            mode = 'combat';
        }
        else if (t.includes('stand down') || t.includes('normal mode')) {
            response = "Standing down, sir. Restoring standard interface.";
            mode = 'normal';
        }

        // ─── SYSTEM STATUS & MONITORING ──────────────────────────
        else if (t === 'system' || t.includes('system status') || t.includes('system scan') || t.includes('run diagnostics') || t.includes('health check')) {
            try {
                const cpuUsage = await osu.cpu.usage();
                let memInfo = { usedMemPercentage: 0 };
                try { memInfo = await osu.mem.info(); } catch { }
                let driveInfo = { usedPercentage: '0' };
                try { driveInfo = await osu.drive.info(); } catch { }

                const uptimeSeconds = os.uptime();
                const uptimeHours = Math.floor(uptimeSeconds / 3600);
                const uptimeMins = Math.floor((uptimeSeconds % 3600) / 60);

                response = `Full diagnostics complete.\n` +
                    `CPU usage: ${(cpuUsage || 0).toFixed(1)}%.\n` +
                    `Memory: ${(memInfo.usedMemPercentage || 0).toFixed(1)}% used of ${formatBytes(os.totalmem())}.\n` +
                    `Disk: ${driveInfo.usedPercentage || 0}% used.\n` +
                    `System uptime: ${uptimeHours} hours ${uptimeMins} minutes.\n` +
                    `All systems nominal, sir.`;
            } catch (err) {
                console.error(err);
                response = "I encountered an issue reading the full system diagnostics, sir.";
            }
        }
        else if (t.includes('cpu') && (t.includes('usage') || t.includes('status'))) {
            try {
                const cpuUsage = await osu.cpu.usage();
                const cpus = os.cpus();
                const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Unknown Processor';
                const cpuCores = cpus ? cpus.length : 0;
                response = `CPU: ${cpuModel}. ${cpuCores} cores. Current usage at ${(cpuUsage || 0).toFixed(1)}%, sir.`;
            } catch (err) {
                console.error(err);
                response = "I couldn't fetch the specific CPU usage right now, sir.";
            }
        }
        else if (t.includes('memory') || t.includes('ram')) {
            const memInfo = await osu.mem.info();
            response = `Memory usage is at ${memInfo.usedMemPercentage.toFixed(1)}%. ${formatBytes(memInfo.freeMemMb * 1024 * 1024)} available out of ${formatBytes(os.totalmem())}, sir.`;
        }
        else if (t.includes('disk') || t.includes('storage') || t.includes('hard drive') || t.includes('space')) {
            const driveInfo = await osu.drive.info();
            response = `Storage: ${driveInfo.usedPercentage}% used. ${driveInfo.freeGb} GB free out of ${driveInfo.totalGb} GB total, sir.`;
        }
        else if (t.includes('battery')) {
            try {
                const batteryInfo = await run(`(Get-WmiObject Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json)`);
                const bat = JSON.parse(batteryInfo);
                const charging = bat.BatteryStatus === 2 ? 'charging' : 'on battery';
                response = `Battery is at ${bat.EstimatedChargeRemaining}%, currently ${charging}, sir.`;
            } catch {
                response = "I couldn't read the battery status. This might be a desktop system without a battery, sir.";
            }
        }
        else if (t.includes('uptime') || t.includes('how long')) {
            const uptimeSeconds = os.uptime();
            const h = Math.floor(uptimeSeconds / 3600);
            const m = Math.floor((uptimeSeconds % 3600) / 60);
            response = `This system has been running for ${h} hours and ${m} minutes, sir.`;
        }

        // ─── TIME & DATE ─────────────────────────────────────────
        else if (t.includes('time')) {
            response = `The current time is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, sir.`;
        }
        else if (t.includes('date') || t.includes('today')) {
            response = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, sir.`;
        }

        // ─── APP LAUNCH ──────────────────────────────────────────
        else if (t.includes('open ') || t.includes('launch ') || t.includes('start ')) {
            let appFound = false;
            // Check the app map
            for (const [keyword, cmd] of Object.entries(APP_MAP)) {
                if (t.includes(keyword)) {
                    exec(cmd, { shell: 'cmd.exe' });
                    response = `Opening ${keyword} for you now, sir.`;
                    action = 'app_launch';
                    appFound = true;
                    break;
                }
            }

            // Check for folder opens
            if (!appFound) {
                for (const [keyword, folderPath] of Object.entries(FOLDER_MAP)) {
                    if (t.includes(keyword)) {
                        exec(`start "" "${folderPath}"`, { shell: 'cmd.exe' });
                        response = `Opening your ${keyword} folder, sir.`;
                        action = 'folder_open';
                        appFound = true;
                        break;
                    }
                }
            }

            // Try to open a website
            if (!appFound && (t.includes('.com') || t.includes('.org') || t.includes('.net') || t.includes('http'))) {
                const urlMatch = t.match(/(https?:\/\/[^\s]+|[a-z0-9.-]+\.(com|org|net|io|dev|app)[^\s]*)/i);
                if (urlMatch) {
                    const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
                    exec(`start "" "${url}"`, { shell: 'cmd.exe' });
                    response = `Opening ${url} in your browser now, sir.`;
                    action = 'url_open';
                    appFound = true;
                }
            }

            if (!appFound) {
                // Try to open whatever they said as a program
                const appName = t.replace(/^(open|launch|start)\s+/, '').trim();
                if (appName) {
                    try {
                        exec(`start ${appName}`, { shell: 'cmd.exe' });
                        response = `Attempting to open "${appName}" for you, sir.`;
                        action = 'app_launch';
                    } catch {
                        response = `I couldn't find an application called "${appName}", sir.`;
                    }
                }
            }
        }

        // ─── CLOSE / KILL APPS ───────────────────────────────────
        else if (t.includes('close ') || t.includes('kill ') || t.includes('terminate ') || t.includes('end ')) {
            const processName = t.replace(/^(close|kill|terminate|end)\s+/, '').trim();
            const processMap = {
                'chrome': 'chrome.exe',
                'google chrome': 'chrome.exe',
                'firefox': 'firefox.exe',
                'edge': 'msedge.exe',
                'notepad': 'notepad.exe',
                'calculator': 'CalculatorApp.exe',
                'word': 'WINWORD.EXE',
                'excel': 'EXCEL.EXE',
                'powerpoint': 'POWERPNT.EXE',
                'spotify': 'Spotify.exe',
                'discord': 'Discord.exe',
                'teams': 'Teams.exe',
                'vs code': 'Code.exe',
                'vscode': 'Code.exe',
                'explorer': 'explorer.exe',
                'task manager': 'Taskmgr.exe',
            };

            const pName = processMap[processName] || `${processName}.exe`;
            try {
                await runCmd(`taskkill /IM "${pName}" /F`);
                response = `${processName} has been terminated, sir.`;
                action = 'app_close';
            } catch {
                response = `I couldn't find a running process for "${processName}", sir.`;
            }
        }

        // ─── RUNNING PROCESSES ───────────────────────────────────
        else if (t.includes('running processes') || t.includes('what is running') || t.includes('active processes') || t.includes('list processes')) {
            try {
                const result = await run(`Get-Process | Sort-Object -Property CPU -Descending | Select-Object -First 10 Name, @{Name='CPU_Sec';Expression={[math]::Round($_.CPU,1)}}, @{Name='Memory_MB';Expression={[math]::Round($_.WorkingSet64/1MB,1)}} | Format-Table -AutoSize | Out-String`);
                response = `Here are the top 10 processes by CPU usage, sir:\n${result}`;
            } catch {
                response = "I encountered an error while fetching running processes, sir.";
            }
        }

        // ─── SCREENSHOT ──────────────────────────────────────────
        else if (t.includes('screenshot') || t.includes('screen capture') || t.includes('capture screen') || t.includes('snap screen')) {
            const filename = `jarvis_screenshot_${Date.now()}.png`;
            const filepath = path.join(USER_HOME, 'Pictures', filename);
            try {
                const screenshot = require('screenshot-desktop');
                await screenshot({ filename: filepath });
                response = `Screenshot captured and saved to Pictures as ${filename}, sir.`;
                action = 'screenshot';
            } catch (e) {
                response = "I encountered an error during screen capture, sir.";
            }
        }

        // ─── FILE OPERATIONS ─────────────────────────────────────
        else if (t.includes('list') && (t.includes('desktop') || t.includes('files') || t.includes('folder'))) {
            let targetFolder = FOLDER_MAP['desktop'];
            for (const [name, folderPath] of Object.entries(FOLDER_MAP)) {
                if (t.includes(name)) {
                    targetFolder = folderPath;
                    break;
                }
            }
            try {
                const files = fs.readdirSync(targetFolder);
                const fileDetails = files.slice(0, 15).map(f => {
                    try {
                        const stat = fs.statSync(path.join(targetFolder, f));
                        return `${stat.isDirectory() ? '📁' : '📄'} ${f}`;
                    } catch {
                        return `📄 ${f}`;
                    }
                });
                response = `Found ${files.length} items. Showing first 15:\n${fileDetails.join('\n')}`;
            } catch {
                response = "I couldn't access that directory, sir.";
            }
        }
        else if (t.includes('search for file') || t.includes('find file') || t.includes('locate file')) {
            const searchTerm = t.replace(/.*(search for file|find file|locate file)\s*/i, '').trim();
            if (searchTerm) {
                try {
                    const result = await run(`Get-ChildItem -Path "${USER_HOME}" -Recurse -Filter "*${searchTerm}*" -ErrorAction SilentlyContinue | Select-Object -First 10 FullName | Format-List | Out-String`);
                    response = result ? `I found these files matching "${searchTerm}":\n${result}` : `No files found matching "${searchTerm}", sir.`;
                } catch {
                    response = `Search for "${searchTerm}" timed out or encountered an error, sir.`;
                }
            } else {
                response = "What file would you like me to search for, sir?";
            }
        }
        else if (t.includes('create folder') || t.includes('make folder') || t.includes('new folder')) {
            const folderName = t.replace(/.*(create|make|new) folder\s*/i, '').trim();
            if (folderName) {
                const targetPath = path.join(USER_HOME, 'Desktop', folderName);
                try {
                    fs.mkdirSync(targetPath, { recursive: true });
                    response = `Folder "${folderName}" created on your desktop, sir.`;
                    action = 'folder_create';
                } catch {
                    response = `I couldn't create the folder "${folderName}", sir.`;
                }
            } else {
                response = "What would you like to name the folder, sir?";
            }
        }
        else if (t.includes('delete folder') || t.includes('remove folder')) {
            const folderName = t.replace(/.*(delete|remove) folder\s*/i, '').trim();
            if (folderName) {
                const targetPath = path.join(USER_HOME, 'Desktop', folderName);
                try {
                    fs.rmSync(targetPath, { recursive: true });
                    response = `Folder "${folderName}" has been removed from your desktop, sir.`;
                    action = 'folder_delete';
                } catch {
                    response = `I couldn't find or delete the folder "${folderName}", sir.`;
                }
            }
        }

        // ─── VOLUME CONTROL ──────────────────────────────────────
        else if (t.includes('mute') || t.includes('unmute') || t.includes('toggle mute')) {
            await run(`
        $obj = new-object -com wscript.shell;
        $obj.SendKeys([char]173)
      `);
            response = t.includes('unmute') ? "Volume unmuted, sir." : "Volume muted, sir.";
            action = 'volume';
        }
        else if (t.includes('volume up') || t.includes('increase volume') || t.includes('louder')) {
            await run(`
        $obj = new-object -com wscript.shell;
        1..5 | ForEach-Object { $obj.SendKeys([char]175) }
      `);
            response = "Volume increased, sir.";
            action = 'volume';
        }
        else if (t.includes('volume down') || t.includes('decrease volume') || t.includes('quieter') || t.includes('lower volume')) {
            await run(`
        $obj = new-object -com wscript.shell;
        1..5 | ForEach-Object { $obj.SendKeys([char]174) }
      `);
            response = "Volume decreased, sir.";
            action = 'volume';
        }
        else if (t.includes('max volume') || t.includes('full volume')) {
            await run(`
        $obj = new-object -com wscript.shell;
        1..50 | ForEach-Object { $obj.SendKeys([char]175) }
      `);
            response = "Volume set to maximum, sir.";
            action = 'volume';
        }

        // ─── BRIGHTNESS ──────────────────────────────────────────
        else if (t.includes('brightness')) {
            let level = 50;
            if (t.includes('max') || t.includes('full') || t.includes('100')) level = 100;
            else if (t.includes('high') || t.includes('bright')) level = 80;
            else if (t.includes('half') || t.includes('medium') || t.includes('50')) level = 50;
            else if (t.includes('low') || t.includes('dim')) level = 30;
            else if (t.includes('minimum') || t.includes('min')) level = 10;

            const numMatch = t.match(/(\d+)\s*%?/);
            if (numMatch) level = parseInt(numMatch[1]);

            try {
                await run(`(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${level})`);
                response = `Brightness set to ${level}%, sir.`;
                action = 'brightness';
            } catch {
                response = "I couldn't adjust the brightness. This feature may not be supported on desktop monitors, sir.";
            }
        }

        // ─── NETWORK INFO ────────────────────────────────────────
        else if (t.includes('ip address') || t.includes('my ip') || t.includes('network') || t.includes('wifi')) {
            try {
                const interfaces = os.networkInterfaces();
                let ipInfo = '';
                for (const [name, addrs] of Object.entries(interfaces)) {
                    const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
                    if (ipv4) ipInfo += `${name}: ${ipv4.address}\n`;
                }
                const wifiInfo = await run(`(Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*Wireless*' } | Select-Object Name, InterfaceAlias | ConvertTo-Json)`);
                let wifiName = '';
                try {
                    const wifi = JSON.parse(wifiInfo);
                    wifiName = wifi.Name || 'Unknown';
                } catch { }
                response = `Network information:\n${ipInfo}${wifiName ? `WiFi Network: ${wifiName}` : 'No WiFi detected'}\nAll connections are stable, sir.`;
            } catch {
                response = "I couldn't retrieve network information, sir.";
            }
        }

        // ─── POWER MANAGEMENT ────────────────────────────────────
        else if (t.includes('shutdown') || t.includes('shut down')) {
            response = "Initiating system shutdown in 30 seconds, sir. Say 'cancel shutdown' to abort.";
            exec('shutdown /s /t 30', { shell: 'cmd.exe' });
            action = 'power';
        }
        else if (t.includes('restart') || t.includes('reboot')) {
            response = "Initiating system restart in 30 seconds, sir. Say 'cancel' to abort.";
            exec('shutdown /r /t 30', { shell: 'cmd.exe' });
            action = 'power';
        }
        else if (t.includes('cancel shutdown') || t.includes('abort shutdown') || t.includes('cancel restart')) {
            exec('shutdown /a', { shell: 'cmd.exe' });
            response = "Shutdown has been cancelled, sir.";
            action = 'power';
        }
        else if (t.includes('sleep') || t.includes('hibernate')) {
            response = "Putting the system to sleep, sir.";
            exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0', { shell: 'cmd.exe' });
            action = 'power';
        }
        else if (t.includes('lock') || t.includes('lock screen') || t.includes('lock computer')) {
            exec('rundll32.exe user32.dll,LockWorkStation', { shell: 'cmd.exe' });
            response = "Locking the workstation now, sir.";
            action = 'power';
        }
        else if (t.includes('sign out') || t.includes('log out') || t.includes('log off')) {
            response = "Signing out now, sir. See you soon.";
            exec('shutdown /l', { shell: 'cmd.exe' });
            action = 'power';
        }

        // ─── CLIPBOARD ───────────────────────────────────────────
        else if (t.includes('clipboard') || t.includes('paste content') || t.includes("what's copied") || t.includes('what did i copy')) {
            try {
                const clipContent = await run('Get-Clipboard');
                response = clipContent ? `Your clipboard contains: "${clipContent.substring(0, 200)}"` : "Your clipboard is empty, sir.";
            } catch {
                response = "I couldn't access the clipboard, sir.";
            }
        }
        else if (t.includes('copy ') && !t.includes('copyright')) {
            const textToCopy = t.replace(/^copy\s+/i, '').trim();
            if (textToCopy) {
                await run(`Set-Clipboard -Value "${textToCopy.replace(/"/g, '\\"')}"`);
                response = `"${textToCopy}" has been copied to your clipboard, sir.`;
                action = 'clipboard';
            }
        }

        // ─── WEB SEARCH ──────────────────────────────────────────
        else if (t.includes('search for') || t.includes('google') || t.includes('look up') || t.includes('search ')) {
            const query = t.replace(/.*(search for|google|look up|search)\s*/i, '').trim();
            if (query) {
                const encodedQuery = encodeURIComponent(query);
                exec(`start "" "https://www.google.com/search?q=${encodedQuery}"`, { shell: 'cmd.exe' });
                response = `Searching Google for "${query}" now, sir.`;
                action = 'search';
            }
        }

        // ─── YOUTUBE ─────────────────────────────────────────────
        else if (t.includes('play') && (t.includes('youtube') || t.includes('video') || t.includes('music') || t.includes('song'))) {
            const query = t.replace(/.*(play|on youtube|youtube|video|music|song)\s*/gi, '').trim();
            if (query) {
                const encodedQuery = encodeURIComponent(query);
                exec(`start "" "https://www.youtube.com/results?search_query=${encodedQuery}"`, { shell: 'cmd.exe' });
                response = `Searching YouTube for "${query}" now, sir.`;
                action = 'youtube';
            } else {
                exec(`start "" "https://www.youtube.com"`, { shell: 'cmd.exe' });
                response = "Opening YouTube for you, sir.";
            }
        }

        // ─── PINTEREST ───────────────────────────────────────────
        else if (t.includes('pinterest')) {
            const query = t.replace(/.*(search pinterest for|search pinterest|pinterest for|on pinterest)\s*/gi, '').trim();
            if (query) {
                const encodedQuery = encodeURIComponent(query);
                exec(`start "" "https://www.pinterest.com/search/pins/?q=${encodedQuery}"`, { shell: 'cmd.exe' });
                response = `Searching Pinterest visual database for "${query}", sir.`;
                action = 'pinterest';
            } else {
                exec(`start "" "https://www.pinterest.com"`, { shell: 'cmd.exe' });
                response = "Opening Pinterest for you, sir.";
            }
        }

        // ─── INSTALLED APPS ──────────────────────────────────────
        else if (t.includes('installed apps') || t.includes('installed programs') || t.includes('what apps')) {
            try {
                const result = await run(`Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName | Where-Object { $_.DisplayName -ne $null } | Sort-Object DisplayName | Select-Object -First 20 | Format-Table -AutoSize | Out-String`);
                response = `Here are some installed programs:\n${result}`;
            } catch {
                response = "I couldn't retrieve the installed applications list, sir.";
            }
        }

        // ─── MEDIA CONTROLS ──────────────────────────────────────
        else if (t.includes('pause') || t.includes('play pause') || t.includes('resume')) {
            await run(`$obj = new-object -com wscript.shell; $obj.SendKeys([char]179)`);
            response = "Media playback toggled, sir.";
            action = 'media';
        }
        else if (t.includes('next track') || t.includes('skip') || t.includes('next song')) {
            await run(`$obj = new-object -com wscript.shell; $obj.SendKeys([char]176)`);
            response = "Skipping to next track, sir.";
            action = 'media';
        }
        else if (t.includes('previous track') || t.includes('previous song') || t.includes('go back')) {
            await run(`$obj = new-object -com wscript.shell; $obj.SendKeys([char]177)`);
            response = "Going to previous track, sir.";
            action = 'media';
        }

        // ─── EMPTY RECYCLE BIN ───────────────────────────────────
        else if (t.includes('empty recycle bin') || t.includes('clear recycle') || t.includes('empty trash')) {
            try {
                await run(`Clear-RecycleBin -Force -ErrorAction SilentlyContinue`);
                response = "Recycle bin has been emptied, sir.";
                action = 'cleanup';
            } catch {
                response = "The recycle bin is already empty or I couldn't clear it, sir.";
            }
        }

        // ─── DISPLAY RESOLUTION INFO ─────────────────────────────
        else if (t.includes('screen resolution') || t.includes('display info') || t.includes('monitor')) {
            try {
                const result = await run(`Get-CimInstance -ClassName Win32_VideoController | Select-Object Name, CurrentHorizontalResolution, CurrentVerticalResolution, CurrentRefreshRate | ConvertTo-Json`);
                const display = JSON.parse(result);
                const d = Array.isArray(display) ? display[0] : display;
                response = `Display: ${d.Name}. Resolution: ${d.CurrentHorizontalResolution}x${d.CurrentVerticalResolution} at ${d.CurrentRefreshRate}Hz, sir.`;
            } catch {
                response = "I couldn't retrieve display information, sir.";
            }
        }

        // ─── HELP / COMMANDS ─────────────────────────────────────
        else if (t.includes('help') || t.includes('what can you do') || t.includes('commands') || t.includes('capabilities')) {
            response = `Here's what I can do for you, sir:

🖥️ SYSTEM: "system status", "cpu usage", "memory", "disk space", "battery", "uptime"
📱 APPS: "open chrome", "open notepad", "close chrome", "launch calculator"
📁 FILES: "list desktop files", "search for file", "create folder", "delete folder"
🔊 AUDIO: "volume up", "volume down", "mute", "max volume"
💡 DISPLAY: "brightness 50%", "screen resolution"
🌐 NETWORK: "my ip address", "wifi status"
🔍 SEARCH: "google something", "search for", "play on youtube"
🎵 MEDIA: "pause", "next track", "previous track"
📋 CLIPBOARD: "what's copied", "copy hello world"
⚡ POWER: "shutdown", "restart", "sleep", "lock screen", "sign out"
🗑️ CLEANUP: "empty recycle bin"
🏗️ PROCESSES: "running processes"
📸 CAPTURE: "take a screenshot"

Just speak naturally, sir. I'll understand.`;
        }

        // ─── JOKES / EASTER EGGS ────────────────────────────────
        else if (t.includes('tell me a joke') || t.includes('joke')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs, sir.",
                "I told my wife she was drawing her eyebrows too high. She looked surprised.",
                "Why did the developer go broke? Because he used up all his cache.",
                "I would tell you a UDP joke, but you might not get it.",
                "There are only 10 types of people in the world: those who understand binary, and those who don't.",
            ];
            response = jokes[Math.floor(Math.random() * jokes.length)];
        }

    } catch (err) {
        console.error('Error processing command:', err);
        response = "I encountered an unexpected error, sir. I'll log the details for analysis.";
    }

    res.json({ response, mode, action });
});

// ─── SYSTEM INFO ENDPOINT ──────────────────────────────────
app.get('/api/system', async (req, res) => {
    try {
        const cpuUsage = await osu.cpu.usage();

        let memInfo = { usedMemPercentage: 0, freeMemMb: 0 };
        try { memInfo = await osu.mem.info(); } catch { }

        let driveInfo = { usedPercentage: '0', freeGb: '0', totalGb: '0' };
        try { driveInfo = await osu.drive.info(); } catch { }

        // Fetch Battery
        let battery = null;
        try {
            const batteryInfo = await run(`(Get-WmiObject Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json)`);
            if (batteryInfo) {
                const bat = JSON.parse(batteryInfo);
                battery = {
                    percent: bat.EstimatedChargeRemaining,
                    isCharging: bat.BatteryStatus === 2
                };
            }
        } catch { }

        // Fetch Display Resolution
        let display = null;
        try {
            const result = await run(`Get-CimInstance -ClassName Win32_VideoController | Select-Object Name, CurrentHorizontalResolution, CurrentVerticalResolution | ConvertTo-Json`);
            const raw = JSON.parse(result);
            const d = Array.isArray(raw) ? raw[0] : raw;
            display = `${d.CurrentHorizontalResolution}x${d.CurrentVerticalResolution}`;
        } catch { }

        res.json({
            cpu: {
                usage: cpuUsage,
                model: os.cpus()[0].model,
                cores: os.cpus().length,
            },
            memory: {
                usedPercent: memInfo.usedMemPercentage || 0,
                total: formatBytes(os.totalmem()),
                free: formatBytes((memInfo.freeMemMb || 0) * 1024 * 1024),
            },
            disk: {
                usedPercent: parseFloat(driveInfo.usedPercentage) || 0,
                freeGb: driveInfo.freeGb || '0',
                totalGb: driveInfo.totalGb || '0',
            },
            battery,
            display,
            uptime: os.uptime(),
            hostname: os.hostname(),
            platform: `${os.type()} ${os.release()}`,
            user: os.userInfo().username,
        });
    } catch (err) {
        console.error('System info error:', err);
        res.json({
            cpu: { usage: 0, model: os.cpus()[0].model, cores: os.cpus().length },
            memory: { usedPercent: 0, total: formatBytes(os.totalmem()), free: '0' },
            disk: { usedPercent: 0, freeGb: '0', totalGb: '0' },
            uptime: os.uptime(),
            hostname: os.hostname(),
            platform: `${os.type()} ${os.release()}`,
            user: os.userInfo().username,
        });
    }
});

// ─── SERVER START ──────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║     J.A.R.V.I.S. NODE BRAIN v2.0          ║`);
    console.log(`║     Listening on port: ${PORT}               ║`);
    console.log(`║     Desktop Control: FULL ACCESS           ║`);
    console.log(`║     Commands: ${Object.keys(APP_MAP).length + 40}+ voice commands          ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});
