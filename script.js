const canvas = document.getElementById('benchCanvas');
const ctx = canvas.getContext('2d');

// === БЛОК КРИСТАЛЬНОЇ ЧІТКОСТІ ===
const dpr = window.devicePixelRatio || 1;
const baseWidth = 700;
const baseHeight = 400;
canvas.width = baseWidth * dpr;
canvas.height = baseHeight * dpr;
canvas.style.width = baseWidth + 'px';
canvas.style.height = baseHeight + 'px';
ctx.scale(dpr, dpr);
// ================================

const clearBtn = document.getElementById('clearBtn');

// Поточний етап (підміняється з canvas_bench.py)
let currentStage = "stage1";

let wires = [];
let activeTerminal = null;
let mouseX = 0;
let mouseY = 0;
let isDrawing = false;

// Потенціометр (4): значення від 0.000 до 1.000 (від 0 до 16 В)
let knob = { x: 140, y: 155, r: 24, value: 0.0, angle: -Math.PI * 0.75, isDragging: false };

// Зонд (3): x_cm від 0.0 до 5.0 см (крок 0.5 см)
let probeState = { x_cm: 0.0, isDragging: false };

// Реалістична похибка приладів для кожної точки x (від -0.09 до +0.09 В)
const noiseTable = [0.00, 0.06, -0.05, 0.08, -0.07, 0.09, -0.04, 0.07, -0.08, 0.05, -0.02];

// Клеми на стенді (за Рис. 3.4)
const terminals = [
    // Джерело ~16 В
    { id: "src_left",  name: "0 В",  x: 45,  y: 75,  r: 7, color: "#1E1E1E" },
    { id: "src_right", name: "16 В", x: 115, y: 75,  r: 7, color: "#FF4B4B" },

    // Потенціометр (4)
    { id: "pot_left",  name: "R1",   x: 40,  y: 195, r: 7, color: "#666666" },
    { id: "pot_right", name: "R2",   x: 240, y: 195, r: 7, color: "#666666" },
    { id: "pot_wiper", name: "Повз.",x: 140, y: 110, r: 7, color: "#32CD32" },

    // Вольтметр (V)
    { id: "volt_1",    name: "COM",  x: 315, y: 95,  r: 7, color: "#1E1E1E" },
    { id: "volt_2",    name: "V",    x: 395, y: 95,  r: 7, color: "#FF8C00" },

    // Осцилограф-нуль-індикатор (5)
    { id: "osc_1",     name: "Y1",   x: 525, y: 120, r: 7, color: "#2E8B57" },
    { id: "osc_2",     name: "Y2",   x: 615, y: 120, r: 7, color: "#2E8B57" },

    // Ванна з водою: електроди 1 і 2 + зонд 3
    { id: "el_1",      name: "Ел. 1", x: 40,  y: 315, r: 7, color: "#FF4B4B" },
    { id: "el_2",      name: "Ел. 2", x: 370, y: 315, r: 7, color: "#1E1E1E" },
    { id: "probe",     name: "Зонд 3",x: 205, y: 235, r: 7, color: "#0077CC" }
];

function hasWire(t1, t2) {
    return wires.some(w =>
        (w.from.id === t1 && w.to.id === t2) ||
        (w.from.id === t2 && w.to.id === t1)
    );
}

// Теоретичний + експериментальний потенціал у точці зонда (В)
function getProbePotential() {
    const idx = Math.round(probeState.x_cm * 2); // 0..10
    const noise = (idx === 0 || idx === 10) ? 0.0 : noiseTable[idx];
    let phi_ideal = 0.0;

    if (currentStage === "stage1") {
        // Плоский конденсатор (r = 5.0 см, φ2 - φ1 = 16 В)
        phi_ideal = (16.0 / 5.0) * probeState.x_cm;
    } else {
        // Циліндричний конденсатор (R1 = 2.5 см, R2 = 7.5 см, k = 14.57 В)
        const k = 16.0 / Math.log(7.5 / 2.5);
        phi_ideal = k * Math.log((probeState.x_cm + 2.5) / 2.5);
    }
    return Math.min(Math.max(phi_ideal + noise, 0.0), 16.0);
}

