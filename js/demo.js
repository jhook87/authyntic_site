(function(window, document) {
  'use strict';

  const MS_PER_SECOND = 1000;
  const TIMELINE_INTERVAL = 4000;
  const CLOCK_INTERVAL = 1000;

  const SCENARIOS = {
    'forward-observation': {
      label: 'Forward Observation',
      meta: ['Latency &lt; 45ms', 'Policy Pack: Sentinel-12', 'Nodes synchronized: 18', 'Edge replication enabled'],
      metrics: {
        trust: {
          values: [92.4, 93.8, 95.1, 96.3],
          trend: ['▲ +1.4% vs baseline', '▲ +1.3%', '▲ +1.2%', 'Stable'],
          formatter: (value) => `${value.toFixed(1)}%`,
          progress: (value) => value / 100
        },
        latency: {
          values: [39, 36, 34, 32],
          trend: ['▼ 3ms', '▼ 2ms', 'Stable', 'Stable'],
          formatter: (value) => `${value.toFixed(0)} ms`,
          progress: (value) => Math.max(0, (60 - value) / 60)
        },
        coverage: {
          values: [96, 97, 99, 99.5],
          trend: ['▲ 1%', '▲ 2%', '▲ 0.5%', 'Stable'],
          formatter: (value) => `${value.toFixed(1)}%`,
          progress: (value) => value / 100
        }
      },
      consensus: {
        values: [96.4, 97.1, 97.8, 98.2],
        trend: ['Rising', 'Stable', 'Stable', 'Stable']
      },
      preview: {
        activeOperators: [12, 16, 18, 21],
        authenticatedNodes: [88, 92, 95, 97]
      },
      timeline: [
        { time: '00:00', title: 'Operator handshake', description: 'Expeditionary sensor kit authenticated and linked to mission ledger.' },
        { time: '+00:05', title: 'Live stream attestations', description: 'Video packets sealed, cross-domain alerts cleared by integrity mesh.' },
        { time: '+00:11', title: 'Threat analytics', description: 'Adversarial noise detected and quarantined for analyst review.' },
        { time: '+00:18', title: 'Consensus broadcast', description: 'Allied nodes ingest signed provenance ledger; trust posture up 1.2%.' }
      ],
      activity: [
        { actor: 'Operator Justin', action: 'Approved new ISR feed from Team Raven', offset: '+00:04' },
        { actor: 'Integrity Mesh', action: 'Autonomous quarantine of tampered segment', offset: '+00:09' },
        { actor: 'Policy Engine', action: 'Applied coalition-sharing profile Delta-3', offset: '+00:14' }
      ],
      health: [
        { label: 'Edge Node 3A', status: 'good', detail: 'Synchronized <12ms drift' },
        { label: 'Coalition Link', status: 'good', detail: 'Zero packet loss' },
        { label: 'Threat Watch', status: 'warning', detail: '2 anomalies queued' }
      ]
    },
    'coalition-onboarding': {
      label: 'Coalition Onboarding',
      meta: ['Zero Trust mode active', 'Eight partner enclaves', 'Continuous auditing enabled'],
      metrics: {
        trust: {
          values: [88.2, 89.7, 91.5, 92.4],
          trend: ['▲ +1.5%', '▲ +1.8%', '▲ +0.9%', 'Stable'],
          formatter: (value) => `${value.toFixed(1)}%`,
          progress: (value) => value / 100
        },
        latency: {
          values: [42, 40, 38, 36],
          trend: ['▼ 2ms', '▼ 2ms', '▼ 2ms', 'Stable'],
          formatter: (value) => `${value.toFixed(0)} ms`,
          progress: (value) => Math.max(0, (60 - value) / 60)
        },
        coverage: {
          values: [92, 94, 97, 98],
          trend: ['▲ 2%', '▲ 3%', '▲ 1%', 'Stable'],
          formatter: (value) => `${value.toFixed(0)}%`,
          progress: (value) => value / 100
        }
      },
      consensus: {
        values: [94.5, 95.6, 96.2, 96.8],
        trend: ['Rising', 'Rising', 'Stable', 'Stable']
      },
      preview: {
        activeOperators: [22, 26, 28, 30],
        authenticatedNodes: [74, 82, 88, 92]
      },
      timeline: [
        { time: '00:00', title: 'Partner enrollment', description: 'Coalition credentials validated and sandboxed for policy testing.' },
        { time: '+00:06', title: 'Device attestation', description: 'Edge devices scanned for tamper signals; 1 quarantined for review.' },
        { time: '+00:13', title: 'Cross-domain share', description: 'Mission data replicated to partner enclaves with scoped metadata.' },
        { time: '+00:20', title: 'Audit package', description: 'Immutable report delivered to coalition oversight nodes.' }
      ],
      activity: [
        { actor: 'Coalition Admin', action: 'Provisioned new enclave connectors', offset: '+00:03' },
        { actor: 'Security Analytics', action: 'Flagged outdated firmware signature', offset: '+00:08' },
        { actor: 'Policy Engine', action: 'Enabled limited-time sharing rules', offset: '+00:16' }
      ],
      health: [
        { label: 'Enclave Gateways', status: 'good', detail: 'All channels encrypted' },
        { label: 'Credential Vault', status: 'good', detail: 'Hardware root verified' },
        { label: 'Firmware Watch', status: 'warning', detail: '1 update pending approval' }
      ]
    },
    'critical-infrastructure': {
      label: 'Critical Infrastructure',
      meta: ['24/7 monitoring', 'OT bridge hardened', 'Resilience posture: HIGH'],
      metrics: {
        trust: {
          values: [90.1, 91.6, 93.0, 94.2],
          trend: ['▲ +1.5%', '▲ +1.4%', '▲ +1.2%', 'Stable'],
          formatter: (value) => `${value.toFixed(1)}%`,
          progress: (value) => value / 100
        },
        latency: {
          values: [48, 46, 44, 43],
          trend: ['▼ 2ms', '▼ 2ms', '▼ 1ms', 'Stable'],
          formatter: (value) => `${value.toFixed(0)} ms`,
          progress: (value) => Math.max(0, (65 - value) / 65)
        },
        coverage: {
          values: [95, 96, 97, 99],
          trend: ['▲ 1%', '▲ 1%', '▲ 2%', 'Stable'],
          formatter: (value) => `${value.toFixed(0)}%`,
          progress: (value) => value / 100
        }
      },
      consensus: {
        values: [95.7, 96.4, 97.2, 97.9],
        trend: ['Rising', 'Stable', 'Rising', 'Stable']
      },
      preview: {
        activeOperators: [14, 17, 19, 22],
        authenticatedNodes: [81, 86, 90, 94]
      },
      timeline: [
        { time: '00:00', title: 'Control room sync', description: 'OT controllers authenticated with multi-factor policy enforcement.' },
        { time: '+00:05', title: 'Sensor flood detected', description: 'AI analytics neutralized spoofed telemetry packets.' },
        { time: '+00:12', title: 'Grid integrity check', description: 'Protective relays verified; automated report pushed to regulator.' },
        { time: '+00:19', title: 'Resilience drill', description: 'Failover nodes activated and returned to nominal status.' }
      ],
      activity: [
        { actor: 'OT Supervisor', action: 'Acknowledged resilience drill start', offset: '+00:02' },
        { actor: 'Threat Analytics', action: 'Mitigated telemetry flood attempt', offset: '+00:07' },
        { actor: 'Compliance Bot', action: 'Dispatched signed audit package', offset: '+00:15' }
      ],
      health: [
        { label: 'Control Room', status: 'good', detail: 'All controllers green' },
        { label: 'Telemetry Bridge', status: 'good', detail: 'Integrity lock engaged' },
        { label: 'Anomaly Queue', status: 'warning', detail: '1 review pending' }
      ]
    }
  };

  function $(selector, context = document) {
    return context.querySelector(selector);
  }

  function $all(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.querySelector('[data-operator-dashboard]');
    if (!dashboard) {
      return;
    }

    const scenarioControls = dashboard.querySelector('[data-scenario-controls]');
    const metricGrid = dashboard.querySelector('[data-metric-grid]');
    const timelineContainer = dashboard.querySelector('[data-timeline]');
    const activityFeed = dashboard.querySelector('[data-activity-feed]');
    const healthGrid = dashboard.querySelector('[data-health-grid]');
    const consensusValue = dashboard.querySelector('[data-consensus-value]');
    const consensusTrend = dashboard.querySelector('[data-consensus-trend]');
    const consensusMeter = dashboard.querySelector('[data-consensus-meter]');
    const scenarioMeta = dashboard.querySelector('[data-scenario-meta]');
    const simStatus = document.querySelector('[data-sim-status]');
    const simClock = document.querySelector('[data-sim-clock]');
    const previewScenarioLabel = document.querySelector('[data-sim-scenario-label]');
    const previewActiveBar = document.querySelector('[data-sim-active-operators]');
    const previewActiveLabel = document.querySelector('[data-sim-active-operators-label]');
    const previewNodesBar = document.querySelector('[data-sim-node-health]');
    const previewNodesLabel = document.querySelector('[data-sim-node-health-label]');

    const state = {
      currentScenario: 'forward-observation',
      tick: 0,
      running: false,
      elapsedSeconds: 0,
      timelineInterval: null,
      clockInterval: null
    };

    function setStatus(message, variant = 'info') {
      if (!simStatus) {
        return;
      }
      simStatus.textContent = message;
      simStatus.hidden = false;
      simStatus.classList.remove('alert--info', 'alert--warning', 'alert--success');
      if (variant === 'warning') {
        simStatus.classList.add('alert--warning');
      } else if (variant === 'success') {
        simStatus.classList.add('alert--success');
      } else {
        simStatus.classList.add('alert--info');
      }
    }

    function clearStatus() {
      if (simStatus) {
        simStatus.hidden = true;
      }
    }

    function renderScenarioMeta(scenario) {
      if (!scenarioMeta) return;
      scenarioMeta.innerHTML = scenario.meta.map((item) => `<span>${item}</span>`).join('');
    }

    function renderMetrics(scenario) {
      const cards = $all('[data-metric]', metricGrid);
      cards.forEach((card) => {
        const key = card.getAttribute('data-metric');
        const config = scenario.metrics[key];
        if (!config) {
          return;
        }
        const values = config.values;
        const index = clamp(state.tick, 0, values.length - 1);
        const value = values[index];
        const display = card.querySelector('[data-metric-value]');
        const trend = card.querySelector('[data-metric-trend]');
        if (display) {
          display.textContent = typeof config.formatter === 'function' ? config.formatter(value) : value;
        }
        if (trend) {
          trend.textContent = config.trend ? config.trend[index] || config.trend[config.trend.length - 1] : '';
        }
        if (typeof config.progress === 'function') {
          const progressValue = clamp(config.progress(value), 0, 1);
          card.style.setProperty('--metric-progress', progressValue);
        }
      });
    }

    function renderConsensus(scenario) {
      const index = clamp(state.tick, 0, scenario.consensus.values.length - 1);
      if (consensusValue) {
        consensusValue.textContent = `${scenario.consensus.values[index].toFixed(1)}%`;
      }
      if (consensusTrend) {
        consensusTrend.textContent = scenario.consensus.trend[index] || '';
      }
      if (consensusMeter) {
        const normalized = clamp(scenario.consensus.values[index] / 100, 0, 1);
        consensusMeter.style.setProperty('--trust-value', normalized);
      }
    }

    function renderPreview(scenario) {
      const index = clamp(state.tick, 0, scenario.preview.activeOperators.length - 1);
      if (previewActiveBar) {
        const percent = scenario.preview.activeOperators[index];
        previewActiveBar.style.width = `${percent}%`;
      }
      if (previewActiveLabel) {
        previewActiveLabel.textContent = scenario.preview.activeOperators[index].toString();
      }
      if (previewNodesBar) {
        const percent = scenario.preview.authenticatedNodes[index];
        previewNodesBar.style.width = `${percent}%`;
      }
      if (previewNodesLabel) {
        previewNodesLabel.textContent = scenario.preview.authenticatedNodes[index].toString();
      }
      if (previewScenarioLabel) {
        previewScenarioLabel.textContent = scenario.label;
      }
    }

    function renderTimeline(scenario) {
      if (!timelineContainer) {
        return;
      }
      timelineContainer.innerHTML = scenario.timeline.map((item, idx) => {
        const activeClass = idx === state.tick ? ' is-active' : '';
        return `
          <div class="timeline-item${activeClass}" data-timeline-index="${idx}">
            <span class="timeline-status"><span class="timeline-marker"></span>${item.time}</span>
            <div class="timeline-content">
              <strong>${item.title}</strong>
              <p>${item.description}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderActivity(scenario) {
      if (!activityFeed) return;
      activityFeed.innerHTML = scenario.activity.map((entry) => `
        <div class="activity-item">
          <div class="activity-item__detail">
            <strong>${entry.actor}</strong>
            <span>${entry.action}</span>
          </div>
          <span class="activity-item__timestamp">${entry.offset}</span>
        </div>
      `).join('');
    }

    function renderHealth(scenario) {
      if (!healthGrid) return;
      healthGrid.innerHTML = scenario.health.map((item) => `
        <div class="system-health-cell" data-status="${item.status}">
          <h4>${item.label}</h4>
          <p>${item.detail}</p>
        </div>
      `).join('');
    }

    function renderScenario() {
      const scenario = SCENARIOS[state.currentScenario];
      if (!scenario) {
        return;
      }
      renderScenarioMeta(scenario);
      renderMetrics(scenario);
      renderConsensus(scenario);
      renderPreview(scenario);
      renderTimeline(scenario);
      renderActivity(scenario);
      renderHealth(scenario);
    }

    function setScenario(scenarioId) {
      if (!SCENARIOS[scenarioId]) {
        return;
      }
      state.currentScenario = scenarioId;
      state.tick = 0;
      state.elapsedSeconds = 0;
      updateClock();
      renderScenario();
      clearStatus();
      if (scenarioControls) {
        $all('[data-scenario]', scenarioControls).forEach((button) => {
          button.classList.toggle('is-active', button.getAttribute('data-scenario') === scenarioId);
        });
      }
    }

    function updateClock() {
      if (simClock) {
        simClock.textContent = formatTime(state.elapsedSeconds);
      }
    }

    function stepTimeline() {
      const scenario = SCENARIOS[state.currentScenario];
      if (!scenario) {
        return;
      }
      if (state.tick < scenario.timeline.length - 1) {
        state.tick += 1;
      } else {
        pauseSimulation();
        setStatus('Scenario complete. Reset to replay or select another mission.', 'success');
      }
      renderScenario();
    }

    function startSimulation() {
      if (state.running) {
        return;
      }
      state.running = true;
      setStatus('Simulation running. Timeline events will advance automatically.', 'info');
      state.timelineInterval = window.setInterval(stepTimeline, TIMELINE_INTERVAL);
      state.clockInterval = window.setInterval(() => {
        state.elapsedSeconds += 1;
        updateClock();
      }, CLOCK_INTERVAL);
    }

    function pauseSimulation() {
      if (!state.running) {
        return;
      }
      state.running = false;
      if (state.timelineInterval) {
        window.clearInterval(state.timelineInterval);
        state.timelineInterval = null;
      }
      if (state.clockInterval) {
        window.clearInterval(state.clockInterval);
        state.clockInterval = null;
      }
      setStatus('Simulation paused.', 'warning');
    }

    function resetSimulation() {
      if (state.timelineInterval) {
        window.clearInterval(state.timelineInterval);
        state.timelineInterval = null;
      }
      if (state.clockInterval) {
        window.clearInterval(state.clockInterval);
        state.clockInterval = null;
      }
      state.running = false;
      state.tick = 0;
      state.elapsedSeconds = 0;
      renderScenario();
      updateClock();
      clearStatus();
    }

    function bindScenarioControls() {
      if (!scenarioControls) return;
      scenarioControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-scenario]');
        if (!button) {
          return;
        }
        const scenarioId = button.getAttribute('data-scenario');
        if (!scenarioId || scenarioId === state.currentScenario) {
          return;
        }
        resetSimulation();
        setScenario(scenarioId);
      });
    }

    function bindSimulationActions() {
      $all('[data-sim-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.getAttribute('data-sim-action');
          if (action === 'start') {
            startSimulation();
          } else if (action === 'pause') {
            pauseSimulation();
          } else if (action === 'reset') {
            resetSimulation();
          }
        });
      });
    }

    setScenario(state.currentScenario);
    bindScenarioControls();
    bindSimulationActions();
  });
})(window, document);
