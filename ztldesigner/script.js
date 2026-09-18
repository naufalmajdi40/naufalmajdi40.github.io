
let canvas;
let isGridVisible = true;
let currentZoom = 1.0;

// Undo/Redo Engine Stack
let undoStack = [];
let redoStack = [];
let isStateLocked = false;

window.onload = function () {
    // Kunci state di awal agar penyesuaian awal tidak menimpa localStorage
    isStateLocked = true;

    canvas = new fabric.Canvas('labelCanvas', {
        width: 400,
        height: 300,
        backgroundColor: '#ffffff'
    });

    const savedState = localStorage.getItem('zplStudioState');
    const savedW = localStorage.getItem('zplCanvasW');
    const savedH = localStorage.getItem('zplCanvasH');

    if (savedW && savedH) {
        document.getElementById('canvasWidth').value = savedW;
        document.getElementById('canvasHeight').value = savedH;
        // Lewati pemanggilan saveState saat inisialisasi dimensi
        updateCanvasSize(true);
    }

    if (savedState) {
        canvas.loadFromJSON(savedState, () => {
            canvas.renderAll();
            isStateLocked = false; // Buka kunci setelah proses render selesai
            undoStack = [savedState];
            redoStack = [];
            updateUndoRedoUI();
            updateLayerList();
        });
    } else {
        isStateLocked = false;
        if (typeof initSampleObjects === 'function') {
            initSampleObjects();
        }
        switchObjectEditTab('text');
        saveState();
    }

    // Event Listeners
    canvas.on('object:added', () => { saveState(); updateLayerList(); });
    canvas.on('object:modified', () => { saveState(); updateLayerList(); updateSelectionUI(); });
    canvas.on('object:removed', () => { saveState(); updateLayerList(); });
    canvas.on('object:rotating', updateSelectionUI);

    canvas.on('selection:created', onObjectSelected);
    canvas.on('selection:updated', onObjectSelected);
    canvas.on('selection:cleared', onSelectionCleared);

    // Mouse Wheel Zoom Event
    canvas.on('mouse:wheel', function (opt) {
        let delta = opt.e.deltaY;
        let zoom = currentZoom;
        if (delta > 0) {
            zoom -= 0.05;
        } else {
            zoom += 0.05;
        }
        setZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    renderRulers();
    updateLayerList();

    lucide.createIcons();
};

// --- DARK / LIGHT MODE ENGINE ---
function toggleDarkMode() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        themeBtn.innerHTML = `<i data-lucide="moon" class="w-4 h-4"></i>`;
    } else {
        html.classList.add('dark');
        themeBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4"></i>`;
    }

    lucide.createIcons();
    renderRulers();
}

// --- ZOOM ENGINE ---
function setZoom(zoomValue) {
    currentZoom = Math.max(0.2, Math.min(3.0, parseFloat(zoomValue.toFixed(2))));

    const dim = getCanvasInputPx();
    const origW = dim.width || 400;
    const origH = dim.height || 300;

    canvas.setZoom(currentZoom);
    canvas.setDimensions({
        width: origW * currentZoom,
        height: origH * currentZoom
    });

    document.getElementById('zoomVal').textContent = `${Math.round(currentZoom * 100)}%`;
    renderRulers();
}

function zoomIn() { setZoom(currentZoom + 0.1); }
function zoomOut() { setZoom(currentZoom - 0.1); }
function resetZoom() { setZoom(1.0); }

function fitCanvasToScreen() {
    const container = document.getElementById('workspaceArea');
    if (!container) return;

    const availW = container.clientWidth - 100;
    const availH = container.clientHeight - 100;

    const dim = getCanvasInputPx();
    const origW = dim.width || 400;
    const origH = dim.height || 300;

    const zoomW = availW / origW;
    const zoomH = availH / origH;
    const fitZoom = Math.min(zoomW, zoomH, 2.0);

    setZoom(fitZoom);
}

// --- SIDEBAR TAB SWITCHER ---
function switchSidebarTab(tabName) {
    const tabs = ['elements', 'props', 'layers'];
    tabs.forEach(t => {
        const content = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);

        if (t === tabName) {
            content.classList.remove('hidden');
            btn.classList.add('border-indigo-600', 'dark:border-indigo-500', 'text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
            btn.classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
        } else {
            content.classList.add('hidden');
            btn.classList.remove('border-indigo-600', 'dark:border-indigo-500', 'text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
            btn.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400');
        }
    });
}

// --- ALIGNMENT FITUR ---
function alignObject(action) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    const dim = getCanvasInputPx();
    const origW = dim.width || 400;
    const origH = dim.height || 300;

    switch (action) {
        case 'left': activeObj.set('left', 0); break;
        case 'center-h': activeObj.set('left', (origW / 2) - (activeObj.width * activeObj.scaleX / 2)); break;
        case 'right': activeObj.set('left', origW - (activeObj.width * activeObj.scaleX)); break;
        case 'top': activeObj.set('top', 0); break;
        case 'center-v': activeObj.set('top', (origH / 2) - (activeObj.height * activeObj.scaleY / 2)); break;
        case 'bottom': activeObj.set('top', origH - (activeObj.height * activeObj.scaleY)); break;
    }

    activeObj.setCoords();
    canvas.renderAll();
    saveState();
}

// --- ROTATION FITUR ---
function rotateSelected(deltaDegree) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    let currentAngle = activeObj.angle || 0;
    let newAngle = (currentAngle + deltaDegree) % 360;
    if (newAngle < 0) newAngle += 360;

    activeObj.rotate(newAngle);
    activeObj.setCoords();
    canvas.renderAll();
    updateSelectionUI();
    saveState();
}

function setExactRotation(degree) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    activeObj.rotate(degree);
    activeObj.setCoords();
    canvas.renderAll();
    updateSelectionUI();
    saveState();
}

// --- LAYER MANAGEMENT ---
function changeLayer(action) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    switch (action) {
        case 'front': canvas.bringToFront(activeObj); break;
        case 'forward': canvas.bringForward(activeObj); break;
        case 'backward': canvas.sendBackwards(activeObj); break;
        case 'back': canvas.sendToBack(activeObj); break;
    }

    canvas.renderAll();
    updateLayerList();
    saveState();
}

