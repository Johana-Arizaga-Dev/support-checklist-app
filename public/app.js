// =====================================================
// CONFIGURACIÓN RÁPIDA
// Cambia estas dos constantes con los datos del usuario:
// USER_INITIALS = iniciales del técnico
// DEPARTMENT_NAME = nombre del departamento
// =====================================================
const USER_INITIALS = 'JDG';
const DEPARTMENT_NAME = 'Soporte Técnico';

const configuredInitials = document.getElementById('configuredInitials');
const configuredDepartment = document.getElementById('configuredDepartment');
const globalStatusText = document.getElementById('globalStatusText');
const globalStatusBox = document.getElementById('globalStatusBox');
const checklistBanner = document.getElementById('checklistBanner');
const savedActivities = document.getElementById('savedActivities');
const savedCountBadge = document.getElementById('savedCountBadge');
const checklistItems = document.getElementById('checklistItems');
const activityForm = document.getElementById('activityForm');
const activityLabel = document.getElementById('activityLabel');
const activityType = document.getElementById('activityType');
const resetChecklistButton = document.getElementById('resetChecklistButton');
const savedActivityTemplate = document.getElementById('savedActivityTemplate');
const checkItemTemplate = document.getElementById('checkItemTemplate');

configuredInitials.textContent = USER_INITIALS;
configuredDepartment.textContent = DEPARTMENT_NAME;

let activities = [];
let runtimeState = [];

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Ocurrió un error en la solicitud.');
  }

  return data;
}

function formatDateCode(date = new Date()) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function updateStatus() {
  if (!runtimeState.length) {
    globalStatusText.textContent = 'No hay actividades guardadas.';
    checklistBanner.textContent = 'Agrega actividades para empezar.';
    globalStatusBox.className = 'meta-box status-box pending';
    checklistBanner.className = 'status-banner pending';
    return;
  }

  const allDone = runtimeState.every((item) => {
    if (item.type === 'check') return item.value === true;
    return item.value.trim().length > 0;
  });

  if (allDone) {
    globalStatusText.textContent = 'Todas las actividades tienen check o captura completa.';
    checklistBanner.textContent = 'Checklist completo. Ya puedes cerrar el flujo de soporte.';
    globalStatusBox.className = 'meta-box status-box ok';
    checklistBanner.className = 'status-banner ok';
  } else {
    const completed = runtimeState.filter((item) => item.type === 'check' ? item.value : item.value.trim().length > 0).length;
    globalStatusText.textContent = `Faltan actividades. Llevas ${completed}/${runtimeState.length} completas.`;
    checklistBanner.textContent = 'Faltan actividades por completar.';
    globalStatusBox.className = 'meta-box status-box pending';
    checklistBanner.className = 'status-banner pending';
  }
}

function resetRuntimeState() {
  runtimeState = activities.map((activity) => ({
    id: activity._id,
    type: activity.type,
    value: activity.type === 'check' ? false : ''
  }));
  renderChecklist();
  updateStatus();
}

function renderSavedActivities() {
  savedActivities.innerHTML = '';
  savedCountBadge.textContent = `${activities.length} ${activities.length === 1 ? 'actividad' : 'actividades'}`;

  if (!activities.length) {
    savedActivities.innerHTML = '<li class="empty-state">No hay actividades guardadas todavía.</li>';
    return;
  }

  activities.forEach((activity) => {
    const node = savedActivityTemplate.content.cloneNode(true);
    node.querySelector('.saved-item-label').textContent = activity.label;
    node.querySelector('.saved-item-type').textContent = activity.type === 'check' ? 'Tipo: check' : 'Tipo: texto';
    node.querySelector('.delete-btn').addEventListener('click', () => deleteActivity(activity._id));
    savedActivities.appendChild(node);
  });
}

function buildCopyText(textValue) {
  return `${textValue} | ${formatDateCode()} | ${DEPARTMENT_NAME}`;
}

function renderChecklist() {
  checklistItems.innerHTML = '';

  if (!activities.length) {
    checklistItems.innerHTML = '<div class="empty-state">No hay actividades cargadas para el checklist.</div>';
    return;
  }

  activities.forEach((activity, index) => {
    const state = runtimeState.find((item) => item.id === activity._id);
    const node = checkItemTemplate.content.cloneNode(true);
    const card = node.querySelector('.check-card');
    const stepPill = node.querySelector('.step-pill');
    const typePill = node.querySelector('.type-pill');
    const label = node.querySelector('.check-item-label');
    const body = node.querySelector('.check-item-body');

    stepPill.textContent = `${USER_INITIALS} · Paso ${index + 1}`;
    typePill.textContent = activity.type === 'check' ? 'Palomita obligatoria' : 'Texto obligatorio';
    label.textContent = activity.label;

    if (activity.type === 'check') {
      const row = document.createElement('div');
      row.className = 'check-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(state?.value);
      checkbox.addEventListener('change', (event) => {
        state.value = event.target.checked;
        updateStatus();
      });

      const helper = document.createElement('span');
      helper.textContent = 'Marcar cuando la actividad esté completada.';
      helper.style.color = 'var(--muted)';

      row.appendChild(checkbox);
      row.appendChild(helper);
      body.appendChild(row);
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'text-field-wrap';

      const labelEl = document.createElement('label');
      labelEl.textContent = 'Captura requerida';

      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Escribe aquí el detalle requerido...';
      textarea.value = state?.value || '';
      textarea.addEventListener('input', (event) => {
        state.value = event.target.value;
        updateStatus();
      });

      const actionRow = document.createElement('div');
      actionRow.className = 'text-action-row';

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'btn btn-copy';
      copyButton.textContent = 'Copiar texto + fecha + departamento';

      const feedback = document.createElement('div');
      feedback.className = 'copy-feedback';

      copyButton.addEventListener('click', async () => {
        const content = textarea.value.trim();
        if (!content) {
          feedback.textContent = 'Primero escribe algo para copiar.';
          return;
        }

        try {
          await navigator.clipboard.writeText(buildCopyText(content));
          feedback.textContent = 'Texto copiado al portapapeles.';
        } catch (error) {
          feedback.textContent = 'No se pudo copiar automáticamente.';
        }
      });

      actionRow.appendChild(copyButton);
      wrap.appendChild(labelEl);
      wrap.appendChild(textarea);
      wrap.appendChild(actionRow);
      wrap.appendChild(feedback);
      body.appendChild(wrap);
    }

    checklistItems.appendChild(card);
  });
}

async function loadActivities() {
  try {
    activities = await requestJSON('/api/activities');
    renderSavedActivities();
    resetRuntimeState();
  } catch (error) {
    globalStatusText.textContent = error.message;
    checklistItems.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function addActivity(event) {
  event.preventDefault();

  try {
    await requestJSON('/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        label: activityLabel.value,
        type: activityType.value
      })
    });

    activityForm.reset();
    activityType.value = 'check';
    await loadActivities();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteActivity(id) {
  try {
    await requestJSON(`/api/activities/${id}`, { method: 'DELETE' });
    await loadActivities();
  } catch (error) {
    alert(error.message);
  }
}

activityForm.addEventListener('submit', addActivity);
resetChecklistButton.addEventListener('click', resetRuntimeState);

loadActivities();
