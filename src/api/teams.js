import { api } from "./client.js";

export function listTeams() {
  return api("/api/teams");
}

export function createTeam(name) {
  return api("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function inviteToTeam(teamId, username) {
  return api(`/api/teams/${teamId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function listTeamMembers(teamId) {
  return api(`/api/teams/${teamId}/members`);
}

export function kickMember(teamId, userId) {
  return api(`/api/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
}

export function leaveTeam(teamId) {
  return api(`/api/teams/${teamId}/leave`, {
    method: "POST",
  });
}

export function deleteTeam(teamId) {
  return api(`/api/teams/${teamId}`, {
    method: "DELETE",
  });
}