function updateLayerList() {
    const container = document.getElementById('layerListContainer');
    const objects = canvas.getObjects();

    if (objects.length === 0) {
        container.innerHTML = `<div class="text-slate-400 dark:text-slate-500 text-center py-6 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">Canvas Masih Kosong</div>`;
        return;
    }

    let html = '';
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const isActive = canvas.getActiveObject() === obj;
        const isLocked = obj.selectable === false;

        let label = 'Elemen Objek';
        let iconName = 'square';

        if (obj.customType === 'text' || obj.type === 'i-text' || obj.type === 'text') {
            label = `Teks: "${obj.text ? obj.text.substring(0, 10) : ''}"`;
            iconName = 'type';
        } else if (obj.customType === 'circle') {
            label = 'Lingkaran (Circle)';
            iconName = 'circle';
        } else if (obj.customType === 'counter') {
            label = `Counter: ${obj.counterStart || '00001'}`;
            iconName = 'hash';
        } else if (obj.customType === 'datetime') {
            label = `Date: ${obj.dateFormat || '%d/%m/%Y'}`;
            iconName = 'calendar';
        } else if (obj.customType === 'variable') {
            label = `Var (^FN${obj.varNumber || 1})`;
            iconName = 'code-2';
        } else if (obj.customType === 'barcode') {
            label = `Code: ${obj.barcodeValue || ''}`;
            iconName = 'barcode';
        } else if (obj.customType === 'qrcode') {
            const qrLabel = String(obj.qrcodeValue || '').substring(0, 12);
            label = `QR: "${qrLabel}"`;
            iconName = 'qr-code';
        } else if (obj.customType === 'table') {
            label = `Tabel (${obj.tableRows || 3}x${obj.tableCols || 3})`;
            iconName = 'table';
        } else if (obj.customType === 'rect') {
            label = 'Kotak Frame';
            iconName = 'square';
        } else if (obj.customType === 'line') {
            label = 'Garis Lurus';
            iconName = 'minus';
        } else if (obj.customType === 'image' || obj.type === 'image') {
            label = 'Gambar (Image)';
            iconName = 'image';
        }

        const activeStyle = isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';

        const lockIcon = isLocked ? 'lock' : 'unlock';

        html += `
                    <div onclick="selectObjectByIndex(${i})" class="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer transition text-xs ${activeStyle} ${isLocked ? 'opacity-60' : ''}">
                        <span class="truncate flex items-center gap-2">
                            <i data-lucide="${iconName}" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"></i> ${label}
                        </span>
                        <div class="flex items-center gap-2">
                            <button onclick="toggleLockObject(event, ${i})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition" title="${isLocked ? 'Buka Kunci' : 'Kunci Elemen'}">
                                <i data-lucide="${lockIcon}" class="w-3.5 h-3.5"></i>
                            </button>
                            <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">#${i + 1}</span>
                        </div>
                    </div>
                `;
    }
    container.innerHTML = html;
    lucide.createIcons();
}

function toggleLockObject(event, index) {
    event.stopPropagation();
    const objects = canvas.getObjects();
    const obj = objects[index];
    if (!obj) return;

    const isCurrentlyLocked = obj.selectable === false;
    const willBeLocked = !isCurrentlyLocked;

    obj.set({
        selectable: !willBeLocked,
        evented: !willBeLocked,
        lockMovementX: willBeLocked,
        lockMovementY: willBeLocked,
        lockRotation: willBeLocked,
        lockScalingX: willBeLocked,
        lockScalingY: willBeLocked,
        hasControls: !willBeLocked
    });

    if (willBeLocked && canvas.getActiveObject() === obj) {
        canvas.discardActiveObject();
        onSelectionCleared();
    }

    obj.setCoords();
    canvas.renderAll();
    updateLayerList();
    saveState();
}

function selectObjectByIndex(index) {
    const objects = canvas.getObjects();
    if (objects[index]) {
        if (objects[index].selectable === false) return;
        canvas.setActiveObject(objects[index]);
        canvas.renderAll();
        updateLayerList();
        onObjectSelected({ selected: [objects[index]] });
    }
}

function updateSelectionUI() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
        const angle = Math.round(activeObj.angle || 0) % 360;
        document.getElementById('rotateDegreeVal').textContent = `${angle}°`;
    } else {
        document.getElementById('rotateDegreeVal').textContent = `0°`;
    }
}

function onSelectionCleared() {
    document.getElementById('rotateDegreeVal').textContent = `0°`;
    document.getElementById('objectEditEmpty').classList.remove('hidden');
    ['editPanelText', 'editPanelCircle', 'editPanelCounter', 'editPanelDate', 'editPanelVar', 'editPanelQR', 'editPanelBarcode', 'editPanelTable'].forEach(id => document.getElementById(id).classList.add('hidden'));
    updateLayerList();
}

// --- FILE ZPL IMPORT & EXPORT ---
function triggerOpenFile() {
    document.getElementById('zplFileInput').click();
}

function handleFileOpen(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        parseZPLAndRender(e.target.result);
        event.target.value = '';
    };
    reader.readAsText(file);
}

