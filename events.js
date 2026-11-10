function updateCursor(x, y) {
    let hover = false;
    const pCoords = getProbeCoords();
    if (Math.hypot(x - knob.x, y - knob.y) < knob.r) hover = true;
    if (Math.hypot(x - pCoords.x, y - pCoords.y) < 12) hover = true;
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
    const pCoords = getProbeCoords();

    if (Math.hypot(x - knob.x, y - knob.y) < knob.r) {
        knob.isDragging = true;
        return;
    }
    if (Math.hypot(x - pCoords.x, y - pCoords.y) < 14) {
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
        let ratio = 0.0;
        if (currentStage === "stage1") {
            ratio = (mouseX - flatTrack.xStart) / (flatTrack.xEnd - flatTrack.xStart);
        } else {
            const xStart = cylCenter.x + cylCenter.rInner;
            const xEnd = cylCenter.x + cylCenter.rOuter;
            ratio = (mouseX - xStart) / (xEnd - xStart);
        }
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
