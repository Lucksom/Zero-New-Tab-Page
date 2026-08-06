function getActiveThemeFolder() {
    const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (localStorage.getItem('custom_weather_wallpaper') === 'true') {
        return isDarkOS ? 'light' : 'dark';
    }
    const savedColor = localStorage.getItem('custom_browser_color');
    if (savedColor) {
        const rgb = savedColor.split(',').map(Number);
        const brightness = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000);
        return brightness < 128 ? 'light' : 'dark';
    }
    return isDarkOS ? 'light' : 'dark';
}

window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
        const img = e.target;
        if (img.src.includes('icons/')) {
            if (!img.dataset.retried) {
                img.dataset.retried = 'true';
                let newSrc = img.src
                    .replace('_day.svg', '.svg')
                    .replace('_night.svg', '.svg');
                img.src = newSrc;
            } else if (img.dataset.retried === 'true') {
                img.dataset.retried = 'failed';
                img.src = `./icons/${getActiveThemeFolder()}/cloudy.svg`;
            }
        }
    }
}, true);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('custom_weather_wallpaper') === 'true') {
        updateUIContrast(0, 0, 0, true);
    } else {
        const savedColor = localStorage.getItem('custom_browser_color');
        if (savedColor) applyBackgroundStyle('solid', savedColor.split(','), true);
    }
    if (window.lastWeatherData) renderWeatherUI(window.lastWeatherData);
});

const css = (prop, val) => document.documentElement.style.setProperty(prop, val);
const rgbStr = (r, g, b) => `rgb(${r},${g},${b})`;
const hexToRgb = hex => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = '0x' + hex[1] + hex[1];
        g = '0x' + hex[2] + hex[2];
        b = '0x' + hex[3] + hex[3];
    } else {
        r = '0x' + hex[1] + hex[2];
        g = '0x' + hex[3] + hex[4];
        b = '0x' + hex[5] + hex[6];
    }
    return [+r, +g, +b];
};

function mixRgb(c1, c2, w) {
    return [
        Math.round(c1[0] * w + c2[0] * (1 - w)),
        Math.round(c1[1] * w + c2[1] * (1 - w)),
        Math.round(c1[2] * w + c2[2] * (1 - w))
    ];
}

function clamp(v, min = 0, max = 255) {
    return Math.max(min, Math.min(max, Math.round(v)));
}

function darken(rgb, amount) {
    return rgb.map(c => clamp(c * (1 - amount)));
}
function lighten(rgb, amount) {
    return rgb.map(c => clamp(c + (255 - c) * amount));
}

function updateUIContrast(r, g, b, isWallpaper) {
    const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let seed = [parseInt(r), parseInt(g), parseInt(b)];
    if (isWallpaper) {
        const saved = localStorage.getItem('custom_browser_color');
        seed = saved ? saved.split(',').map(Number) : [66, 133, 244];
    }

    const brightness = Math.round((seed[0] * 299 + seed[1] * 587 + seed[2] * 114) / 1000);
    const isDark = isWallpaper ? isDarkOS : brightness < 128;
    const isVeryLight = brightness > 230;

    let primary, onPrimary, primaryContainer, onPrimaryContainer;
    if (isDark) {
        primary          = lighten(seed, 0.55);
        onPrimary        = darken(seed, 0.65);
        primaryContainer = darken(seed, 0.30);
        onPrimaryContainer = lighten(seed, 0.80);
    } else {
        primary          = isVeryLight ? darken(seed, 0.40) : darken(seed, 0.10);
        onPrimary        = [255, 255, 255];
        primaryContainer = lighten(seed, 0.70);
        onPrimaryContainer = darken(seed, 0.45);
    }

    const secondary          = mixRgb(seed, isDark ? [160,165,185] : [90,95,115], 0.35);
    const onSecondary        = isDark ? darken(secondary, 0.60) : [255,255,255];
    const secondaryContainer = isDark ? darken(secondary, 0.35) : lighten(secondary, 0.70);
    const onSecondaryContainer = isDark ? lighten(secondary, 0.80) : darken(secondary, 0.45);

    let surface, surfaceVariant,
        containerLowest, containerLow, container, containerHigh, containerHighest,
        onSurface, onSurfaceVariant, outline, outlineVariant;

    if (isDark) {
        surface            = mixRgb(seed, [18,18,24], 0.12);
        surfaceVariant     = mixRgb(seed, [60,62,72], 0.25);
        containerLowest    = mixRgb(seed, [13,13,18], 0.10);
        containerLow       = mixRgb(seed, [22,23,30], 0.12);
        container          = mixRgb(seed, [28,29,38], 0.14);
        containerHigh      = mixRgb(seed, [36,38,48], 0.16);
        containerHighest   = mixRgb(seed, [44,46,58], 0.18);
        onSurface          = lighten(seed, 0.82);
        onSurfaceVariant   = lighten(seed, 0.55);
        outline            = mixRgb(seed, [140,142,155], 0.30);
        outlineVariant     = mixRgb(seed, [60,62,75], 0.30);
    } else if (isVeryLight) {
        surface            = [248,249,252];
        surfaceVariant     = [224,226,234];
        containerLowest    = [255,255,255];
        containerLow       = [244,245,250];
        container          = [238,239,246];
        containerHigh      = [232,233,242];
        containerHighest   = [226,227,236];
        onSurface          = [26,28,36];
        onSurfaceVariant   = [68,72,90];
        outline            = [112,116,135];
        outlineVariant     = [195,197,212];
    } else {
        surface            = lighten(seed, 0.92);
        surfaceVariant     = lighten(seed, 0.78);
        containerLowest    = [255,255,255];
        containerLow       = lighten(seed, 0.88);
        container          = lighten(seed, 0.82);
        containerHigh      = lighten(seed, 0.76);
        containerHighest   = lighten(seed, 0.70);
        onSurface          = darken(seed, 0.72);
        onSurfaceVariant   = darken(seed, 0.45);
        outline            = mixRgb(seed, [120,122,135], 0.30);
        outlineVariant     = lighten(seed, 0.60);
    }

    css('--md-sys-color-primary',                   rgbStr(...primary));
    css('--md-sys-color-on-primary',                rgbStr(...onPrimary));
    css('--md-sys-color-primary-container',         rgbStr(...primaryContainer));
    css('--md-sys-color-on-primary-container',      rgbStr(...onPrimaryContainer));
    css('--md-sys-color-secondary',                 rgbStr(...secondary));
    css('--md-sys-color-on-secondary',              rgbStr(...onSecondary));
    css('--md-sys-color-secondary-container',       rgbStr(...secondaryContainer));
    css('--md-sys-color-on-secondary-container',    rgbStr(...onSecondaryContainer));
    css('--md-sys-color-surface',                   rgbStr(...surface));
    css('--md-sys-color-on-surface',                rgbStr(...onSurface));
    css('--md-sys-color-surface-variant',           rgbStr(...surfaceVariant));
    css('--md-sys-color-on-surface-variant',        rgbStr(...onSurfaceVariant));
    css('--md-sys-color-surface-container-lowest',  rgbStr(...containerLowest));
    css('--md-sys-color-surface-container-low',     rgbStr(...containerLow));
    css('--md-sys-color-surface-container',         rgbStr(...container));
    css('--md-sys-color-surface-container-high',    rgbStr(...containerHigh));
    css('--md-sys-color-surface-container-highest', rgbStr(...containerHighest));
    css('--md-sys-color-outline',                   rgbStr(...outline));
    css('--md-sys-color-outline-variant',           rgbStr(...outlineVariant));
    css('--md-sys-color-background',                rgbStr(...surface));
    css('--md-sys-color-on-background',             rgbStr(...onSurface));

    const inverseSurface   = isDark ? lighten(seed, 0.85) : darken(seed, 0.70);
    const inverseOnSurface = isDark ? darken(seed, 0.70)  : lighten(seed, 0.85);
    css('--md-sys-color-inverse-surface',    rgbStr(...inverseSurface));
    css('--md-sys-color-inverse-on-surface', rgbStr(...inverseOnSurface));
    css('--md-sys-color-inverse-primary',    rgbStr(...primary));

    const tonalRgb = primary.join(',');
    css('--md-sys-elevation-tonal-1', `rgba(${tonalRgb},.05)`);
    css('--md-sys-elevation-tonal-2', `rgba(${tonalRgb},.08)`);
    css('--md-sys-elevation-tonal-3', `rgba(${tonalRgb},.11)`);
    css('--md-sys-elevation-tonal-4', `rgba(${tonalRgb},.12)`);
    css('--md-sys-elevation-tonal-5', `rgba(${tonalRgb},.14)`);
    css('--home-surface-rgb', containerHigh.join(','));

    if (isWallpaper) {
        const textRgb   = isDarkOS ? '255,255,255' : '20,20,30';
        const chipAlpha = isDarkOS ? '0.22' : '0.18';
        css('--home-surface-rgb', isDarkOS ? '0,0,0' : '255,255,255');
        css('--bar-alpha',        chipAlpha);
        css('--md-sys-color-on-surface',         isDarkOS ? '#ffffff' : '#14141e');
        css('--md-sys-color-on-surface-variant',  isDarkOS ? 'rgba(255,255,255,.75)' : 'rgba(20,20,30,.75)');
        css('--md-sys-color-outline-variant',      isDarkOS ? 'rgba(255,255,255,.25)' : 'rgba(20,20,30,.18)');
    } else {
        const savedAlpha = localStorage.getItem('shape_alpha');
        css('--bar-alpha', savedAlpha !== null ? savedAlpha / 100 : 1);
    }
}

const bgLayer      = document.getElementById('bgLayer');
const wpFileInput  = document.getElementById('wpFileInput');
const defaultColor = [102, 187, 106]; 

function applyBackgroundStyle(type, value, isInit = false) {
    if (!bgLayer) return;

    if (type !== 'weather' && !isInit) {
        localStorage.removeItem('custom_browser_wallpaper');
        localStorage.removeItem('custom_browser_color');
        localStorage.removeItem('custom_browser_gradient');
        localStorage.setItem('custom_weather_wallpaper', 'false');
        const wwToggle = document.getElementById('weatherWallpaperToggle');
        if (wwToggle) wwToggle.checked = false;
    }

    if (type === 'solid') {
        const rgb = value.map(Number);
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        if (!isNaN(rgb[0])) {
            if (!isInit) localStorage.setItem('custom_browser_color', rgb.join(','));
            updateUIContrast(rgb[0], rgb[1], rgb[2], false);
        }
    } else if (type === 'gradient') {
        bgLayer.style.backgroundImage  = value;
        bgLayer.style.backgroundColor  = 'transparent';
        if (!isInit) localStorage.setItem('custom_browser_gradient', value);
        updateUIContrast(0, 0, 0, true);
    } else if (type === 'wallpaper') {
        bgLayer.style.backgroundImage  = `url(${value})`;
        bgLayer.style.backgroundColor  = 'transparent';
        if (!isInit) localStorage.setItem('custom_browser_wallpaper', value);
        updateUIContrast(0, 0, 0, true);
    } else if (type === 'weather') {
        bgLayer.style.backgroundImage  = `url(${value})`;
        bgLayer.style.backgroundColor  = 'transparent';
        updateUIContrast(0, 0, 0, true);
    }
}

const savedWallpaper = localStorage.getItem('custom_browser_wallpaper');
const savedGradient  = localStorage.getItem('custom_browser_gradient');
const savedColor     = localStorage.getItem('custom_browser_color');

if      (savedWallpaper) applyBackgroundStyle('wallpaper', savedWallpaper, true);
else if (savedGradient)  applyBackgroundStyle('gradient',  savedGradient,  true);
else if (savedColor)     applyBackgroundStyle('solid',     savedColor.split(','), true);
else                     applyBackgroundStyle('solid',     defaultColor,   true);

