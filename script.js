document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const searchBtn = document.getElementById('search-btn');
    const retryBtn = document.getElementById('retry-btn');
    const serverIpInput = document.getElementById('server-ip');
    const embed = document.getElementById('embed');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = error.querySelector('p');
    const serverName = document.getElementById('server-name');
    const statusBadge = document.getElementById('status-badge');
    const statusIndicator = statusBadge.querySelector('.status-indicator');
    const statusText = statusBadge.querySelector('.status-text');
    const serverIcon = document.getElementById('server-icon');
    const serverBanner = document.getElementById('server-banner');
    const serverIpAddress = document.getElementById('server-ip-address');
    const serverPlayers = document.getElementById('server-players');
    const playersProgress = serverPlayers.querySelector('.progress-fill');
    const playersText = serverPlayers.querySelector('.players-text');
    const serverVersion = document.getElementById('version-badge').querySelector('span');
    const serverInfo = document.getElementById('server-info');
    const serverProtocol = document.getElementById('server-protocol');
    const serverPort = document.getElementById('server-port');
    const timestamp = document.getElementById('timestamp');
    const lastUpdated = document.getElementById('last-updated');
    const playersCount = document.getElementById('players-count').querySelector('span');
    const colorBar = document.querySelector('.embed-color-bar');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', toggleTheme);
    serverIpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchServer();
    });
    searchBtn.addEventListener('click', searchServer);
    retryBtn.addEventListener('click', searchServer);

    async function searchServer() {
        const ip = serverIpInput.value.trim();
        if (!ip) {
            showError("Lütfen bir sunucu IP adresi girin");
            return;
        }
        
        embed.style.display = 'none';
        error.style.display = 'none';
        loading.style.display = 'flex';
        updateTimestamps();
        
        try {
            const data = await fetchServerData(ip);
            if (!data.online) {
                showError("Sunucu çevrimdışı görünüyor");
                return;
            }
            updateEmbed(data, ip);
            loading.style.display = 'none';
            embed.style.display = 'block';
        } catch (err) {
            console.error('Error:', err);
            showError("Sunucu bulunamadı. Lütfen IP adresini kontrol edip tekrar deneyin");
        }
    }

    function showError(message) {
        loading.style.display = 'none';
        embed.style.display = 'none';
        errorMessage.textContent = message;
        error.style.display = 'flex';
    }

    async function fetchServerData(ip) {
        const [host, port = '25565'] = ip.split(':');
        const cleanIp = `${host}:${port}`;

        try {
            const statusRes = await fetch(`https://api.mcstatus.io/v2/status/java/${cleanIp}`);
            
            if (statusRes.ok) {
                const data = await statusRes.json();
                return {
                    online: data.online,
                    ip: data.ip || host,
                    sayısal_ip: data.ip_address,
                    hostname: data.host || host,
                    port: data.port || port,
                    players: {
                        online: data.players?.online || 0,
                        max: data.players?.max || 0
                    },
                    version: data.version?.name || 'Bilinmiyor',
                    motd: {
                        clean: data.motd?.clean || ['Bilinmiyor']
                    },
                    icon: `https://api.mcstatus.io/v2/icon/${cleanIp}`,
                    protocol: data.version?.protocol || 'Bilinmiyor'
                };
            }
            throw new Error('mcstatus.io failed');
        } catch (err) {
            try {
                const response = await fetch(`https://api.mcsrvstat.us/2/${cleanIp}`);
                
                if (!response.ok) throw new Error('API request failed');
                
                const data = await response.json();
                return {
                    online: data.online,
                    ip: data.ip || host,
                    sayısal_ip: data.ip_address,
                    hostname: data.hostname || host,
                    port: data.port || port,
                    players: {
                        online: data.players?.online || 0,
                        max: data.players?.max || 0
                    },
                    version: data.version || 'Bilinmiyor',
                    motd: {
                        clean: data.motd?.clean || ['Bilinmiyor']
                    },
                    icon: data.icon ? `data:image/png;base64,${data.icon}` : null,
                    protocol: data.protocol || 'Bilinmiyor'
                };
            } catch (fallbackErr) {
                throw new Error('Sunucu bilgileri alınamadı');
            }
        }
    }

    function updateEmbed(data, ip) {
        if (data.online) {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Çevrimiçi';
            colorBar.style.backgroundColor = 'var(--success-color)';
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Çevrimdışı';
            colorBar.style.backgroundColor = 'var(--danger-color)';
        }
        
        if (data.icon) {
            serverIcon.src = data.icon;
            serverIcon.style.display = 'block';
            serverIcon.onerror = () => serverIcon.style.display = 'none';
        } else {
            serverIcon.style.display = 'none';
        }
        
        const bannerUrl = `http://status.mclive.eu/${ip.split(':')[0]}/${ip.split(':')[0]}/${data.port || 25565}/banner.png`;
        serverBanner.src = bannerUrl;
        serverBanner.style.display = 'block';
        serverBanner.onerror = () => serverBanner.style.display = 'none';
        
        serverName.textContent = data.motd.clean[0] || data.hostname || ip.split(':')[0];
        serverIpAddress.textContent = ip;
        
        const online = data.players.online || 0;
        const max = data.players.max || 0;
        const percentage = max > 0 ? Math.min(100, (online / max) * 100) : 0;
        
        playersProgress.style.width = `${percentage}%`;
        playersText.textContent = `${online.toLocaleString()}/${max.toLocaleString()}`;
        playersCount.textContent = online.toLocaleString();
        
        serverVersion.textContent = data.sayısal_ip || "veri alınamadı!"
        serverProtocol.textContent = `Protokol: ${data.protocol}`;
        serverPort.textContent = `Port: ${data.port}`;

serverInfo.innerHTML = `
<div class="network-info"><div class="network-item"><span class="network-label">
      <span class="info-item" style="color: #4fc3f7">Sayısal IP:</span> ${data.sayısal_ip || "veri alınamadı!"}
      <span class="info-item" style="color: #4fc3f7">Domain:</span> ${data.hostname||ip.split(':')[0]}
      <span class="info-item" style="color: #4fc3f7">Oyuncu:</span> <span style="color: #69f0ae">${data.players.online||0}</span>/<span style="color: #ff5252">${data.players.max||0}</span>
      <span class="info-item" style="color: #4fc3f7">Port:</span> ${data.port||(ip.includes(':')?ip.split(':')[1]:25565)}
    </span>
  </div>
</div>`;
  }

    function updateTimestamps() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        timestamp.textContent = `Bugün, ${timeString}`;
        lastUpdated.textContent = `Son güncelleme: ${timeString}`;
    }

    serverIpInput.value = '';
    embed.style.display = 'none';
    loading.style.display = 'none';
    error.style.display = 'none';
});
