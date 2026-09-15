import { useNavigate } from "react-router-dom";
import { useData } from "../DataContext";

export default function Dashboard() {
  const {
    users,
    referrals,
    getSessionUserId,
    login,
    logout,
    completeFirstConsultation,
    findUserById,
  } = useData();
  const navigate = useNavigate();

  const sessionUserId = getSessionUserId();
  const currentUser = sessionUserId ? findUserById(sessionUserId) : null;

  if (!currentUser) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p>No one is logged in on this tab yet.</p>

        {users.length > 0 && (
          <div className="card">
            <p className="muted">For demo purposes, log in as an existing user:</p>
            {users.map((u) => (
              <button key={u.id} className="secondary" onClick={() => login(u.id)}>
                Log in as {u.name} ({u.referralCode})
              </button>
            ))}
          </div>
        )}

        <p className="muted">
          Or <a href="/">sign up</a> to create a new account.
        </p>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/signup?ref=${currentUser.referralCode}`;

  const myReferrals = referrals.filter((r) => r.referrerUserId === currentUser.id);
  const myIncomingReferral = referrals.find((r) => r.referredUserId === currentUser.id);

  function copyLink() {
    navigator.clipboard?.writeText(referralLink);
  }

  function simulateConsultation() {
    completeFirstConsultation(currentUser.id);
  }

  return (
    <div className="page">
      <div className="row-between">
        <h1>Welcome, {currentUser.name}</h1>
        <button className="secondary" onClick={() => { logout(); navigate("/"); }}>
          Log out
        </button>
      </div>

      <div className="card">
        <h2>Wallet</h2>
        <p className="wallet-balance">₹{currentUser.walletBalance}</p>
      </div>

      <div className="card">
        <h2>Your referral code</h2>
        <p className="code">{currentUser.referralCode}</p>
        <div className="row">
          <input readOnly value={referralLink} />
          <button onClick={copyLink}>Copy link</button>
        </div>
      </div>

      {myIncomingReferral && myIncomingReferral.status === "pending" && (
        <div className="card">
          <h2>Complete your first consultation</h2>
          <p className="muted">
            You were referred and haven't completed a paid consultation yet. Simulate
            that here to trigger the referral reward for both you and your referrer.
          </p>
          <button onClick={simulateConsultation}>
            Complete first paid consultation (Get Money)
          </button>
        </div>
      )}

      {myReferrals.length > 0 && (
        <div className="card">
          <h2>People you've referred</h2>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myReferrals.map((r) => {
                const referred = findUserById(r.referredUserId);
                return (
                  <tr key={r.id}>
                    <td>{referred?.name ?? "Unknown"}</td>
                    <td>
                      <span className={`status status-${r.status}`}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