let bgMenusBuilt = false;
function buildBackgroundMenus() {
    if (bgMenusBuilt) return;
    
    document.querySelectorAll('.bg-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelectorAll('.bg-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('colorGrid').style.display    = 'none';
            document.getElementById('gradientGrid').style.display = 'none';
            const target = document.getElementById(tab.getAttribute('data-target'));
            if (target) target.style.display = 'grid';
        });
    });

    const colorGrid = document.getElementById('colorGrid');
    const palette = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
      '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B',
      '#EF9A9A', '#F48FB1', '#CE93D8', '#B39DDB', '#9FA8DA', '#90CAF9',
      '#80DEEA', '#80CBC4', '#A5D6A7', '#C5E1A5', '#E6EE9C', '#FFE082',
      '#FFCC80', '#FFAB91', '#BCAAA4', '#B2DFDB', '#F8BBD0', '#E1BEE7',
      '#B71C1C', '#880E4F', '#4A148C', '#1A237E', '#006064', '#1B5E20',
      '#33691E', '#E65100', '#4E342E', '#263238', '#212121', '#37474F'
    ];

    if (colorGrid) {
        palette.forEach(hex => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch tap-anim';
            swatch.style.backgroundColor = hex;
            swatch.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                
                applyBackgroundStyle('solid', hexToRgb(hex));
            });
            colorGrid.appendChild(swatch);
        });
    }

    const gradientGrid    = document.getElementById('gradientGrid');
    const gradientPalette = [
        'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
        'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
        'linear-gradient(135deg,#84fab0,#8fd3f4)',
        'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
        'linear-gradient(135deg,#ffecd2,#fcb69f)',
        'linear-gradient(135deg,#cfd9df,#e2ebf0)',
        'linear-gradient(135deg,#667eea,#764ba2)',
        'linear-gradient(135deg,#ff9a9e,#fecfef)',
        'linear-gradient(135deg,#f6d365,#fda085)',
        'linear-gradient(135deg,#12c2e9,#c471ed 50%,#f64f59)',
        'linear-gradient(135deg,#43e97b,#38f9d7)',
        'linear-gradient(135deg,#fa709a,#fee140)',
        'linear-gradient(135deg,#0ba360,#3cba92)',
        'linear-gradient(135deg,#ff0844,#ffb199)',
        'linear-gradient(135deg,#89f7fe,#66a6ff)',
        'linear-gradient(135deg,#fccb90,#d57eeb)',
        'linear-gradient(135deg,#4facfe,#00f2fe)',
        'linear-gradient(135deg,#ff758c,#ff7eb3)',
        'linear-gradient(135deg,#868f96,#596164)',
        'linear-gradient(135deg,#c79081,#dfa579)',
        'linear-gradient(135deg,#29323c,#485563)',
        'linear-gradient(135deg,#1e3c72,#2a5298)',
        'linear-gradient(135deg,#B7F8DB,#50A7C2)',
        'linear-gradient(135deg,#FF9A9E,#FECFEF)'
    ];

    if (gradientGrid) {
        gradientPalette.forEach(grad => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch tap-anim';
            swatch.style.background = grad;
            swatch.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                applyBackgroundStyle('gradient', grad);
            });
            gradientGrid.appendChild(swatch);
        });
    }
    bgMenusBuilt = true;
}

let isDraggingSV = false, isDraggingHue = false;
let customHue = 0.33, customSat = 1, customVal = 0.5;

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6), f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r=v; g=t; b=p; break; case 1: r=q; g=v; b=p; break;
        case 2: r=p; g=v; b=t; break; case 3: r=p; g=q; b=v; break;
        case 4: r=t; g=p; b=v; break; case 5: r=v; g=p; b=q; break;
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

const rgbToHex = (r, g, b) => '#' + (1<<24|r<<16|g<<8|b).toString(16).slice(1);

function updateCustomColor() {
    const pureHue = hsvToRgb(customHue, 1, 1);
    const svArea  = document.getElementById('svArea');
    if (svArea) svArea.style.backgroundColor = `rgb(${pureHue.join(',')})`;
    const finalRgb = hsvToRgb(customHue, customSat, customVal);
    const hex      = rgbToHex(...finalRgb);
    const cpPreview = document.getElementById('cpPreview');
    const cpHex     = document.getElementById('cpHex');
    if (cpPreview) cpPreview.style.backgroundColor = hex;
    if (cpHex)     cpHex.value = hex;
}

const svArea = document.getElementById('svArea');
const updateSV = e => {
    if (!svArea) return;
    const rect = svArea.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    customSat = Math.max(0, Math.min((cx - rect.left) / rect.width, 1));
    customVal = 1 - Math.max(0, Math.min((cy - rect.top) / rect.height, 1));
    const svCursor = document.getElementById('svCursor');
    if (svCursor) { svCursor.style.left = `${customSat*100}%`; svCursor.style.top = `${(1-customVal)*100}%`; }
    updateCustomColor();
};

const hueArea = document.getElementById('hueArea');
const updateHue = e => {
    if (!hueArea) return;
    const rect = hueArea.getBoundingClientRect();
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    customHue  = Math.max(0, Math.min((cy - rect.top) / rect.height, 1));
    const hueCursor = document.getElementById('hueCursor');
    if (hueCursor) hueCursor.style.top = `${customHue*100}%`;
    updateCustomColor();
};

if (svArea) {
    svArea.addEventListener('mousedown',  e => { isDraggingSV = true;  updateSV(e); });
    svArea.addEventListener('touchstart', e => { isDraggingSV = true;  updateSV(e); }, { passive: true });
}
if (hueArea) {
    hueArea.addEventListener('mousedown',  e => { isDraggingHue = true; updateHue(e); });
    hueArea.addEventListener('touchstart', e => { isDraggingHue = true; updateHue(e); }, { passive: true });
}
window.addEventListener('mousemove', e => { if (isDraggingSV) updateSV(e); if (isDraggingHue) updateHue(e); });
window.addEventListener('touchmove', e => { if (isDraggingSV) updateSV(e); if (isDraggingHue) updateHue(e); }, { passive: true });
window.addEventListener('mouseup',   () => { isDraggingSV = false; isDraggingHue = false; });
window.addEventListener('touchend',  () => { isDraggingSV = false; isDraggingHue = false; });

const wpModal = document.getElementById('wallpaperModal');
document.querySelectorAll('#wpGrid img.wp-item').forEach(img => {
    img.addEventListener('click', e => {
        e.stopPropagation();
        applyBackgroundStyle('wallpaper', img.src.replace('w=400', 'w=1920'));
        if (wpModal) wpModal.classList.remove('visible');
    });
});

const uploadWpBtn = document.getElementById('uploadWpBtn');
if (uploadWpBtn && wpFileInput) uploadWpBtn.addEventListener('click', e => { e.stopPropagation(); wpFileInput.click(); });

if (wpFileInput) {
    wpFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx    = canvas.getContext('2d');
                const MAX    = 1920;
                let { width, height } = img;
                if (width > height && width > MAX) { height = height * MAX / width; width = MAX; }
                else if (height > MAX)             { width  = width  * MAX / height; height = MAX; }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                applyBackgroundStyle('wallpaper', canvas.toDataURL('image/jpeg', 0.80));
                if (wpModal) wpModal.classList.remove('visible');
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
}

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WD     = ['M','T','W','T','F','S','S'];
const WD_JS  = [1,2,3,4,5,6,0]; 

function updateDateChip() {
    if (localStorage.getItem('hide_date_widget') === 'true') return;

    const d  = new Date();
    const el = id => document.getElementById(id);
    if (el('dateNum'))   el('dateNum').textContent   = d.getDate();
    if (el('dateMonth')) el('dateMonth').textContent = MONTHS[d.getMonth()];
    if (el('dateDay'))   el('dateDay').textContent   = DAYS[d.getDay()];
    const strip = el('weekdayStrip');
    if (strip) {
        strip.innerHTML = '';
        WD.forEach((label, i) => {
            const div = document.createElement('div');
            div.className = 'wd' + (WD_JS[i] === d.getDay() ? ' today' : '');
            div.textContent = label;
            strip.appendChild(div);
        });
    }
}
updateDateChip();

const widgetRow  = document.getElementById('widgetContainerRow');
const savedAlign = localStorage.getItem('custom_widget_align') || 'center';

function applyWidgetAlign(mode) {
    if (!widgetRow) return;
    widgetRow.classList.remove('align-left','align-center','align-right');
    widgetRow.classList.add(`align-${mode}`);
    document.querySelectorAll('#widgetAlignmentContainer .segmented-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === mode);
    });
    localStorage.setItem('custom_widget_align', mode);
}

document.querySelectorAll('#widgetAlignmentContainer .segmented-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); applyWidgetAlign(btn.dataset.align); });
});
applyWidgetAlign(savedAlign);

const weatherModal            = document.getElementById('weatherModal');
const weatherWidget           = document.getElementById('weatherWidget');
const cancelWeatherBtn        = document.getElementById('cancelWeatherBtn');
const saveWeatherBtn          = document.getElementById('saveWeatherBtn');
const cityInput               = document.getElementById('cityInput');
const citySuggestions         = document.getElementById('citySuggestions');
const weatherTemp             = document.getElementById('weatherTemp');
const weatherCity             = document.getElementById('weatherCity');
const weatherIconContainer    = document.getElementById('weatherIconContainer');
const hourlyForecastContainer = document.getElementById('hourlyForecast');

if (weatherWidget && weatherModal) {
    weatherWidget.addEventListener('click', e => {
        e.stopPropagation();
        weatherModal.classList.add('visible');
        if (cityInput) cityInput.value = localStorage.getItem('custom_weather_city') || '';
        if (citySuggestions) citySuggestions.style.display = 'none';
        if (cityInput) cityInput.focus();
    });
}

if (cancelWeatherBtn) cancelWeatherBtn.addEventListener('click', e => {
    e.stopPropagation(); weatherModal.classList.remove('visible');
});

let cityDebounce;
if (cityInput) {
    cityInput.addEventListener('input', () => {
        clearTimeout(cityDebounce);
        const q = cityInput.value.trim();
        if (!q) { citySuggestions.style.display = 'none'; return; }
        cityDebounce = setTimeout(async () => {
            try {
                const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`);
                const data = await res.json();
                citySuggestions.innerHTML = '';
                if (data.results?.length) {
                    data.results.forEach(city => {
                        const div = document.createElement('div');
                        div.className = 'city-suggestion-item tap-anim';
                        div.textContent = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}${city.country ? ', ' + city.country : ''}`;
                        div.addEventListener('click', e => {
                            e.stopPropagation();
                            cityInput.value = city.name;
                            localStorage.setItem('custom_weather_city', city.name);
                            localStorage.setItem('custom_weather_lat',  city.latitude);
                            localStorage.setItem('custom_weather_lon',  city.longitude);
                            
                            localStorage.removeItem('weather_cached_data');
                            localStorage.removeItem('weather_cached_hour');

                            citySuggestions.style.display = 'none';
                            
                            loadWeather();
                            const weatherModal = document.getElementById('weatherModal');
                            if (weatherModal) weatherModal.classList.remove('visible');
                        });
                        citySuggestions.appendChild(div);
                    });
                    citySuggestions.style.display = 'flex';
                } else {
                    citySuggestions.style.display = 'none';
                }
            } catch { citySuggestions.style.display = 'none'; }
        }, 300);
    });
}

document.addEventListener('click', e => {
    if (citySuggestions && !citySuggestions.contains(e.target) && e.target !== cityInput) {
        citySuggestions.style.display = 'none';
    }
});

