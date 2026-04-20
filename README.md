# 🎲 D20 ULTRA_3D

> Simulador de dados D20 en 3D para sesiones de rol — puro HTML, CSS y JavaScript vanilla. Sin dependencias, sin frameworks, sin servidor.

**[▶ Demo en vivo](https://TU-USUARIO.github.io/d20-ultra-3d/)** · [Reportar bug](https://github.com/TU-USUARIO/d20-ultra-3d/issues)

---

## ✨ Características

- **Icosaedro 3D real** — geometría correcta con los 12 vértices y 20 caras del icosaedro regular
- **Animación de rodado** con física de desaceleración suavizada (easing cúbico)
- **Iluminación por cara** — cada triángulo calcula su normal y recibe luz de forma independiente
- **Números siempre rectos** — los valores se muestran horizontales en el centroide de cada cara visible
- **Código de color por resultado** — 🟢 verde para 20 crítico · 🔴 rojo para 1 pifio · 🟡 amarillo para el resto
- **Hasta 10 dados simultáneos** con animaciones escalonadas
- **Sistema de éxitos** configurable — cuenta cuántos dados superan un umbral
- **Historial de tiradas** con hora, valores individuales y suma total
- **Zero dependencias** — vanilla JS puro, funciona offline

---

## 🚀 Uso rápido

Simplemente descarga el repositorio y abre `index.html` en el navegador. No necesita instalación ni servidor.

```bash
git clone https://github.com/TU-USUARIO/d20-ultra-3d.git
cd d20-ultra-3d
# Abre index.html en tu navegador
```

> **Nota:** Para que el navegador cargue `script.js` correctamente con el protocolo `file://`, usa un servidor local (ver abajo) o usa directamente la [demo en GitHub Pages](https://TU-USUARIO.github.io/d20-ultra-3d/).

### Servidor local (opcional)

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# VS Code → botón derecho en index.html → "Open with Live Server"
```

---

## 🎮 Interfaz

| Campo | Descripción |
|---|---|
| **Dados** | Número de D20 a tirar (1–10) |
| **Mayores a (x)** | Umbral para contar éxitos |
| **REROLLEAR TODO** | Lanza todos los dados con animación |

---

## 📁 Estructura

```
d20-ultra-3d/
├── index.html    # Estructura HTML
├── style.css     # Tema oscuro, layout y componentes
├── script.js     # Motor 3D, animación y lógica
└── README.md     # Este archivo
```

---

## 🛠️ Stack técnico

| Tecnología | Uso |
|---|---|
| HTML5 Canvas API | Render del icosaedro 3D |
| CSS3 Custom Properties | Theming y layout responsivo |
| JavaScript ES6+ | Geometría, animación y lógica de juego |

**Algoritmos:**
- **Painter's algorithm** — ordenación de caras por profundidad para oclusión correcta
- **Iluminación difusa** — producto escalar normal·luz por cara
- **Proyección perspectiva** — cámara virtual en Z con escala por distancia
- **Easing cúbico** `1 - (1-t)³` — deceleración natural del dado al parar

---

## 📐 Geometría

Icosaedro regular basado en la proporción áurea φ:

```
φ = (1 + √5) / 2 ≈ 1.618

Vértices: (0, ±1, ±φ) y sus permutaciones cíclicas
          (±1, ±φ, 0)
          (±φ, 0, ±1)

Normalizados a esfera unitaria: v / √(1 + φ²)
```

20 caras triangulares equiláteras · 12 vértices · 30 aristas.

---

## 🎨 Personalización

Cambia el tema editando las variables CSS en `style.css`:

```css
:root {
    --bg:     #05070a;   /* Fondo de página        */
    --card:   #111418;   /* Fondo de tarjetas       */
    --accent: #00d2ff;   /* Color de acento (cyan)  */
    --text:   #f0f6fc;   /* Texto principal         */
    --border: #30363d;   /* Bordes y separadores    */
}
```

Cambia los colores de los dados en `script.js`:

```js
if      (num === 20) base = [46,  204, 113];  // Verde  — crítico
else if (num ===  1) base = [255,  77,  77];  // Rojo   — pifio
else                 base = [241, 196,  15];  // Amarillo — normal
```

---

## 🌐 Desplegar en GitHub Pages

1. Sube el repositorio a GitHub
2. Ve a **Settings → Pages**
3. En **Source** selecciona `Deploy from a branch`
4. Rama: `main` · Carpeta: `/ (root)`
5. Guarda — en unos minutos estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`

> Recuerda reemplazar `TU-USUARIO` y `d20-ultra-3d` con tu usuario y nombre de repo reales en los enlaces de este README.

---

## 📜 Licencia

MIT — úsalo, modifícalo y compártelo libremente.

---

<div align="center">
  Hecho para mesas de rol ⚔️ &nbsp;·&nbsp; Funciona en cualquier navegador moderno
</div>
