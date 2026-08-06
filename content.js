chrome.storage.local.get(['toolbarEnabled'], result => {
    if (result.toolbarEnabled !== true) return; 
    initFloatingBar(); 
});

function initFloatingBar() {
    
}

(function() {
    "use strict";

    const currentUrl = window.location.href;
    if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://') || currentUrl.includes('yjplughomesettle')) {
        return;
    }

    function loadAndInit() {
        if (!chrome.runtime?.id) return; 
        
        chrome.storage.local.get(['toolbarEnabled', 'toolbarVertical', 'barBottom', 'barLeft', 'barRadius', 'barOpacity', 'showHI', 'showDL', 'showNW', 'barHue'], function(res) {
            
            if (res.toolbarEnabled === false) {
                const existingBar = document.getElementById("custom-nav-toolbar");
                if (existingBar) existingBar.remove();
                return;
            }

            const attachWhenReady = () => {
                initToolbar(
                    res.barBottom || "20px", res.barLeft || "20px", res.barRadius || "50px", 
                    res.barOpacity || "0.98", res.showHI ?? true, res.showDL ?? false, 
                    res.showNW ?? false, res.toolbarVertical || false, 
                    res.barHue !== undefined ? res.barHue : -10 // -10 maps to White
                );
            };

            if (document.readyState === "complete" || document.readyState === "interactive") attachWhenReady();
            else document.addEventListener('DOMContentLoaded', attachWhenReady);
        });
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && (changes.toolbarEnabled || changes.toolbarVertical)) {
            loadAndInit();
        }
    });

    // Helper: Convert HSL to RGB to calculate accurate brightness
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; } 
        else {
            const hue2rgb = (p, q, t) => {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function initToolbar(savedBottom, savedLeft, savedRadius, savedOpacity, showHI, showDL, showNW, isVertical, savedHue) {
        const existingBar = document.getElementById("custom-nav-toolbar");
        if (existingBar) existingBar.remove();

        const toolbar = document.createElement("div");
        toolbar.id = "custom-nav-toolbar";
        
        const flexDirection = isVertical ? 'column' : 'row';
        const barWidth = isVertical ? '48px' : 'auto';
        const barHeight = isVertical ? 'auto' : '48px';
        const barPadding = isVertical ? '16px 0' : '0 16px';
        
        toolbar.style.cssText = `
            all: initial !important; position: fixed !important; 
            width: ${barWidth} !important; height: ${barHeight} !important;
            z-index: 2147483647 !important; backdrop-filter: blur(12px) !important; display: flex !important;
            flex-direction: ${flexDirection} !important;
            justify-content: center !important; align-items: center !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
            touch-action: none !important; 
            bottom: ${savedBottom} !important; left: ${savedLeft} !important; border-radius: ${savedRadius} !important;
            padding: ${barPadding} !important; gap: 12px !important; box-sizing: border-box !important;
            transform: translate3d(0,0,0) !important; backface-visibility: hidden !important; will-change: left, bottom !important;
            -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important;
            transition: none !important;
        `;

        const popupBottom = isVertical ? '0px' : '60px';
        const popupLeft = isVertical ? '60px' : '0px';

        const settingsPopup = document.createElement("div");
        settingsPopup.id = "nav-settings-popup";
        
        settingsPopup.style.cssText = `
            all: initial !important; position: absolute !important; bottom: ${popupBottom} !important; left: ${popupLeft} !important; 
            width: 260px !important; padding: 18px !important; border-radius: 20px !important; 
            box-shadow: 0 12px 36px rgba(0,0,0,0.25) !important; display: none !important; flex-direction: column !important; 
            gap: 14px !important; font-family: sans-serif !important; 
            z-index: 2147483648 !important; box-sizing: border-box !important; transform: translate3d(0,0,0) !important;
            -webkit-user-select: none !important; user-select: none !important;
            
            /* DYNAMIC CSS VARIABLES FOR AUTO-CONTRAST */
            --pop-text: #1a1c1e;
            --pop-text-muted: #4a5c4e;
            --pop-elem-bg: rgba(0,0,0,0.05);
            --pop-elem-bg-hover: rgba(0,0,0,0.1);
            --pop-primary: #1a73e8;
            --pop-divider: rgba(0,0,0,0.1);
        `;

        const createControlRow = (label, id, min, max, initial, step = 1) => {
            return `
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <label style="font-weight:600; font-size:12px; color:var(--pop-text-muted); letter-spacing:0.3px;">${label}</label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="step-btn tap-btn" data-id="${id}" data-step="-${step}">-</button>
                    <input type="range" id="${id}" class="custom-slider" min="${min}" max="${max}" step="${step}" value="${initial}">
                    <button class="step-btn tap-btn" data-id="${id}" data-step="${step}">+</button>
                </div>
            </div>`;
        };

        settingsPopup.innerHTML = `
            <style>
                #nav-settings-popup { color: var(--pop-text) !important; border: 1px solid var(--pop-divider) !important; }
                #nav-settings-popup .custom-slider {
                    -webkit-appearance: none; width: 100%; height: 6px; background: var(--pop-elem-bg); border-radius: 4px; outline: none; margin: 0;
                }
                #nav-settings-popup .color-slider {
                    -webkit-appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; margin: 0;
                    /* Added a white segment at the start for the default theme */
                    background: linear-gradient(to right, #ffffff 0%, #ffffff 5%, #f00 5%, #ff0 20%, #0f0 36%, #0ff 52%, #00f 68%, #f0f 84%, #f00 100%);
                }
                #nav-settings-popup .custom-slider::-webkit-slider-thumb, #nav-settings-popup .color-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--pop-primary);
                    cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                #nav-settings-popup .color-slider::-webkit-slider-thumb { background: #fff; border: 2px solid rgba(0,0,0,0.2); width:20px; height:20px; }
                #nav-settings-popup .custom-slider::-webkit-slider-thumb:active, #nav-settings-popup .color-slider::-webkit-slider-thumb:active {
                    transform: scale(1.3);
                }
                #nav-settings-popup .tap-btn {
                    width: 28px; height: 28px; border-radius: 8px; background: var(--pop-elem-bg); color: var(--pop-text); border: 1px solid var(--pop-divider); cursor: pointer; 
                    font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center; 
                    transition: background 0.2s, transform 0.1s; -webkit-tap-highlight-color: transparent;
                }
                #nav-settings-popup .tap-btn:active {
                    background: var(--pop-elem-bg-hover); transform: scale(0.9);
                }
                #nav-settings-popup .toggle-switch {
                    position: relative; display: inline-block; width: 38px; height: 22px; flex-shrink: 0;
                }
                #nav-settings-popup .toggle-switch input {
                    opacity: 0; width: 0; height: 0; margin: 0;
                }
                #nav-settings-popup .toggle-slider {
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: var(--pop-divider); transition: .3s cubic-bezier(0.25, 1, 0.5, 1); border-radius: 30px;
                }
                #nav-settings-popup .toggle-slider:before {
                    position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px;
                    background-color: white; transition: .3s cubic-bezier(0.25, 1, 0.5, 1); border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                #nav-settings-popup .toggle-switch input:checked + .toggle-slider { background-color: var(--pop-primary); }
                #nav-settings-popup .toggle-switch input:checked + .toggle-slider:before { transform: translateX(16px); }
            </style>
            
            <div style="font-weight:bold; border-bottom:1px solid var(--pop-divider); padding-bottom:8px; font-size:14px; color:var(--pop-text);">Toolbar Appearance</div>
            
            <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                <label style="font-weight:600; font-size:12px; color:var(--pop-text-muted); letter-spacing:0.3px;">Background Color</label>
                <input type="range" id="slide-hue" class="color-slider" min="-10" max="360" value="${savedHue}">
            </div>

            ${createControlRow("Horizontal Position", "slide-left", 0, window.innerWidth - 60, parseInt(savedLeft), 1)}
            ${createControlRow("Vertical Position", "slide-bottom", 0, 600, parseInt(savedBottom), 1)}
            ${createControlRow("Corner Roundness", "slide-radius", 0, 50, parseInt(savedRadius), 1)}
            ${createControlRow("Bar Opacity (%)", "slide-opacity", 10, 100, parseFloat(savedOpacity) * 100, 1)}
            
            <div style="background:var(--pop-elem-bg); padding:14px 12px; border-radius:16px; display:flex; flex-direction:column; gap:12px; color:var(--pop-text); border:1px solid var(--pop-divider); margin-top:4px;">
                <label style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600;">History <div class="toggle-switch"><input type="checkbox" id="check-hi" ${showHI ? 'checked' : ''}><span class="toggle-slider"></span></div></label>
                <label style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600;">Downloads <div class="toggle-switch"><input type="checkbox" id="check-dl" ${showDL ? 'checked' : ''}><span class="toggle-slider"></span></div></label>
                <label style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600;">New Window <div class="toggle-switch"><input type="checkbox" id="check-nw" ${showNW ? 'checked' : ''}><span class="toggle-slider"></span></div></label>
                <div style="height:1px; background:var(--pop-divider); margin:4px 0;"></div>
                <label style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; color:var(--pop-primary);">Vertical Layout <div class="toggle-switch"><input type="checkbox" id="check-vert" ${isVertical ? 'checked' : ''}><span class="toggle-slider"></span></div></label>
            </div>
            
            <button id="save-all" style="all:unset !important; display:block !important; background:var(--pop-primary) !important; color:white !important; padding:12px 0 !important; border-radius:12px !important; cursor:pointer !important; font-weight:bold !important; width:100% !important; text-align:center !important; font-size:13px !important; transition:filter 0.2s !important; margin-top:4px !important; -webkit-tap-highlight-color: transparent;">Apply & Save</button>
            
            <div style="font-size: 11px !important; color: var(--pop-text-muted) !important; text-align: center !important; margin-top: 12px !important; font-style: italic !important; font-family: sans-serif !important; line-height: 1.3 !important;">Press and hold the settings icon to move this floating bar.</div>
        `;
        toolbar.appendChild(settingsPopup);

        const iconConfig = [
            { id: "backward", svg: `<path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>`, show: true },
            { id: "forward", svg: `<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>`, show: true },
            { id: "reload", svg: `<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>`, show: true },
            { id: "history", svg: `<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>`, show: showHI },
            { id: "downloads", svg: `<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>`, show: showDL },
            { id: "new_window", svg: `<path d="M18 2H10c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14h-8V4h8v12zM6 4H4v14c0 1.1.9 2 2 2h12v-2H6V4z"/>`, show: showNW },
            { id: "settings", svg: `<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`, show: true }
        ];

        let isDragging = false;
        let longPressTimer;

        iconConfig.forEach(c => {
            if (!c.show) return;
            const btn = document.createElement("div");
            btn.className = "toolbar-icon-btn";
            btn.style.cssText = `all: initial; width:36px; height:36px; border-radius:10px; background:var(--pop-primary, #1a73e8); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2); flex-shrink:0; transition: transform 0.1s ease; -webkit-tap-highlight-color: transparent; pointer-events: auto;`;
            
            btn.innerHTML = `<svg viewBox="0 0 24 24" style="all:initial; display:block; width:20px; height:20px; fill:white; pointer-events:none;">${c.svg}</svg>`;

            if (c.id === "settings") {
                const startDrag = () => {
                    longPressTimer = setTimeout(() => { 
                        isDragging = true; toolbar.style.opacity = "0.6"; settingsPopup.style.setProperty('display', 'none', 'important'); 
                    }, 400);
                };
                
                const endDrag = () => {
                    clearTimeout(longPressTimer);
                    if (isDragging) {
                        isDragging = false; toolbar.style.opacity = "1";
                        chrome.storage.local.set({ barBottom: toolbar.style.bottom, barLeft: toolbar.style.left });
                    }
                };

                const moveDrag = (e) => {
                    if (isDragging) {
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                        
                        const x = Math.max(0, Math.min(clientX - (toolbar.offsetWidth / 2), window.innerWidth - toolbar.offsetWidth));
                        const y = Math.max(0, Math.min(window.innerHeight - clientY - 24, window.innerHeight - 60));
                        
                        toolbar.style.setProperty('transition', 'none', 'important');
                        toolbar.style.setProperty('left', x + "px", 'important');
                        toolbar.style.setProperty('bottom', y + "px", 'important');
                        e.preventDefault();
                    }
                };

                btn.addEventListener('touchstart', startDrag, { passive: true });
                btn.addEventListener('mousedown', startDrag);
                
                window.addEventListener('touchend', endDrag);
                window.addEventListener('mouseup', endDrag);
                
                window.addEventListener('touchmove', moveDrag, { passive: false });
                window.addEventListener('mousemove', moveDrag);
            }

            btn.onclick = (e) => {
                if (isDragging) return;
                e.stopPropagation();
                
                btn.style.transform = "scale(0.9)";
                setTimeout(() => { btn.style.transform = "scale(1)"; }, 100);

                if (c.id === "settings") {
                    const isHidden = window.getComputedStyle(settingsPopup).display === "none";
                    settingsPopup.style.setProperty('display', isHidden ? 'flex' : 'none', 'important');
                } else if (c.id === "reload") {
                    window.location.reload();
                } else {
                    chrome.runtime.sendMessage({ ask: c.id });
                }
            };
            toolbar.appendChild(btn);
        });

        document.addEventListener('click', (e) => {
            if (!toolbar.contains(e.target)) {
                settingsPopup.style.setProperty('display', 'none', 'important');
            }
        });

        const sl = settingsPopup.querySelector('#slide-left');
        const sb = settingsPopup.querySelector('#slide-bottom');
        const sr = settingsPopup.querySelector('#slide-radius');
        const so = settingsPopup.querySelector('#slide-opacity');
        const sh = settingsPopup.querySelector('#slide-hue');

        // Dynamic Color Logic handling pure white fallback
        const updateLive = () => { 
            const hue = parseInt(sh.value);
            let rgb;
            let isDark = false;
            
            if (hue < 0) {
                // Return pure white if slider is dragged all the way left
                rgb = [255, 255, 255];
                isDark = false;
            } else {
                rgb = hslToRgb(hue / 360, 0.6, 0.6); 
                const brightness = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000);
                isDark = brightness < 130;
            }
            
            // Update custom CSS variables for auto-contrast
            settingsPopup.style.setProperty('--pop-text', isDark ? '#ffffff' : '#1a1c1e');
            settingsPopup.style.setProperty('--pop-text-muted', isDark ? 'rgba(255,255,255,0.7)' : '#4a5c4e');
            settingsPopup.style.setProperty('--pop-elem-bg', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)');
            settingsPopup.style.setProperty('--pop-elem-bg-hover', isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)');
            settingsPopup.style.setProperty('--pop-primary', isDark ? '#a8c7fa' : '#1a73e8');
            settingsPopup.style.setProperty('--pop-divider', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)');
            
            // Apply to toolbar icons
            toolbar.querySelectorAll('.toolbar-icon-btn').forEach(b => {
                b.style.background = isDark ? '#a8c7fa' : '#1a73e8';
                b.querySelector('svg').style.fill = isDark ? '#1a1c1e' : '#ffffff';
            });

            // Apply layout adjustments
            toolbar.style.setProperty('transition', 'none', 'important');
            toolbar.style.setProperty('left', sl.value + "px", 'important'); 
            toolbar.style.setProperty('bottom', sb.value + "px", 'important'); 
            toolbar.style.setProperty('border-radius', sr.value + "px", 'important'); 
            toolbar.style.setProperty('border', `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, 'important'); 
            
            // Apply Background Color & Opacity
            toolbar.style.setProperty('background-color', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${so.value / 100})`, 'important'); 
            settingsPopup.style.setProperty('background-color', `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, 'important');
        };

        [sl, sb, sr, so, sh].forEach(i => i.oninput = updateLive);

        settingsPopup.querySelectorAll('.step-btn').forEach(b => { 
            b.onclick = (e) => { 
                e.stopPropagation(); 
                const t = settingsPopup.querySelector(`#${b.dataset.id}`); 
                t.value = parseFloat(t.value) + parseFloat(b.dataset.step); 
                updateLive(); 
            }; 
        });

        const saveBtn = settingsPopup.querySelector('#save-all');
        saveBtn.onmouseover = () => { saveBtn.style.setProperty('filter', 'brightness(0.9)', 'important'); };
        saveBtn.onmouseout = () => { saveBtn.style.setProperty('filter', 'brightness(1)', 'important'); };
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            chrome.storage.local.set({ 
                barBottom: toolbar.style.bottom, barLeft: toolbar.style.left, barRadius: toolbar.style.borderRadius, 
                barOpacity: (so.value / 100).toString(), barHue: sh.value,
                showHI: settingsPopup.querySelector('#check-hi').checked,
                showDL: settingsPopup.querySelector('#check-dl').checked, showNW: settingsPopup.querySelector('#check-nw').checked,
                toolbarVertical: settingsPopup.querySelector('#check-vert').checked
            }, () => { 
                loadAndInit(); 
            }); 
        };

        // Run once on load to establish correct colors
        updateLive();
        document.documentElement.appendChild(toolbar);
    }

    loadAndInit();
})();