function getWeatherBackground(wmo, isNight) {
    const bgs = {
        clearDay:         ['sunny_clear_sky_day_01.jpg','sunny_clear_sky_day_02.jpg','sunny_clear_sky_day_03.jpg','sunny_clear_sky_day_04.jpg','sunny_clear_sky_day_05.jpg','sunny_clear_sky_day_06.jpg','sunny_clear_sky_day_07.jpg'],
        clearNight:       ['clear_sky_night_01.jpg','clear_sky_night_02.jpg','clear_sky_night_03.jpg','clear_sky_night_04.jpg','clear_sky_night_05.jpg'],
        mostlyClearNight: ['mostly_clear_night_01.jpg','mostly_clear_night_02.jpg','mostly_clear_night_03.jpg'],
        partlyCloudyDay:  ['partly_cloudy_day_01.jpg','partly_cloudy_day_02.jpg','partly_cloudy_day_03.jpg','partly_cloudy_day_04.jpg','partly_cloudy_day_05.jpg'],
        partlyCloudyNight:['partly_cloudy_night_01.jpg','partly_cloudy_night_02.jpg','partly_cloudy_night_03.jpg'],
        mostlyCloudyDay:  ['mostly_cloudy_day_01.jpg','mostly_cloudy_day_02.jpg','mostly_cloudy_day_03.jpg','overcast_cloudy_day_01.jpg','overcast_cloudy_day_02.jpg','overcast_cloudy_day_03.jpg'],
        mostlyCloudyNight:['mostly_cloudy_night_01.jpg','mostly_cloudy_night_02.jpg','mostly_cloudy_night_03.jpg'],
        fog:   ['foggy_01.jpg'],
        rain:  ['rainy_01.jpg','rainy_02.jpg','rainy_03.jpg','rainy_04.jpg','rainy_05.jpg','rainy_06.jpg'],
        snow:  ['snowy_01.jpg','snowy_02.jpg','snowy_03.jpg','snowy_04.jpg'],
        storm: ['thunderstorm_lightning_01.jpg','hail_storm_01.jpg','hail_storm_02.jpg']
    };
    let pool = bgs.clearDay;
    switch (wmo) {
        case 0:  pool = isNight ? bgs.clearNight        : bgs.clearDay;         break;
        case 1:  pool = isNight ? bgs.mostlyClearNight  : bgs.clearDay;         break;
        case 2:  pool = isNight ? bgs.partlyCloudyNight : bgs.partlyCloudyDay;  break;
        case 3:  pool = isNight ? bgs.mostlyCloudyNight : bgs.mostlyCloudyDay;  break;
        case 45: case 48: pool = bgs.fog;   break;
        case 51: case 53: case 55: case 56: case 57:
        case 61: case 63: case 65: case 66: case 67:
        case 80: case 81: case 82: pool = bgs.rain;  break;
        case 71: case 73: case 75: case 77: case 85: case 86: pool = bgs.snow;  break;
        case 95: case 96: case 99: pool = bgs.storm; break;
        default: pool = isNight ? bgs.mostlyCloudyNight : bgs.mostlyCloudyDay;
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function getWeatherDescription(wmo) {
    const desc = {
        0:'Clear', 1:'Mostly Clear', 2:'Partly Cloudy', 3:'Cloudy',
        45:'Foggy', 48:'Icy Fog', 51:'Light Drizzle', 53:'Drizzle', 55:'Heavy Drizzle',
        56:'Frz. Drizzle', 57:'Heavy Frz. Drizzle', 61:'Light Rain', 63:'Rain', 65:'Heavy Rain',
        66:'Frz. Rain', 67:'Heavy Frz. Rain', 71:'Light Snow', 73:'Snow', 75:'Heavy Snow',
        77:'Snow Grains', 80:'Showers', 81:'Heavy Showers', 82:'Violent Showers',
        85:'Snow Showers', 86:'Heavy Snow Showers', 95:'T-Storm', 96:'T-Storm+Hail', 99:'Heavy T-Storm'
    };
    return desc[wmo] || 'Unknown';
}

function getLocalSet4IconName(wmo) {
    const map = {
        0:'clear_sky', 1:'mainly_clear', 2:'partly_cloudy', 3:'overcast',
        45:'fog', 48:'rime_fog', 51:'drizzle_light', 53:'drizzle_moderate', 55:'drizzle_dense',
        56:'freezing_drizzle_light', 57:'freezing_drizzle_dense',
        61:'rain_slight', 63:'rain_moderate', 65:'rain_heavy',
        66:'freezing_rain_light', 67:'freezing_rain_heavy',
        71:'snow_slight', 73:'snow_moderate', 75:'snow_heavy', 77:'snow_grains',
        80:'rain_showers_slight', 81:'rain_showers_moderate', 82:'rain_showers_violent',
        85:'snow_showers_slight', 86:'snow_showers_heavy',
        95:'thunderstorm', 96:'thunderstorm_slight_hail', 99:'thunderstorm_heavy_hail'
    };
    return map[wmo] || 'clear_sky';
}

function renderWeatherUI(data) {
    if (!data) return;
    window.lastWeatherData = data;

    const temp       = Math.round(data.current_weather.temperature);
    const code       = data.current_weather.weathercode;
    const isNight    = data.current_weather.is_day === 0;
    const folder     = isNight ? 'dark' : 'light';

    if (data.current_weather.time) {
        const dateStr = data.current_weather.time.split('T')[0];
        const dateObj = new Date(`${dateStr}T12:00:00Z`);
        const el = id => document.getElementById(id);
        if (el('dateNum'))   el('dateNum').textContent   = dateObj.getUTCDate();
        if (el('dateMonth')) el('dateMonth').textContent = MONTHS[dateObj.getUTCMonth()];
        if (el('dateDay'))   el('dateDay').textContent   = DAYS[dateObj.getUTCDay()];
        const strip = el('weekdayStrip');
        if (strip) {
            strip.innerHTML = '';
            WD.forEach((label, i) => {
                const div = document.createElement('div');
                div.className = 'wd' + (WD_JS[i] === dateObj.getUTCDay() ? ' today' : '');
                div.textContent = label;
                strip.appendChild(div);
            });
        }
    }

    if (weatherTemp) weatherTemp.textContent = `${temp}°`;

    if (localStorage.getItem('custom_weather_wallpaper') === 'true') {
        applyBackgroundStyle('weather', `./weather_compressed/${getWeatherBackground(code, isNight)}`);
    }

    if (weatherIconContainer) {
        const iconName  = getLocalSet4IconName(code);
        const condition = getWeatherDescription(code);
        weatherIconContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;">
                <img src="./icons/${folder}/${iconName}.svg"
                     style="flex:1;min-height:0;width:100%;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.18));"
                     alt="${condition}">
                <span style="font-size:11px;font-weight:600;opacity:.85;margin-top:4px;text-align:center;line-height:1.1;color:var(--md-sys-color-on-surface);">${condition}</span>
            </div>`;
    }

    if (hourlyForecastContainer && data.hourly && data.current_weather) {
        const prefix = data.current_weather.time.substring(0, 13);
        let idx = data.hourly.time.findIndex(t => t.startsWith(prefix));
        if (idx === -1) idx = 0;
        let html = '';
        for (let i = 1; i <= 4; i++) {
            const ti = idx + i;
            if (ti >= data.hourly.time.length) continue;
            let h = parseInt(data.hourly.time[ti].substring(11, 13), 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const fTemp   = Math.round(data.hourly.temperature_2m[ti]);
            const fCode   = data.hourly.weathercode[ti];
            const fNight  = data.hourly.is_day[ti] === 0;
            const fFolder = fNight ? 'dark' : 'light';
            const icon    = getLocalSet4IconName(fCode);
            html += `
                <div class="hf-chip">
                    <span class="hf-time">${h}${ampm}</span>
                    <span class="hf-icon" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
                        <img src="./icons/${fFolder}/${icon}.svg"
                             style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12));"
                             alt="">
                    </span>
                    <span class="hf-temp">${fTemp}°</span>
                </div>`;
        }
        hourlyForecastContainer.innerHTML = html;
    }
}

async function loadWeather() {
    if (localStorage.getItem('hide_weather_widget') === 'true') return;
    const city = localStorage.getItem('custom_weather_city');
    const lat  = localStorage.getItem('custom_weather_lat');
    const lon  = localStorage.getItem('custom_weather_lon');

    if (!city || !lat || !lon) {
        if (weatherTemp) weatherTemp.textContent = '--°';
        if (weatherCity) weatherCity.textContent = 'Set City';
        const folder = getActiveThemeFolder();
        if (weatherIconContainer) {
            weatherIconContainer.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;">
                    <img src="./icons/${folder}/cloudy.svg"
                         style="flex:1;min-height:0;width:100%;object-fit:contain;opacity:.45;"
                         alt="No location set">
                    <span style="font-size:11px;font-weight:600;opacity:.45;margin-top:4px;color:var(--md-sys-color-on-surface);">Unknown</span>
                </div>`;
        }
        if (hourlyForecastContainer) hourlyForecastContainer.innerHTML = '';
        return;
    }

    if (weatherCity) weatherCity.textContent = city;

    let cachedData = null;
    try { cachedData = JSON.parse(localStorage.getItem('weather_cached_data')); } catch(e){}
    const cachedHourKey = localStorage.getItem('weather_cached_hour');

    let currentCityHour = new Date().getHours(); 
    if (cachedData && cachedData.utc_offset_seconds !== undefined) {
        const utcMillis = Date.now() + (new Date().getTimezoneOffset() * 60000);
        const cityDate = new Date(utcMillis + (cachedData.utc_offset_seconds * 1000));
        currentCityHour = cityDate.getHours(); 
    }
    const currentHourKey = `Hour-${currentCityHour}`;

    let isFreshLaunch = false;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        const sessionRes = await chrome.storage.session.get(['weather_session_started']);
        if (!sessionRes.weather_session_started) {
            isFreshLaunch = true;
            await chrome.storage.session.set({ 'weather_session_started': true });
        }
    } else {
        if (!sessionStorage.getItem('weather_session_started')) {
            isFreshLaunch = true;
            sessionStorage.setItem('weather_session_started', 'true');
        }
    }

    if (cachedData && cachedHourKey === currentHourKey && !isFreshLaunch) {
        renderWeatherUI(cachedData);
        return;
    }

    if (weatherTemp) weatherTemp.textContent = '…';
    try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 6000);
        const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,is_day&timezone=auto&forecast_days=2`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
            const data = await res.json();
            
            const utcMillis = Date.now() + (new Date().getTimezoneOffset() * 60000);
            const freshCityDate = new Date(utcMillis + (data.utc_offset_seconds * 1000));
            
            localStorage.setItem('weather_cached_data', JSON.stringify(data));
            localStorage.setItem('weather_cached_hour', `Hour-${freshCityDate.getHours()}`);
            
            renderWeatherUI(data);
        }
    } catch {
        if (cachedData) renderWeatherUI(cachedData); 
        else if (weatherTemp) weatherTemp.textContent = 'Err';
    }
}

setTimeout(() => loadWeather(), 100);

if (saveWeatherBtn && weatherModal) {
    saveWeatherBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const newCity = cityInput?.value.trim();
        if (newCity) {
            if (newCity !== localStorage.getItem('custom_weather_city')) {
                if (weatherCity) weatherCity.textContent = 'Searching…';
                try {
                    const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newCity)}&count=1&language=en&format=json`);
                    const data = await res.json();
                    if (data.results?.length) {
                        localStorage.setItem('custom_weather_city', data.results[0].name);
                        localStorage.setItem('custom_weather_lat',  data.results[0].latitude);
                        localStorage.setItem('custom_weather_lon',  data.results[0].longitude);
                    } else {
                        localStorage.setItem('custom_weather_city', newCity);
                    }
                    localStorage.removeItem('weather_cached_data');
                    localStorage.removeItem('weather_cached_hour');
                } catch { }
            }
            loadWeather();
        }
        weatherModal.classList.remove('visible');
    });
}

async function getCachedImage(url) {
    if (!url || url.startsWith('data:')) return url; 
    
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('icon_cache') || '{}'); } catch(e){}
    if (cache[url]) return cache[url];

    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
        cache[url] = base64; 
        try { localStorage.setItem('icon_cache', JSON.stringify(cache)); } catch(e){} 
        return base64;
    } catch (e) {
        return url; 
    }
}

let activeEngine = { name: 'Google', url: 'https://www.google.com/search?q=%s' };
let activeEngine2 = { name: 'Yandex', url: 'https://yandex.com/search/?text=%s&lang=en' };
let dynamicTargetBtn = 1;

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['custom_search_engine', 'custom_search_engine_2'], result => {
        if (result.custom_search_engine) activeEngine = result.custom_search_engine;
        if (result.custom_search_engine_2) activeEngine2 = result.custom_search_engine_2;
        
        if (logoBtn) applyEngineVisuals(activeEngine, logoBtn);
        if (logoBtn2) applyEngineVisuals(activeEngine2, logoBtn2);
    });
} else {
    try {
        const saved = localStorage.getItem('custom_search_engine');
        if (saved) activeEngine = JSON.parse(saved);
        const saved2 = localStorage.getItem('custom_search_engine_2');
        if (saved2) activeEngine2 = JSON.parse(saved2);
    } catch { }
}

const searchInput   = document.getElementById('searchInput');
const suggestionsBox= document.getElementById('suggestionsBox');
const logoBtn       = document.getElementById('engineLogoBtn');
const logoBtn2      = document.getElementById('engineLogoBtn2');
const form          = document.getElementById('searchForm');
const selectorPanel = document.getElementById('engineSelector');
const customPanel   = document.getElementById('customPanel');
const lensBtn       = document.getElementById('lensBtn');
const geminiBtn     = document.getElementById('geminiBtn');
const mainSearchSubmitBtn = document.getElementById('mainSearchSubmitBtn');
const lensFileInput = document.getElementById('lensFileInput');
const lensForm      = document.getElementById('lensForm');

async function applyEngineVisuals(engine, btnInstance = logoBtn) {
    if (!btnInstance) return;
    
    btnInstance.style.padding = '';
    btnInstance.style.overflow = '';
    
    const existingOpt = document.querySelector(`.engine-option[data-name="${engine.name}"]`);
    
    if (existingOpt) {
        btnInstance.innerHTML = existingOpt.querySelector('.icon-circle').innerHTML;
        const mainSvg = btnInstance.querySelector('svg'); 
        if (mainSvg) { 
            mainSvg.setAttribute('width', '36'); 
            mainSvg.setAttribute('height', '36'); 
        }
    } else {
        try {
            const domain = new URL(engine.url).hostname;
            const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            const finalSrc = await getCachedImage(iconUrl); 
            btnInstance.innerHTML = `<img src="${finalSrc}" alt="${engine.name} icon" style="width:36px; height:36px; border-radius:50%; object-fit:contain;">`;
        } catch {
            btnInstance.innerHTML = `<span style="width:36px; height:36px; border-radius:50%; background:var(--md-sys-color-primary); color:var(--md-sys-color-on-primary); font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center;">${engine.name[0].toUpperCase()}</span>`;
        }
    }

    const isDual = localStorage.getItem('custom_dual_engine') === 'true';
    if (searchInput) {
        searchInput.placeholder = isDual 
            ? `Search with ${activeEngine.name} or ${activeEngine2.name}…` 
            : `Search with ${activeEngine.name}…`;
    }
    
    const isGoogle = activeEngine.name.trim().toLowerCase() === 'google';
    if (lensBtn) lensBtn.style.display = (isGoogle && !isDual) ? 'flex' : 'none';
    if (geminiBtn) geminiBtn.style.display = (isGoogle && !isDual) ? 'flex' : 'none';
}

