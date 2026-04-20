// ════════════════════════════════════════════════
//  D20 ULTRA_3D — Motor de dados icosaédricos 3D
//  Canvas 2D · Painter's algorithm · Easing cúbico
// ════════════════════════════════════════════════

// ── Geometría del icosaedro regular ──────────────
// Vértices basados en la proporción áurea φ = (1+√5)/2
const PHI  = (1 + Math.sqrt(5)) / 2;
const VLEN = Math.sqrt(1 + PHI * PHI);   // longitud para normalizar a esfera unitaria

const VERTS = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0,  1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0,  1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(([x, y, z]) => [x / VLEN, y / VLEN, z / VLEN]);

// 20 caras triangulares del icosaedro
const FACES = [
    [0,11,5], [0,5,1],  [0,1,7],   [0,7,10],  [0,10,11],
    [1,5,9],  [5,11,4], [11,10,2], [10,7,6],  [7,1,8],
    [3,9,4],  [3,4,2],  [3,2,6],   [3,6,8],   [3,8,9],
    [4,9,5],  [2,4,11], [6,2,10],  [8,6,7],   [9,8,1]
];

const SIZE     = 130;   // tamaño del canvas por dado (px)
const diceMeta = [];    // estado de cada dado activo
let   animId   = null;  // handle del requestAnimationFrame

// ── Matrices de rotación 3D ───────────────────────
function rotX(pts, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y, z]) => [x, y*c - z*s, y*s + z*c]);
}
function rotY(pts, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y, z]) => [x*c + z*s, y, -x*s + z*c]);
}
function rotZ(pts, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y, z]) => [x*c - y*s, x*s + y*c, z]);
}
function applyRot(pts, rx, ry, rz) {
    return rotZ(rotY(rotX(pts, rx), ry), rz);
}

// ── Normal unitaria de una cara triangular ────────
function faceNormalVec(pts, face) {
    const [ax, ay, az] = pts[face[0]];
    const [bx, by, bz] = pts[face[1]];
    const [ex, ey, ez] = pts[face[2]];
    const nx = (by - ay) * (ez - az) - (bz - az) * (ey - ay);
    const ny = (bz - az) * (ex - ax) - (bx - ax) * (ez - az);
    const nz = (bx - ax) * (ey - ay) - (by - ay) * (ex - ax);
    const l  = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    return [nx/l, ny/l, nz/l];
}

// ── Rotación de parada: cara 0 mirando al viewer ──
// Calcula rx, ry para que la normal de FACES[0] apunte en +Z
function getStopRotation() {
    const n0 = faceNormalVec(VERTS, FACES[0]);
    const ry  = -Math.atan2(n0[0], n0[2]);
    const pts1 = rotY(VERTS, ry);
    const n1   = faceNormalVec(pts1, FACES[0]);
    const rx   = -Math.atan2(-n1[1], n1[2]);
    return { rx, ry, rz: 0 };
}
const STOP_ROT = getStopRotation();

// ── Proyección perspectiva ────────────────────────
function project([x, y, z], cx, cy, r, camZ = 3) {
    const s = camZ / (camZ - z);
    return [cx + x * r * s, cy - y * r * s];
}

// ── Asignar números 1-20 a las caras ─────────────
// El número del roll siempre va en FACES[0] (cara frontal al parar)
function makeFaceNumbers(roll) {
    const nums = Array.from({ length: 20 }, (_, i) => i + 1);
    // Fisher-Yates shuffle
    for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    // Poner el roll en la posición 0
    const idx = nums.indexOf(roll);
    [nums[0], nums[idx]] = [nums[idx], nums[0]];
    return nums;
}

