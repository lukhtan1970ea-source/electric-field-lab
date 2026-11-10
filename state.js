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
let knob = { x: 140, y: 155, r: 22, value: 0.0, angle: -Math.PI * 0.75, isDragging: false };

// Зонд (3): x_cm від 0.0 до 5.0 см (крок 0.5 см)
let probeState = { x_cm: 0.0, isDragging: false };

// Реалістична похибка приладів для кожної точки x (від -0.09 до +0.09 В)
const noiseTable = [0.00, 0.06, -0.05, 0.08, -0.07, 0.09, -0.04, 0.07, -0.08, 0.05, -0.02];

// Клеми на стенді
const terminals = [
    // Джерело ~16 В
    { id: "src_left",  name: "0 В",    x: 45,  y: 72,  r: 7, color: "#1E1E1E" },
    { id: "src_right", name: "16 В",   x: 115, y: 72,  r: 7, color: "#FF4B4B" },

    // Потенціометр (4)
    { id: "pot_left",  name: "R1",     x: 38,  y: 185, r: 7, color: "#666666" },
    { id: "pot_right", name: "R2",     x: 242, y: 185, r: 7, color: "#666666" },
    { id: "pot_wiper", name: "Повз.",  x: 140, y: 108, r: 7, color: "#32CD32" },

    // Вольтметр (V)
    { id: "volt_1",    name: "COM",    x: 315, y: 98,  r: 7, color: "#333333" },
    { id: "volt_2",    name: "V",      x: 395, y: 98,  r: 7, color: "#FF8C00" },

    // Осцилограф-нуль-індикатор (5)
    { id: "osc_1",     name: "Y1",     x: 535, y: 122, r: 7, color: "#2E8B57" },
    { id: "osc_2",     name: "Y2",     x: 625, y: 122, r: 7, color: "#2E8B57" },

    // Велика ванна з водою праворуч: електроди 1 і 2 + зонд 3
    { id: "el_1",      name: "Ел. 1",  x: 295, y: 275, r: 7, color: "#FF4B4B" },
    { id: "el_2",      name: "Ел. 2",  x: 675, y: 275, r: 7, color: "#1E1E1E" },
    { id: "probe",     name: "Зонд 3", x: 485, y: 148, r: 7, color: "#0077CC" }
];

function hasWire(t1, t2) {
    return wires.some(w =>
        (w.from.id === t1 && w.to.id === t2) ||
        (w.from.id === t2 && w.to.id === t1)
    );
}

// Пошук в ширину: перевіряє, чи з'єднані клеми t1 та t2 ланцюжком дротів
function areNodesConnected(startId, targetId) {
    if (startId === targetId) return true;
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length > 0) {
        const curr = queue.shift();
        for (const w of wires) {
            let next = null;
            if (w.from.id === curr) next = w.to.id;
            else if (w.to.id === curr) next = w.from.id;
            if (next && !visited.has(next)) {
                if (next === targetId) return true;
                visited.add(next);
                queue.push(next);
            }
        }
    }
    return false;
}

// Потенціал у точці зонда (В)
function getProbePotential() {
    const idx = Math.round(probeState.x_cm * 2);
    const noise = (idx === 0 || idx === 10) ? 0.0 : noiseTable[idx];
    let phi_ideal = 0.0;

    if (currentStage === "stage1") {
        phi_ideal = (16.0 / 5.0) * probeState.x_cm;
    } else {
        const k = 16.0 / Math.log(7.5 / 2.5);
        phi_ideal = k * Math.log((probeState.x_cm + 2.5) / 2.5);
    }
    return Math.min(Math.max(phi_ideal + noise, 0.0), 16.0);
}

function getCircuitState() {
    // 1. Живлення ванни (пряме або інверсне)
    const bathDirect  = areNodesConnected("src_left", "el_2") && areNodesConnected("src_right", "el_1");
    const bathReverse = areNodesConnected("src_left", "el_1") && areNodesConnected("src_right", "el_2");
    const bathOk = bathDirect || bathReverse;

    // 2. Живлення потенціометра (пряме або інверсне)
    const potDirect  = areNodesConnected("src_left", "pot_left") && areNodesConnected("src_right", "pot_right");
    const potReverse = areNodesConnected("src_left", "pot_right") && areNodesConnected("src_right", "pot_left");
    const potOk = potDirect || potReverse;

    // 3. Осцилограф у діагоналі містка (між зондом 3 та повзунком)
    const oscOk = (areNodesConnected("probe", "osc_1") && areNodesConnected("pot_wiper", "osc_2")) ||
                  (areNodesConnected("probe", "osc_2") && areNodesConnected("pot_wiper", "osc_1"));

    // 4. Вольтметр між нульовим полюсом і повзунком потенціометра (у будь-якій полярності)
    const zeroNode = potDirect ? "src_left" : "src_right";
    const voltOk = potOk && (
        (areNodesConnected(zeroNode, "volt_1") && areNodesConnected("pot_wiper", "volt_2")) ||
        (areNodesConnected(zeroNode, "volt_2") && areNodesConnected("pot_wiper", "volt_1"))
    );

    const potVoltage = knob.value * 16.0;
    const rawProbe = getProbePotential();
    const probeVoltage = (bathDirect === potDirect) ? rawProbe : (16.0 - rawProbe);

    return {
        voltReading: voltOk ? potVoltage : 0.0,
        oscActive: (bathOk && potOk && oscOk),
        unbalance: potVoltage - probeVoltage,
        bathOk, potOk, oscOk, voltOk
    };
}