const dualEngineToggle = document.getElementById('dualEngineToggle');
if (dualEngineToggle) {
    const isDual = localStorage.getItem('custom_dual_engine') === 'true';
    dualEngineToggle.checked = isDual;
    
    const toggleDualMode = (on) => {
        if (form) form.classList.toggle('dual-mode-active', on);
        if (logoBtn2) logoBtn2.style.display = on ? 'flex' : 'none';
        if (mainSearchSubmitBtn) mainSearchSubmitBtn.style.display = on ? 'none' : 'flex';
        localStorage.setItem('custom_dual_engine', on);
        applyEngineVisuals(activeEngine, logoBtn); 
    };
    toggleDualMode(isDual);
    dualEngineToggle.addEventListener('change', e => toggleDualMode(e.target.checked));
    bindRowToggle('rowDualEngine', 'dualEngineToggle');
}

setTimeout(() => {
    applyEngineVisuals(activeEngine, logoBtn);
    applyEngineVisuals(activeEngine2, logoBtn2);
}, 50);

if (lensBtn) lensBtn.addEventListener('click', e => { e.stopPropagation(); lensFileInput?.click(); });
if (lensFileInput) lensFileInput.addEventListener('change', () => {
    if (lensFileInput.files?.length) { lensForm?.submit(); setTimeout(() => lensForm?.reset(), 1000); }
});
if (geminiBtn) geminiBtn.addEventListener('click', e => {
    e.stopPropagation();
    const q = searchInput?.value.trim();
    window.open(q ? `https://gemini.google.com/app?q=${encodeURIComponent(q)}` : 'https://gemini.google.com/app', '_blank');
});

let debounceTimer;
window.handleSuggestions = function (data) {
    const suggestions = data[1] ? data[1].slice(0, 5) : [];
    if (suggestionsBox) suggestionsBox.innerHTML = '';
    if (suggestions?.length && suggestionsBox) {
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'suggestion-item tap-anim';
            div.textContent = s;
            div.setAttribute('role', 'option');
            div.addEventListener('click', e => {
                e.stopPropagation();
                if (searchInput) searchInput.value = s;
                suggestionsBox.style.display = 'none';
                if (localStorage.getItem('custom_auto_search') === 'true') {
                    window.location.href = activeEngine.url.replace('%s', encodeURIComponent(s));
                } else {
                    searchInput?.focus();
                }
            });
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = 'flex';
    } else if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
    }
};

if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = searchInput.value.trim();
        if (!q) { if (suggestionsBox) suggestionsBox.style.display = 'none'; return; }
        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`);
                if (res.ok) window.handleSuggestions(await res.json());
            } catch { }
        }, 200);
    });
}

if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput?.value.trim();
    if (q) {
        const isDual = localStorage.getItem('custom_dual_engine') === 'true';
        
        const targetEngine = isDual ? activeEngine2 : activeEngine;
        
        window.location.href = targetEngine.url.replace('%s', encodeURIComponent(q));
    }
});

[logoBtn, logoBtn2].forEach((btn, idx) => {
    if (!btn) return;
    
    let pressStartTime = 0;
    const markPressStart = () => { pressStartTime = Date.now(); };
    btn.addEventListener('mousedown', markPressStart);
    btn.addEventListener('touchstart', markPressStart, {passive: true});

    btn.addEventListener('click', e => {
        e.preventDefault(); 
        e.stopPropagation();
        
        const pressDuration = Date.now() - pressStartTime;
        const isLongPress = pressDuration >= 400; 
        
        const isDual = localStorage.getItem('custom_dual_engine') === 'true';
        const query = searchInput?.value.trim();

        if (isDual && query && !isLongPress) {
            const targetEngine = idx === 0 ? activeEngine : activeEngine2;
            window.location.href = targetEngine.url.replace('%s', encodeURIComponent(query));
        } else {
            dynamicTargetBtn = idx === 0 ? 1 : 2;
            
            btn.classList.remove('pop-anim'); 
            void btn.offsetWidth; 
            btn.classList.add('pop-anim');
            
            if (customPanel) customPanel.classList.remove('visible');
            if (suggestionsBox) suggestionsBox.style.display = 'none';
            if (selectorPanel) selectorPanel.classList.toggle('visible');
        }
    });
});

document.querySelectorAll('.engine-option[data-name]').forEach(opt => {
    opt.addEventListener('click', e => {
        e.stopPropagation();
        const selectedEngine = { name: opt.getAttribute('data-name'), url: opt.getAttribute('data-url') };
        const isDual = localStorage.getItem('custom_dual_engine') === 'true';
        
        if (isDual) {
            if ((dynamicTargetBtn === 2 && activeEngine.name === selectedEngine.name) ||
                (dynamicTargetBtn === 1 && activeEngine2.name === selectedEngine.name)) {
                
                const temp = activeEngine;
                activeEngine = activeEngine2;
                activeEngine2 = temp;
                
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {

                    chrome.storage.local.set({ 
                        'custom_search_engine': activeEngine,
                        'custom_search_engine_2': activeEngine2 
                    });
                }
                localStorage.setItem('custom_search_engine', JSON.stringify(activeEngine));
                localStorage.setItem('custom_search_engine_2', JSON.stringify(activeEngine2));
                
                logoBtn.style.transform = 'scale(0)';
                logoBtn2.style.transform = 'scale(0)';
                setTimeout(() => {
                    applyEngineVisuals(activeEngine, logoBtn);
                    applyEngineVisuals(activeEngine2, logoBtn2);
                    logoBtn.style.transform = 'scale(1)';
                    logoBtn2.style.transform = 'scale(1)';
                }, 150);
                
                if (selectorPanel) selectorPanel.classList.remove('visible');
                return;
            }
        }

        let targetBtn = logoBtn;
        if (dynamicTargetBtn === 2) {
            activeEngine2 = selectedEngine;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 'custom_search_engine_2': activeEngine2 });
            }
            localStorage.setItem('custom_search_engine_2', JSON.stringify(activeEngine2));
            targetBtn = logoBtn2;
        } else {
            activeEngine = selectedEngine;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 'custom_search_engine': activeEngine });
            }
            localStorage.setItem('custom_search_engine', JSON.stringify(activeEngine));
            targetBtn = logoBtn;
        }
        
        if (targetBtn) {
            targetBtn.style.transform = 'scale(0)';
            setTimeout(() => {
                applyEngineVisuals(selectedEngine, targetBtn);
                targetBtn.style.transform = 'scale(1)';
            }, 150);
        }

        if (isDual) {
            const otherBtn = dynamicTargetBtn === 2 ? logoBtn : logoBtn2;
            const otherEng = dynamicTargetBtn === 2 ? activeEngine : activeEngine2;
            applyEngineVisuals(otherEng, otherBtn); 
        }
        
        if (selectorPanel) selectorPanel.classList.remove('visible');
    });
});

const addEngineBtn = document.getElementById('addEngineBtn');
if (addEngineBtn) addEngineBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (selectorPanel) selectorPanel.classList.remove('visible');
    if (customPanel)   customPanel.classList.add('visible');
});

const applyBtn  = document.getElementById('applyBtn');
const cancelBtn = document.getElementById('cancelBtn');
if (applyBtn) applyBtn.addEventListener('click', () => {
    const n = document.getElementById('engineName')?.value.trim();
    const u = document.getElementById('engineUrl')?.value.trim();
    if (!u || !u.includes('%s')) { alert('Please enter a valid URL containing %s'); return; }
    activeEngine = { name: n || 'Custom', url: u };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'custom_search_engine': activeEngine });
    }
    localStorage.setItem('custom_search_engine', JSON.stringify(activeEngine));
    applyEngineVisuals(activeEngine);
    if (customPanel) customPanel.classList.remove('visible');
});
if (cancelBtn) cancelBtn.addEventListener('click', () => { if (customPanel) customPanel.classList.remove('visible'); });

const shortcutsGrid    = document.getElementById('shortcutsGrid');
const addShortcutModal = document.getElementById('addShortcutModal');

const defaultShortcuts = [
    { name:'To-dos',  url:'https://todoist.com',       icon:'📝',  isImage:false, color:'#00c853' },
    { name:'Notes',   url:'https://keep.google.com',   icon:'📘',  isImage:false, color:'#2979ff' },
    { name:'Amazon',  url:'https://amazon.com',        icon:'a',   isImage:false, color:'#ff9800' },
    { name:'Twitter', url:'https://twitter.com',       icon:'🐦',  isImage:false, color:'#1da1f2' }
];

const scColors = ['#00c853', '#2979ff', '#ff9800', '#1da1f2', '#003296', '#b0bec5', '#e91e63', '#9c27b0'];

let globalDragItem = null, globalDragClone = null, globalIsDragging = false;
let globalDragStartX, globalDragStartY, globalDragPressTimer;

function handleGlobalDragStart(e, item) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.target.closest('.delete-badge')) return;
    const touch = e.touches ? e.touches[0] : e;
    globalDragStartX = touch.clientX;
    globalDragStartY = touch.clientY;
    globalDragItem   = item;

    globalDragPressTimer = setTimeout(() => {
        if (shortcutsGrid) shortcutsGrid.classList.add('edit-mode');
        globalIsDragging = true;
        const rect = globalDragItem.getBoundingClientRect();
        globalDragClone = globalDragItem.cloneNode(true);
        Object.assign(globalDragClone.style, {
            position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
            width: rect.width + 'px', height: rect.height + 'px',
            zIndex: '9999', pointerEvents: 'none',
            transition: 'none', transform: 'scale(1.12)',
            opacity: '0.92'
        });
        document.body.appendChild(globalDragClone);
        globalDragItem.style.opacity = '0.01';
    }, 400);
}

function handleGlobalDragMove(e) {
    if (!globalDragItem) return;
    const touch = e.touches ? e.touches[0] : e;

    if (!globalIsDragging) {
        if (Math.abs(touch.clientX - globalDragStartX) > 10 || Math.abs(touch.clientY - globalDragStartY) > 10) {
            clearTimeout(globalDragPressTimer); globalDragItem = null;
        }
        return;
    }
    e.preventDefault();
    const dx = touch.clientX - globalDragStartX;
    const dy = touch.clientY - globalDragStartY;
    if (globalDragClone) globalDragClone.style.transform = `translate(${dx}px,${dy}px) scale(1.12)`;

    if (globalDragClone) {
        globalDragClone.style.display = 'none';
        const below = document.elementFromPoint(touch.clientX, touch.clientY);
        globalDragClone.style.display = '';
        if (!below) return;
        const target = below.closest('.shortcut-item:not(.add-btn)');
        if (target && target !== globalDragItem) {
            const all = [...shortcutsGrid.querySelectorAll('.shortcut-item:not(.add-btn)')];
            const itemIdx   = all.indexOf(globalDragItem);
            const targetIdx = all.indexOf(target);
            const rects = new Map(all.map(it => [it, it.getBoundingClientRect()]));

            if (itemIdx < targetIdx) target.after(globalDragItem);
            else                     target.before(globalDragItem);

            all.forEach(it => {
                if (it === globalDragItem) return;
                const oldR = rects.get(it), newR = it.getBoundingClientRect();
                const diffX = oldR.left - newR.left, diffY = oldR.top - newR.top;
                if (diffX !== 0 || diffY !== 0) {
                    it.style.transition = 'none';
                    it.style.transform  = `translate(${diffX}px,${diffY}px)`;
                    requestAnimationFrame(() => {
                        it.offsetWidth; 
                        it.style.transition = 'transform 0.35s var(--md-sys-motion-easing-emphasized)';
                        it.style.transform  = 'translate(0,0)';
                        setTimeout(() => { if (!globalIsDragging) { it.style.transition = ''; it.style.transform = ''; } }, 350);
                    });
                }
            });
        }
    }
}

function handleGlobalDragEnd() {
    clearTimeout(globalDragPressTimer);
    if (globalIsDragging && globalDragItem) {
        globalIsDragging = false;
        const revealItem = globalDragItem;
        if (globalDragClone) {
            const finalRect = revealItem.getBoundingClientRect();
            const dx = finalRect.left - parseFloat(globalDragClone.style.left);
            const dy = finalRect.top  - parseFloat(globalDragClone.style.top);
            globalDragClone.style.transition = 'transform 0.35s var(--md-sys-motion-easing-emphasized)';
            globalDragClone.style.transform  = `translate(${dx}px,${dy}px) scale(1)`;
            setTimeout(() => {
                revealItem.style.opacity = '1';
                globalDragClone?.remove();
                globalDragClone = null;
                saveShortcuts();
            }, 350);
        } else {
            revealItem.style.opacity = '1';
            saveShortcuts();
        }
    }
    globalDragItem = null;
}

window.addEventListener('mousemove', handleGlobalDragMove, { passive: false });
window.addEventListener('touchmove', handleGlobalDragMove, { passive: false });
window.addEventListener('mouseup',   handleGlobalDragEnd);
window.addEventListener('touchend',  handleGlobalDragEnd);

function attachShortcutEvents(item) {
    item.addEventListener('contextmenu', e => {
        e.preventDefault(); 
        e.stopPropagation();
    });

    item.addEventListener('mousedown',  e => handleGlobalDragStart(e, item));
    item.addEventListener('touchstart', e => handleGlobalDragStart(e, item), { passive: false });
    item.addEventListener('click', e => {
        if (shortcutsGrid?.classList.contains('edit-mode') || e.target.closest('.delete-badge')) {
            e.preventDefault(); return;
        }
        const url = item.getAttribute('data-url');
        if (url) window.location.href = url;
    });
    const badge = item.querySelector('.delete-badge');
    if (badge) badge.addEventListener('click', e => {
        e.stopPropagation();
        item.classList.add('removing');
        setTimeout(() => { item.remove(); saveShortcuts(); }, 400);
    });
}

function loadShortcuts() {
    if (!shortcutsGrid) return;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['custom_shortcuts'], result => {
            let saved = result.custom_shortcuts;
            if (!saved || saved.length === 0) saved = defaultShortcuts;
            renderShortcutsDOM(saved);
        });
    } else {
        let saved = JSON.parse(localStorage.getItem('custom_shortcuts') || 'null');
        if (!saved || saved.length === 0) saved = defaultShortcuts;
        renderShortcutsDOM(saved);
    }
}

function renderShortcutsDOM(saved) {
    shortcutsGrid.querySelectorAll('.shortcut-item:not(.add-btn)').forEach(el => el.remove());
    const addBtn = document.getElementById('openAddShortcutBtn');
    
    if (addBtn) {
        const addIcon = addBtn.querySelector('.shortcut-icon');
        if (addIcon) {
            addIcon.style.background = 'rgba(255, 255, 255, 0.8)';
            addIcon.style.border = '1px solid rgba(0, 0, 0, 0.05)';
            addIcon.style.color = 'var(--text-sec)';
        }
    }
    
    saved.forEach(s => {
        const item = document.createElement('div');
        item.className = 'shortcut-item tap-anim';
        item.setAttribute('data-url', s.url);
        item.setAttribute('role', 'listitem');
        
        let highResIcon = s.icon;
        if (typeof highResIcon === 'string' && highResIcon.includes('sz=64')) {
            highResIcon = highResIcon.replace('sz=64', 'sz=128');
        }

        const imgId = 'img-' + Math.random().toString(36).substr(2, 9);
        const iconContent = s.isImage
            ? `<img id="${imgId}" src="${highResIcon}" alt="${s.name} icon" loading="lazy" style="width:54px; height:54px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">`
            : `<span style="font-size: 24px; color: #fff; line-height: 1; margin-top: -2px;">${highResIcon}</span>`;
            
        const bgColor = s.color || scColors[Math.floor(Math.random() * scColors.length)];

        item.innerHTML = `
            <div class="delete-badge" aria-label="Remove ${s.name}">&times;</div>
            <div class="shortcut-outer" style="background-color: ${bgColor}; width: 54px; height: 54px; border-radius: var(--icon-radius); overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.12); transition: border-radius 0.2s ease-out, transform 0.15s;">
                <div class="shortcut-icon" style="background: transparent; box-shadow: none; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${iconContent}</div>
            </div>
            <span class="shortcut-label" style="margin-top: 4px;">${s.name}</span>`;
        shortcutsGrid.insertBefore(item, addBtn);
        attachShortcutEvents(item);

        if (s.isImage && !highResIcon.startsWith('data:')) {
            getCachedImage(highResIcon).then(b64 => {
                if (b64 !== highResIcon) {
                    const imgEl = document.getElementById(imgId);
                    if (imgEl) {
                        imgEl.src = b64; 
                        saveShortcuts(); 
                    }
                }
            });
        }
    });
}

function saveShortcuts() {
    const items = [];
    shortcutsGrid?.querySelectorAll('.shortcut-item:not(.add-btn)').forEach(item => {
        const img = item.querySelector('.shortcut-icon img');
        const outer = item.querySelector('.shortcut-outer');
        items.push({
            name:    item.querySelector('.shortcut-label').textContent, 
            url:     item.getAttribute('data-url'),
            icon:    img ? img.src : item.querySelector('.shortcut-icon').textContent.trim(),
            isImage: !!img,
            color:   outer ? outer.style.backgroundColor : '#ffffff'
        });
    });
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'custom_shortcuts': items });
    }
    localStorage.setItem('custom_shortcuts', JSON.stringify(items));
}

const openAddShortcutBtn = document.getElementById('openAddShortcutBtn');
if (openAddShortcutBtn) openAddShortcutBtn.addEventListener('click', e => {
    e.stopPropagation();
    addShortcutModal?.classList.add('visible');
    document.getElementById('shortcutNameInput')?.focus();
});

const cancelShortcutBtn = document.getElementById('cancelShortcutBtn');
if (cancelShortcutBtn) cancelShortcutBtn.addEventListener('click', e => {
    e.stopPropagation();
    addShortcutModal?.classList.remove('visible');
});

const applyShortcutBtn = document.getElementById('applyShortcutBtn');
if (applyShortcutBtn) applyShortcutBtn.addEventListener('click', async e => {
    e.stopPropagation();
    let name = document.getElementById('shortcutNameInput')?.value.trim();
    let url  = document.getElementById('shortcutUrlInput')?.value.trim();
    if (!url) { alert('Please enter a URL.'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    
    const oldText = applyShortcutBtn.textContent;
    applyShortcutBtn.textContent = 'Saving...';

    try {
        const domain  = new URL(url).hostname;
        const newItem = document.createElement('div');
        newItem.className = 'shortcut-item tap-anim';
        newItem.setAttribute('data-url', url);
        newItem.setAttribute('role', 'listitem');
        
        const randomBg = scColors[Math.floor(Math.random() * scColors.length)];
        
        const rawUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        const finalSrc = await getCachedImage(rawUrl); 

        newItem.innerHTML = '<div class="delete-badge">&times;</div>' +
            `<div class="shortcut-outer" style="background-color: ${randomBg}; width: 54px; height: 54px; border-radius: var(--icon-radius); overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.12); transition: border-radius 0.2s ease-out, transform 0.15s;">` +
            '<div class="shortcut-icon" style="background: transparent; box-shadow: none; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">' +
            `<img src="${finalSrc}" alt="${name || domain} icon" loading="lazy" style="width:54px; height:54px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">` +
            `</div></div><span class="shortcut-label" style="margin-top: 4px;">${name || domain}</span>`;
            
        shortcutsGrid?.insertBefore(newItem, document.getElementById('openAddShortcutBtn'));
        attachShortcutEvents(newItem);
        saveShortcuts();
        
        applyShortcutBtn.textContent = oldText;
        document.getElementById('shortcutNameInput').value = '';
        document.getElementById('shortcutUrlInput').value  = '';
        addShortcutModal?.classList.remove('visible');
    } catch { 
        alert('Invalid URL format.'); 
        applyShortcutBtn.textContent = oldText;
    }
});

loadShortcuts();

function initSlider(id, storageKey, cssVar, transform, labelId) {
    const slider = document.getElementById(id);
    const label  = labelId ? document.getElementById(labelId) : null;
    if (!slider) return;

    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
        slider.value = saved;
        if (label) label.textContent = saved;
        document.documentElement.style.setProperty(cssVar, transform(saved));
    }
    updateSliderTrack(slider);

    slider.addEventListener('input', e => {
        const v = e.target.value;
        if (label) label.textContent = v;
        updateSliderTrack(e.target);
        document.documentElement.style.setProperty(cssVar, transform(v));
        localStorage.setItem(storageKey, v);
    });
}

function updateSliderTrack(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--md-sys-color-primary) ${pct}%, var(--md-sys-color-surface-variant) ${pct}%)`;
}