function parseZPLAndRender(zpl) {
    try {
        const pwMatch = zpl.match(/\^PW(\d+)/i);
        if (pwMatch) document.getElementById('canvasWidth').value = pxToMm(pwMatch[1]).toFixed(1);

        const llMatch = zpl.match(/\^LL(\d+)/i);
        if (llMatch) document.getElementById('canvasHeight').value = pxToMm(llMatch[1]).toFixed(1);

        updateCanvasSize();

        isStateLocked = true;
        canvas.clear();

        const fieldMatches = zpl.match(/\^FO\d+,\d+[\s\S]*?\^FS/gi);

        if (!fieldMatches) {
            alert('File ZPL terbuka, tetapi tidak ditemukan elemen ^FO...^FS.');
            isStateLocked = false;
            saveState();
            return;
        }

        fieldMatches.forEach(block => {
            const foMatch = block.match(/\^FO(\d+),(\d+)/i);
            if (!foMatch) return;
            const x = parseInt(foMatch[1]);
            const y = parseInt(foMatch[2]);

            let angle = 0;
            if (block.includes('R,')) angle = 90;
            else if (block.includes('I,')) angle = 180;
            else if (block.includes('B,')) angle = 270;

            if (block.includes('^GC')) {
                const gcMatch = block.match(/\^GC(\d+),(\d+)/i);
                if (gcMatch) {
                    const d = parseInt(gcMatch[1]);
                    const border = parseInt(gcMatch[2]);
                    const circle = new fabric.Circle({
                        left: x, top: y, radius: d / 2, fill: 'transparent',
                        stroke: '#000000', strokeWidth: border || 2, angle: angle, customType: 'circle'
                    });
                    canvas.add(circle);
                }
            } else if (block.includes('^BQ')) {
                const fdMatch = block.match(/\^FDLA?([^\^]+)\^FS/i);
                const val = fdMatch ? fdMatch[1] : 'QR';
                const magMatch = block.match(/\^BQN,\s*\d+\s*,\s*(\d+)/i);
                const magnification = magMatch ? Math.max(1, Math.min(10, parseInt(magMatch[1]))) : 3;
                createQRCodeObject(val, x, y, angle, magnification);
            } else if (block.includes('^BC')) {
                const fdMatch = block.match(/\^FD([^\^]+)\^FS/i);
                const val = fdMatch ? fdMatch[1] : '123456';
                createBarcodeObject(val, 'CODE128', x, y, angle);
            } else if (block.includes('^SN')) {
                const snMatch = block.match(/\^SN([^,]+),([^,]+),(Y|N)/i);
                const start = snMatch ? snMatch[1] : '00001';
                const step = snMatch ? parseInt(snMatch[2]) : 1;
                const pad = snMatch ? snMatch[3] : 'Y';
                let fontSize = 24;
                const fontMatch = block.match(/\^A0[A-Z]?,(\d+),(\d+)?/i);
                if (fontMatch) fontSize = parseInt(fontMatch[1]);

                const text = new fabric.IText(start, {
                    left: x, top: y, fontSize: fontSize, fontFamily: 'Courier Prime', fill: '#000000', angle: angle,
                    customType: 'counter', counterStart: start, counterStep: step, counterPad: pad
                });
                canvas.add(text);
            } else if (block.includes('^FN')) {
                const fnMatch = block.match(/\^FN(\d+)/i);
                const fdMatch = block.match(/\^FD([^\^]+)\^FS/i);
                const num = fnMatch ? parseInt(fnMatch[1]) : 1;
                const def = fdMatch ? fdMatch[1] : `{VAR_${num}}`;
                let fontSize = 22;
                const fontMatch = block.match(/\^A0[A-Z]?,(\d+),(\d+)?/i);
                if (fontMatch) fontSize = parseInt(fontMatch[1]);

                const text = new fabric.IText(def, {
                    left: x, top: y, fontSize: fontSize, fontFamily: 'Arial', fill: '#000000', angle: angle,
                    customType: 'variable', varNumber: num, varDefault: def
                });
                canvas.add(text);
            } else if (block.includes('%d') || block.includes('%m') || block.includes('%Y')) {
                const fdMatch = block.match(/\^FD([^\^]+)\^FS/i);
                const fmt = fdMatch ? fdMatch[1] : '%d/%m/%Y';
                const previewStr = formatZPLDatePreview(fmt, new Date());
                let fontSize = 20;
                const fontMatch = block.match(/\^A0[A-Z]?,(\d+),(\d+)?/i);
                if (fontMatch) fontSize = parseInt(fontMatch[1]);

                const text = new fabric.IText(previewStr, {
                    left: x, top: y, fontSize: fontSize, fontFamily: 'Arial', fill: '#000000', angle: angle,
                    customType: 'datetime', dateFormat: fmt
                });
                canvas.add(text);
            } else if (block.includes('^GB')) {
                const gbMatch = block.match(/\^GB(\d+),(\d+),(\d+)/i);
                if (gbMatch) {
                    const w = parseInt(gbMatch[1]);
                    const h = parseInt(gbMatch[2]);
                    const border = parseInt(gbMatch[3]);

                    if (h <= 2 || w === 0) {
                        const line = new fabric.Line([x, y, x + (w || 100), y], {
                            stroke: '#000000', strokeWidth: border || 2, angle: angle, customType: 'line'
                        });
                        canvas.add(line);
                    } else {
                        const rect = new fabric.Rect({
                            left: x, top: y, width: w, height: h, fill: 'transparent',
                            stroke: '#000000', strokeWidth: border || 2, angle: angle, customType: 'rect'
                        });
                        canvas.add(rect);
                    }
                }
            } else if (block.includes('^FD')) {
                const fdMatch = block.match(/\^FD([^\^]+)\^FS/i);
                const textVal = fdMatch ? fdMatch[1] : '';

                let fontSize = 24;
                const fontMatch = block.match(/\^A0[A-Z]?,(\d+),(\d+)?/i);
                if (fontMatch) fontSize = parseInt(fontMatch[1]);

                const text = new fabric.IText(textVal, {
                    left: x, top: y, fontSize: fontSize, fontFamily: 'Arial', fill: '#000000', angle: angle, customType: 'text'
                });
                canvas.add(text);
            }
        });

        setTimeout(() => {
            canvas.renderAll();
            isStateLocked = false;
            saveState();
            updateLayerList();
        }, 100);

    } catch (err) {
        alert('Gagal membaca file ZPL: ' + err.message);
        isStateLocked = false;
    }
}

