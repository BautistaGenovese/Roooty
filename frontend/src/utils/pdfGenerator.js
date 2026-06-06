/**
 * pdfGenerator.js — Generador de PDF unificado para Roooty Lab.
 *
 * Centraliza TODOS los reportes PDF de la aplicación (raíces, matrices,
 * integración, EDOs, regresión) bajo un formato visual consistente:
 *   - Encabezado azul centrado con título "Reporte · Roooty Lab"
 *   - Línea divisoria
 *   - Subtítulo del método + parámetros
 *   - Captura del gráfico (si existe)
 *   - Tabla de iteraciones/pasos con encabezado azul y filas alternadas
 *   - Pie de página con fecha
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

// ─── PALETA DE COLORES UNIFICADA ──────────────────────────────────────────────
const COLORS = {
  blue:     [59, 130, 246],
  navy:     [30,  41,  59],
  success:  [ 0, 150,  80],
  error:    [220, 38,  38],
  border:   [226, 232, 240],
  altRow:   [248, 250, 252],
  white:    [255, 255, 255],
}

const MARGIN = 14
const FONT = 'helvetica'

// ─── FUNCIONES INTERNAS ───────────────────────────────────────────────────────

function drawHeader(doc, title) {
  const pw = doc.internal.pageSize.getWidth()

  // Título centrado
  doc.setFont(FONT, 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...COLORS.blue)
  doc.text('Reporte · Roooty Lab', pw / 2, 18, { align: 'center' })

  // Línea divisoria
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 23, pw - MARGIN, 23)

  // Subtítulo del método
  doc.setFont(FONT, 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.navy)
  doc.text(title, MARGIN, 32)

  return 40  // siguiente Y disponible
}

function drawFooter(doc) {
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const totalPages = doc.internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)

    const fecha = new Date().toLocaleDateString('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    doc.text(`Generado el ${fecha}`, MARGIN, ph - 8)
    doc.text(`Página ${i} de ${totalPages}`, pw - MARGIN, ph - 8, { align: 'right' })
  }
}

function drawParamLine(doc, y, label, value) {
  doc.setFont(FONT, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.navy)
  doc.text(`${label}: ${value}`, MARGIN, y)
  return y + 6
}

async function drawChart(doc, y, containerId = 'chart-pdf-container') {
  const chartEl = document.getElementById(containerId)
  if (!chartEl) return y

  const canvas = await html2canvas(chartEl, { scale: 3, useCORS: true, logging: false })
  const imgData = canvas.toDataURL('image/png')
  const imgProps = doc.getImageProperties(imgData)
  const pw = doc.internal.pageSize.getWidth()

  let displayWidth = pw - MARGIN * 2
  let displayHeight = (imgProps.height * displayWidth) / imgProps.width

  if (displayHeight > 110) {
    displayHeight = 110
    displayWidth = (imgProps.width * displayHeight) / imgProps.height
  }

  const xOffset = (pw - displayWidth) / 2
  doc.addImage(imgData, 'PNG', xOffset, y, displayWidth, displayHeight)
  return y + displayHeight + 8
}

function drawTable(doc, y, head, body, options = {}) {
  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.blue,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      font: FONT,
      fontSize: 9,
    },
    bodyStyles: {
      halign: 'center',
      font: FONT,
      fontSize: 9,
      textColor: COLORS.navy,
    },
    alternateRowStyles: { fillColor: COLORS.altRow },
    margin: { left: options.marginL ?? MARGIN, right: options.marginR ?? MARGIN },
    ...options,
  })
  return doc.lastAutoTable.finalY + 8
}

function sanitize(text) {
  if (typeof text !== 'string') return String(text ?? '')
  return text.replace(/[ₙ₊₁₀]/g, c => ({ 'ₙ': 'n', '₊': '+', '₁': '1', '₀': '0' }[c] || c))
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Genera un PDF para los métodos de búsqueda de raíces (Bisección, Newton, etc.)
 * e Integración Numérica y Regresión.
 */
export async function generateMethodPdf({ title, f, params, result, columns }) {
  const doc = new jsPDF({ format: 'letter' })
  let y = drawHeader(doc, `Método de ${title}`)

  // Función
  if (f) {
    y = drawParamLine(doc, y, 'f(x)', f)
  }

  // Parámetros
  if (params) {
    const paramStr = Object.entries(params).map(([k, v]) => `${sanitize(k)}: ${v}`).join('  ·  ')
    y = drawParamLine(doc, y, 'Parámetros', paramStr)
  }

  // Resultado principal (raíz, integral, etc.)
  if (result?.raiz !== undefined && result.raiz !== null) {
    y += 2
    doc.setFont(FONT, 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.success)
    doc.text(`Raíz encontrada: x = ${Number(result.raiz).toFixed(6)}`, MARGIN, y)
    y += 10
  } else if (result?.resultado !== undefined) {
    y += 2
    doc.setFont(FONT, 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.success)
    doc.text(`Resultado: ${Number(result.resultado).toFixed(6)}`, MARGIN, y)
    y += 10
  } else {
    y += 4
  }

  // Gráfico
  y = await drawChart(doc, y)

  // Tabla de iteraciones
  if (result?.iteraciones && columns) {
    const head = [['Iter', ...columns.map(c => c.label)]]
    const body = result.iteraciones.map((row, i) => [
      i,
      ...columns.map(c => {
        const v = row[c.key]
        if (v == null) return '—'
        return typeof v === 'number' ? v.toFixed(6) : String(v)
      })
    ])
    y = drawTable(doc, y, head, body)
  }

  drawFooter(doc)
  doc.save(`Reporte_${title || 'Metodo'}.pdf`)
}


