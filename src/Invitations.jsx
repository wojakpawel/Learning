import React from "react";
import {
  listInvitations,
  acceptInvitation,
  rejectInvitation,
} from "./api/invitations.js";

const Invitations = ({ onMembershipChange }) => {
  const [invitations, setInvitations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mutating, setMutating] = React.useState(null);

  const loadInvitations = React.useCallback(async () => {
    setError("");

    try {
      const data = await listInvitations();
      setInvitations(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (invitationId) => {
    setMutating({ id: invitationId, action: "accept" });
    setError("");

    try {
      await acceptInvitation(invitationId);
      await loadInvitations();
      onMembershipChange?.();
    } catch (acceptError) {
      setError(acceptError.message);
    } finally {
      setMutating(null);
    }
  };

  const handleReject = async (invitationId) => {
    setMutating({ id: invitationId, action: "reject" });
    setError("");

    try {
      await rejectInvitation(invitationId);
      await loadInvitations();
    } catch (rejectError) {
      setError(rejectError.message);
    } finally {
      setMutating(null);
    }
  };

  if (loading) {
    return <p className="loading-message">Loading invitations...</p>;
  }

  const isMutating = mutating !== null;

  return (
    <div className="todo-panel invitations-panel">
      <h2>Invitations</h2>
      {error ? <p className="form-error">{error}</p> : null}
      {invitations.length === 0 ? (
        <p className="no-tasks">No pending invitations.</p>
      ) : (
        <ul className="invitation-list">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="invitation-item">
              <div>
                <strong>{invitation.teamName}</strong>
                <p>Invited by {invitation.invitedByUsername}</p>
              </div>
              <div className="invitation-actions">
                <button
                  type="button"
                  className="task-remove"
                  disabled={isMutating}
                  onClick={() => handleAccept(invitation.id)}
                >
                  {mutating?.id === invitation.id &&
                  mutating.action === "accept"
                    ? "Accepting..."
                    : "Accept"}
                </button>
                <button
                  type="button"
                  className="logout-button"
                  disabled={isMutating}
                  onClick={() => handleReject(invitation.id)}
                >
                  {mutating?.id === invitation.id &&
                  mutating.action === "reject"
                    ? "Rejecting..."
                    : "Reject"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Invitations;
