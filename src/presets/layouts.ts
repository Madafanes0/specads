// Layouts de tarjetas en 3D. Coordenadas relativas al centro del cuadro (px).
// z negativo = más lejos de cámara.
export type CardSlot = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  w: number;
  h: number;
};

export type LayoutName = "orbit" | "columns" | "scatter" | "arc";

// Cada layout define 7 slots; CardField toma los primeros N (ordenados por relevancia).
export const LAYOUTS: Record<LayoutName, CardSlot[]> = {
  // Anillo alrededor del logo: 4 esquinas cercanas + 3 lejanas para profundidad
  orbit: [
    { x: -330, y: -420, z: 0, rx: 10, ry: 26, rz: -5, w: 300, h: 390 },
    { x: 370, y: -330, z: -140, rx: 8, ry: -26, rz: 5, w: 280, h: 360 },
    { x: -350, y: 350, z: 80, rx: -12, ry: 26, rz: 4, w: 270, h: 340 },
    { x: 360, y: 380, z: 20, rx: -12, ry: -28, rz: -5, w: 280, h: 360 },
    { x: -40, y: -820, z: -520, rx: 16, ry: -4, rz: 2, w: 320, h: 220 },
    { x: 0, y: 690, z: -620, rx: -18, ry: 6, rz: -2, w: 330, h: 210 },
    { x: 640, y: 10, z: -900, rx: 4, ry: -26, rz: 3, w: 260, h: 330 },
  ],
  // Dos columnas en los bordes, escalonadas, alternando profundidad
  columns: [
    { x: -350, y: -470, z: 20, rx: 6, ry: 25, rz: 0, w: 290, h: 390 },
    { x: 370, y: -200, z: -60, rx: 6, ry: -25, rz: 0, w: 270, h: 370 },
    { x: -370, y: 140, z: -100, rx: -6, ry: 25, rz: 0, w: 270, h: 370 },
    { x: 350, y: 330, z: 40, rx: -6, ry: -25, rz: 0, w: 290, h: 370 },
    { x: -330, y: 660, z: -560, rx: -10, ry: 22, rz: 0, w: 280, h: 330 },
    { x: 380, y: -830, z: -620, rx: 10, ry: -22, rz: 0, w: 270, h: 320 },
    { x: -440, y: -1000, z: -900, rx: 12, ry: 20, rz: 0, w: 260, h: 320 },
  ],
  // Dispersión con mucha profundidad (más cinematográfico)
  scatter: [
    { x: -300, y: -450, z: 160, rx: 14, ry: 16, rz: -8, w: 280, h: 350 },
    { x: 330, y: 360, z: 140, rx: -14, ry: -18, rz: 7, w: 250, h: 320 },
    { x: 360, y: -470, z: -320, rx: 12, ry: -14, rz: 4, w: 290, h: 360 },
    { x: -400, y: 340, z: -260, rx: -12, ry: 20, rz: -5, w: 270, h: 340 },
    { x: 20, y: -860, z: -760, rx: 20, ry: 4, rz: 3, w: 340, h: 240 },
    { x: -20, y: 760, z: -760, rx: -20, ry: -6, rz: -2, w: 340, h: 240 },
    { x: -640, y: -40, z: -1000, rx: 4, ry: 24, rz: 0, w: 260, h: 340 },
  ],
  // Abanico superior: las tarjetas forman un arco sobre el logo
  arc: [
    { x: 0, y: -600, z: -60, rx: 14, ry: 0, rz: 0, w: 250, h: 310 },
    { x: -380, y: -460, z: -140, rx: 12, ry: 18, rz: -8, w: 250, h: 320 },
    { x: 380, y: -460, z: -140, rx: 12, ry: -18, rz: 8, w: 250, h: 320 },
    { x: -430, y: 20, z: -260, rx: 6, ry: 25, rz: -12, w: 230, h: 300 },
    { x: 430, y: 20, z: -260, rx: 6, ry: -25, rz: 12, w: 230, h: 300 },
    { x: -300, y: 470, z: -620, rx: -10, ry: 20, rz: -4, w: 260, h: 320 },
    { x: 300, y: 470, z: -620, rx: -10, ry: -20, rz: 4, w: 260, h: 320 },
  ],
};