function getCircuitState() {
    const bathOk = hasWire("src_left", "el_2") && hasWire("src_right", "el_1");
    const potOk  = hasWire("src_left", "pot_left") && hasWire("src_right", "pot_right");
    const oscOk  = (hasWire("probe", "osc_1") && hasWire("pot_wiper", "osc_2")) ||
                   (hasWire("probe", "osc_2") && hasWire("pot_wiper", "osc_1"));
    const voltOk = (hasWire("el_2", "volt_1") && hasWire("pot_wiper", "volt_2")) ||
                   (hasWire("pot_left", "volt_1") && hasWire("pot_wiper", "volt_2")) ||
                   (hasWire("src_left", "volt_1") && hasWire("pot_wiper", "volt_2"));

    const potVoltage = knob.value * 16.0;
    const probeVoltage = getProbePotential();

    return {
        voltReading: (potOk && voltOk) ? potVoltage : 0.0,
        oscActive: (bathOk && potOk && oscOk),
        unbalance: potVoltage - probeVoltage,
        bathOk, potOk, oscOk, voltOk
    };
}
// Координати робочої зони зонда у ванні (від x=0 до x=5.0 см)
const bathBox = { x: 65, y: 255, w: 280, h: 120 };
const probeTrack = { xStart: 295, xEnd: 115, y: 315 };

function getProbeScreenX() {
    const ratio = probeState.x_cm / 5.0;
    return probeTrack.xStart + ratio * (probeTrack.xEnd - probeTrack.xStart);
}

