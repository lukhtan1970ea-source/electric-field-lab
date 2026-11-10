// Координати ванни та робочої доріжки зонда (від x=0 до x=5.0 см)
const bathBox = { x: 58, y: 245, w: 314, h: 140 };
const flatTrack = { xStart: 315, xEnd: 115, y: 315 };
const cylCenter = { x: 215, y: 318, rInner: 14, rOuter: 54 };

function getProbeCoords() {
    const ratio = probeState.x_cm / 5.0;
    if (currentStage === "stage1") {
        return {
            x: flatTrack.xStart + ratio * (flatTrack.xEnd - flatTrack.xStart),
            y: flatTrack.y
        };
    } else {
        // Рух уздовж радіуса праворуч від внутрішнього циліндра R1 до зовнішнього R2
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
    ctx.fillRect(20, 15, 120, 72);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 15, 120, 72);
    ctx.fillStyle = "#222";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Джерело ~16 В", 80, 38);

    // 2. Потенціометр (4)
    ctx.fillStyle = "#D8D8D8";
    ctx.fillRect(55, 118, 170, 92);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(55, 118, 170, 92);
    ctx.fillStyle = "#222";
    ctx.font = "bold 11px Arial";
    ctx.fillText("Потенціометр (4)", 140, 202);

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
    ctx.fillRect(275, 15, 160, 102);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(275, 15, 160, 102);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(285, 30, 140, 40);

    ctx.fillStyle = "#CCC";
    ctx.font = "bold 10px Arial";
    ctx.fillText("ВОЛЬТМЕТР (V)", 355, 25);

    ctx.fillStyle = "#FF2222";
    ctx.font = "bold 22px 'Courier New'";
    ctx.textAlign = "right";
    ctx.fillText(state.voltReading.toFixed(2), 395, 58);
    ctx.font = "bold 12px Arial";
    ctx.fillText("В", 418, 57);

    // 4. Осцилограф-нуль-індикатор (5)
    ctx.fillStyle = "#2F3640";
    ctx.fillRect(485, 15, 190, 125);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(485, 15, 190, 125);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ОСЦИЛОГРАФ (5) — НУЛЬ-ІНДИКАТОР", 580, 28);

    const scrX = 525, scrY = 35, scrW = 110, scrH = 66;
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
        const amp = Math.min(Math.abs(state.unbalance) * 8.0, 28);
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
        // Плоскі електроди 1 (ліворуч, 16 В) та 2 (праворуч, 0 В)
        ctx.fillStyle = "#B03A2E";
        ctx.fillRect(107, 275, 8, 80);
        ctx.fillStyle = "#2C3E50";
        ctx.fillRect(315, 275, 8, 80);

        // Лінійка координат x (0..5 см)
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(flatTrack.xEnd, 366);
        ctx.lineTo(flatTrack.xStart, 366);
        ctx.stroke();

        ctx.fillStyle = "#111";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        for (let i = 0; i <= 10; i++) {
            const xVal = i * 0.5;
            const px = flatTrack.xStart + (i / 10) * (flatTrack.xEnd - flatTrack.xStart);
            ctx.beginPath();
            ctx.moveTo(px, 362);
            ctx.lineTo(px, 370);
            ctx.stroke();
            if (i % 2 === 0) ctx.fillText(xVal.toFixed(0), px, 379);
        }
    } else {
        // Циліндричні електроди (вид зверху: два повних концентричних кільця)
        // Зовнішнє кільце R2 = 7.5 см (Ел. 1 — потенційний 16 В)
        ctx.beginPath();
        ctx.arc(cylCenter.x, cylCenter.y, cylCenter.rOuter, 0, 2 * Math.PI);
        ctx.strokeStyle = "#B03A2E";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Внутрішній циліндр R1 = 2.5 см (Ел. 2 — нульовий 0 В)
        ctx.beginPath();
        ctx.arc(cylCenter.x, cylCenter.y, cylCenter.rInner, 0, 2 * Math.PI);
        ctx.fillStyle = "#2C3E50";
        ctx.fill();
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Радіальна шкала вздовж осі руху зонда (від x=0 біля R1 до x=5 см біля R2)
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cylCenter.x + cylCenter.rInner, cylCenter.y);
        ctx.lineTo(cylCenter.x + cylCenter.rOuter, cylCenter.y);
        ctx.stroke();

        ctx.fillStyle = "#1B4F72";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("R1=2.5см", bathBox.x + 8, 355);
        ctx.fillText("R2=7.5см", bathBox.x + 8, 370);
    }

    // Рухомий зонд (3)
    const pCoords = getProbeCoords();
    ctx.beginPath();
    ctx.arc(pCoords.x, pCoords.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = "#0077CC";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Інформаційна плашка праворуч від ванни
    ctx.fillStyle = "#FFF";
    ctx.fillRect(435, 245, 240, 140);
    ctx.strokeStyle = "#BBB";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(435, 245, 240, 140);

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Положення зонда (3): x = ${probeState.x_cm.toFixed(1)} см`, 448, 272);

    ctx.font = "11px Arial";
    ctx.fillStyle = "#444";
    ctx.fillText("• Тягніть синій зонд мишкою у ванні", 448, 298);
    ctx.fillText("• Або натисніть ↑ / ↓ для кроку 0.5 см", 448, 318);
    ctx.fillText("• ← / → — точна підстройка потенціометра", 448, 338);

    const isReady = state.bathOk && state.potOk && state.oscOk && state.voltOk;
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = isReady ? "#1E8449" : "#C0392B";
    ctx.fillText(
        isReady ? "✅ Схему зібрано правильно!" : "⚠️ З'єднайте всі клеми згідно з Рис. 3.4",
        448, 366
    );

    // Клеми та контрастні підписи
    terminals.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, 2 * Math.PI);
        ctx.fillStyle = t.color;
        ctx.fill();
        ctx.strokeStyle = (t.id === "volt_1" || t.id === "volt_2") ? "#FFF" : "#000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Світлий текст на темних приладах, темний — на світлому фоні
        const isDarkBody = (t.id === "volt_1" || t.id === "volt_2" || t.id === "osc_1" || t.id === "osc_2");
        ctx.fillStyle = isDarkBody ? "#FFFFFF" : "#111111";
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
