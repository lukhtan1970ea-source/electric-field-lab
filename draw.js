// Координати ванни та робочих зон (прив'язаних до сантиметрової сітки)
const bathBox = { x: 278, y: 152, w: 340, h: 236 };
// Плоский конденсатор: великий масштаб (1 см = 44 px, 5 см = 220 px)
const flatTrack = { xStart: 560, xEnd: 340, y: 266 };
// Циліндричний конденсатор: масштаб 1 см = 14 px (R1 = 35 px, R2 = 105 px)
const cylCenter = { x: 448, y: 274, rInner: 35, rOuter: 105 };

function getProbeCoords() {
    const ratio = probeState.x_cm / 5.0;
    if (currentStage === "stage1") {
        return {
            x: flatTrack.xStart + ratio * (flatTrack.xEnd - flatTrack.xStart),
            y: flatTrack.y
        };
    } else {
        const r = cylCenter.rInner + ratio * (cylCenter.rOuter - cylCenter.rInner);
        return { x: cylCenter.x + r, y: cylCenter.y };
    }
}

function drawBench() {
    ctx.clearRect(0, 0, baseWidth, baseHeight);
    const state = getCircuitState();
    knob.angle = -Math.PI * 0.75 + knob.value * (Math.PI * 1.5);

    // 1. Джерело ~16 В
    ctx.fillStyle = "#EAEAEA";
    ctx.fillRect(15, 8, 125, 68);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 8, 125, 68);
    ctx.fillStyle = "#222";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Джерело ~16 В", 77, 28);

    // 2. Потенціометр (4) — зсунутий вліво і вниз
    ctx.fillStyle = "#D8D8D8";
    ctx.fillRect(28, 174, 148, 118);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(28, 174, 148, 118);
    ctx.fillStyle = "#222";
    ctx.font = "bold 11px Arial";
    ctx.fillText("Потенціометр (4)", 102, 282);

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
    ctx.fillRect(245, 8, 160, 96);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(245, 8, 160, 96);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(255, 22, 140, 38);

    ctx.fillStyle = "#CCC";
    ctx.font = "bold 10px Arial";
    ctx.fillText("ВОЛЬТМЕТР (V)", 325, 18);

    ctx.fillStyle = "#FF2222";
    ctx.font = "bold 22px 'Courier New'";
    ctx.textAlign = "right";
    ctx.fillText(state.voltReading.toFixed(2), 365, 49);
    ctx.font = "bold 12px Arial";
    ctx.fillText("В", 388, 48);

    // 4. Осцилограф-нуль-індикатор (5)
    ctx.fillStyle = "#2F3640";
    ctx.fillRect(458, 8, 226, 118);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(458, 8, 226, 118);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText("ОСЦИЛОГРАФ (5) — НУЛЬ-ІНДИКАТОР", 468, 21);

    const scrX = 468, scrY = 27, scrW = 148, scrH = 90;
    ctx.fillStyle = "#082914";
    ctx.fillRect(scrX, scrY, scrW, scrH);
    ctx.strokeStyle = "#555";
    ctx.strokeRect(scrX, scrY, scrW, scrH);

    ctx.strokeStyle = "rgba(0, 255, 100, 0.16)";
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
        const amp = Math.min(Math.abs(state.unbalance) * 10.0, 38);
        if (amp < 0.4) {
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#00FF66";
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx, cy - amp);
            ctx.lineTo(cx, cy + amp);
            ctx.strokeStyle = "#00FF66";
            ctx.lineWidth = 2.8;
            ctx.stroke();
        }
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 255, 102, 0.35)";
        ctx.fill();
    }

    // Коаксіальний роз'єм BNC (Y) + довгий кабель вниз праворуч
    const bncX = 656, bncY = 76;
    ctx.beginPath();
    ctx.arc(bncX, bncY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#BDC3C7";
    ctx.fill();
    ctx.strokeStyle = "#7F8C8D";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bncX, bncY, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#2C3E50";
    ctx.fill();

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Y", bncX, bncY - 14);

    const splitY = 158;
    ctx.beginPath();
    ctx.moveTo(bncX, bncY + 9);
    ctx.lineTo(bncX, splitY);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bncX, splitY);
    ctx.lineTo(636, 182);
    ctx.strokeStyle = "#C0392B";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bncX, splitY);
    ctx.lineTo(678, 182);
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 2.5;
    ctx.stroke();

        // 5. Велика ванна з водою та сантиметровою сіткою, прив'язаною до електродів
    ctx.fillStyle = "#EBF5FB";
    ctx.fillRect(bathBox.x, bathBox.y, bathBox.w, bathBox.h);

    // Визначаємо крок та опорну точку сітки залежно від етапу
    const gridStep = (currentStage === "stage1") ? 44 : 14; // 1 см = 44 px (плоский) або 14 px (циліндр.)
    const anchorX  = (currentStage === "stage1") ? flatTrack.xEnd : cylCenter.x;
    const anchorY  = (currentStage === "stage1") ? flatTrack.y    : cylCenter.y;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bathBox.x, bathBox.y, bathBox.w, bathBox.h);
    ctx.clip();

    ctx.strokeStyle = "rgba(40, 116, 166, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Вертикальні лінії сітки вліво та вправо від робочої грані електрода / центру
    for (let gx = anchorX; gx <= bathBox.x + bathBox.w; gx += gridStep) {
        ctx.moveTo(gx, bathBox.y);
        ctx.lineTo(gx, bathBox.y + bathBox.h);
    }
    for (let gx = anchorX - gridStep; gx >= bathBox.x; gx -= gridStep) {
        ctx.moveTo(gx, bathBox.y);
        ctx.lineTo(gx, bathBox.y + bathBox.h);
    }
    // Горизонтальні лінії сітки вгору та вниз від осі
    for (let gy = anchorY; gy <= bathBox.y + bathBox.h; gy += gridStep) {
        ctx.moveTo(bathBox.x, gy);
        ctx.lineTo(bathBox.x + bathBox.w, gy);
    }
    for (let gy = anchorY - gridStep; gy >= bathBox.y; gy -= gridStep) {
        ctx.moveTo(bathBox.x, gy);
        ctx.lineTo(bathBox.x + bathBox.w, gy);
    }
    ctx.stroke();
    ctx.restore();

    // Рамка ванни
    ctx.strokeStyle = "#2874A6";
    ctx.lineWidth = 2;
    ctx.strokeRect(bathBox.x, bathBox.y, bathBox.w, bathBox.h);

    // Заголовок ванни + поточна координата зонда
    ctx.fillStyle = "#1B4F72";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
        currentStage === "stage1" ? "Ванна (плоскі електроди)" : "Ванна (циліндричні електроди)",
        bathBox.x + 8, bathBox.y + 15
    );
    ctx.textAlign = "right";
    ctx.fillStyle = "#0B5345";
    ctx.fillText(`Зонд: x = ${probeState.x_cm.toFixed(1)} см`, bathBox.x + bathBox.w - 8, bathBox.y + 15);

    if (currentStage === "stage1") {
        // Плоскі електроди: робочі грані строго лежать на лініях сітки x=340 та x=560 (відстань 5 см)
        ctx.fillStyle = "#B03A2E";
        ctx.fillRect(flatTrack.xEnd - 8, 200, 8, 132); // Ел. 1 (16 В), робоча грань x = 340
        ctx.fillStyle = "#2C3E50";
        ctx.fillRect(flatTrack.xStart, 200, 8, 132);   // Ел. 2 (0 В), робоча грань x = 560

        // Лінійка координат x (0..5 см)
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(flatTrack.xEnd, 346);
        ctx.lineTo(flatTrack.xStart, 346);
        ctx.stroke();

        ctx.fillStyle = "#111";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        for (let i = 0; i <= 10; i++) {
            const xVal = i * 0.5;
            const px = flatTrack.xStart + (i / 10) * (flatTrack.xEnd - flatTrack.xStart);
            const isWhole = (i % 2 === 0);
            const tickHalf = isWhole ? 6 : 3; // Цілі поділки довші, половинні — коротші
            ctx.beginPath();
            ctx.moveTo(px, 346 - tickHalf);
            ctx.lineTo(px, 346 + tickHalf);
            ctx.stroke();
            if (isWhole) ctx.fillText(xVal.toFixed(0), px, 364);
        }
    } else {
        // Циліндричні електроди (вид зверху: два концентричних ПОРОЖНИСТИХ кільця)
        // Зовнішнє кільце R2 = 7.5 см (105 px)
        ctx.beginPath();
        ctx.arc(cylCenter.x, cylCenter.y, cylCenter.rOuter, 0, 2 * Math.PI);
        ctx.strokeStyle = "#B03A2E";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Внутрішній порожнистий циліндр R1 = 2.5 см (35 px)
        ctx.beginPath();
        ctx.arc(cylCenter.x, cylCenter.y, cylCenter.rInner, 0, 2 * Math.PI);
        ctx.strokeStyle = "#2C3E50";
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Радіальна шкала з поділками від R1 (x=0) до R2 (x=5 см)
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cylCenter.x + cylCenter.rInner, cylCenter.y);
        ctx.lineTo(cylCenter.x + cylCenter.rOuter, cylCenter.y);
        ctx.stroke();

        for (let i = 0; i <= 10; i++) {
            const rx = cylCenter.x + cylCenter.rInner + (i / 10) * (cylCenter.rOuter - cylCenter.rInner);
            const isWhole = (i % 2 === 0);
            const tickHalf = isWhole ? 5 : 2.5; // Цілі поділки довші, 0.5 — коротші
            ctx.beginPath();
            ctx.moveTo(rx, cylCenter.y - tickHalf);
            ctx.lineTo(rx, cylCenter.y + tickHalf);
            ctx.stroke();
        }

        ctx.fillStyle = "#1B4F72";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("R1=2.5см", bathBox.x + 8, 366);
        ctx.fillText("R2=7.5см", bathBox.x + 8, 380);
    }

    // Рухомий зонд (3)
    const pCoords = getProbeCoords();
    ctx.beginPath();
    ctx.arc(pCoords.x, pCoords.y, 7.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#0077CC";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Клеми та контрастні підписи
    terminals.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, 2 * Math.PI);
        ctx.fillStyle = t.color;
        ctx.fill();
        ctx.strokeStyle = (t.id === "volt_1" || t.id === "volt_2") ? "#FFF" : "#000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const isDarkBody = (t.id === "volt_1" || t.id === "volt_2");
        ctx.fillStyle = isDarkBody ? "#FFFFFF" : "#111111";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        const labelY = (t.id === "osc_1" || t.id === "osc_2") ? (t.y + t.r + 11) : (t.y - t.r - 4);
        ctx.fillText(t.name, t.x, labelY);
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
