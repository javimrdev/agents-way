const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3030;
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CATALOG_AGENTS_DIR = path.join(ROOT, 'catalog', 'agents');
const CATALOG_SKILLS_DIR = path.join(ROOT, 'catalog', 'skills');

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function sanitizeName(name) {
  return String(name || '').replace(/[^a-zA-Z0-9._-]/g, '');
}

async function readCatalog() {
  const agentFiles = await fsp.readdir(CATALOG_AGENTS_DIR, { withFileTypes: true });
  const skillDirs = await fsp.readdir(CATALOG_SKILLS_DIR, { withFileTypes: true });

  const agents = agentFiles
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => ({
      id: e.name.replace(/\.md$/, ''),
      name: e.name.replace(/\.md$/, ''),
      source: path.join(CATALOG_AGENTS_DIR, e.name),
    }));

  const skills = skillDirs
    .filter((e) => e.isDirectory())
    .map((e) => ({
      id: e.name,
      name: e.name,
      source: path.join(CATALOG_SKILLS_DIR, e.name, 'SKILL.md'),
    }))
    .filter((e) => fs.existsSync(e.source));

  return { agents, skills };
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function copyFileSafe(source, target) {
  await ensureDir(path.dirname(target));
  await fsp.copyFile(source, target);
}

async function installSelection(targetProjectPath, selectedAgents, selectedSkills) {
  const absoluteTarget = path.resolve(targetProjectPath);
  const codexDir = path.join(absoluteTarget, '.codex');
  const agentsDir = path.join(codexDir, 'agents');
  const skillsDir = path.join(codexDir, 'skills');

  await ensureDir(agentsDir);
  await ensureDir(skillsDir);

  const installedAgents = [];
  for (const rawAgent of selectedAgents) {
    const agent = sanitizeName(rawAgent);
    if (!agent) continue;

    const source = path.join(CATALOG_AGENTS_DIR, `${agent}.md`);
    const target = path.join(agentsDir, `${agent}.md`);
    if (!fs.existsSync(source)) continue;

    await copyFileSafe(source, target);
    installedAgents.push(agent);
  }

  const installedSkills = [];
  for (const rawSkill of selectedSkills) {
    const skill = sanitizeName(rawSkill);
    if (!skill) continue;

    const source = path.join(CATALOG_SKILLS_DIR, skill, 'SKILL.md');
    const target = path.join(skillsDir, skill, 'SKILL.md');
    if (!fs.existsSync(source)) continue;

    await copyFileSafe(source, target);
    installedSkills.push(skill);
  }

  const agentsInstructions = installedAgents.map((name) => `@.codex/agents/${name}.md`).join('\n');
  const skillsInstructions = installedSkills.map((name) => `@.codex/skills/${name}/SKILL.md`).join('\n');

  const bodyLines = [agentsInstructions, skillsInstructions].filter(Boolean).join('\n');

  const agentsMdPath = path.join(absoluteTarget, 'AGENTS.md');
  const content = [
    '# AGENTS.md',
    '',
    '<INSTRUCTIONS>',
    bodyLines || '','</INSTRUCTIONS>',''
  ].join('\n');

  await fsp.writeFile(agentsMdPath, content, 'utf8');

  return {
    targetProject: absoluteTarget,
    installedAgents,
    installedSkills,
    agentsMdPath,
  };
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function contentTypeFor(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

async function serveStatic(req, res) {
  const pathname = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden path' });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/catalog') {
      const catalog = await readCatalog();
      sendJson(res, 200, catalog);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/install') {
      const body = await parseBody(req);
      const targetProjectPath = String(body.targetProjectPath || '').trim();
      const selectedAgents = Array.isArray(body.selectedAgents) ? body.selectedAgents : [];
      const selectedSkills = Array.isArray(body.selectedSkills) ? body.selectedSkills : [];

      if (!targetProjectPath) {
        sendJson(res, 400, { error: 'targetProjectPath is required' });
        return;
      }

      const result = await installSelection(targetProjectPath, selectedAgents, selectedSkills);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unexpected error' });
  }
});

server.listen(PORT, () => {
  console.log(`Agents Way UI running on http://localhost:${PORT}`);
});
