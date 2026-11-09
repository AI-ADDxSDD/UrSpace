import { useState } from 'react'
import { buildSvgPath } from '../helpers/forgettingCurveCalculation'
import type { RetentionDataPointDto } from '../types'

type ForgettingCurveChartProps = {
  points: RetentionDataPointDto[]
  timeRangeDays: number
  stabilityFactorDays: number
}

const VIEW_WIDTH = 840
const VIEW_HEIGHT = 380
const PADDING_TOP = 30
const PADDING_RIGHT = 35
const PADDING_BOTTOM = 55
const PADDING_LEFT = 65

const CHART_WIDTH = VIEW_WIDTH - PADDING_LEFT - PADDING_RIGHT
const CHART_HEIGHT = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM

export function ForgettingCurveChart({
  points,
  timeRangeDays,
  stabilityFactorDays,
}: ForgettingCurveChartProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null)

  const safeRange = Math.max(1, timeRangeDays)

  const getX = (elapsedDays: number): number => {
    return PADDING_LEFT + (Math.min(safeRange, Math.max(0, elapsedDays)) / safeRange) * CHART_WIDTH
  }

  const getY = (percent: number): number => {
    return PADDING_TOP + ((100 - Math.min(100, Math.max(0, percent))) / 100) * CHART_HEIGHT
  }

  // Theoretical path
  const theoreticalCoords = points.map((p) => ({
    x: getX(p.elapsedDays),
    y: getY(p.theoreticalRetentionRate),
  }))
  const theoreticalPath = buildSvgPath(theoreticalCoords)

  // Theoretical area fill
  const theoreticalAreaPath = theoreticalCoords.length > 0
    ? `${theoreticalPath} L ${theoreticalCoords[theoreticalCoords.length - 1].x.toFixed(2)},${(PADDING_TOP + CHART_HEIGHT).toFixed(2)} L ${theoreticalCoords[0].x.toFixed(2)},${(PADDING_TOP + CHART_HEIGHT).toFixed(2)} Z`
    : ''

  // Observed points & path (only for points with actual observations)
  const observedPoints = points.filter((p) => p.observedRetentionRate !== null)
  const hasObservedData = observedPoints.length > 0
  const observedCoords = observedPoints.map((p) => ({
    x: getX(p.elapsedDays),
    y: getY(p.observedRetentionRate as number),
    point: p,
  }))
  const observedPath = hasObservedData ? buildSvgPath(observedCoords) : ''

  // Choose tick step to prevent label collision
  const getTickStep = (range: number): number => {
    if (range <= 7) return 1
    if (range <= 14) return 2
    if (range <= 30) return 5
    return 10
  }
  const tickStep = getTickStep(safeRange)
  const xTicks: number[] = []
  for (let day = 0; day <= safeRange; day += tickStep) {
    xTicks.push(day)
  }
  if (xTicks[xTicks.length - 1] !== safeRange) {
    xTicks.push(safeRange)
  }

  const yTicks = [100, 75, 50, 25, 0]

  const activePoint = activePointIndex !== null && points[activePointIndex]
    ? points[activePointIndex]
    : null

  return (
    <div className="forgetting-chart-container">
      <div className="forgetting-chart-wrapper">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="forgetting-chart-svg"
          role="img"
          aria-label={`Biểu đồ đường cong quên lãng Ebbinghaus và dữ liệu quan sát thực tế trong ${safeRange} ngày.`}
        >
          <defs>
            <linearGradient id="theoreticalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#735dc9" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#735dc9" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="observedLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y labels */}
          {yTicks.map((val) => {
            const y = getY(val)
            return (
              <g key={`y-${val}`} className="forgetting-chart-grid-y">
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={PADDING_LEFT + CHART_WIDTH}
                  y2={y}
                  stroke={val === 0 ? '#d1ccdc' : '#edeaf2'}
                  strokeDasharray={val === 0 || val === 100 ? undefined : '4 4'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                />
                <text
                  x={PADDING_LEFT - 12}
                  y={y + 4.5}
                  textAnchor="end"
                  className="forgetting-chart-axis-label"
                >
                  {val}%
                </text>
              </g>
            )
          })}

          {/* Vertical Grid lines and X labels */}
          {xTicks.map((day) => {
            const x = getX(day)
            return (
              <g key={`x-${day}`} className="forgetting-chart-grid-x">
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={PADDING_TOP + CHART_HEIGHT}
                  stroke="#f0edf5"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={PADDING_TOP + CHART_HEIGHT + 22}
                  textAnchor="middle"
                  className="forgetting-chart-axis-label"
                >
                  {day === 0 ? '0d' : `${day}d`}
                </text>
              </g>
            )
          })}

          {/* X and Y Axis Titles */}
          <text
            x={PADDING_LEFT + CHART_WIDTH / 2}
            y={VIEW_HEIGHT - 8}
            textAnchor="middle"
            className="forgetting-chart-title-axis"
          >
            Thời gian trôi qua kể từ lần ôn tập gần nhất (ngày)
          </text>

          {/* Theoretical Retention Curve Area Fill */}
          {theoreticalAreaPath && (
            <path
              d={theoreticalAreaPath}
              fill="url(#theoreticalGradient)"
              className="forgetting-area-theoretical"
            />
          )}

          {/* Theoretical Retention Curve (Illustrative Ebbinghaus) */}
          {theoreticalPath && (
            <path
              d={theoreticalPath}
              fill="none"
              stroke="#735dc9"
              strokeWidth={3}
              strokeDasharray="6 4"
              className="forgetting-line-theoretical"
            />
          )}

          {/* Observed Retention Curve (Solid Line) - ONLY RENDERED IF DATA EXISTS */}
          {hasObservedData && observedPath && (
            <path
              d={observedPath}
              fill="none"
              stroke="url(#observedLineGradient)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="forgetting-line-observed"
            />
          )}

          {/* Observed Markers (Interactive Circles) */}
          {observedCoords.map(({ x, y, point }) => {
            const isSelected = activePoint?.elapsedDays === point.elapsedDays
            return (
              <g key={`marker-${point.elapsedDays}`} className="forgetting-marker-group">
                {/* Hit area */}
                <circle
                  cx={x}
                  cy={y}
                  r={15}
                  fill="transparent"
                  className="forgetting-marker-hit"
                  tabIndex={0}
                  role="button"
                  aria-label={`Ngày ${point.elapsedDays}: Quan sát ${point.observedRetentionRate}%, ${point.totalReviews} lượt ôn`}
                  onMouseEnter={() => setActivePointIndex(point.elapsedDays)}
                  onFocus={() => setActivePointIndex(point.elapsedDays)}
                  onClick={() => setActivePointIndex(point.elapsedDays)}
                />
                {/* Visual Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  className="forgetting-marker-dot"
                />
              </g>
            )
          })}

          {/* Active Highlight vertical indicator */}
          {activePoint && (
            <g className="forgetting-active-indicator">
              <line
                x1={getX(activePoint.elapsedDays)}
                y1={PADDING_TOP}
                x2={getX(activePoint.elapsedDays)}
                y2={PADDING_TOP + CHART_HEIGHT}
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(activePoint.elapsedDays)}
                cy={getY(activePoint.theoreticalRetentionRate)}
                r={5}
                fill="#735dc9"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Hover / Focused Detail Tooltip */}
        {activePoint && (
          <div
            className="forgetting-tooltip"
            style={{
              left: `${Math.min(84, Math.max(16, (getX(activePoint.elapsedDays) / VIEW_WIDTH) * 100))}%`,
              top: `${Math.max(10, Math.min(65, (getY(activePoint.theoreticalRetentionRate) / VIEW_HEIGHT) * 100))}%`,
            }}
            role="status"
          >
            <div className="forgetting-tooltip-header">
              <strong>Ngày thứ {activePoint.elapsedDays}</strong>
              <button
                type="button"
                className="forgetting-tooltip-close"
                onClick={() => setActivePointIndex(null)}
                aria-label="Đóng tooltip"
              >
                ×
              </button>
            </div>
            <div className="forgetting-tooltip-row forgetting-tooltip-theoretical">
              <span>Lý thuyết Ebbinghaus:</span>
              <strong>{activePoint.theoreticalRetentionRate}%</strong>
            </div>
            <div className="forgetting-tooltip-row forgetting-tooltip-observed">
              <span>Quan sát thực tế:</span>
              <strong>
                {activePoint.observedRetentionRate !== null
                  ? `${activePoint.observedRetentionRate}%`
                  : 'Chưa có lượt ôn'}
              </strong>
            </div>
            {activePoint.totalReviews > 0 && (
              <div className="forgetting-tooltip-meta">
                {activePoint.successfulReviews}/{activePoint.totalReviews} lượt nhớ tốt (Good / Easy)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="forgetting-chart-legend" aria-label="Chú giải biểu đồ">
        <div className="forgetting-legend-item">
          <span className="forgetting-legend-line forgetting-legend-line-theoretical" />
          <span>Đường cong lý thuyết Ebbinghaus (mô hình minh họa S = {stabilityFactorDays} ngày)</span>
        </div>
        <div className="forgetting-legend-item">
          <span className="forgetting-legend-dot forgetting-legend-dot-observed" />
          <span>
            {hasObservedData
              ? 'Retention quan sát thực tế (tổng hợp từ mock reviews)'
              : 'Retention quan sát thực tế (không có dữ liệu trong khoảng này)'}
          </span>
        </div>
      </div>
    </div>
  )
}
