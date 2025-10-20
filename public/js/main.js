let isLiteMode = true;
let liteModeType = 'dps';
const professionMap = {
    '雷影剑士': { name: 'Stormblade', icon: 'Stormblade.png', role: 'dps' },
    '冰魔导师': { name: 'Frost Mage', icon: 'Frost Mage.png', role: 'dps' },
    '涤罪恶火·战斧': { name: 'Fire Axe', icon: 'Fire Axe.png', role: 'dps' },
    '青岚骑士': { name: 'Wind Knight', icon: 'Wind Knight.png', role: 'tank' },
    '森语者': { name: 'Verdant Oracle', icon: 'Verdant Oracle.png', role: 'healer' },
    '雷霆一闪·手炮': { name: 'Gunner', icon: 'desconocido.png', role: 'dps' },
    '巨刃守护者': { name: 'Heavy Guardian', icon: 'baluarte_ferreo.png', role: 'tank' },
    '暗灵祈舞·仪刀/仪仗': { name: 'Beat Performer', icon: 'desconocido.png', role: 'healer' },
    '神射手': { name: 'Marksman', icon: 'arco_halcon.png', role: 'dps' },
    '神盾骑士': { name: 'Shield Knight', icon: 'guardian.png', role: 'tank' },
    '灵魂乐手': { name: 'Soul Musician', icon: 'sonido_feroz.png', role: 'dps' },

    '居合': { name: 'laido Slash', icon: 'Stormblade.png', role: 'dps' },
    '月刃': { name: 'MoonStrike', icon: 'MoonStrike.png', role: 'dps' },
    '冰矛': { name: 'Icicle', icon: 'lanza_hielo.png', role: 'dps' },
    '射线': { name: 'Frostbeam', icon: 'Frost Mage.png', role: 'dps' },
    '防盾': { name: 'Vanguard', icon: 'guardian.png', role: 'tank' },
    '岩盾': { name: 'Skyward', icon: 'Fire Axe.png', role: 'tank' },
    '惩戒': { name: 'Smite', icon: 'castigo.png', role: 'healer' },
    '愈合': { name: 'Lifebind', icon: 'Verdant Oracle.png', role: 'healer' },
    '格挡': { name: 'Block', icon: 'guardian.png', role: 'tank' },
    '狼弓': { name: 'Wildpack', icon: 'arco_lobo.png', role: 'dps' },
    '鹰弓': { name: 'Falconry', icon: 'arco_halcon.png', role: 'dps' },
    '光盾': { name: 'Shield', icon: 'egida_luz.png', role: 'tank' },
    '协奏': { name: 'Concerto', icon: 'Concierto.png', role: 'healer' },
    '狂音': { name: 'Dissonance', icon: 'sonido_feroz.png', role: 'healer' },
    '空枪': { name: 'Empty Gun', icon: 'francotirador.png', role: 'dps' },
    '重装': { name: 'Heavy Armor', icon: 'Wind Knight.png', role: 'tank' },

};

 const defaultProfession = { name: 'Unknown', icon: 'desconocido.png', role: 'dps' };

    let lastTotalDamage = 0;
    let lastDamageChangeTime = Date.now();
    
    let phaseStartTime = null;
    let phaseNumber = 1;
    let phaseTimerInterval = null;
    
    function calculateBarWidth(currentDamage, maxDamage) {
        if (maxDamage <= 0) return 0;
        return (currentDamage / maxDamage) * 100;
    }
    let currentZoom = 1.0;
    let syncTimerInterval;
    let syncCountdown = 0;
    const SYNC_RESET_TIME = 80;
    let syncTimerDisplayTimeout;
    let isLocked = false;
    let logPreviewTimeout;

    const dpsTimerDiv = document.getElementById('dps-timer');
    const playerBarsContainer = document.getElementById('player-bars-container');
    const syncButton = document.getElementById('sync-button');
    const syncIcon = document.querySelector('#sync-button .sync-icon');
    const syncTimerSpan = document.querySelector('#sync-button .sync-timer');
    const lockButton = document.getElementById('lock-button');
    const logsSection = document.getElementById('logs-section');
    const loadingIndicator = document.getElementById('loading-indicator');
    const phaseTimer = document.getElementById('phase-timer');
    const phaseTimerText = document.getElementById('phase-timer-text');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            if (document.body.classList.contains('locked')) {
                document.body.classList.add('alt-pressed');
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            document.body.classList.remove('alt-pressed');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                resetDpsMeter();
            });
        }

        const clearDataButton = document.getElementById('clear-data-button');
        if (clearDataButton) {
            clearDataButton.addEventListener('click', () => {
                fetch('/api/clear');
                resetPhaseTimer();
                console.log('Data cleared');
            });
        }



        const zoomInButton = document.getElementById('zoom-in-button');
        const zoomOutButton = document.getElementById('zoom-out-button');

        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => {
                currentZoom = Math.min(2.0, currentZoom + 0.1); // Limitar zoom máximo a 2.0
                applyZoom();
            });
        }

        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => {
                currentZoom = Math.max(0.5, currentZoom - 0.1); // Limitar zoom mínimo a 0.5
                applyZoom();
            });
        }

        if (syncButton) {
        }

        if (lockButton) {
            lockButton.addEventListener('click', () => {
                if (window.electronAPI) {
                    window.electronAPI.toggleLockState();
                }
            });

            if (window.electronAPI) {
                window.electronAPI.onLockStateChanged((locked) => {
                    isLocked = locked;
                    lockButton.innerHTML = isLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
                    lockButton.title = isLocked ? 'Desbloquear posición' : 'Bloquear posición';
                    document.body.classList.toggle('locked', isLocked); // Añadir/quitar clase al body
                });
                
                window.electronAPI.onToggleHeader(() => {
                    const header = document.querySelector('.controls');
                    if (header) {
                        header.style.display = header.style.display === 'none' ? 'flex' : 'none';
                    }
                });
                
                document.addEventListener('keydown', (event) => {
                    if (event.ctrlKey && event.altKey && event.key === 'd') {
                        const debugDiv = document.getElementById('debug-info');
                        if (debugDiv) {
                            debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
                            console.log('Debug panel toggled');
                        }
                    }
                });
            }
        }

        const closeButton = document.getElementById('close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (window.electronAPI) {
                    window.electronAPI.closeWindow();
                }
            });
        }
    });

    function applyZoom() {
        if (playerBarsContainer) {
            playerBarsContainer.style.transform = `scale(${currentZoom})`;
            playerBarsContainer.style.transformOrigin = 'top left';
            updateWindowSize(); // Redimensionar la ventana al aplicar zoom
        }
    }

    function updateWindowSize() {
        const dpsMeter = document.querySelector('.dps-meter');
        const container = document.getElementById('player-bars-container');
        if (!dpsMeter || !container || !window.electronAPI) return;

        const baseWidth = 350; // Ancho fijo como se solicitó
        const headerHeight = document.querySelector('.controls')?.offsetHeight || 50; // Altura de la cabecera
        const marginTop = 0; // Margen superior del contenedor de barras
        const borderWidth = 2; // Borde superior e inferior del contenedor
        const barHeight = 55; // Altura de cada barra de jugador
        const barGap = 0;    // Espacio entre barras

        const numPlayers = container.querySelectorAll('.player-bar').length;
        const numPlayersCapped = Math.min(numPlayers, 10); // Limitar a 10 barras

        let barsHeight = 0;
        if (numPlayersCapped > 0) {
            barsHeight = (numPlayersCapped * barHeight) + ((numPlayersCapped - 1) * barGap);
        } else {
            barsHeight = 50;
        }

        const totalContentHeightUnscaled = headerHeight + marginTop + borderWidth + barsHeight + 20; // Búfer de 20px

        const finalWidth = Math.round(baseWidth * currentZoom);
        const finalHeight = Math.round(totalContentHeightUnscaled * currentZoom);
        
        window.electronAPI.resizeWindow(finalWidth, finalHeight);
    }

    function resetDpsMeter() {
        fetch('/api/clear');
        dpsTimerDiv.style.display = 'none';
        dpsTimerDiv.innerText = '';
        console.log('Medidor reiniciado.');
        lastTotalDamage = 0;
        lastDamageChangeTime = Date.now();
        stopSyncTimer(); // Detener el temporizador de sincronización al reiniciar
        resetPhaseTimer(); // Reset phase timer
    }
    
    function startPhaseTimer() {
        if (phaseStartTime) return; // Already running
        
        phaseStartTime = Date.now();
        phaseTimer.style.display = 'block';
        
        phaseTimerInterval = setInterval(updatePhaseTimer, 1000);
        updatePhaseTimer();
    }
    
    function updatePhaseTimer() {
        if (!phaseStartTime) return;
        
        const elapsed = Date.now() - phaseStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        phaseTimerText.textContent = `Phase ${phaseNumber}: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function resetPhaseTimer() {
        if (phaseTimerInterval) {
            clearInterval(phaseTimerInterval);
            phaseTimerInterval = null;
        }
        phaseStartTime = null;
        phaseNumber = 1;
        phaseTimer.style.display = 'none';
    }
    
    function nextPhase() {
        if (phaseStartTime) {
            phaseNumber++;
            phaseStartTime = Date.now(); // Reset timer for new phase
        }
    }

    async function syncData() {
        try {
            await fetch('/api/sync', { method: 'POST' });
            console.log('Datos sincronizados internamente.');
        } catch (error) {
            console.error('Error al sincronizar datos:', error);
        }
    }

    function updateSyncButtonState() {
        if (!syncIcon || !syncTimerSpan) return;
        
        clearTimeout(syncTimerDisplayTimeout); // Limpiar cualquier timeout pendiente

        if (syncTimerInterval) { // Si el temporizador está activo (hay cuenta regresiva)
            if (syncCountdown <= 60) {
                syncIcon.style.display = 'none';
                syncIcon.classList.remove('spinning');
                syncTimerSpan.innerText = `${syncCountdown}s`;
                syncTimerSpan.style.display = 'block';
            } else {
                syncIcon.style.display = 'block';
                syncIcon.classList.add('spinning'); // Asegura que gire continuamente
                syncTimerSpan.style.display = 'none';
            }
        } else { // Si el temporizador no está activo (no hay cuenta regresiva)
            syncIcon.style.display = 'block';
            syncIcon.classList.add('spinning'); // Asegura que gire continuamente
            syncTimerSpan.style.display = 'none';
            syncTimerSpan.innerText = '';
        }
    }

    function startSyncTimer() {
        if (syncTimerInterval) return; // Evitar múltiples temporizadores
        syncCountdown = SYNC_RESET_TIME;

        syncTimerInterval = setInterval(() => {
            syncCountdown--;

            if (syncCountdown <= 0) {
                stopSyncTimer();
                resetDpsMeter();
            }
        }, 1000);
    }

    function stopSyncTimer() {
        clearInterval(syncTimerInterval);
        syncTimerInterval = null;
        clearTimeout(syncTimerDisplayTimeout); // Limpiar el timeout si existe
    }

    function formatTimer(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    async function fetchLogs() {
        const res = await fetch('/logs-dps');
        return await res.json();
    }

    function renderLogs(logs) {
        let html = '';
        if (logs.length === 0) {
            logsSection.style.display = 'none'; // Ocultar la sección si no hay logs
            return;
        } else {
            logsSection.style.display = 'block'; // Mostrar la sección si hay logs
            html = '<select id="logs-dropdown" style="width:100%;padding:6px 4px;border-radius:6px;font-size:1rem;">' +
                `<option value="-1">LOG</option>` +
                logs.map((log, i) => `<option value="${i}">${log.fecha}</option>`).join('') + '</select>';
            html += '<div id="log-preview"></div>';
        }
        logsSection.innerHTML = html;
        if (logs.length > 0) {
            let lastValue = -1;
            const dropdown = document.getElementById('logs-dropdown');
            dropdown.onchange = function() {
                if (this.value == lastValue || this.value == -1) {
                    showLogPreview(null);
                    this.value = -1;
                    lastValue = -1;
                } else {
                    showLogPreview(logs[this.value]);
                    lastValue = this.value;
                }
            };
        }
    }

    function showLogPreview(log) {
        const logPreview = document.getElementById('log-preview');
        if (logPreviewTimeout) {
            clearTimeout(logPreviewTimeout);
        }

        if (!log) {
            logPreview.innerHTML = '';
            return;
        }

        let prof = professionMap && log.icon ? Object.values(professionMap).find(p => p.icon === log.icon) : null;
        let profName = prof ? prof.name : '';
        logPreview.innerHTML = `<div class=\"player-bar\" style=\"margin-top:10px;\">\n            <div class=\"progress-fill\" style=\"width: 100%; background: #444b5a;\"></div>\n            <div class=\"bar-content\">\n                <div class=\"player-info\">\n                    <span class=\"player-name\">${log.nombre}</span>\n                    <span class=\"player-id\">ID: ${log.id}</span>\n                    <span class=\"player-id\">${profName}</span>\n                </div>\n                <div class=\"player-performance\">\n                    <div class=\"stats-list\">\n                        <span class=\"main-stat\">DPS ${formatStat(log.dps)}</span>\n                        <span class=\"secondary-stat\">HPS ${formatStat(log.hps)}</span>\n                        <span class=\"secondary-stat\">DTPS ${formatStat(log.dtps)}</span>\n                    </div>\n                    <img class=\"class-icon\" src=\"icons/${log.icon}\" alt=\"icon\">\n                </div>\n            </div>\n        </div>`;
        logPreviewTimeout = setTimeout(() => { 
            logPreview.innerHTML = '';
        }, 7000);
    }

    async function updateLogsUI() {
        const logs = await fetchLogs();
        renderLogs(logs);
    }

    function getHealthColor(percentage) {
        const r1 = 220, g1 = 53, b1 = 69; // Rojo para HP bajo (#dc3545)
        const r2 = 40, g2 = 167, b2 = 69; // Verde para HP alto (#28a745)

        const r = Math.round(r1 + (r2 - r1) * (percentage / 100));
        const g = Math.round(g1 + (g2 - g1) * (percentage / 100));
        const b = Math.round(b1 + (b2 - b1) * (percentage / 100));

        return `rgb(${r}, ${g}, ${b})`;
    }

    function formatStat(value) {
        if (value >= 1000000000000) {
            return (value / 1000000000000).toFixed(1) + 'T';
        }
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + 'G';
        }
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toFixed(0);
    }

    const playerColors = [
        'rgba(255, 99, 132, 0.7)', // Rojo
        'rgba(54, 162, 235, 0.7)', // Azul
        'rgba(255, 206, 86, 0.7)', // Amarillo
        'rgba(75, 192, 192, 0.7)', // Verde
        'rgba(153, 102, 255, 0.7)', // Morado
        'rgba(255, 159, 64, 0.7)' // Naranja
    ];

    async function fetchDataAndRender() {
        const container = document.getElementById('player-bars-container');
        try {
            const [dataRes, diccRes, settingsRes] = await Promise.all([
                fetch('/api/data'),
                fetch('/api/diccionario'),
                fetch('/api/settings')
            ]);
            const userData = await dataRes.json();
            const diccionarioData = await diccRes.json();
            const currentGlobalSettings = await settingsRes.json();

            let userArray = Object.values(userData.user);
            userArray = userArray.filter(u => u.total_damage && u.total_damage.total > 0);

            if (!userArray || userArray.length === 0) {
                loadingIndicator.style.display = 'flex'; // Mostrar el indicador de carga
                playerBarsContainer.style.display = 'none'; // Ocultar el contenedor de barras
                return;
            }

            loadingIndicator.style.display = 'none'; // Ocultar el indicador de carga
            playerBarsContainer.style.display = 'flex'; // Mostrar el contenedor de barras

            const sumaTotalDamage = userArray.reduce((acc, u) => acc + (u.total_damage && u.total_damage.total ? Number(u.total_damage.total) : 0), 0);


            
            if (sumaTotalDamage > 0 && !phaseStartTime) {
                startPhaseTimer();
            }

            if (sumaTotalDamage > 0) {
                if (sumaTotalDamage !== lastTotalDamage) {
                    lastTotalDamage = sumaTotalDamage;
                    lastDamageChangeTime = Date.now();
                    stopSyncTimer();
                } else {
                    if (!syncTimerInterval) {
                        startSyncTimer();
                    }
                }
            } else {
                lastTotalDamage = 0;
                lastDamageChangeTime = Date.now();
                stopSyncTimer();
            }

            userArray.forEach(u => {
                const userDamage = u.total_damage && u.total_damage.total ? Number(u.total_damage.total) : 0;
                u.damagePercent = sumaTotalDamage > 0 ? Math.max(0, Math.min(100, (userDamage / sumaTotalDamage) * 100)) : 0;
            });

            if (isLiteMode && liteModeType === 'healer') {
                const totalHealingContribution = userArray.reduce((acc, u) => acc + (u.total_healing && u.total_healing.total ? Number(u.total_healing.total) : 0), 0);
                userArray.forEach(u => {
                    const userHealing = u.total_healing && u.total_healing.total ? Number(u.total_healing.total) : 0;
                    u.healingPercent = totalHealingContribution > 0 ? Math.max(0, Math.min(100, (userHealing / totalHealingContribution) * 100)) : 0;
                });
                userArray.sort((a, b) => b.healingPercent - a.healingPercent);
            } else { // Modo DPS (Lite o Advanced)
                userArray.sort((a, b) => (b.total_damage && b.total_damage.total ? Number(b.total_damage.total) : 0) - (a.total_damage && a.total_damage.total ? Number(a.total_damage.total) : 0));
            }
            
            userArray = userArray.slice(0, 20);

            container.innerHTML = userArray.map((u, index) => {
                    const professionParts = u.profession.split('-');
                    const mainProfessionKey = professionParts[0];
                    const subProfessionKey = professionParts[1];
                    const mainProf = professionMap[mainProfessionKey] || defaultProfession;
                    const subProf = professionMap[subProfessionKey];
                    let prof = mainProf.name !== 'Unknown' ? mainProf : (subProf || mainProf);
                    const nombre = u.name || '';
                    
                    console.log('Player:', nombre, 'Profession:', u.profession, 'Main:', mainProfessionKey, 'Sub:', subProfessionKey, 'Role:', prof.role);
                    
                    let roleColor;
                    if (prof.role === 'healer') {
                        roleColor = '#28a745'; // Green for healers
                    } else if (prof.role === 'tank') {
                        roleColor = '#007bff'; // Blue for tanks
                    } else {
                        roleColor = '#fd7e14'; // Orange for DPS
                    }
                    
                    let barFillWidth, barFillBackground, value1, value2, iconHtml;

                    if (liteModeType === 'dps') {
                        const maxDamage = Math.max(...userArray.map(player => player.total_damage.total || 0));
                        barFillWidth = calculateBarWidth(u.total_damage.total || 0, maxDamage);
                        
                        let displayDPS = 0;
                        const serverStart = u.start_ts;
                        const serverLast = u.last_ts;
                        if (serverStart && serverLast && serverLast > serverStart) {
                            const durationSec = (serverLast - serverStart) / 1000;
                            displayDPS = durationSec > 0 ? (u.total_damage.total || 0) / durationSec : 0;
                        } else {
                            const playerData = dpsHistory.get(u.uid);
                            if (playerData && playerData.firstDamageTime && playerData.lastDamageTime) {
                                const combatDuration = (playerData.lastDamageTime - playerData.firstDamageTime) / 1000;
                                displayDPS = combatDuration > 0 ? (u.total_damage.total || 0) / combatDuration : 0;
                            } else {
                                const combatDuration = 20;
                            displayDPS = (u.total_damage.total || 0) / combatDuration;
                            }
                        }
                        barFillBackground = displayDPS > 0 ? `linear-gradient(90deg, transparent, ${roleColor})` : 'none';
                        value1 = `${formatStat(u.total_damage.total || 0)} (${formatStat(displayDPS)}/s)`; // Total (DPS/s)
                    } else { // liteModeType === 'healer'
                        const totalHealing = userArray.reduce((sum, player) => sum + (player.total_healing.total || 0), 0);
                        barFillWidth = calculateBarWidth(u.total_healing.total || 0, totalHealing);
                        
                        let displayHPS = 0;
                        const serverStart = u.start_ts;
                        const serverLast = u.last_ts;
                        if (serverStart && serverLast && serverLast > serverStart) {
                            const durationSec = (serverLast - serverStart) / 1000;
                            displayHPS = durationSec > 0 ? (u.total_healing.total || 0) / durationSec : 0;
                        }
                        
                        barFillBackground = displayHPS > 0 ? `linear-gradient(90deg, transparent, ${roleColor})` : 'none';
                        value1 = `${formatStat((u.total_healing && u.total_healing.total) || 0)} (${formatStat(displayHPS)}/s)`;
                    }

                    return `<div class="lite-bar" data-lite="true" data-rank="${u.rank}">
                        <div class="lite-bar-fill" style="width: ${barFillWidth}%; background: ${barFillBackground};"></div>
                        <div class="lite-bar-content" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: center; padding: 0 8px;">
                            
                            <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                                <img class="lite-bar-icon" src="icons/${prof.icon}" alt="icon" style="width: 16px; height: 16px;" />
                                <span class="lite-bar-name" style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${nombre}</span>
                            </div>
                            <div class="lite-bar-values">
                                <span class="lite-bar-damage" style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${value1}</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
        } catch (err) {
            if (container) {
                container.innerHTML = '<div id="message-display">Connection Lost... do you have npcap installed?</div>';
            }
        } finally {
            updateWindowSize();
        }
    }

    setInterval(fetchDataAndRender, 50);
    fetchDataAndRender();
    updateLogsUI();

    document.addEventListener('DOMContentLoaded', () => {
        const debugTexts = [
            '# VSCode Visible Files',
            '# VSCode Open Tabs',
            '# Current Time',
            '# Context Window Usage',
            '# Current Mode'
        ];

        function removeDebugText() {
            const allElements = document.body.querySelectorAll('*');
            allElements.forEach(element => {
                debugTexts.forEach(debugText => {
                    if (element.textContent.includes(debugText)) {
                        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE && element.firstChild.textContent.includes(debugText)) {
                            element.remove();
                        } else {
                            Array.from(element.childNodes).forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(debugText)) {
                                    node.remove();
                                }
                            });
                        }
                    }
                });
            });

            Array.from(document.body.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    debugTexts.forEach(debugText => {
                        if (node.textContent.includes(debugText)) {
                            node.remove();
                        }
                    });
                }
            });
        }

        removeDebugText();
        setTimeout(removeDebugText, 500); // Reintentar después de 500ms
    });
