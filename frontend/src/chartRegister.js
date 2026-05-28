/**
 * Registro único de piezas Chart.js usadas en la app (react-chartjs-2).
 * Importar una sola vez desde ``main.jsx`` antes de montar componentes con gráficas.
 */
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  LogarithmicScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Title,
)
