<div align="center">
  <br />
  <h1>✨ Roooty Lab ✨</h1>
  <p>
    <strong>Una suite web interactiva de Alto Rendimiento para el Análisis Numérico</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  </p>
  <p>
    <a href="#-características">Características</a> •
    <a href="#-métodos-implementados">Métodos</a> •
    <a href="#%EF%B8%8F-stack-tecnológico">Stack</a> •
    <a href="#-seguridad-y-arquitectura">Seguridad</a> •
    <a href="#-instalación-local">Instalación</a>
  </p>
</div>

<br />

> **Roooty Lab** reinventa el enfoque tradicional del Análisis Numérico. Diseñado para estudiantes, ingenieros y matemáticos, elimina la necesidad de pesados scripts en consola a favor de una experiencia web fluida, interactiva y visualmente asombrosa (UI Glassmorphism), brindando potentes herramientas de cálculo en tiempo real con exportación a PDF.

<br />

## 🚀 Características Principales

*   **⚡ Renderizado Reactivo:** Soluciones instantáneas, sin recargas de página.
*   **📊 Gráficos Interactivos Avanzados:** Visualización con SVG nativo y *Recharts*. Hover magnético, tooltips dinámicos, funciones adaptativas y gráficos radar para comparativas algorítmicas.
*   **🖨️ Reportes Exportables:** Generación de reportes detallados en PDF con tablas de iteración y estados de gráficos incluidos (`html2canvas` + `jsPDF`).
*   **🧮 Tipografía Matemática Real:** Las fórmulas y teoremas se representan en elegante formato LaTeX mediante KaTeX.
*   **🛠️ Fragmentos de Código en Vivo:** Generación dinámica de código Python según los parámetros introducidos en la UI para que puedas llevar tus cálculos a tus propios scripts.

<br />

## 🔢 Métodos Implementados

| Categoría | Algoritmos Soportados |
| :--- | :--- |
| **Búsqueda de Raíces** | Bisección, Regula Falsi, Punto Fijo, Newton-Raphson, Secante. |
| **Integración Numérica** | Regla del Trapecio, Regla de Simpson 1/3. |
| **Ec. Diferenciales Ordinarias (EDO)** | Método de Euler, Método de Heun, Punto Medio, Ralston. |
| **Álgebra Lineal** | Eliminación Gaussiana, Método de Gauss-Jordan. |
| **Análisis de Datos** | Regresión Lineal Interactiva con gráficos de dispersión. |
| **Benchmark (Laboratorio)**| Comparativas simultáneas de algoritmos en un mismo escenario. |

<br />

## 🛡️ Seguridad y Arquitectura de la API

La API no es solo un backend funcional; está **blindada contra inyecciones y ataques cibernéticos**, diseñada bajo estándares profesionales:

1. **Prevención de Ejecución de Código Remoto (RCE):** Las expresiones matemáticas ingresadas (ej. `x*sin(x)`) son evaluadas utilizando *Sandboxing estricto* en SymPy. El intérprete carece de acceso global a módulos de Python (`__import__`, `eval`), bloqueando ejecuciones arbitrarias.
2. **Mitigación de Denegación de Servicio (DoS):**
    *   **Overflows y Límites de Bucle:** Modelos Pydantic v2 restringen rigurosamente parámetros como particiones, tamaño de matrices (`≤ 20x20`), iteraciones e incrementos de paso, evitando bloqueos de CPU en cálculos infinitos.
    *   **Detección de Sintaxis:** Filtros RegEx y control de excepciones (422 Unprocessable Entity) evitan procesar ecuaciones basura antes de consumir recursos.

<br />

## ⚙️ Stack Tecnológico

El proyecto se divide en un ecosistema robusto y moderno:

### **Frontend** (Client-side)
*   [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/) - Motor principal.
*   [Recharts](https://recharts.org/) - Composición de gráficos (Líneas, Dispersión, Radar).
*   [KaTeX](https://katex.org/) - Tipografía matemática de alto rendimiento.
*   Estilos Vanilla / CSS Variables + Glassmorphism.

### **Backend** (Server-side)
*   [FastAPI](https://fastapi.tiangolo.com/) - Framework asíncrono de alto rendimiento.
*   [Pydantic v2](https://docs.pydantic.dev/) - Esquemas y validación de tipos.
*   [SymPy](https://www.sympy.org/) - Manipulación matemática simbólica y derivadas automáticas.
*   [NumPy](https://numpy.org/) - Vectores, matrices y álgebra de alta velocidad.

<br />

## 💻 Instalación Local

### Requisitos Previos
*   Python 3.8+
*   Node.js 16+

### 1. Despliegue del Backend
```bash
# Clonar el proyecto
git clone https://github.com/TU_USUARIO/Roooty.git
cd Roooty/backend

# Inicializar y activar el entorno virtual
python -m venv venv
# (Windows): venv\Scripts\activate
# (Mac/Linux): source venv/bin/activate

# Instalar dependencias e iniciar servidor en puerto 8000
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Despliegue del Frontend
Abre una nueva terminal apuntando a la raíz del proyecto.
```bash
cd Roooty/frontend

# Instalar módulos de Node e iniciar en puerto 5173
npm install
npm run dev
```

> Accede a `http://localhost:5173` en tu navegador para experimentar la suite.

<br />

## 🤝 Contribuir
Las contribuciones hacen que la comunidad open-source sea increíble. Si quieres proponer mejoras:
1. Haz un **Fork** del proyecto
2. Crea una rama de funcionalidad (`git checkout -b feature/NuevoMetodo`)
3. Confirma tus cambios (`git commit -m 'Agregar método RK4'`)
4. Haz Push a la rama (`git push origin feature/NuevoMetodo`)
5. Abre un **Pull Request**

<br />

<div align="center">
  <p>Construido con dedicación combinando Ingeniería de Software y Análisis Matemático. 🪐</p>
</div>
