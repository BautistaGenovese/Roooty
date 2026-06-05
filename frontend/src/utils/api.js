import axios from 'axios'

const BASE = '/api'

function formatPydanticError(err) {
  if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
    const msgs = err.response.data.detail.map(e => `${e.loc?.slice(1).join('.') || 'input'}: ${e.msg}`)
    err.response.data.detail = msgs.join(' | ')
  }
  return err
}

export async function apiPost(endpoint, data) {
  try {
    const res = await axios.post(`${BASE}/${endpoint}`, data)
    return res.data
  } catch (err) {
    throw formatPydanticError(err)
  }
}

export function buildPayload(payload, settings) {
  return {
    max_iters: settings.maxIters,
    cero_maquina: settings.ceroMaquina,
    limite_infinito: settings.limiteInfinito,
    tipo_error: settings.tipoError,
    trig_mode: settings.trigMode,
    ...payload,
  }
}

export async function fetchChartData(f, xMin, xMax, trigMode) {
  try {
    const res = await axios.post(`${BASE}/chart_data`, {
      f, x_min: xMin, x_max: xMax, trig_mode: trigMode, n_points: 500,
    })
    return res.data
  } catch (err) {
    throw formatPydanticError(err)
  }
}