initSlider('positionSlider',   'shape_pos_y',  '--search-pos',   v => `${v}vh`, 'posValText');
initSlider('engineWidthSlider','shape_eng_w',   '--engine-w',     v => `${v}%`,  'engWValText');
initSlider('engineHeightSlider','shape_eng_h',  '--engine-pad-v', v => `${v}px`, 'engHValText');
initSlider('searchSlider',     'shape_search',  '--search-radius',v => `${(v/100)*26}px`, 'searchValText');
initSlider('iconSlider',       'shape_icon',    '--icon-radius',  v => `${(v/100)*50}%`,  'iconValText');
initSlider('transparencySlider','shape_alpha',  '--bar-alpha',    v => `${v/100}`, 'transparencyValText');

const enginePosXSlider = document.getElementById('enginePosXSlider');
if (enginePosXSlider) {
    const savedX = localStorage.getItem('shape_eng_x');
    if (savedX !== null) {
        enginePosXSlider.value = savedX;
        document.documentElement.style.setProperty('--engine-x', `${savedX}px`);
        const lbl = document.getElementById('engXValText');
        if (lbl) lbl.textContent = savedX;
    }
    updateSliderTrack(enginePosXSlider);
    enginePosXSlider.addEventListener('input', e => {
        const v = e.target.value;
        updateSliderTrack(e.target);
        document.documentElement.style.setProperty('--engine-x', `${v}px`);
        const lbl = document.getElementById('engXValText');
        if (lbl) lbl.textContent = v;
        localStorage.setItem('shape_eng_x', v);
    });
}

const bgOpacitySlider = document.getElementById('bgOpacitySlider');
if (bgOpacitySlider) {
    const saved = localStorage.getItem('custom_bg_opacity');
    if (saved !== null) {
        bgOpacitySlider.value = saved;
        document.documentElement.style.setProperty('--bg-opacity', saved / 100);
        const lbl = document.getElementById('bgOpacityVal');
        if (lbl) lbl.textContent = `${saved}%`;
    }
    bgOpacitySlider.addEventListener('input', e => {
        const v = e.target.value;
        document.documentElement.style.setProperty('--bg-opacity', v / 100);
        const lbl = document.getElementById('bgOpacityVal');
        if (lbl) lbl.textContent = `${v}%`;
        localStorage.setItem('custom_bg_opacity', v);
    });
}

function bindWidgetToggle(toggleId, widgetId, storageKey, defaultHidden = false) {
    const toggle = document.getElementById(toggleId);
    const widget = document.getElementById(widgetId);
    if (!toggle || !widget) return;
    const saved = localStorage.getItem(storageKey);
    const hidden = saved !== null ? saved === 'true' : defaultHidden;
    toggle.checked  = !hidden;
    widget.style.display = hidden ? 'none' : '';
    toggle.addEventListener('change', e => {
        widget.style.display = e.target.checked ? '' : 'none';
        localStorage.setItem(storageKey, !e.target.checked);
    });
}

function bindRowToggle(rowId, toggleId, storageKey) {
    const row    = document.getElementById(rowId);
    const toggle = document.getElementById(toggleId);
    if (!row || !toggle) return;
    row.addEventListener('click', e => {
        if (e.target === toggle || e.target === toggle.nextElementSibling) return;
        toggle.checked = !toggle.checked;
        toggle.dispatchEvent(new Event('change'));
    });
    if (storageKey) {
        toggle.checked = localStorage.getItem(storageKey) === 'true';
        toggle.addEventListener('change', e => localStorage.setItem(storageKey, e.target.checked));
    }
}

bindRowToggle('rowAutoSearch', 'autoSearchToggle', 'custom_auto_search');

const minimalistToggle = document.getElementById('minimalistToggle');
const rowMinimalist    = document.getElementById('rowMinimalist');
if (minimalistToggle) {
    const isMinimal = localStorage.getItem('custom_minimalist') === 'true';
    minimalistToggle.checked = isMinimal;
    const applyMinimalist = on => {
        shortcutsGrid?.classList.toggle('hidden', on);
        const wr = document.getElementById('widgetContainerRow');
        const wc = document.getElementById('wotdContainer');
        if (wr) wr.style.display = on ? 'none' : 'flex';
        if (wc) wc.style.display = on ? 'none' : 'flex';
        localStorage.setItem('custom_minimalist', on);
    };
    applyMinimalist(isMinimal);
    minimalistToggle.addEventListener('change', e => applyMinimalist(e.target.checked));
    rowMinimalist?.addEventListener('click', e => {
        if (e.target === minimalistToggle || e.target === minimalistToggle.nextElementSibling) return;
        minimalistToggle.checked = !minimalistToggle.checked;
        minimalistToggle.dispatchEvent(new Event('change'));
    });
}

