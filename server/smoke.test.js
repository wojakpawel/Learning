const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const { app } = require("./app");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "smoke-test-secret";
}

const runId = Date.now().toString(36);
const ownerUsername = `smoke_owner_${runId}`;
const memberUsername = `smoke_member_${runId}`;
const password = "smokepass1";
const teamName = `smoke_team_${runId}`;

async function withServer(run) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();

  const request = async (method, path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    let json = null;

    if (text) {
      json = JSON.parse(text);
    }

    return { status: response.status, json };
  };

  try {
    return await run(request);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function register(request, username) {
  const response = await request("POST", "/api/auth/register", {
    body: { username, password },
  });

  assert.equal(response.status, 201);
  assert.ok(response.json.token);
  assert.equal(response.json.user.username, username);

  return response.json;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

test("API smoke: health, teams, members, tasks, leave, delete", async () => {
  await withServer(async (request) => {
    const health = await request("GET", "/api/health");
    assert.equal(health.status, 200);
    assert.deepEqual(health.json, { ok: true });

    const owner = await register(request, ownerUsername);
    const member = await register(request, memberUsername);

    const me = await request("GET", "/api/auth/me", {
      headers: authHeader(owner.token),
    });
    assert.equal(me.status, 200);
    assert.equal(me.json.username, ownerUsername);

    const createTeam = await request("POST", "/api/teams", {
      headers: authHeader(owner.token),
      body: { name: teamName },
    });
    assert.equal(createTeam.status, 201);
    assert.equal(createTeam.json.name, teamName);
    assert.equal(createTeam.json.isOwner, true);

    const teamId = createTeam.json.id;

    const listTeams = await request("GET", "/api/teams", {
      headers: authHeader(owner.token),
    });
    assert.equal(listTeams.status, 200);
    assert.equal(listTeams.json.length, 1);

    const members = await request("GET", `/api/teams/${teamId}/members`, {
      headers: authHeader(owner.token),
    });
    assert.equal(members.status, 200);
    assert.equal(members.json.length, 1);
    assert.equal(members.json[0].username, ownerUsername);
    assert.equal(members.json[0].isOwner, true);

    const invite = await request("POST", `/api/teams/${teamId}/invitations`, {
      headers: authHeader(owner.token),
      body: { username: memberUsername },
    });
    assert.equal(invite.status, 201);

    const invitations = await request("GET", "/api/invitations", {
      headers: authHeader(member.token),
    });
    assert.equal(invitations.status, 200);
    assert.equal(invitations.json.length, 1);

    const accept = await request(
      "POST",
      `/api/invitations/${invitations.json[0].id}/accept`,
      { headers: authHeader(member.token) },
    );
    assert.equal(accept.status, 200);
    assert.equal(accept.json.teamName, teamName);

    const memberView = await request("GET", `/api/teams/${teamId}/members`, {
      headers: authHeader(member.token),
    });
    assert.equal(memberView.status, 200);
    assert.equal(memberView.json.length, 2);

    const createTask = await request("POST", "/api/tasks", {
      headers: authHeader(owner.token),
      body: {
        name: "Shared smoke task",
        description: "team task",
        teamId,
      },
    });
    assert.equal(createTask.status, 201);
    assert.equal(createTask.json.scope, "team");
    assert.equal(createTask.json.showCreator, false);

    const memberTasks = await request("GET", "/api/tasks", {
      headers: authHeader(member.token),
    });
    assert.equal(memberTasks.status, 200);
    assert.equal(memberTasks.json.length, 1);
    assert.equal(memberTasks.json[0].showCreator, true);
    assert.equal(memberTasks.json[0].createdByUsername, ownerUsername);

    const leaveDenied = await request("POST", `/api/teams/${teamId}/leave`, {
      headers: authHeader(owner.token),
    });
    assert.equal(leaveDenied.status, 403);

    const leave = await request("POST", `/api/teams/${teamId}/leave`, {
      headers: authHeader(member.token),
    });
    assert.equal(leave.status, 204);

    const memberTeams = await request("GET", "/api/teams", {
      headers: authHeader(member.token),
    });
    assert.equal(memberTeams.status, 200);
    assert.equal(memberTeams.json.length, 0);

    const deleteTeam = await request("DELETE", `/api/teams/${teamId}`, {
      headers: authHeader(owner.token),
    });
    assert.equal(deleteTeam.status, 204);

    const ownerTeams = await request("GET", "/api/teams", {
      headers: authHeader(owner.token),
    });
    assert.equal(ownerTeams.status, 200);
    assert.equal(ownerTeams.json.length, 0);

    const ownerTasks = await request("GET", "/api/tasks", {
      headers: authHeader(owner.token),
    });
    assert.equal(ownerTasks.status, 200);
    assert.equal(ownerTasks.json.length, 0);
  });
});