/**
 * Genera un PDF para los métodos de matrices (Eliminación Gaussiana, Gauss-Jordan).
 */
export function generateMatrixPdf({ title, n, matrix, vector, result }) {
  const doc = new jsPDF({ format: 'letter' })
  let y = drawHeader(doc, title)

  const fmt = v => {
    const num = Number(v)
    if (isNaN(num)) return '0'
    if (Math.abs(num) < 1e-9) return '0'
    return parseFloat(num.toFixed(4)).toString()
  }

  // Info del sistema
  y = drawParamLine(doc, y, 'Tamaño del sistema', `${n} × ${n}`)
  y += 2

  // Error case
  if (result?.isError) {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.error)
    doc.text('Estado: Error — ' + (result.errorMsg || 'Sin solución'), MARGIN, y)
    y += 10

    doc.setFont(FONT, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.navy)
    const lines = doc.splitTextToSize(`Diagnóstico: ${result.errorMsg || 'Error desconocido.'}`, 180)
    doc.text(lines, MARGIN, y)

    drawFooter(doc)
    doc.save(`Reporte_${title?.replace(/\s+/g, '_') || 'Matriz'}.pdf`)
    return
  }

  // Matriz aumentada como tabla
  if (matrix && vector && n > 0) {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.navy)
    doc.text('Matriz Aumentada [A | b]:', MARGIN, y)
    y += 4

    const headLabels = Array.from({ length: n }, (_, j) => `x${j + 1}`).concat(['b'])
    const matrixBody = matrix.map((row, i) => [
      ...row.map(v => fmt(v)),
      fmt(vector[i])
    ])

    const sideMargin = Math.max(MARGIN, 105 - n * 9)
    y = drawTable(doc, y, [headLabels], matrixBody, {
      marginL: sideMargin,
      marginR: sideMargin,
      didDrawCell: function (data) {
        if (data.column.index === n - 1) {
          doc.setDrawColor(...(data.section === 'head' ? COLORS.white : COLORS.blue))
          doc.setLineWidth(0.5)
          doc.line(
            data.cell.x + data.cell.width, data.cell.y,
            data.cell.x + data.cell.width, data.cell.y + data.cell.height
          )
        }
      },
    })
  }

  // Solución exitosa
  if (result?.solucion) {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.success)
    doc.text('Estado: Sistema Resuelto ✓', MARGIN, y)
    y += 8

    // Tabla de solución
    const solHead = [['Variable', 'Valor']]
    const solBody = result.solucion.map((val, i) => [
      `x${i + 1}`,
      Number(val).toFixed(6),
    ])
    y = drawTable(doc, y, solHead, solBody, {
      marginL: 50,
      marginR: 50,
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { font: 'courier', halign: 'center' },
      },
    })

    // Pasos
    if (result.pasos?.length) {
      doc.setFont(FONT, 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.navy)
      doc.text('Operaciones Realizadas:', MARGIN, y)
      y += 4

      const pasosBody = result.pasos
        .filter(p => p.tipo !== 'solucion')
        .map((p, idx) => [`Paso ${idx + 1}`, (p.descripcion || '').replace(/[\"−]/g, '-')])

      if (pasosBody.length > 0) {
        y = drawTable(doc, y, null, pasosBody, {
          columnStyles: {
            0: { fontStyle: 'bold', textColor: COLORS.blue, cellWidth: 25, halign: 'center' },
            1: { halign: 'left' },
          },
        })
      }
    }
  }

  drawFooter(doc)
  doc.save(`Reporte_${title?.replace(/\s+/g, '_') || 'Matriz'}_${n}x${n}.pdf`)
}


/**
 * Genera un PDF genérico con tabla de iteraciones (fallback para MatrixLayout u otros).
 */
export function generateTablePdf({ title, iteraciones, columns }) {
  const doc = new jsPDF({ format: 'letter' })
  let y = drawHeader(doc, title)

  if (iteraciones && columns) {
    const firstColIsLabel = iteraciones.length > 0 && typeof iteraciones[0][columns[0]?.key] === 'string'
    const head = firstColIsLabel ? [columns.map(c => c.label)] : [['#', ...columns.map(c => c.label)]]
    const body = iteraciones.map((row, i) => [
      ...(firstColIsLabel ? [] : [i]),
      ...columns.map(c => {
        const v = row[c.key]
        if (v == null) return '—'
        return typeof v === 'number' ? v.toFixed(6) : String(v)
      })
    ])
    y = drawTable(doc, y, head, body)
  }

  drawFooter(doc)
  doc.save(`Reporte_${title || 'Tabla'}.pdf`)
}