bindWidgetToggle('dateWidgetToggle',    'dateWidget',    'hide_date_widget', false);
bindWidgetToggle('weatherWidgetToggle', 'weatherWidget', 'hide_weather_widget', false);
bindWidgetToggle('wotdWidgetToggle',    'wotdContainer', 'hide_wotd_widget', true);

bindRowToggle('rowDateWidget',    'dateWidgetToggle');
bindRowToggle('rowWeatherWidget', 'weatherWidgetToggle');
bindRowToggle('rowWotdWidget',    'wotdWidgetToggle');

const weatherWallpaperToggle = document.getElementById('weatherWallpaperToggle');
const rowWeatherWallpaper    = document.getElementById('rowWeatherWallpaper');
if (weatherWallpaperToggle) {
    weatherWallpaperToggle.checked = localStorage.getItem('custom_weather_wallpaper') === 'true';
    weatherWallpaperToggle.addEventListener('change', e => {
        localStorage.setItem('custom_weather_wallpaper', e.target.checked);
        if (e.target.checked) {
            if (window.lastWeatherData) renderWeatherUI(window.lastWeatherData);
        } else {
            const sw = localStorage.getItem('custom_browser_wallpaper');
            const sg = localStorage.getItem('custom_browser_gradient');
            const sc = localStorage.getItem('custom_browser_color');
            if (sw)      applyBackgroundStyle('wallpaper', sw, true);
            else if (sg) applyBackgroundStyle('gradient',  sg, true);
            else if (sc) applyBackgroundStyle('solid',     sc.split(','), true);
            else         applyBackgroundStyle('solid',     defaultColor,  true);
            if (window.lastWeatherData) renderWeatherUI(window.lastWeatherData);
        }
    });
    rowWeatherWallpaper?.addEventListener('click', e => {
        if (e.target === weatherWallpaperToggle || e.target === weatherWallpaperToggle.nextElementSibling) return;
        weatherWallpaperToggle.checked = !weatherWallpaperToggle.checked;
        weatherWallpaperToggle.dispatchEvent(new Event('change'));
    });
}

const floatingToggle  = document.getElementById('floatingToggle');
const verticalToggle  = document.getElementById('verticalToggle');
const rowVerticalToggle = document.getElementById('rowVerticalToggle');

if (floatingToggle && typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['toolbarEnabled','toolbarVertical'], result => {
        if (result.toolbarEnabled === undefined) {
            chrome.storage.local.set({ toolbarEnabled: false });
        }
        
        floatingToggle.checked = result.toolbarEnabled === true;
        if (rowVerticalToggle) rowVerticalToggle.style.display = floatingToggle.checked ? 'flex' : 'none';
        if (verticalToggle)    verticalToggle.checked = result.toolbarVertical === true;
    });
    floatingToggle.addEventListener('change', e => {
        chrome.storage.local.set({ toolbarEnabled: e.target.checked });
        if (rowVerticalToggle) rowVerticalToggle.style.display = e.target.checked ? 'flex' : 'none';
    });
    verticalToggle?.addEventListener('change', e => {
        chrome.storage.local.set({ toolbarVertical: e.target.checked });
    });
}
bindRowToggle('rowFloatingToggle', 'floatingToggle');
bindRowToggle('rowVerticalToggle', 'verticalToggle');

const topSettingsBtn   = document.getElementById('topSettingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const settingsView     = document.getElementById('settingsView');
const shapeModal       = document.getElementById('shapeModal');
const bgModal          = document.getElementById('bgModal');
const resetModal       = document.getElementById('resetModal');
const aboutModal       = document.getElementById('aboutModal');
const customColorModal = document.getElementById('customColorModal');

if (topSettingsBtn && settingsDropdown) {
    topSettingsBtn.addEventListener('click', e => { e.stopPropagation(); settingsDropdown.classList.toggle('visible'); });
}

document.getElementById('openSettingsBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsDropdown?.classList.remove('visible');
    settingsView?.classList.add('active');
});

document.getElementById('backToHomeBtn')?.addEventListener('click', e => {
    e.stopPropagation(); settingsView?.classList.remove('active');
});

document.getElementById('openIconShapeBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsView?.classList.remove('active');
    shapeModal?.classList.add('visible');
});
document.getElementById('cancelShapeBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    shapeModal?.classList.remove('visible');
    settingsView?.classList.add('active');
});
document.getElementById('saveShapeBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    shapeModal?.classList.remove('visible');
    settingsView?.classList.add('active');
});

document.getElementById('openBgModalBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsDropdown?.classList.remove('visible');
    buildBackgroundMenus();
    bgModal?.classList.add('visible');
});

document.getElementById('openWpModalBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsDropdown?.classList.remove('visible');
    wpModal?.classList.add('visible');
});
document.getElementById('closeWpBtn')?.addEventListener('click', e => {
    e.stopPropagation(); wpModal?.classList.remove('visible');
});

document.getElementById('openResetModalBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsDropdown?.classList.remove('visible');
    resetModal?.classList.add('visible');
});
document.getElementById('closeResetBtn')?.addEventListener('click', e => {
    e.stopPropagation(); resetModal?.classList.remove('visible');
});

document.getElementById('openAboutModalBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    settingsDropdown?.classList.remove('visible');
    aboutModal?.classList.add('visible');
});
document.getElementById('closeAboutBtn')?.addEventListener('click', e => {
    e.stopPropagation(); aboutModal?.classList.remove('visible');
});

document.getElementById('openCustomColorBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    bgModal?.classList.remove('visible');
    customColorModal?.classList.add('visible');
    updateCustomColor();
});
document.getElementById('cpAddBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    const hex = document.getElementById('cpHex')?.value;
    if (hex) applyBackgroundStyle('solid', hexToRgb(hex));
    customColorModal?.classList.remove('visible');
});

document.getElementById('resetBgBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    applyBackgroundStyle('solid', defaultColor);
    const slider = document.getElementById('bgOpacitySlider');
    if (slider) { slider.value = 70; slider.dispatchEvent(new Event('input')); }
    alert('Background reset to default!');
    resetModal?.classList.remove('visible');
});
document.getElementById('resetShortcutsBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    localStorage.removeItem('custom_shortcuts');
    loadShortcuts();
    alert('Shortcuts reset!');
    resetModal?.classList.remove('visible');
});
document.getElementById('resetShapeBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    [
        ['positionSlider',   10],
        ['engineWidthSlider',94],
        ['engineHeightSlider',8],
        ['enginePosXSlider',  0],
        ['searchSlider',    100],
        ['iconSlider',      100],
        ['transparencySlider',100]
    ].forEach(([id, val]) => {
        const s = document.getElementById(id);
        if (s) { s.value = val; s.dispatchEvent(new Event('input')); }
    });
    alert('Layout and transparency reset!');
    resetModal?.classList.remove('visible');
});