// ── Renderizar un dado en su canvas ──────────────
function drawDie(meta) {
    const { canvas: cv, ctx, state, startT, duration,
            rx0, ry0, rz0, drx, dry, drz, faceNums } = meta;

    const W = cv.width, H = cv.height;
    const cx = W / 2,   cy = H / 2;
    const r  = W * 0.40;

    ctx.clearRect(0, 0, W, H);

    // Calcular rotación según estado
    let ax = rx0, ay = ry0, az = rz0;

    if (state === 'rolling') {
        const elapsed  = Date.now() - startT;
        const progress = Math.min(elapsed / duration, 1);
        const ease     = 1 - Math.pow(1 - progress, 3);  // easing cúbico out
        const t        = elapsed / 1000;
        ax = rx0 + drx * t * (1 - ease * 0.7) + STOP_ROT.rx * ease * 0.5;
        ay = ry0 + dry * t * (1 - ease * 0.7) + STOP_ROT.ry * ease * 0.5;
        az = rz0 + drz * t * (1 - ease * 0.7) + STOP_ROT.rz * ease * 0.5;
    } else {
        // Parado: orientación fija con cara 0 al frente
        ax = STOP_ROT.rx;
        ay = STOP_ROT.ry;
        az = STOP_ROT.rz;
    }

    const pts = applyRot(VERTS, ax, ay, az);

    // Ordenar caras de atrás hacia adelante (Painter's algorithm)
    const sorted = FACES
        .map((face, fi) => ({
            fi,
            zAvg: (pts[face[0]][2] + pts[face[1]][2] + pts[face[2]][2]) / 3
        }))
        .sort((a, b) => a.zAvg - b.zAvg);

    for (const { fi } of sorted) {
        const face = FACES[fi];
        const p2d  = [
            project(pts[face[0]], cx, cy, r),
            project(pts[face[1]], cx, cy, r),
            project(pts[face[2]], cx, cy, r)
        ];

        // Normal de la cara para iluminación difusa
        const [ax2, ay2, az2] = pts[face[0]];
        const [bx,  by,  bz ] = pts[face[1]];
        const [ex,  ey,  ez ] = pts[face[2]];
        const nx   = (by - ay2) * (ez - az2) - (bz - az2) * (ey - ay2);
        const ny   = (bz - az2) * (ex - ax2) - (bx - ax2) * (ez - az2);
        const nz   = (bx - ax2) * (ey - ay2) - (by - ay2) * (ex - ax2);
        const nlen = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;

        // Iluminación: luz desde arriba-izquierda-frente
        const [lx, ly, lz] = [0.3, 0.5, 0.8];
        const lit = Math.max(0.15, (nx*lx + ny*ly + nz*lz) / nlen);

        // Color base según número de la cara
        const num = faceNums[fi];
        let base;
        if      (num === 20) base = [46,  204, 113];   // Verde  — crítico
        else if (num ===  1) base = [255,  77,  77];   // Rojo   — pifio
        else                 base = [241, 196,  15];   // Amarillo — normal

        // Dibujar triángulo sombreado
        ctx.beginPath();
        ctx.moveTo(p2d[0][0], p2d[0][1]);
        ctx.lineTo(p2d[1][0], p2d[1][1]);
        ctx.lineTo(p2d[2][0], p2d[2][1]);
        ctx.closePath();
        ctx.fillStyle   = `rgb(${Math.round(base[0]*lit)},${Math.round(base[1]*lit)},${Math.round(base[2]*lit)})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth   = 1.0;
        ctx.stroke();

        // Número recto (sin rotación) centrado en el centroide de la cara
        const nzNorm = nz / nlen;
        if (nzNorm > 0.15) {
            const mcx = (p2d[0][0] + p2d[1][0] + p2d[2][0]) / 3;
            const mcy = (p2d[0][1] + p2d[1][1] + p2d[2][1]) / 3;

            // Tamaño de fuente proporcional al área proyectada
            const area     = Math.abs(
                (p2d[1][0] - p2d[0][0]) * (p2d[2][1] - p2d[0][1]) -
                (p2d[2][0] - p2d[0][0]) * (p2d[1][1] - p2d[0][1])
            ) / 2;
            const fontSize = Math.max(7, Math.sqrt(area) * 0.60 * nzNorm);

            ctx.save();
            ctx.translate(mcx, mcy);
            // ⚠️ Sin ctx.rotate() → número siempre horizontal
            ctx.font         = `900 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle  = 'rgba(0,0,0,0.8)';
            ctx.lineWidth    = fontSize * 0.15;
            ctx.strokeText(String(num), 0, 0);
            ctx.fillStyle    = 'rgba(0,0,0,0.82)';
            ctx.fillText(String(num), 0, 0);
            ctx.restore();
        }
    }
}

// ── Bucle de animación principal ─────────────────
function tick() {
    let anyRolling = false;
    const now = Date.now();

    for (const m of diceMeta) {
        if (m.state === 'rolling') {
            if (now - m.startT >= m.duration) m.state = 'idle';
            else anyRolling = true;
        }
        drawDie(m);
    }

    if (anyRolling) animId = requestAnimationFrame(tick);
    else            animId = null;
}

// ── Lógica del botón ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const rollBtn       = document.getElementById('rollBtn');
    const diceContainer = document.getElementById('diceContainer');
    const statTotal     = document.getElementById('statTotal');
    const statSuccess   = document.getElementById('statSuccess');
    const threshLabel   = document.getElementById('threshLabel');
    const historyBody   = document.getElementById('historyBody');

    rollBtn.addEventListener('click', () => {
        const count     = parseInt(document.getElementById('diceCount').value)    || 1;
        const threshold = parseInt(document.getElementById('threshold').value) || 0;

        threshLabel.innerText   = threshold;
        diceContainer.innerHTML = '';
        diceMeta.length         = 0;
        if (animId) cancelAnimationFrame(animId);

        let total = 0, successes = 0, results = [];

        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * 20) + 1;
            results.push(roll);
            total += roll;
            if (roll > threshold) successes++;

            const cv    = document.createElement('canvas');
            cv.width    = SIZE;
            cv.height   = SIZE;
            diceContainer.appendChild(cv);

            diceMeta.push({
                canvas:   cv,
                ctx:      cv.getContext('2d'),
                roll,
                state:    'rolling',
                startT:   Date.now() + i * 100,
                duration: 900 + Math.random() * 500 + i * 100,
                faceNums: makeFaceNumbers(roll),
                rx0: Math.random() * Math.PI * 2,
                ry0: Math.random() * Math.PI * 2,
                rz0: Math.random() * Math.PI * 2,
                drx: (Math.random() < .5 ? 1 : -1) * (8  + Math.random() * 8),
                dry: (Math.random() < .5 ? 1 : -1) * (6  + Math.random() * 8),
                drz: (Math.random() < .5 ? 1 : -1) * (4  + Math.random() * 6),
            });
        }

        statTotal.innerText   = total;
        statSuccess.innerText = successes;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        historyBody.insertAdjacentHTML('afterbegin',
            `<tr><td>${time}</td><td>${results.join(', ')}</td><td>${total}</td></tr>`
        );

        tick();
    });
});