function downloadZPLFile() {
    const zplCode = generateZPLCodeString();
    const blob = new Blob([zplCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `label_${Date.now()}.zpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- UNDO / REDO SYSTEM ---
function saveState() {
    if (isStateLocked) return;
    const json = JSON.stringify(canvas.toJSON([
        'customType', 'barcodeValue', 'barcodeFormat', 'qrcodeValue', 'qrcodeMagnification',
        'tableRows', 'tableCols', 'tableWidth', 'tableHeight', 'tableBorder', 'tableColor',
        'counterStart', 'counterStep', 'counterPad', 'dateFormat', 'varNumber', 'varDefault'
    ]));
    undoStack.push(json);
    redoStack = [];
    updateUndoRedoUI();

    localStorage.setItem('zplStudioState', json);
    localStorage.setItem('zplCanvasW', document.getElementById('canvasWidth').value);
    localStorage.setItem('zplCanvasH', document.getElementById('canvasHeight').value);
}

function undo() {
    if (undoStack.length <= 1) return;
    isStateLocked = true;
    redoStack.push(undoStack.pop());
    const prevState = undoStack[undoStack.length - 1];

    canvas.loadFromJSON(prevState, () => {
        setZoom(currentZoom);
        canvas.renderAll();
        isStateLocked = false;
        updateUndoRedoUI();
        updateLayerList();
    });
}

function redo() {
    if (redoStack.length === 0) return;
    isStateLocked = true;
    const nextState = redoStack.pop();
    undoStack.push(nextState);

    canvas.loadFromJSON(nextState, () => {
        setZoom(currentZoom);
        canvas.renderAll();
        isStateLocked = false;
        updateUndoRedoUI();
        updateLayerList();
    });
}

function updateUndoRedoUI() {
    document.getElementById('btnUndo').disabled = undoStack.length <= 1;
    document.getElementById('btnRedo').disabled = redoStack.length === 0;
}

window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isInputActive = ['input', 'textarea', 'select'].includes(activeTag);

    if (!isInputActive && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteSelected();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo();
        else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
    }
});

// --- STUDIO RULERS & GRID ---
function renderRulers() {
    const isDark = document.documentElement.classList.contains('dark');
    const topC = document.getElementById('rulerTop');
    const leftC = document.getElementById('rulerLeft');

    const dim = getCanvasInputPx();
    const origW = dim.width || mmToPx(50);
    const origH = dim.height || mmToPx(37.5);

    const widthMm = pxToMm(origW);
    const heightMm = pxToMm(origH);

    topC.width = Math.ceil(origW * currentZoom);
    topC.height = 24;
    leftC.width = 24;
    leftC.height = Math.ceil(origH * currentZoom);

    const bg = isDark ? '#090d16' : '#f8fafc';
    const stroke = isDark ? '#334155' : '#cbd5e1';
    const textCol = isDark ? '#64748b' : '#64748b';

    // Top Ruler
    const ctxT = topC.getContext('2d');
    ctxT.clearRect(0, 0, topC.width, topC.height);
    ctxT.fillStyle = bg;
    ctxT.fillRect(0, 0, topC.width, 24);
    ctxT.strokeStyle = stroke;
    ctxT.fillStyle = textCol;
    ctxT.font = '9px monospace';
    ctxT.textBaseline = 'top';

    for (let mm = 0; mm <= widthMm + 0.001; mm += 1) {
        const px = mmToPx(mm);
        const screenX = px * currentZoom;

        let tickH = 4;
        if (mm % 5 === 0) tickH = 8;
        if (mm % 10 === 0) tickH = 14;

        ctxT.beginPath();
        ctxT.moveTo(screenX, 24);
        ctxT.lineTo(screenX, 24 - tickH);
        ctxT.stroke();

        if (mm % 10 === 0) {
            ctxT.fillText(String(Math.round(mm)), screenX + 2, 2);
        }
    }

    // Left Ruler
    const ctxL = leftC.getContext('2d');
    ctxL.clearRect(0, 0, leftC.width, leftC.height);
    ctxL.fillStyle = bg;
    ctxL.fillRect(0, 0, 24, leftC.height);
    ctxL.strokeStyle = stroke;
    ctxL.fillStyle = textCol;
    ctxL.font = '9px monospace';
    ctxL.textBaseline = 'top';

    for (let mm = 0; mm <= heightMm + 0.001; mm += 1) {
        const px = mmToPx(mm);
        const screenY = px * currentZoom;

        let tickW = 4;
        if (mm % 5 === 0) tickW = 8;
        if (mm % 10 === 0) tickW = 14;

        ctxL.beginPath();
        ctxL.moveTo(24, screenY);
        ctxL.lineTo(24 - tickW, screenY);
        ctxL.stroke();

        if (mm % 10 === 0) {
            ctxL.save();
            ctxL.translate(10, screenY + 2);
            ctxL.rotate(-Math.PI / 2);
            ctxL.fillText(String(Math.round(mm)), 0, 0);
            ctxL.restore();
        }
    }
}

function toggleGrid() {
    isGridVisible = document.getElementById('gridToggle').checked;
    const gridPattern = isGridVisible ? createGridPattern() : '#ffffff';
    canvas.setBackgroundColor(gridPattern, canvas.renderAll.bind(canvas));
}

function createGridPattern() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 20; patternCanvas.height = 20;
    const pctx = patternCanvas.getContext('2d');
    pctx.fillStyle = '#ffffff'; pctx.fillRect(0, 0, 20, 20);
    pctx.strokeStyle = '#f1f5f9'; pctx.lineWidth = 1;
    pctx.strokeRect(0, 0, 20, 20);
    return new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' });
}

const LABEL_DPI = 203;
const PX_PER_MM = LABEL_DPI / 25.4;

function mmToPx(mm) {
    return Math.round((parseFloat(mm) || 0) * PX_PER_MM);
}

function pxToMm(px) {
    return (parseFloat(px) || 0) / PX_PER_MM;
}

function getCanvasInputPx() {
    return {
        width: mmToPx(document.getElementById('canvasWidth').value || 50),
        height: mmToPx(document.getElementById('canvasHeight').value || 37.5)
    };
}

function updateCanvasSize(skipSave = false) {
    const dim = getCanvasInputPx();
    const w = dim.width || 400;
    const h = dim.height || 300;

    canvas.setDimensions({ width: w, height: h });
    document.getElementById('canvasDimStatus').textContent = `${pxToMm(w).toFixed(1)} × ${pxToMm(h).toFixed(1)} mm`;
    setZoom(currentZoom);
    toggleGrid();

    // Hanya simpan state jika tidak diabaikan
    if (!skipSave) {
        saveState();
    }
}

// --- TEKS TOOL ---
function addText() {
    const val = document.getElementById('textInput').value || 'Teks Baru';
    const size = parseInt(document.getElementById('fontSizeInput').value) || 24;
    const font = document.getElementById('fontFamilySelect').value;

    const text = new fabric.IText(val, {
        left: 40, top: 30, fontSize: size, fontFamily: font, fill: '#000000', customType: 'text'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
}

function changeFontFamily(font) {
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
        activeObj.set('fontFamily', font);
        canvas.renderAll();
        saveState();
    }
}

// --- SERIAL / COUNTER TOOL ---
function addCounter() {
    const start = document.getElementById('counterStartInput').value || '00001';
    const step = parseInt(document.getElementById('counterStepInput').value) || 1;
    const pad = document.getElementById('counterPadInput').value || 'Y';
    const size = parseInt(document.getElementById('counterSizeInput').value) || 24;

    const text = new fabric.IText(start, {
        left: 40, top: 40, fontSize: size, fontFamily: 'Courier Prime', fill: '#000000',
        customType: 'counter', counterStart: start, counterStep: step, counterPad: pad
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState();
}

// --- DATE / TIME TOOL ---
function addDateTime() {
    const fmt = document.getElementById('dateFormatInput').value || '%d/%m/%Y';
    const size = parseInt(document.getElementById('dateSizeInput').value) || 20;

    const previewStr = formatZPLDatePreview(fmt, new Date());

    const text = new fabric.IText(previewStr, {
        left: 40, top: 40, fontSize: size, fontFamily: 'Arial', fill: '#000000',
        customType: 'datetime', dateFormat: fmt
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState();
}

function formatZPLDatePreview(fmt, date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const Y = date.getFullYear();
    const H = String(date.getHours()).padStart(2, '0');
    const M = String(date.getMinutes()).padStart(2, '0');
    const S = String(date.getSeconds()).padStart(2, '0');
    return fmt.replace(/%d/g, d).replace(/%m/g, m).replace(/%Y/g, Y).replace(/%H/g, H).replace(/%M/g, M).replace(/%S/g, S);
}

// --- VARIABLE TOOL ---
function addVariable() {
    const num = parseInt(document.getElementById('varNumberInput').value) || 1;
    const defVal = document.getElementById('varDefaultInput').value || `{VAR_${num}}`;

    const text = new fabric.IText(defVal, {
        left: 40, top: 40, fontSize: 22, fontFamily: 'Arial', fill: '#000000',
        customType: 'variable', varNumber: num, varDefault: defVal
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState();
}

function onObjectSelected(e) {
    const selected = e.selected ? e.selected[0] : null;
    if (selected) {
        if (selected.type === 'i-text' || selected.type === 'text') {
            if (selected.fontFamily) document.getElementById('fontFamilySelect').value = selected.fontFamily;
            if (selected.fontSize) document.getElementById('fontSizeInput').value = selected.fontSize;
        }
        updateObjectEditUI(selected);
        updateSelectionUI();
        updateLayerList();
    }
}

function switchObjectEditTab(type) {
    const types = ['text', 'circle', 'counter', 'datetime', 'variable', 'qrcode', 'barcode', 'table'];
    types.forEach(t => {
        let tabId = 'editTab' + t.charAt(0).toUpperCase() + t.slice(1);
        if (t === 'datetime') tabId = 'editTabDate';
        if (t === 'variable') tabId = 'editTabVar';

        let panelId = 'editPanel' + t.charAt(0).toUpperCase() + t.slice(1);
        if (t === 'datetime') panelId = 'editPanelDate';
        if (t === 'variable') panelId = 'editPanelVar';

        const btn = document.getElementById(tabId);
        const panel = document.getElementById(panelId);
        if (!btn || !panel) return;

        const active = t === type;
        panel.classList.toggle('hidden', !active);
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('dark:bg-slate-800', active);
        btn.classList.toggle('text-indigo-600', active);
        btn.classList.toggle('dark:text-indigo-400', active);
        btn.classList.toggle('shadow-sm', active);
        btn.classList.toggle('text-slate-500', !active);
    });
}

function updateObjectEditUI(obj) {
    const empty = document.getElementById('objectEditEmpty');
    if (!obj || !['text', 'circle', 'counter', 'datetime', 'variable', 'qrcode', 'barcode', 'table'].includes(obj.customType)) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    if (obj.customType === 'text' || (obj.type === 'i-text' && !obj.customType)) {
        document.getElementById('editTextValue').value = obj.text || '';
        document.getElementById('editTextFont').value = obj.fontFamily || 'Arial';
        document.getElementById('editTextSize').value = Math.round(obj.fontSize || 24);
        document.getElementById('editTextWeight').value = obj.fontWeight || 'normal';
        document.getElementById('editTextColor').value = obj.fill || '#000000';
        switchObjectEditTab('text');
    } else if (obj.customType === 'circle') {
        const diameterMm = pxToMm(obj.radius * 2 * obj.scaleX);
        document.getElementById('editCircleDiameter').value = diameterMm.toFixed(1);
        document.getElementById('editCircleBorder').value = Math.round(obj.strokeWidth || 2);
        switchObjectEditTab('circle');
    } else if (obj.customType === 'counter') {
        document.getElementById('editCounterStart').value = obj.counterStart || '00001';
        document.getElementById('editCounterStep').value = obj.counterStep || 1;
        document.getElementById('editCounterPad').value = obj.counterPad || 'Y';
        document.getElementById('editCounterSize').value = Math.round(obj.fontSize || 24);
        switchObjectEditTab('counter');
    } else if (obj.customType === 'datetime') {
        document.getElementById('editDateFormat').value = obj.dateFormat || '%d/%m/%Y';
        document.getElementById('editDateSize').value = Math.round(obj.fontSize || 20);
        switchObjectEditTab('datetime');
    } else if (obj.customType === 'variable') {
        document.getElementById('editVarNumber').value = obj.varNumber || 1;
        document.getElementById('editVarDefault').value = obj.varDefault || '{VAR_1}';
        document.getElementById('editVarSize').value = Math.round(obj.fontSize || 22);
        switchObjectEditTab('variable');
    } else if (obj.customType === 'qrcode') {
        document.getElementById('editQRValue').value = obj.qrcodeValue || '';
        document.getElementById('editQRMagnification').value = String(obj.qrcodeMagnification || 3);
        switchObjectEditTab('qrcode');
    } else if (obj.customType === 'barcode') {
        document.getElementById('editBarcodeValue').value = obj.barcodeValue || '';
        document.getElementById('editBarcodeType').value = obj.barcodeFormat || 'CODE128';
        switchObjectEditTab('barcode');
    } else if (obj.customType === 'table') {
        document.getElementById('editTableRows').value = obj.tableRows || 3;
        document.getElementById('editTableCols').value = obj.tableCols || 3;
        document.getElementById('editTableWidth').value = pxToMm(obj.tableWidth || 100).toFixed(1);
        document.getElementById('editTableHeight').value = pxToMm(obj.tableHeight || 50).toFixed(1);
        document.getElementById('editTableBorder').value = obj.tableBorder || 2;
        switchObjectEditTab('table');
    }
}

function applyTextEdit() {
    const obj = canvas.getActiveObject();
    if (!obj) return;

    obj.set({
        text: document.getElementById('editTextValue').value || 'Teks Baru',
        fontFamily: document.getElementById('editTextFont').value || 'Arial',
        fontSize: parseInt(document.getElementById('editTextSize').value) || 24,
        fontWeight: document.getElementById('editTextWeight').value,
        fill: document.getElementById('editTextColor').value
    });

    obj.setCoords();
    canvas.renderAll();
    saveState();
    updateLayerList();
}

function applyCircleEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'circle') return;

    const diameterMm = parseFloat(document.getElementById('editCircleDiameter').value) || 10;
    const border = parseInt(document.getElementById('editCircleBorder').value) || 2;
    const radiusPx = mmToPx(diameterMm) / 2;

    obj.set({
        radius: radiusPx,
        strokeWidth: border,
        scaleX: 1,
        scaleY: 1
    });

    obj.setCoords();
    canvas.renderAll();
    saveState();
}

function applyCounterEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'counter') return;

    const start = document.getElementById('editCounterStart').value || '00001';
    const step = parseInt(document.getElementById('editCounterStep').value) || 1;
    const pad = document.getElementById('editCounterPad').value || 'Y';
    const size = parseInt(document.getElementById('editCounterSize').value) || 24;

    obj.set({
        text: start,
        fontSize: size,
        counterStart: start,
        counterStep: step,
        counterPad: pad
    });

    obj.setCoords();
    canvas.renderAll();
    saveState();
    updateLayerList();
}

function applyDateTimeEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'datetime') return;

    const fmt = document.getElementById('editDateFormat').value || '%d/%m/%Y';
    const size = parseInt(document.getElementById('editDateSize').value) || 20;
    const previewStr = formatZPLDatePreview(fmt, new Date());

    obj.set({
        text: previewStr,
        fontSize: size,
        dateFormat: fmt
    });

    obj.setCoords();
    canvas.renderAll();
    saveState();
    updateLayerList();
}

function applyVariableEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'variable') return;

    const num = parseInt(document.getElementById('editVarNumber').value) || 1;
    const defVal = document.getElementById('editVarDefault').value || `{VAR_${num}}`;
    const size = parseInt(document.getElementById('editVarSize').value) || 22;

    obj.set({
        text: defVal,
        fontSize: size,
        varNumber: num,
        varDefault: defVal
    });

    obj.setCoords();
    canvas.renderAll();
    saveState();
    updateLayerList();
}

function applyQREdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'qrcode') return;
    const value = document.getElementById('editQRValue').value.trim() || 'QR';
    const mag = parseInt(document.getElementById('editQRMagnification').value) || 3;
    replaceCodeObject(obj, 'qrcode', value, mag);
}

function applyBarcodeEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'barcode') return;
    const value = document.getElementById('editBarcodeValue').value.trim() || '123456';
    const format = document.getElementById('editBarcodeType').value || 'CODE128';
    replaceCodeObject(obj, 'barcode', value, format);
}

function replaceCodeObject(oldObj, kind, value, option) {
    const left = oldObj.left || 0, top = oldObj.top || 0, angle = oldObj.angle || 0;
    const scaleX = oldObj.scaleX || 1, scaleY = oldObj.scaleY || 1;
    canvas.remove(oldObj);
    const done = (newObj) => {
        newObj.set({ left, top, angle, scaleX, scaleY });
        canvas.add(newObj); canvas.setActiveObject(newObj); newObj.setCoords();
        canvas.renderAll(); updateObjectEditUI(newObj); updateLayerList(); saveState();
    };
    if (kind === 'barcode') {
        createBarcodeObject(value, option, left, top, angle, done);
    } else {
        createQRCodeObject(value, left, top, angle, option, done);
    }
}

// --- BARCODE TOOL ---
function addBarcode() {
    const val = document.getElementById('barcodeInput').value || '123456';
    const type = document.getElementById('barcodeType').value;
    createBarcodeObject(val, type, 40, 90);
}

function createBarcodeObject(value, format, left, top, angle = 0, callback = null) {
    try {
        const tempCanvas = document.getElementById('barcodeTempCanvas');
        JsBarcode(tempCanvas, value, {
            format: format, width: 2, height: 50, displayValue: true, fontSize: 14, margin: 0
        });

        const imgData = tempCanvas.toDataURL("image/png");

        fabric.Image.fromURL(imgData, function (img) {
            img.set({
                left: left, top: top, angle: angle, customType: 'barcode', barcodeValue: value, barcodeFormat: format
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            if (callback) callback(img);
        });
    } catch (e) {
        alert("Format teks barcode tidak valid!");
    }
}

// --- QR CODE TOOL ---
function addQRCode() {
    const val = document.getElementById('qrcodeInput').value.trim() || 'QR';
    const magnification = parseInt(document.getElementById('qrcodeMagnification').value) || 3;
    createQRCodeObject(val, 40, 160, 0, magnification);
}

function createQRCodeObject(value, left, top, angle = 0, magnification = 3, callback = null) {
    if (typeof QRCode === 'undefined') {
        alert('Library QR Code belum tersedia. Pastikan koneksi internet aktif.');
        return;
    }

    const temp = document.getElementById('qrcodeTemp');
    temp.innerHTML = '';

    const px = Math.max(29, magnification * 25);
    new QRCode(temp, {
        text: String(value),
        width: px,
        height: px,
        correctLevel: QRCode.CorrectLevel.M
    });

    setTimeout(() => {
        const qrCanvas = temp.querySelector('canvas');
        const qrImg = temp.querySelector('img');

        let imgData = null;
        if (qrCanvas) {
            imgData = qrCanvas.toDataURL('image/png');
        } else if (qrImg && qrImg.src) {
            imgData = qrImg.src;
        }

        if (!imgData) {
            alert('Gagal membuat QR Code.');
            return;
        }

        fabric.Image.fromURL(imgData, function (img) {
            img.set({
                left: left,
                top: top,
                angle: angle,
                customType: 'qrcode',
                qrcodeValue: String(value),
                qrcodeMagnification: magnification
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            if (callback) callback(img);
        });
    }, 50);
}

// --- TABLE TOOL ---
function createTableObject(rows, cols, tableWidth, tableHeight, borderWidth, strokeColor = '#000000', left = 40, top = 40) {
    const items = [];

    const outerRect = new fabric.Rect({
        left: 0, top: 0, width: tableWidth, height: tableHeight,
        fill: 'transparent', stroke: strokeColor, strokeWidth: borderWidth
    });
    items.push(outerRect);

    const rowH = tableHeight / rows;
    for (let r = 1; r < rows; r++) {
        const lineY = r * rowH;
        const hLine = new fabric.Line([0, lineY, tableWidth, lineY], { stroke: strokeColor, strokeWidth: borderWidth });
        items.push(hLine);
    }

    const colW = tableWidth / cols;
    for (let c = 1; c < cols; c++) {
        const lineX = c * colW;
        const vLine = new fabric.Line([lineX, 0, lineX, tableHeight], { stroke: strokeColor, strokeWidth: borderWidth });
        items.push(vLine);
    }

    const group = new fabric.Group(items, {
        left: left, top: top, customType: 'table',
        tableRows: rows, tableCols: cols, tableWidth: tableWidth, tableHeight: tableHeight, tableBorder: borderWidth
    });

    return group;
}

function addTable() {
    const rows = parseInt(document.getElementById('tableRowsInput').value) || 3;
    const cols = parseInt(document.getElementById('tableColsInput').value) || 3;
    const widthMm = parseFloat(document.getElementById('tableWidthInput').value) || 30;
    const heightMm = parseFloat(document.getElementById('tableHeightInput').value) || 15;
    const borderWidth = parseInt(document.getElementById('tableBorderInput').value) || 2;

    const tableObj = createTableObject(rows, cols, mmToPx(widthMm), mmToPx(heightMm), borderWidth);
    canvas.add(tableObj);
    canvas.setActiveObject(tableObj);
    canvas.renderAll();
    saveState();
    updateLayerList();
}

function applyTableEdit() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.customType !== 'table') return;

    const rows = parseInt(document.getElementById('editTableRows').value) || 3;
    const cols = parseInt(document.getElementById('editTableCols').value) || 3;
    const widthMm = parseFloat(document.getElementById('editTableWidth').value) || 30;
    const heightMm = parseFloat(document.getElementById('editTableHeight').value) || 15;
    const borderWidth = parseInt(document.getElementById('editTableBorder').value) || 2;

    const left = obj.left;
    const top = obj.top;
    const angle = obj.angle;

    canvas.remove(obj);

    const newTable = createTableObject(rows, cols, mmToPx(widthMm), mmToPx(heightMm), borderWidth, '#000000', left, top);
    newTable.set({ angle: angle });

    canvas.add(newTable);
    canvas.setActiveObject(newTable);
    canvas.renderAll();
    saveState();
    updateLayerList();
    updateObjectEditUI(newTable);
}

// --- BENTUK VEKTOR ---
function addRectangle() {
    const rect = new fabric.Rect({
        left: 30, top: 30, fill: 'transparent', stroke: '#000000', strokeWidth: 3, width: 340, height: 230, customType: 'rect'
    });
    canvas.add(rect); canvas.renderAll();
}

function addCircle() {
    const circle = new fabric.Circle({
        left: 40, top: 40, radius: 30, fill: 'transparent', stroke: '#000000', strokeWidth: 3, customType: 'circle'
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    saveState();
}

function addLine() {
    const line = new fabric.Line([30, 50, 370, 50], { stroke: '#000000', strokeWidth: 3, customType: 'line' });
    canvas.add(line); canvas.renderAll();
}

// --- IMAGE TOOL ---
function addImage() {
    const fileInput = document.getElementById('imageInput');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Silakan pilih file gambar (JPG/PNG) terlebih dahulu!');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function (img) {
            if (img.width > 200) img.scaleToWidth(200);
            img.set({ left: 30, top: 30, customType: 'image' });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            fileInput.value = '';
        });
    };
    reader.readAsDataURL(file);
}

function deleteSelected() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        activeObjects.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
    }
}

function clearCanvas() {
    if (confirm("Hapus seluruh elemen dari canvas?")) {
        canvas.clear();
        toggleGrid();
        localStorage.removeItem('zplStudioState');
    }
}

function initSampleObjects() {
    toggleGrid();
    const text = new fabric.IText('SAMPLE LABEL', {
        left: 30, top: 20, fontSize: 26, fontFamily: 'Montserrat', fill: '#000000', customType: 'text'
    });
    canvas.add(text);
    createBarcodeObject('899123456', 'CODE128', 30, 80);
}

// --- ZPL GENERATOR ---
function imageToZPLHex(fabricImage) {
    const tempCanvas = document.createElement('canvas');
    const width = Math.round(fabricImage.width * fabricImage.scaleX);
    const height = Math.round(fabricImage.height * fabricImage.scaleY);

    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const imgElement = fabricImage.getElement();
    ctx.drawImage(imgElement, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let hexString = '';
    let byteVal = 0;
    let bitCount = 0;
    const bytesPerRow = Math.ceil(width / 8);
    const totalBytes = bytesPerRow * height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 128) {
                byteVal = (byteVal << 1) | 0;
            } else {
                const gray = (r * 0.299 + g * 0.587 + b * 0.114);
                const isBlack = (gray < 140) ? 1 : 0;
                byteVal = (byteVal << 1) | isBlack;
            }

            bitCount++;

            if (bitCount === 8) {
                hexString += byteVal.toString(16).padStart(2, '0').toUpperCase();
                byteVal = 0;
                bitCount = 0;
            }
        }

        if (bitCount > 0) {
            byteVal = byteVal << (8 - bitCount);
            hexString += byteVal.toString(16).padStart(2, '0').toUpperCase();
            byteVal = 0;
            bitCount = 0;
        }
        hexString += '\n';
    }

    return {
        hex: hexString,
        totalBytes: totalBytes,
        bytesPerRow: bytesPerRow
    };
}

function getZPLOrientation(angle) {
    const norm = ((Math.round(angle) % 360) + 360) % 360;
    if (norm >= 45 && norm < 135) return 'R';
    if (norm >= 135 && norm < 225) return 'I';
    if (norm >= 225 && norm < 315) return 'B';
    return 'N';
}

function generateZPLCodeString() {
    const objects = canvas.getObjects();
    const dim = getCanvasInputPx();
    const origW = dim.width || 400;
    const origH = dim.height || 300;

    let zpl = `^XA\n^PW${origW}\n^LL${origH}\n`;

    objects.forEach(obj => {
        const left = Math.round(obj.left);
        const top = Math.round(obj.top);
        const orient = getZPLOrientation(obj.angle || 0);

        if (obj.customType === 'text' || (obj.type === 'i-text' && !obj.customType)) {
            const fontHeight = Math.round(obj.fontSize * obj.scaleY);
            const fontWidth = Math.round(fontHeight * 0.75);
            const textStr = obj.text;
            zpl += `\n^FO${left},${top}\n^A0${orient},${fontHeight},${fontWidth}\n^FD${textStr}^FS\n`;
        } else if (obj.customType === 'circle') {
            const d = Math.round(obj.radius * 2 * obj.scaleX);
            const border = Math.round((obj.strokeWidth || 2) * obj.scaleX);
            zpl += `\n^FO${left},${top}\n^GC${d},${border},B^FS\n`;
        } else if (obj.customType === 'counter') {
            const fontHeight = Math.round(obj.fontSize * obj.scaleY);
            const fontWidth = Math.round(fontHeight * 0.75);
            const start = obj.counterStart || '00001';
            const step = obj.counterStep || 1;
            const pad = obj.counterPad || 'Y';
            zpl += `\n^FO${left},${top}\n^A0${orient},${fontHeight},${fontWidth}\n^SN${start},${step},${pad}^FS\n`;
        } else if (obj.customType === 'datetime') {
            const fontHeight = Math.round(obj.fontSize * obj.scaleY);
            const fontWidth = Math.round(fontHeight * 0.75);
            const fmt = obj.dateFormat || '%d/%m/%Y';
            zpl += `\n^FC%\n^FO${left},${top}\n^A0${orient},${fontHeight},${fontWidth}\n^FD${fmt}^FS\n`;
        } else if (obj.customType === 'variable') {
            const fontHeight = Math.round(obj.fontSize * obj.scaleY);
            const fontWidth = Math.round(fontHeight * 0.75);
            const num = obj.varNumber || 1;
            const def = obj.varDefault || '{VAR_1}';
            zpl += `\n^FO${left},${top}\n^A0${orient},${fontHeight},${fontWidth}\n^FN${num}^FD${def}^FS\n`;
        } else if (obj.customType === 'barcode') {
            const val = obj.barcodeValue || "123456";
            const height = Math.round(obj.height * obj.scaleY);
            const format = obj.barcodeFormat || 'CODE128';
            if (format === 'EAN13') {
                zpl += `\n^FO${left},${top}\n^BE${orient},${height},Y,N\n^FD${val}^FS\n`;
            } else if (format === 'CODE39') {
                zpl += `\n^FO${left},${top}\n^B3${orient},N,${height},Y,N\n^FD${val}^FS\n`;
            } else {
                zpl += `\n^FO${left},${top}\n^BC${orient},${height},Y,N,N\n^FD${val}^FS\n`;
            }
        } else if (obj.customType === 'qrcode') {
            const val = obj.qrcodeValue || "QR";
            const mag = obj.qrcodeMagnification || 3;
            zpl += `\n^FO${left},${top}\n^BQN,2,${mag}\n^FDLA,${val}^FS\n`;
        } else if (obj.customType === 'rect') {
            const w = Math.round(obj.width * obj.scaleX);
            const h = Math.round(obj.height * obj.scaleY);
            const border = Math.round(obj.strokeWidth || 2);
            zpl += `\n^FO${left},${top}\n^GB${w},${h},${border}^FS\n`;
        } else if (obj.customType === 'line') {
            const w = Math.round((obj.width || 100) * obj.scaleX);
            const border = Math.round(obj.strokeWidth || 2);
            zpl += `\n^FO${left},${top}\n^GB${w},${border},${border}^FS\n`;
        } else if (obj.customType === 'table') {
            const rows = obj.tableRows || 3;
            const cols = obj.tableCols || 3;
            const w = Math.round((obj.tableWidth || 200) * obj.scaleX);
            const h = Math.round((obj.tableHeight || 100) * obj.scaleY);
            const border = Math.round((obj.tableBorder || 2) * Math.min(obj.scaleX, obj.scaleY));

            zpl += `\n^FO${left},${top}\n^GB${w},${h},${border}^FS\n`;

            const rowH = h / rows;
            for (let r = 1; r < rows; r++) {
                const lineY = Math.round(top + r * rowH);
                zpl += `^FO${left},${lineY}\n^GB${w},${border},${border}^FS\n`;
            }

            const colW = w / cols;
            for (let c = 1; c < cols; c++) {
                const lineX = Math.round(left + c * colW);
                zpl += `^FO${lineX},${top}\n^GB${border},${h},${border}^FS\n`;
            }
        } else if (obj.customType === 'image' || obj.type === 'image') {
            const imgData = imageToZPLHex(obj);
            if (imgData) {
                zpl += `\n^FO${left},${top}\n^GFA,${imgData.totalBytes},${imgData.totalBytes},${imgData.bytesPerRow},${imgData.hex}^FS\n`;
            }
        }
    });

    zpl += `\n^XZ`;
    return zpl;
}

function generateZPL() {
    const zplCode = generateZPLCodeString();
    document.getElementById('zplOutput').value = zplCode;
    document.getElementById('zplModal').classList.remove('hidden');
    renderZPLPreview(zplCode);
}

function closeModal() {
    document.getElementById('zplModal').classList.add('hidden');
}

function copyZPL() {
    const copyText = document.getElementById('zplOutput');
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert('Kode ZPL berhasil disalin ke clipboard!');
}

function renderZPLPreview(zpl) {
    const container = document.getElementById('zplPreviewContainer');
    container.innerHTML = `<span class="text-xs text-slate-500 flex items-center gap-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Rendering Preview...</span>`;
    lucide.createIcons();

    const w = document.getElementById('canvasWidth').value || 50;
    const h = document.getElementById('canvasHeight').value || 37.5;
    const labelaryUrl = `https://api.labelary.com/v1/printers/8dpmm/labels/${w}x${h}/0/`;

    fetch(labelaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: zpl
    })
        .then(res => {
            if (res.ok) return res.blob();
            throw new Error('Gagal merender preview ZPL');
        })
        .then(blob => {
            const imgUrl = URL.createObjectURL(blob);
            container.innerHTML = `<img src="${imgUrl}" class="max-w-full max-h-[250px] object-contain border border-slate-300 dark:border-slate-700 rounded shadow-md" alt="ZPL Label Preview">`;
        })
        .catch(err => {
            container.innerHTML = `<div class="text-center text-xs text-red-500"><i data-lucide="alert-circle" class="w-5 h-5 mx-auto mb-1"></i> Gagal memuat simulasi printer.<br><span class="text-[10px] text-slate-400">Gunakan printer fisik atau ZPL viewer online.</span></div>`;
            lucide.createIcons();
        });
}

// --- QZ TRAY TCP/IP PRINTING ENGINE ---
function printViaQZ() {
    const ip = document.getElementById('printerIp').value;
    const port = document.getElementById('printerPort').value || '9100';
    const zplData = document.getElementById('zplOutput').value;

    if (!ip) {
        alert('Harap masukkan alamat IP Printer.');
        return;
    }
    if (!zplData) {
        alert('Data ZPL kosong, silakan Export ZPL terlebih dahulu.');
        return;
    }

    if (!qz.websocket.isActive()) {
        qz.websocket.connect().then(() => {
            sendDataToTCP(ip, port, zplData);
        }).catch((err) => {
            console.error(err);
            alert('Gagal terhubung ke QZ Tray. Pastikan aplikasi QZ Tray berjalan di latar belakang.');
        });
    } else {
        sendDataToTCP(ip, port, zplData);
    }
}

function sendDataToTCP(ip, port, zplData) {
    const config = qz.configs.create({
        host: ip,
        port: parseInt(port) || 9100
    });
    const data = [zplData];

    qz.print(config, data).then(() => {
        alert('Sukses mengirim label ZPL ke printer: ' + ip + ':' + port);
    }).catch((err) => {
        console.error(err);
        alert('Terjadi kesalahan saat mengirim cetakan: ' + err);
    });
}