document.addEventListener('click', e => {
    if (settingsDropdown && !settingsDropdown.contains(e.target) && e.target !== topSettingsBtn && !topSettingsBtn?.contains(e.target)) {
        settingsDropdown.classList.remove('visible');
    }
    [bgModal, wpModal, shapeModal, resetModal, aboutModal, addShortcutModal, customColorModal, weatherModal].forEach(m => {
        if (m && e.target === m) m.classList.remove('visible');
    });
    if (searchInput && !searchInput.contains(e.target) && suggestionsBox && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
    if (customPanel && !customPanel.contains(e.target) &&
        selectorPanel && !selectorPanel.contains(e.target) &&
        logoBtn && !logoBtn.contains(e.target)) {
        customPanel.classList.remove('visible');
        selectorPanel.classList.remove('visible');
    }
    if (shortcutsGrid?.classList.contains('edit-mode') && !e.target.closest('.shortcut-item')) {
        shortcutsGrid.classList.remove('edit-mode');
    }
});

async function fetchWOTD() {
    if (localStorage.getItem('hide_wotd_widget') !== 'false') return; 
    const wotdWord = document.getElementById('wotdWord');
    const wotdDef  = document.getElementById('wotdDef');
    if (!wotdWord || !wotdDef) return;

    try {
        let html = '';
        try {
            const res = await fetch('https://www.merriam-webster.com/word-of-the-day');
            if (!res.ok) throw new Error();
            html = await res.text();
        } catch {
            const proxy = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.merriam-webster.com/word-of-the-day')}`);
            html = (await proxy.json()).contents;
        }

        const doc  = new DOMParser().parseFromString(html, 'text/html');
        let word   = 'Word of the Day';
        const titleTag = doc.querySelector('title');
        if (titleTag) {
            const m = titleTag.textContent.match(/Word of the Day:\s+(.*?)\s+\|/);
            if (m?.[1]) word = m[1].trim();
        }

        let defText = '';
        for (const h2 of doc.querySelectorAll('h2')) {
            if (!h2.textContent.includes('What It Means')) continue;
            let next = h2.nextElementSibling;
            while (next) {
                if (next.tagName === 'H2') break;
                if (next.tagName === 'P') {
                    const t = next.textContent.trim();
                    if (t && t !== 'What It Means' && !t.startsWith('See the entry')) defText += t + ' ';
                }
                next = next.nextElementSibling;
            }
            break;
        }

        wotdWord.textContent = word;
        wotdDef.textContent  = defText.trim() || 'Definition currently unavailable.';
    } catch {
        wotdWord.textContent = 'Resilience';
        wotdDef.textContent  = 'The capacity to withstand or recover quickly from difficulties; toughness.';
    }
}
setTimeout(() => fetchWOTD(), 150);

function injectDateClock() {
    if (localStorage.getItem('hide_clock_widget') === 'true') return;
    const content = document.querySelector('#dateWidget .blob-content');
    if (!content || document.getElementById('widgetClockBg')) return;

    const clockBg = document.createElement('div');
    clockBg.id = 'widgetClockBg';
    clockBg.innerHTML = `
        <div class="hand hour-hand"   id="hourHand"></div>
        <div class="hand minute-hand" id="minuteHand"></div>
        <div class="center-cap"></div>`;
    content.insertBefore(clockBg, content.firstChild);

    const s = document.createElement('style');
    s.textContent = `
        #dateWidget .blob-content { background: transparent !important; }
        #widgetClockBg {
            position: absolute; inset: 0; border-radius: 50%;
            background: transparent;
            z-index: 5; overflow: hidden; pointer-events: none;
        }
        #widgetClockBg .tick { position: absolute; transform-origin: 0 0; }
        #widgetClockBg .tick span { display: block; border-radius: 99px; transform: translateX(-50%); }
        #widgetClockBg .tick.major span { width: 3px; height: 8px; background: var(--md-sys-color-on-surface); opacity: .55; }
        #widgetClockBg .tick.minor span { width: 1.5px; height: 4px; background: var(--md-sys-color-on-surface); opacity: .20; }
        #widgetClockBg .hand {
            position: absolute; bottom: 50%; left: 50%;
            transform-origin: bottom center; border-radius: 99px; z-index: 1;
            transition: transform 0.5s cubic-bezier(.34,1.15,.64,1);
        }
        #widgetClockBg .hour-hand   { width: 6px; height: 26%; margin-left: -3px; background: var(--md-sys-color-on-surface); opacity: .80; }
        #widgetClockBg .minute-hand { width: 4px; height: 38%; margin-left: -2px; background: var(--md-sys-color-on-surface); opacity: .50; }
        #widgetClockBg .center-cap  {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%,-50%);
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--md-sys-color-primary); z-index: 2;
        }`;
    document.head.appendChild(s);

    for (let i = 0; i < 60; i++) {
        const angle  = (i / 60) * 360;
        const isMajor = i % 5 === 0;
        const rad    = (angle - 90) * Math.PI / 180;
        const dist   = isMajor ? 40 : 44;
        const tick   = document.createElement('div');
        tick.className = 'tick ' + (isMajor ? 'major' : 'minor');
        tick.style.left      = `calc(50% + ${Math.cos(rad) * dist}%)`;
        tick.style.top       = `calc(50% + ${Math.sin(rad) * dist}%)`;
        tick.style.transform = `rotate(${angle}deg)`;
        tick.appendChild(document.createElement('span'));
        clockBg.appendChild(tick);
    }

    const hourHand   = document.getElementById('hourHand');
    const minuteHand = document.getElementById('minuteHand');

    function tick() {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        if (hourHand)   hourHand.style.transform   = `rotate(${(h % 12) * 30 + m * 0.5 + s * (0.5/60)}deg)`;
        if (minuteHand) minuteHand.style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
    }
    tick();
    setInterval(tick, 1000);
}
setTimeout(() => injectDateClock(), 50);

function startWeatherCanvas() {
    if (localStorage.getItem('hide_weather_widget') === 'true') return;
    const content = document.querySelector('#weatherWidget .blob-content');
    if (!content) return;

    document.getElementById('scenicLayer')?.remove();
    document.getElementById('scenicWeatherStyles')?.remove();

    const style = document.createElement('style');
    style.id = 'scenicWeatherStyles';
    style.textContent = `
        #weatherWidget svg.blob-bg { display: none !important; }
        #weatherWidget .blob-content { background: transparent !important; border: none !important; box-shadow: none !important; }
        #weatherCanvas { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; z-index: 0; pointer-events: none; }
        #weatherWidget .blob-content > *:not(#weatherCanvas) { position: relative; z-index: 10; text-shadow: 0 1px 4px rgba(0,0,0,.8); }`;
    document.head.appendChild(style);

    const canvas = document.createElement('canvas');
    canvas.id = 'weatherCanvas';
    canvas.width = 300; canvas.height = 300;
    content.insertBefore(canvas, content.firstChild);

    const ctx = canvas.getContext('2d');
    let particles = [], clouds = [], frame = 0, lightningFlash = 0, charX = -30, activeUmbrella = null;

    const stars        = Array.from({length:60},  () => ({ x: Math.random()*300, y: Math.random()*180, s: Math.random()*1.5, o: Math.random()*Math.PI*2 }));
    const groundFlowers= Array.from({length:20},  () => ({ x: 20+Math.random()*260, y: 240+Math.random()*50, type: Math.random()>.5?'#fff':'#f48fb1', o: Math.random()*10 }));
    const groundLeaves = Array.from({length:40},  () => ({ x: Math.random()*300, y: 235+Math.random()*60, color: ['#e65100','#ff8f00','#d84315'][~~(Math.random()*3)] }));
    const puddles      = [{x:80,y:260,w:30},{x:220,y:250,w:40},{x:150,y:280,w:50}];

    let sky = {r1:0,g1:0,b1:0,r2:0,g2:0,b2:0};

    const lerp = (a,b,t) => (1-t)*a + t*b;

    function getState() {
        if (!window.lastWeatherData) return { mode:'clear', isNight:false };
        const code    = window.lastWeatherData.current_weather.weathercode;
        const isNight = window.lastWeatherData.current_weather.is_day === 0;
        let mode = 'clear';
        if ([1,2].includes(code))                                              mode = 'partly';
        if ([3,45,48].includes(code))                                          mode = 'clouds';
        if ([51,53,55,56,57,61,63,65,66,67].includes(code))                   mode = 'rain';
        if ([71,73,75,77,85,86].includes(code))                               mode = 'snow';
        if ([80,81,82,95,96,99].includes(code))                               mode = 'storm';
        return { mode, isNight };
    }

    function getSeason(month, lat) {
        const north = lat >= 0, absLat = Math.abs(lat);
        if (absLat <= 30) return 'summer';
        if (absLat >= 65) {
            if (north) return (month>=5&&month<=7)?'summer':'winter';
            return (month>=11||month<=1)?'summer':'winter';
        }
        if (month>=2&&month<=4) return north?'spring':'autumn';
        if (month>=5&&month<=7) return north?'summer':'winter';
        if (month>=8&&month<=10) return north?'autumn':'spring';
        return north?'winter':'summer';
    }

    function getPalette(state, season) {
        const n = state.isNight, st = state.mode === 'storm';
        const p = { isWinter:season==='winter', isSpring:season==='spring', isAutumn:season==='autumn' };
        if (season==='spring') {
            p.h1=n?'#2b4a24':st?'#5a7a53':'#8bc34a'; p.h2=n?'#20381b':st?'#4b6b44':'#7cb342';
            p.tree=n?'#173b22':st?'#3c6145':'#43a047'; p.trunk=n?'#3b2520':'#6d4c41';
        } else if (season==='autumn') {
            p.h1=n?'#5c4f23':st?'#9c8b4d':'#e4c13a'; p.h2=n?'#4f3711':st?'#8c6628':'#f57f17';
            p.tree=n?'#4f1c07':st?'#9e4a21':'#e65100'; p.trunk=n?'#291b18':'#4e342e';
        } else if (season==='winter') {
            p.h1=n?'#455a64':st?'#78909c':'#cfd8dc'; p.h2=n?'#37474f':st?'#607d8b':'#b0bec5';
            p.tree=n?'#263238':st?'#546e7a':'#eceff1'; p.trunk=n?'#212121':'#424242';
        } else {
            p.h1=n?'#2c523b':st?'#5c8a60':'#66bb6a'; p.h2=n?'#1f402d':st?'#45734b':'#4caf50';
            p.tree=n?'#1e4d30':st?'#366341':'#2e7d32'; p.trunk=n?'#4a332d':'#6d4c41';
        }
        return p;
    }

    function render() {
        frame++;
        const state  = getState();
        const month  = new Date().getMonth();
        const lat    = window.lastWeatherData?.latitude ?? 0;
        const season = getSeason(month, lat);
        const pal    = getPalette(state, season);

        let ts = {r1:33,g1:150,b1:243,r2:129,g2:212,b2:250};
        if (state.isNight) {
            ts = (state.mode==='clear'||state.mode==='partly') ? {r1:10,g1:15,b1:37,r2:28,g2:40,b2:65}
               : state.mode==='storm' ? {r1:5,g1:7,b1:10,r2:17,g2:21,b2:28}
               : {r1:17,g1:25,b1:38,r2:36,g2:52,b2:71};
        } else {
            if (state.mode==='storm') ts = {r1:38,g1:50,b1:56,r2:69,g2:90,b2:100};
            else if (state.mode!=='clear'&&state.mode!=='partly') ts = {r1:120,g1:144,b1:156,r2:176,g2:190,b2:197};
        }
        Object.keys(ts).forEach(k => { sky[k] = lerp(sky[k], ts[k], 0.05); });

        const sg = ctx.createLinearGradient(0,0,0,300);
        sg.addColorStop(0, `rgb(${~~sky.r1},${~~sky.g1},${~~sky.b1})`);
        sg.addColorStop(1, `rgb(${~~sky.r2},${~~sky.g2},${~~sky.b2})`);
        ctx.fillStyle = sg; ctx.fillRect(0,0,300,300);

        if (state.isNight && (state.mode==='clear'||state.mode==='partly')) {
            stars.forEach(s => {
                ctx.globalAlpha = Math.max(0, .3 + Math.sin(frame*.05+s.o)*.7);
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(s.x,s.y,s.s,0,Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        if (state.mode==='clear'||state.mode==='partly') {
            const now = new Date();
            let h = now.getHours() + now.getMinutes() / 60;
            
            if (window.lastWeatherData && window.lastWeatherData.utc_offset_seconds !== undefined) {
                const utcMillis = now.getTime() + (now.getTimezoneOffset() * 60000);
                const localDate = new Date(utcMillis + (window.lastWeatherData.utc_offset_seconds * 1000));
                h = localDate.getHours() + localDate.getMinutes() / 60 + localDate.getSeconds() / 3600;
            }
            
            let progress = 0;
            if (!state.isNight) {
                progress = Math.max(0, Math.min(1, (h - 6) / 12)); 
            } else {
                progress = (h >= 18 ? h - 18 : h + 6) / 12; 
            }
            
            const angle = Math.PI - (progress * Math.PI);
            const cx = 150 + Math.cos(angle) * 110; 
            const cy = 230 - Math.sin(angle) * 140; 
            
            ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI*2);
            
            if (!state.isNight) {
                const intensity = Math.sin(progress * Math.PI); 
                const r = Math.round(lerp(255, 255, intensity));
                const g = Math.round(lerp(120, 235, intensity)); 
                const b = Math.round(lerp(60, 59, intensity));
                
                ctx.fillStyle = `rgba(${r},${g},${b},1)`;
                ctx.shadowColor = ctx.fillStyle; 
                ctx.shadowBlur = 10 + (25 * intensity); 
            } else {
                ctx.fillStyle = 'rgba(255,255,255,.9)';
                ctx.shadowColor = ctx.fillStyle; 
                ctx.shadowBlur = 20;
            }
            
            ctx.fill(); ctx.shadowBlur = 0;
            
            if (!state.isNight && h >= 17 && h < 19) {
                const birdX = 350 - ((frame * 0.4) % 500); 
                const birdY = 100 + Math.sin(frame * 0.02) * 15; 
                const flap = Math.sin(frame * 0.2) * 5; 
                
                if (birdX > -10 && birdX < 310) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
                    ctx.beginPath(); 
                    ctx.moveTo(birdX - 6, birdY - flap); 
                    ctx.quadraticCurveTo(birdX - 3, birdY, birdX, birdY + 1); 
                    ctx.quadraticCurveTo(birdX + 3, birdY, birdX + 6, birdY - flap); 
                    ctx.stroke();
                }
            }
        }

        const targetCC = state.mode==='partly' ? 3 : ['clouds','rain','snow','storm'].includes(state.mode) ? 7 : 0;
        if (clouds.length < targetCC && Math.random()>.98) clouds.push({x:-100,y:20+Math.random()*80,s:.5+Math.random()*.8,v:.1+Math.random()*.2});
        else if (clouds.length > targetCC) clouds.shift();

        ctx.fillStyle = state.isNight ? 'rgba(150,160,180,.25)' : state.mode==='storm' ? 'rgba(100,110,120,.8)' : 'rgba(255,255,255,.8)';
        clouds.forEach(c => {
            c.x += c.v; if (c.x>350) c.x=-100;
            ctx.beginPath();
            ctx.arc(c.x,c.y,25*c.s,0,Math.PI*2);
            ctx.arc(c.x+25*c.s,c.y-12*c.s,30*c.s,0,Math.PI*2);
            ctx.arc(c.x+50*c.s,c.y,20*c.s,0,Math.PI*2);
            ctx.fill();
        });

        ctx.fillStyle = pal.h1;
        ctx.beginPath(); ctx.moveTo(0,200); ctx.bezierCurveTo(100,150,200,220,300,180); ctx.lineTo(300,300); ctx.lineTo(0,300); ctx.fill();

        [{x:50,y:195,s:.8},{x:120,y:210,s:1},{x:240,y:190,s:.9}].forEach(t => {
            ctx.fillStyle = pal.trunk; ctx.fillRect(t.x-3*t.s,t.y,6*t.s,30*t.s);
            ctx.fillStyle = pal.isWinter?'#fff':pal.tree;
            const ls = pal.isAutumn ? .8 : 1;
            ctx.beginPath(); ctx.arc(t.x-12*t.s,t.y-10*t.s,15*t.s*ls,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(t.x+12*t.s,t.y-10*t.s,15*t.s*ls,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(t.x,t.y-25*t.s,18*t.s*ls,0,Math.PI*2); ctx.fill();
        });

        ctx.fillStyle = pal.h2;
        ctx.beginPath(); ctx.moveTo(0,240); ctx.bezierCurveTo(120,210,180,260,300,230); ctx.lineTo(300,300); ctx.lineTo(0,300); ctx.fill();

        const temp = window.lastWeatherData?.current_weather?.temperature ?? 20;
        const code = window.lastWeatherData?.current_weather?.weathercode ?? 0;
        
        let charState = 'normal';
        if ([48, 57, 65, 67, 75, 81, 82, 86, 95, 96, 99].includes(code)) charState = 'extreme';
        else if ([45, 56, 66].includes(code)) charState = 'fog';
        else if ([71, 73, 77, 85].includes(code) || (temp < 5 && [0,1,2,3].includes(code))) charState = 'winter';
        else if ([51, 53, 55, 61, 63, 80].includes(code)) charState = 'rain';
        else if (temp >= 30 && [0, 1, 2].includes(code)) charState = 'hot';

        activeUmbrella = null;
        if (charState === 'extreme') {
            charX = -30;
            ctx.fillStyle = state.isNight ? '#3e2723' : '#5d4037';
            ctx.fillRect(170, 205, 50, 40);
            ctx.fillStyle = state.isNight ? '#212121' : '#4e342e';
            ctx.beginPath(); ctx.moveTo(160, 205); ctx.lineTo(195, 175); ctx.lineTo(230, 205); ctx.fill();
            ctx.fillStyle = '#ffeb3b';
            ctx.fillRect(190, 220, 12, 12);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(205 + Math.sin(frame*0.05)*3, 165 - (frame%40)*0.5, 5 + (frame%40)*0.1, 0, Math.PI*2); ctx.fill();
        } else {
            if (charX < 150) charX += 0.6;
            else charX = 150;
            
            const isWalking = charX < 150;
            const bob = isWalking ? Math.abs(Math.sin(frame * 0.15)) * 4 : Math.sin(frame * 0.04) * 1;
            const px = charX, py = 250 - bob;
            
            if (!state.isNight && (charState === 'normal' || charState === 'hot')) {
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.beginPath(); ctx.ellipse(px + 15, 260, 12, 4, 0, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath(); ctx.ellipse(px, 260, 10, 4, 0, 0, Math.PI*2); ctx.fill();
            }
            
            const skin = state.isNight ? '#ffccbc' : '#ffab91';
            const shirt = charState === 'winter' ? (state.isNight ? '#1565c0' : '#1e88e5') : (state.isNight ? '#00695c' : '#00897b');
            const pants = state.isNight ? '#283593' : '#3949ab';
            
            ctx.strokeStyle = pants; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath();
            if (isWalking) {
                ctx.moveTo(px, py); ctx.lineTo(px - Math.sin(frame*0.15)*9, py + 14);
                ctx.moveTo(px, py); ctx.lineTo(px + Math.sin(frame*0.15)*9, py + 14);
            } else {
                ctx.moveTo(px - 4, py); ctx.lineTo(px - 4, py + 14);
                ctx.moveTo(px + 4, py); ctx.lineTo(px + 4, py + 14);
            }
            ctx.stroke();
            
            ctx.fillStyle = shirt; 
            ctx.beginPath(); ctx.roundRect(px - 7, py - 18, 14, 20, 4); ctx.fill();
            
            const hair = '#3e2723';
            ctx.fillStyle = hair;
            ctx.beginPath(); ctx.arc(px - 1, py - 24, 8, 0, Math.PI*2); ctx.fill(); 

            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.arc(px, py - 24, 7, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = hair;
            ctx.beginPath(); ctx.arc(px, py - 24, 7, Math.PI + 0.2, Math.PI * 1.6); ctx.lineTo(px - 7, py-20); ctx.fill();

            ctx.fillStyle = hair;
            ctx.beginPath(); ctx.arc(px + 2, py - 25, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(px + 5, py - 25, 1, 0, Math.PI*2); ctx.fill();
            if (charState === 'normal' || charState === 'hot') {
                ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(px + 3.5, py - 23, 2, 0, Math.PI); ctx.stroke();
            }
            
            if (charState === 'winter') {
                ctx.fillStyle = '#e53935';
                ctx.beginPath(); ctx.arc(px, py - 26, 7.5, Math.PI, 0); ctx.fill();
                ctx.beginPath(); ctx.arc(px, py - 34, 3, 0, Math.PI*2); ctx.fill();
                ctx.fillRect(px - 8, py - 18, 16, 4);
            }
            
            if (charState === 'rain' || charState === 'hot') {
                const uColor = charState === 'hot' ? (state.isNight ? '#fbc02d' : '#ffeb3b') : (state.isNight ? '#b71c1c' : '#e53935');
                const uX = px + 6, uY = py - 30;
                activeUmbrella = { x: uX, y: uY, r: 22 };
                
                ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(uX, py - 5); ctx.lineTo(uX, uY - 5); ctx.stroke();
                ctx.beginPath(); ctx.arc(uX - 2, py - 5, 2, 0, Math.PI); ctx.stroke();
                
                ctx.strokeStyle = skin; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(uX, py - 8); ctx.stroke();
                
                ctx.fillStyle = uColor;
                ctx.beginPath(); ctx.arc(uX, uY, 22, Math.PI, 0); 
                ctx.quadraticCurveTo(uX + 11, uY - 4, uX, uY);
                ctx.quadraticCurveTo(uX - 11, uY - 4, uX - 22, uY);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(uX, uY); ctx.quadraticCurveTo(uX - 10, uY - 10, uX - 15, uY - 16); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(uX, uY); ctx.quadraticCurveTo(uX + 10, uY - 10, uX + 15, uY - 16); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(uX, uY); ctx.lineTo(uX, uY - 22); ctx.stroke();
            } else if (charState === 'fog') {
                ctx.fillStyle = '#ffeb3b'; ctx.fillRect(px + 8, py - 4, 6, 8);
                ctx.fillStyle = 'rgba(255,235,59,0.2)';
                ctx.beginPath(); ctx.arc(px + 11, py, 35, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = skin; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px + 8, py - 4); ctx.stroke();
            } else {
                ctx.strokeStyle = skin; ctx.lineWidth = 3;
                ctx.beginPath();
                if (isWalking) {
                    ctx.moveTo(px, py - 12); ctx.lineTo(px + Math.sin(frame*0.15)*7, py - 2);
                } else {
                    ctx.moveTo(px, py - 12); ctx.lineTo(px + 4, py - 2);
                }
                ctx.stroke();
            }
        }

        if (state.mode==='rain'||state.mode==='storm') {
            puddles.forEach(p => {
                ctx.fillStyle = state.isNight ? 'rgba(40,60,80,.7)' : 'rgba(100,150,200,.6)';
                ctx.save(); ctx.translate(p.x,p.y); ctx.scale(1,.3);
                ctx.beginPath(); ctx.arc(0,0,p.w,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1;
                [frame*.5%p.w,(frame*.5+p.w/2)%p.w].forEach(r => { ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); });
                ctx.restore();
            });
        }

        if (pal.isSpring && state.mode!=='snow' && state.mode!=='storm') {
            groundFlowers.forEach(f => {
                const sway = Math.sin(frame*.03+f.o)*4;
                ctx.strokeStyle='#4caf50'; ctx.lineWidth=2;
                ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.lineTo(f.x+sway,f.y-12); ctx.stroke();
                ctx.fillStyle=f.type;
                [[-3,-14],[3,-14],[0,-18]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(f.x+sway+dx,f.y+dy,3,0,Math.PI*2); ctx.fill(); });
                ctx.fillStyle='#ffeb3b'; ctx.beginPath(); ctx.arc(f.x+sway,f.y-14,2,0,Math.PI*2); ctx.fill();
            });
        }
        if (pal.isAutumn && state.mode!=='snow') groundLeaves.forEach(l => { ctx.fillStyle=l.color; ctx.fillRect(l.x,l.y,4,3); });
        if (pal.isWinter) {
            ctx.fillStyle = state.isNight ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.9)';
            ctx.beginPath(); ctx.moveTo(0,240); ctx.bezierCurveTo(80,225,150,250,300,220); ctx.lineTo(300,250); ctx.lineTo(0,250); ctx.fill();
        }

        if (particles.length < 150) {
            if (state.mode==='rain'||state.mode==='storm') {
                particles.push({x:Math.random()*400-50,y:-20,vx:1+Math.random(),vy:8+Math.random()*8,type:'rain',len:10+Math.random()*15});
            } else if (state.mode==='snow') {
                particles.push({x:Math.random()*300,y:-20,vx:Math.random()*2-1,vy:1+Math.random()*2,type:'snow',size:1+Math.random()*2});
            } else if ((state.mode==='clear'||state.mode==='partly')) {
                if (state.isNight && particles.length<25 && Math.random()>.9) {
                    particles.push({x:Math.random()*300,y:180+Math.random()*100,vx:0,vy:0,type:'firefly',size:1.5+Math.random(),life:Math.random()*100});
                } else if (!state.isNight && particles.length<15 && Math.random()>.9) {
                    particles.push({x:Math.random()*300,y:320,vx:Math.random()-0.5,vy:-0.5-Math.random(),type:'mote',size:Math.random()*2+1});
                }
            }
            if (!state.isNight && (state.mode==='clear'||state.mode==='partly'||state.mode==='clouds')) {
                if (pal.isAutumn && Math.random()>.95) particles.push({x:Math.random()*300,y:-10,vx:Math.random()*2-1,vy:1+Math.random()*1.5,type:'leaf',size:3+Math.random()*2});
                if (pal.isSpring && Math.random()>.95) particles.push({x:Math.random()*300,y:-10,vx:Math.random()*2-1,vy:.5+Math.random(),type:'petal',size:2+Math.random()});
            }
        }

        for (let i=particles.length-1; i>=0; i--) {
            const p = particles[i];
            if (p.type==='rain') {
                p.x+=p.vx; p.y+=p.vy;
                
                if (activeUmbrella && p.y > activeUmbrella.y - 5 && p.y < activeUmbrella.y + 10 && Math.abs(p.x - activeUmbrella.x) < activeUmbrella.r) {
                    for (let s=0; s<2; s++) particles.push({x: p.x, y: activeUmbrella.y - 4, vx: (Math.random()-0.5)*4, vy: -1-Math.random()*2, type: 'splash', life: 12});
                    particles.splice(i, 1);
                    continue;
                }
                
                ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=p.len/10;
                ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*1.5,p.y-p.len); ctx.stroke();
            } else if (p.type==='splash') {
                p.x+=p.vx; p.y+=p.vy; p.vy+=0.5; p.life--;
                ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI*2); ctx.fill();
                if (p.life <= 0) particles.splice(i, 1);
            } else if (p.type==='snow') {
                p.x+=p.vx+Math.sin(frame*.05+p.y*.01)*.5; p.y+=p.vy;
                ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            } else if (p.type==='petal') {
                p.x+=Math.sin(frame*.03+p.y*.01)*1.2; p.y+=p.vy;
                ctx.fillStyle='rgba(244,143,177,.85)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            } else if (p.type==='leaf') {
                p.x+=Math.sin(frame*.04+p.y*.02)*1.5; p.y+=p.vy;
                ctx.fillStyle='rgba(230,81,0,.85)'; ctx.fillRect(p.x,p.y,p.size,p.size);
            } else if (p.type==='mote') {
                p.x+=p.vx; p.y+=p.vy;
                ctx.fillStyle='rgba(255,235,59,.5)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
            } else if (p.type==='firefly') {
                p.vx+=(Math.random()-.5)*.5; p.vy+=(Math.random()-.5)*.5;
                p.vx*=.9; p.vy*=.9; p.x+=p.vx; p.y+=p.vy;
                const glow = Math.max(0, .4+Math.sin(frame*.1+p.life)*.6);
                ctx.fillStyle=`rgba(200,255,50,${glow})`;
                ctx.shadowColor='rgba(200,255,50,.8)'; ctx.shadowBlur=8;
                ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
            }
            if (p.y>320||p.x>350||p.x<-50||(p.type==='mote'&&p.y<-20)||(p.type==='firefly'&&(p.y<100||p.x<0||p.x>300))) {
                particles.splice(i,1);
            }
        }

        if (state.mode==='storm' && Math.random()>.98 && lightningFlash<=0) lightningFlash=15;
        if (lightningFlash>0) {
            ctx.fillStyle=`rgba(255,255,255,${lightningFlash/30})`; ctx.fillRect(0,0,300,300);
            if (lightningFlash>10) {
                ctx.strokeStyle='white'; ctx.lineWidth=3;
                ctx.beginPath(); ctx.moveTo(150+Math.random()*100-50,0);
                let lx=150,ly=0;
                for(let j=0;j<5;j++){lx+=Math.random()*60-30;ly+=40+Math.random()*20;ctx.lineTo(lx,ly);}
                ctx.stroke();
            }
            lightningFlash--;
        }

        if (!document.hidden) {
            requestAnimationFrame(render);
        }
    }

    render();

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            requestAnimationFrame(render);
        }
    });
}

setTimeout(() => startWeatherCanvas(), 250);

const darkToggleBtn = document.getElementById('darkToggleBtn');
if (darkToggleBtn) {
    const isDarkOverlay = localStorage.getItem('custom_dark_overlay') === 'true';
    if (isDarkOverlay) {
        document.body.classList.add('dark-overlay');
    }

    darkToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.classList.toggle('dark-overlay');
        localStorage.setItem('custom_dark_overlay', document.body.classList.contains('dark-overlay'));
    });
}

