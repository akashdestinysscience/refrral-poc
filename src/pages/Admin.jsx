import { useData } from "../DataContext";

export default function Admin() {
  const { users, referrals, findUserById, resetAll } = useData();

  return (
    <div className="page">
      <div className="row-between">
        <h1>Admin / Debug</h1>
        <button
          className="danger"
          onClick={() => {
            if (confirm("Reset all users and referrals?")) resetAll();
          }}
        >
          Reset all data
        </button>
      </div>

      <div className="card">
        <h2>Users ({users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Referral code</th>
              <th>Wallet</th>
              <th>Referral rewards earned</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rewardsEarned = referrals
                .filter((r) => r.referrerUserId === u.id && r.status === "rewarded")
                .reduce((sum, r) => sum + (r.rewardAmount ?? 0), 0);
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.referralCode}</td>
                  <td>₹{u.walletBalance}</td>
                  <td>₹{rewardsEarned}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Referral relationships ({referrals.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Referred</th>
              <th>Status</th>
              <th>Created</th>
              <th>Rewarded</th>
              <th>Reward amount</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id}>
                <td>{findUserById(r.referrerUserId)?.name ?? "?"} ({r.referrerCode})</td>
                <td>{findUserById(r.referredUserId)?.name ?? "?"}</td>
                <td>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.rewardedAt ? new Date(r.rewardedAt).toLocaleString() : "—"}</td>
                <td>{r.rewardAmount ? `₹${r.rewardAmount}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
