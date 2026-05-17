const agentsList = document.getElementById('agentsList');
const skillsList = document.getElementById('skillsList');
const installBtn = document.getElementById('installBtn');
const resultEl = document.getElementById('result');
const targetInput = document.getElementById('targetProjectPath');

function renderCheckbox(container, prefix, item) {
  const id = `${prefix}-${item.id}`;
  const label = document.createElement('label');
  label.innerHTML = `<input type="checkbox" value="${item.id}" id="${id}"> ${item.name}`;
  container.appendChild(label);
}

function checkedValues(container) {
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((el) => el.value);
}

async function loadCatalog() {
  const res = await fetch('/api/catalog');
  const data = await res.json();

  agentsList.innerHTML = '';
  skillsList.innerHTML = '';

  data.agents.forEach((agent) => renderCheckbox(agentsList, 'agent', agent));
  data.skills.forEach((skill) => renderCheckbox(skillsList, 'skill', skill));
}

async function install() {
  const targetProjectPath = targetInput.value.trim();
  const selectedAgents = checkedValues(agentsList);
  const selectedSkills = checkedValues(skillsList);

  const res = await fetch('/api/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetProjectPath, selectedAgents, selectedSkills }),
  });

  const payload = await res.json();
  resultEl.textContent = JSON.stringify(payload, null, 2);
}

installBtn.addEventListener('click', install);
loadCatalog().catch((err) => {
  resultEl.textContent = `Error cargando catálogo: ${err.message}`;
});