function drawBench() {
    ctx.clearRect(0, 0, baseWidth, baseHeight);
    const state = getCircuitState();
    knob.angle = -Math.PI * 0.75 + knob.value * (Math.PI * 1.5);

    // 1. Джерело ~16 В
    ctx.fillStyle = "#EAEAEA";
    ctx.fillRect(20, 15, 120, 75);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 15, 120, 75);
    ctx.fillStyle = "#222";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Джерело ~16 В", 80, 42);

    // 2. Потенціометр (4)
    ctx.fillStyle = "#D8D8D8";
    ctx.fillRect(55, 120, 170, 95);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(55, 120, 170, 95);
    ctx.fillStyle = "#222";
    ctx.font = "bold 11px Arial";
    ctx.fillText("Потенціометр (4)", 140, 207);

    // Ручка потенціометра
    ctx.beginPath();
    ctx.arc(knob.x, knob.y, knob.r, 0, 2 * Math.PI);
    ctx.fillStyle = "#4A4A4A";
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(knob.x, knob.y);
    ctx.lineTo(knob.x + knob.r * Math.cos(knob.angle), knob.y + knob.r * Math.sin(knob.angle));
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1.5;

    // 3. Вольтметр (V)
    ctx.fillStyle = "#222222";
    ctx.fillRect(275, 15, 160, 95);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(275, 15, 160, 95);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(285, 32, 140, 42);

    ctx.fillStyle = "#AAA";
    ctx.font = "bold 10px Arial";
    ctx.fillText("ВОЛЬТМЕТР (V)", 355, 27);

    ctx.fillStyle = "#FF2222";
    ctx.font = "bold 22px 'Courier New'";
    ctx.textAlign = "right";
    ctx.fillText(state.voltReading.toFixed(2), 395, 61);
    ctx.font = "bold 12px Arial";
    ctx.fillText("В", 418, 60);

    // 4. Осцилограф-нуль-індикатор (5)
    ctx.fillStyle = "#2F3640";
    ctx.fillRect(485, 15, 190, 125);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(485, 15, 190, 125);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ОСЦИЛОГРАФ (5) — НУЛЬ-ІНДИКАТОР", 580, 28);

    const scrX = 525, scrY = 35, scrW = 110, scrH = 72;
    ctx.fillStyle = "#082914";
    ctx.fillRect(scrX, scrY, scrW, scrH);
    ctx.strokeStyle = "#555";
    ctx.strokeRect(scrX, scrY, scrW, scrH);

    ctx.strokeStyle = "rgba(0, 255, 100, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scrX + scrW / 2, scrY);
    ctx.lineTo(scrX + scrW / 2, scrY + scrH);
    ctx.moveTo(scrX, scrY + scrH / 2);
    ctx.lineTo(scrX + scrW, scrY + scrH / 2);
    ctx.stroke();

    const cx = scrX + scrW / 2;
    const cy = scrY + scrH / 2;
    if (state.oscActive) {
        const amp = Math.min(Math.abs(state.unbalance) * 8.0, 30);
        if (amp < 0.35) {
            ctx.beginPath();
            ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = "#00FF66";
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx, cy - amp);
            ctx.lineTo(cx, cy + amp);
            ctx.strokeStyle = "#00FF66";
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 255, 102, 0.35)";
        ctx.fill();
    }

    // 5. Ванна з водою та електродами (1, 2)
    ctx.fillStyle = "#D6EAF8";
    ctx.fillRect(bathBox.x, bathBox.y, bathBox.w, bathBox.h);
    ctx.strokeStyle = "#2874A6";
    ctx.lineWidth = 2;
    ctx.strokeRect(bathBox.x, bathBox.y, bathBox.w, bathBox.h);

    ctx.fillStyle = "#1B4F72";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
        currentStage === "stage1" ? "Ванна з водою (плоскі електроди)" : "Ванна з водою (циліндричні електроди)",
        bathBox.x + 8, bathBox.y + 15
    );

    if (currentStage === "stage1") {
        ctx.fillStyle = "#B03A2E";
        ctx.fillRect(105, 275, 8, 80);
        ctx.fillStyle = "#2C3E50";
        ctx.fillRect(297, 275, 8, 80);
    } else {
        ctx.beginPath();
        ctx.arc(115, 315, 14, 0, 2 * Math.PI);
        ctx.fillStyle = "#B03A2E";
        ctx.fill();
        ctx.strokeStyle = "#641E16";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(115, 315, 185, -0.32, 0.32);
        ctx.strokeStyle = "#2C3E50";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.lineWidth = 1.5;
    }
    // Лінійка координат x (від 0 до 5.0 см)
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(probeTrack.xEnd, 362);
    ctx.lineTo(probeTrack.xStart, 362);
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 10; i++) {
        const xVal = i * 0.5;
        const px = probeTrack.xStart + (i / 10) * (probeTrack.xEnd - probeTrack.xStart);
        ctx.beginPath();
        ctx.moveTo(px, 358);
        ctx.lineTo(px, 366);
        ctx.stroke();
        if (i % 2 === 0) {
            ctx.fillText(xVal.toFixed(0), px, 374);
        }
    }

    // Рухомий зонд (3)
    const px = getProbeScreenX();
    ctx.beginPath();
    ctx.arc(px, probeTrack.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#0077CC";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Інформаційна плашка координати зонда праворуч від ванни
    ctx.fillStyle = "#FFF";
    ctx.fillRect(435, 255, 240, 120);
    ctx.strokeStyle = "#BBB";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(435, 255, 240, 120);

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Положення зонда (3): x = ${probeState.x_cm.toFixed(1)} см`, 448, 282);

    ctx.font = "11px Arial";
    ctx.fillStyle = "#444";
    ctx.fillText("• Тягніть синій зонд мишкою у ванні", 448, 306);
    ctx.fillText("• Або натисніть ↑ / ↓ для кроку 0.5 см", 448, 324);
    ctx.fillText("• ← / → — точна підстройка потенціометра", 448, 342);

    // Статус збірки схеми
    const isReady = state.bathOk && state.potOk && state.oscOk && state.voltOk;
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = isReady ? "#1E8449" : "#C0392B";
    ctx.fillText(
        isReady ? "✅ Схему зібрано правильно!" : "⚠️ З'єднайте всі клеми згідно з Рис. 3.4",
        448, 364
    );

    // Клеми та підписи
    terminals.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, 2 * Math.PI);
        ctx.fillStyle = t.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#111";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(t.name, t.x, t.y - t.r - 4);
    });

    // Дроти
    wires.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(w.from.x, w.from.y);
        ctx.bezierCurveTo(w.from.x, w.from.y + 35, w.to.x, w.to.y + 35, w.to.x, w.to.y);
        ctx.strokeStyle = "#0055FF";
        ctx.lineWidth = 2.8;
        ctx.stroke();
    });

    if (isDrawing && activeTerminal) {
        ctx.beginPath();
        ctx.moveTo(activeTerminal.x, activeTerminal.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = "rgba(0, 85, 255, 0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function updateCursor(x, y) {
    let hover = false;
    if (Math.hypot(x - knob.x, y - knob.y) < knob.r) hover = true;
    if (Math.hypot(x - getProbeScreenX(), y - probeTrack.y) < 12) hover = true;
    terminals.forEach(t => {
        if (Math.hypot(x - t.x, y - t.y) < t.r + 4) hover = true;
    });
    canvas.style.cursor = hover ? "pointer" : "default";
}

// Клавіатура: ← / → для потенціометра, ↑ / ↓ для зонда
window.addEventListener('keydown', (e) => {
    if (document.activeElement !== canvas) return;

    if (e.key === "ArrowLeft") {
        knob.value = Math.max(knob.value - 0.0005, 0.0);
        drawBench();
        e.preventDefault();
    } else if (e.key === "ArrowRight") {
        knob.value = Math.min(knob.value + 0.0005, 1.0);
        drawBench();
        e.preventDefault();
    } else if (e.key === "ArrowUp") {
        probeState.x_cm = Math.min(Math.round((probeState.x_cm + 0.5) * 2) / 2, 5.0);
        drawBench();
        e.preventDefault();
    } else if (e.key === "ArrowDown") {
        probeState.x_cm = Math.max(Math.round((probeState.x_cm - 0.5) * 2) / 2, 0.0);
        drawBench();
        e.preventDefault();
    }
});

canvas.addEventListener('mousedown', (e) => {
    canvas.focus();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (Math.hypot(x - knob.x, y - knob.y) < knob.r) {
        knob.isDragging = true;
        return;
    }
    if (Math.hypot(x - getProbeScreenX(), y - probeTrack.y) < 14) {
        probeState.isDragging = true;
        return;
    }
    terminals.forEach(t => {
        if (Math.hypot(x - t.x, y - t.y) < t.r + 5) {
            activeTerminal = t;
            isDrawing = true;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    updateCursor(mouseX, mouseY);

    if (knob.isDragging) {
        let rawAngle = Math.atan2(mouseY - knob.y, mouseX - knob.x);
        let norm = (rawAngle + Math.PI * 0.75) / (Math.PI * 1.5);
        if (norm < 0 && norm > -0.2) norm = 0;
        if (norm > 1 || norm <= -0.2) norm = 1;
        knob.value = Math.min(Math.max(norm, 0), 1);
        drawBench();
    } else if (probeState.isDragging) {
        const ratio = (mouseX - probeTrack.xStart) / (probeTrack.xEnd - probeTrack.xStart);
        const clamped = Math.min(Math.max(ratio, 0), 1);
        probeState.x_cm = Math.round(clamped * 10) * 0.5;
        drawBench();
    } else if (isDrawing) {
        drawBench();
    }
});

canvas.addEventListener('mouseup', () => {
    if (knob.isDragging) { knob.isDragging = false; return; }
    if (probeState.isDragging) { probeState.isDragging = false; return; }
    if (!isDrawing) return;

    isDrawing = false;
    terminals.forEach(t => {
        if (t !== activeTerminal && Math.hypot(mouseX - t.x, mouseY - t.y) < t.r + 5) {
            if (!hasWire(activeTerminal.id, t.id)) {
                wires.push({ from: activeTerminal, to: t });
                drawBench();
            }
        }
    });
    activeTerminal = null;
    drawBench();
});

clearBtn.addEventListener('click', () => {
    wires = [];
    drawBench();
});

setInterval(drawBench, 100);
