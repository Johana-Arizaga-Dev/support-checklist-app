const USER_INITIALS = 'JDG';       // aquí cambias las iniciales
const DEPARTMENT_NAME = 'Soporte'; // aquí cambias el nombre del área

const activitiesList = document.getElementById('activitiesList');
const addActivityForm = document.getElementById('addActivityForm');
const activityLabelInput = document.getElementById('activityLabel');
const activityTypeSelect = document.getElementById('activityType');
const statusBox = document.getElementById('statusBox');
const clearChecklistBtn = document.getElementById('clearChecklistBtn');
const savedSummary = document.getElementById('savedSummary');
const initialsBadge = document.getElementById('initialsBadge');
const departmentChip = document.getElementById('departmentChip');

let activities = [];
let transientState = {};

initialsBadge.textContent = USER_INITIALS;
departmentChip.textContent = DEPARTMENT_NAME;

function formatDateCode(date = new Date()) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function showToast(message) {
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 1800);
}

function updateSummary() {
  const total = activities.length;
  savedSummary.textContent = `${total} ${total === 1 ? 'actividad registrada' : 'actividades registradas'}`;
}

function validateChecklist() {
  if (!activities.length) {
    statusBox.textContent = 'No hay actividades configuradas';
    statusBox.classList.remove('complete');
    statusBox.classList.add('incomplete');
    return;
  }

  let allComplete = true;

  for (const item of activities) {
    const state = transientState[item._id] || {};

    if (item.type === 'check' && !state.checked) {
      allComplete = false;
      break;
    }

    if (item.type === 'text' && !String(state.text || '').trim()) {
      allComplete = false;
      break;
    }
  }

  if (allComplete) {
    statusBox.textContent = 'Todas las actividades están completas';
    statusBox.classList.remove('incomplete');
    statusBox.classList.add('complete');
  } else {
    statusBox.textContent = 'Faltan actividades por completar';
    statusBox.classList.remove('complete');
    statusBox.classList.add('incomplete');
  }
}

function createCheckRow(item) {
  const row = document.createElement('div');
  row.className = 'activity-row';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'activity-check';
  checkbox.checked = !!transientState[item._id]?.checked;

  checkbox.addEventListener('change', () => {
    transientState[item._id] = {
      ...transientState[item._id],
      checked: checkbox.checked
    };
    validateChecklist();
  });

  const label = document.createElement('div');
  label.className = 'activity-label';
  label.textContent = item.label;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Eliminar actividad';
  deleteBtn.addEventListener('click', () => deleteActivity(item._id));

  row.appendChild(checkbox);
  row.appendChild(label);
  row.appendChild(deleteBtn);

  return row;
}

function createTextRow(item) {
  const row = document.createElement('div');
  row.className = 'activity-row text-only';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'activity-input';
  input.placeholder = item.label;
  input.value = transientState[item._id]?.text || '';

  input.addEventListener('input', () => {
    transientState[item._id] = {
      ...transientState[item._id],
      text: input.value
    };
    validateChecklist();
  });

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-copy';
  copyBtn.textContent = 'Copiar';
  copyBtn.addEventListener('click', async () => {
    const textValue = input.value.trim();

    if (!textValue) {
      showToast('Escribe un texto antes de copiar');
      return;
    }

    const finalText = `${textValue} ${formatDateCode()} ${DEPARTMENT_NAME}`;

    try {
      await navigator.clipboard.writeText(finalText);
      showToast('Texto copiado');
    } catch (error) {
      input.select();
      document.execCommand('copy');
      showToast('Texto copiado');
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Eliminar actividad';
  deleteBtn.addEventListener('click', () => deleteActivity(item._id));

  row.appendChild(input);
  row.appendChild(copyBtn);
  row.appendChild(deleteBtn);

  return row;
}

function renderActivities() {
  activitiesList.innerHTML = '';

  if (!activities.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div>
        <strong>No hay actividades configuradas.</strong><br />
        Agrega una actividad de tipo check o texto desde el panel derecho.
      </div>
    `;
    activitiesList.appendChild(empty);
    updateSummary();
    validateChecklist();
    return;
  }

  for (const item of activities) {
    if (!transientState[item._id]) {
      transientState[item._id] = {
        checked: false,
        text: ''
      };
    }

    const row = item.type === 'check' ? createCheckRow(item) : createTextRow(item);
    activitiesList.appendChild(row);
  }

  updateSummary();
  validateChecklist();
}

async function fetchActivities() {
  try {
    const response = await fetch('/api/activities');
    const data = await response.json();
    activities = Array.isArray(data) ? data : [];
    renderActivities();
  } catch (error) {
    showToast('No se pudieron cargar las actividades');
  }
}

async function addActivity(label, type) {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ label, type })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo guardar');
    }

    activities.push(data);
    transientState[data._id] = { checked: false, text: '' };
    renderActivities();
    showToast('Actividad agregada');
  } catch (error) {
    showToast(error.message || 'Error al guardar actividad');
  }
}

async function deleteActivity(id) {
  try {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo eliminar');
    }

    activities = activities.filter((item) => item._id !== id);
    delete transientState[id];
    renderActivities();
    showToast('Actividad eliminada');
  } catch (error) {
    showToast(error.message || 'Error al eliminar actividad');
  }
}

function clearChecklist() {
  transientState = {};

  for (const item of activities) {
    transientState[item._id] = {
      checked: false,
      text: ''
    };
  }

  renderActivities();
  showToast('Checklist vaciado');
}

addActivityForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const label = activityLabelInput.value.trim();
  const type = activityTypeSelect.value;

  if (!label) {
    showToast('Escribe una actividad');
    return;
  }

  await addActivity(label, type);
  addActivityForm.reset();
  activityTypeSelect.value = 'check';
});

clearChecklistBtn.addEventListener('click', clearChecklist);

fetchActivities();