const wwToggle = document.getElementById('weatherWallpaperToggle');
const wotdToggle = document.getElementById('wotdWidgetToggle');

if (wwToggle && wotdToggle) {
    wwToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            wotdToggle.checked = false;
            wotdToggle.dispatchEvent(new Event('change'));
        }
    });
}

const clockWidgetToggle = document.getElementById('clockWidgetToggle');
const rowClockWidget    = document.getElementById('rowClockWidget');

if (clockWidgetToggle) {
    const isHidden = localStorage.getItem('hide_clock_widget') === 'true';
    clockWidgetToggle.checked = !isHidden;

    const clockBg = document.getElementById('widgetClockBg');
    if (clockBg) clockBg.style.display = isHidden ? 'none' : 'block';

    clockWidgetToggle.addEventListener('change', e => {
        const hide = !e.target.checked;
        localStorage.setItem('hide_clock_widget', hide);
        if (clockBg) clockBg.style.display = hide ? 'none' : 'block';
    });

    if (rowClockWidget) {
        rowClockWidget.addEventListener('click', e => {
            if (e.target === clockWidgetToggle || e.target === clockWidgetToggle.nextElementSibling) return;
            clockWidgetToggle.checked = !clockWidgetToggle.checked;
            clockWidgetToggle.dispatchEvent(new Event('change'));
        });
    }
}
