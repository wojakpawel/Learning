import React from "react";
import {
  createTeam,
  deleteTeam,
  inviteToTeam,
  kickMember,
  leaveTeam,
  listTeamMembers,
  listTeams,
} from "./api/teams.js";

const Teams = ({ onTeamsUpdate, onMembershipChange, refreshKey = 0 }) => {
  const [teams, setTeams] = React.useState([]);
  const [teamName, setTeamName] = React.useState("");
  const [inviteUsernames, setInviteUsernames] = React.useState({});
  const [expandedTeamId, setExpandedTeamId] = React.useState(null);
  const [membersByTeamId, setMembersByTeamId] = React.useState({});
  const [membersLoadingTeamId, setMembersLoadingTeamId] = React.useState(null);
  const [membersError, setMembersError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mutating, setMutating] = React.useState(false);

  const loadTeams = React.useCallback(async () => {
    setError("");

    try {
      const data = await listTeams();
      setTeams(data);
      onTeamsUpdate?.(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [onTeamsUpdate]);

  React.useEffect(() => {
    setLoading(true);
    loadTeams();
  }, [loadTeams, refreshKey]);

  const loadMembers = React.useCallback(async (teamId) => {
    setMembersError("");
    setMembersLoadingTeamId(teamId);

    try {
      const data = await listTeamMembers(teamId);
      setMembersByTeamId((current) => ({ ...current, [teamId]: data }));
    } catch (loadError) {
      setMembersError(loadError.message);
    } finally {
      setMembersLoadingTeamId(null);
    }
  }, []);

  const handleToggleMembers = async (teamId) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      return;
    }

    setExpandedTeamId(teamId);
    setMembersError("");

    if (!membersByTeamId[teamId]) {
      await loadMembers(teamId);
    }
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await createTeam(trimmedName);
      setTeamName("");
      await loadTeams();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleInvite = async (teamId) => {
    const username = (inviteUsernames[teamId] ?? "").trim();

    if (!username) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await inviteToTeam(teamId, username);
      setInviteUsernames((current) => ({ ...current, [teamId]: "" }));
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleKick = async (teamId, userId, username) => {
    if (!window.confirm(`Remove ${username} from this team?`)) {
      return;
    }

    setMutating(true);
    setMembersError("");

    try {
      await kickMember(teamId, userId);
      await loadMembers(teamId);
      onMembershipChange?.();
    } catch (kickError) {
      setMembersError(kickError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleLeave = async (team) => {
    if (!window.confirm(`Leave team "${team.name}"?`)) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await leaveTeam(team.id);
      setExpandedTeamId(null);
      setMembersByTeamId((current) => {
        const next = { ...current };
        delete next[team.id];
        return next;
      });
      await loadTeams();
      onMembershipChange?.();
    } catch (leaveError) {
      setError(leaveError.message);
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    if (
      !window.confirm(
        `Delete team "${team.name}"? All team tasks will be removed.`,
      )
    ) {
      return;
    }

    setMutating(true);
    setError("");

    try {
      await deleteTeam(team.id);
      setExpandedTeamId(null);
      setMembersByTeamId((current) => {
        const next = { ...current };
        delete next[team.id];
        return next;
      });
      await loadTeams();
      onMembershipChange?.();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setMutating(false);
    }
  };

  const membersLabel = (teamId) => {
    const members = membersByTeamId[teamId];

    if (members) {
      return `Members (${members.length})`;
    }

    return "Members";
  };

  if (loading) {
    return <p className="loading-message">Loading teams...</p>;
  }

  return (
    <div className="todo-panel teams-panel">
      <h2>Teams</h2>
      <form onSubmit={handleCreateTeam}>
        <input
          type="text"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="New team name"
          disabled={mutating}
        />
        <button
          type="submit"
          disabled={mutating}
          className={mutating ? "is-loading" : ""}
        >
          {mutating ? "Please wait..." : "Create team"}
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      {teams.length === 0 ? (
        <p className="no-tasks">No teams yet. Create one above.</p>
      ) : (
        <ul className="team-list">
          {teams.map((team) => (
            <li key={team.id} className="team-item">
              <div className="team-item-header">
                <div>
                  <strong>{team.name}</strong>
                  {team.isOwner ? (
                    <span className="team-badge">Owner</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="members-toggle"
                  onClick={() => handleToggleMembers(team.id)}
                  disabled={mutating}
                  aria-expanded={expandedTeamId === team.id}
                >
                  {expandedTeamId === team.id ? "Hide" : membersLabel(team.id)}
                </button>
              </div>
              {team.isOwner ? (
                <div className="invite-row">
                  <input
                    type="text"
                    value={inviteUsernames[team.id] ?? ""}
                    onChange={(event) =>
                      setInviteUsernames((current) => ({
                        ...current,
                        [team.id]: event.target.value,
                      }))
                    }
                    placeholder="Invite username"
                    disabled={mutating}
                  />
                  <button
                    type="button"
                    className="task-remove"
                    disabled={mutating}
                    onClick={() => handleInvite(team.id)}
                  >
                    Invite
                  </button>
                </div>
              ) : null}
              {expandedTeamId === team.id ? (
                <div className="members-panel">
                  {membersError ? (
                    <p className="form-error">{membersError}</p>
                  ) : null}
                  {membersLoadingTeamId === team.id ? (
                    <p className="loading-message">Loading members...</p>
                  ) : membersByTeamId[team.id]?.length ? (
                    <ul className="member-list">
                      {membersByTeamId[team.id].map((member) => (
                        <li key={member.userId} className="member-item">
                          <span>
                            {member.username}
                            {member.isOwner ? (
                              <span className="team-badge">Owner</span>
                            ) : null}
                          </span>
                          {team.isOwner && !member.isOwner ? (
                            <button
                              type="button"
                              className="logout-button"
                              disabled={mutating}
                              onClick={() =>
                                handleKick(
                                  team.id,
                                  member.userId,
                                  member.username,
                                )
                              }
                            >
                              Kick
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-tasks">No members found.</p>
                  )}
                  <div className="team-actions">
                    {team.isOwner ? (
                      <button
                        type="button"
                        className="danger-button"
                        disabled={mutating}
                        onClick={() => handleDeleteTeam(team)}
                      >
                        Delete team
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="logout-button"
                        disabled={mutating}
                        onClick={() => handleLeave(team)}
                      >
                        Leave team
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Teams;
