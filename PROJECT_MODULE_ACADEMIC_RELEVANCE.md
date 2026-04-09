# Project Module Academic Relevance

## 7.1 Research Context

- **PMBOK alignment**: The module follows project lifecycle phases (planning, active, on hold, completed, cancelled), work breakdown through tasks/subtasks, and schedule control through timeline views.
- **Gantt chart theory (Henry Gantt)**: Timeline view represents project duration over months and visual progress fill derived from task completion.
- **Resource management theory**: Team assignment includes allocation percentage and workload balancing with warning and critical thresholds.

## 7.2 Novel Contributions

- **Integrated resource view**:
  - Endpoint: `GET /api/employees/{id}/workload`
  - Shows total allocation across projects and warning/critical flags.
- **Dynamic Gantt rendering**:
  - Endpoints: `GET /api/projects/timeline`, `GET /api/projects/{id}/gantt`
  - Timeline updates in real-time based on task progress.
- **Task dependency handling**:
  - Rule: blocked/dependency checks prevent invalid completion.
  - Tasks cannot be marked `DONE` while dependency tasks are incomplete.
- **Team progress tracking**:
  - Endpoint: `GET /api/projects/{id}/team/progress`
  - Returns team-level and individual-level progress metrics.

## 7.3 Evaluation Metrics

Target metrics:

- Gantt chart render time (50 projects): **< 2 seconds**
- Task update latency: **< 500 ms**
- Resource calculation time: **< 1 second**
- Export generation time: **< 5 seconds**

Measurement support:

- Endpoint: `GET /api/projects/benchmarks`
- Returns current measured values for:
  - `ganttRenderTimeMs`
  - `taskUpdateLatencyMs`
  - `resourceCalculationTimeMs`
  - `exportGenerationTimeMs`

Use this endpoint during thesis testing to collect repeated samples and report average, min, max, and percentile values.

