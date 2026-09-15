// Tiny localStorage-backed "database" shared across tabs/components.
// Two tables: `users` and `referrals`. Cross-tab sync works via the native
// `storage` event, which fires in *other* tabs whenever localStorage changes.

const USERS_KEY = "referral_demo_users";
const REFERRALS_KEY = "referral_demo_referrals";
const SESSION_KEY = "referral_demo_session"; // which user is "logged in" in this tab

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  // Manually notify listeners in the SAME tab — the native `storage` event
  // only fires in other tabs/windows, not the one that made the change.
  window.dispatchEvent(new CustomEvent("local-db-change", { detail: { key } }));
}

// Generates a short, human-friendly referral code like "NT9K2XP".
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid ambiguity
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const db = {
  getUsers() {
    return read(USERS_KEY);
  },

  getReferrals() {
    return read(REFERRALS_KEY);
  },

  findUserByEmail(email) {
    return this.getUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  findUserByReferralCode(code) {
    if (!code) return null;
    return this.getUsers().find(
      (u) => u.referralCode.toLowerCase() === code.toLowerCase()
    );
  },

  findUserById(id) {
    return this.getUsers().find((u) => u.id === id);
  },

  /**
   * Creates a new user, assigns them a unique referral code, and — if a
   * valid referrerCode was supplied — creates a "pending" referral linking
   * the new user to whoever referred them.
   *
   * Edge cases handled here:
   *  - Unknown referral code: ignored silently, user just signs up normally.
   *  - Self-referral: not possible at signup time since the new user has no
   *    code yet, but we guard it anyway in case of manual URL tampering.
   */
  createUser({ name, email, referrerCode }) {
    const users = this.getUsers();

    let referralCode;
    do {
      referralCode = generateReferralCode();
    } while (users.some((u) => u.referralCode === referralCode));

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      referralCode,
      walletBalance: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    write(USERS_KEY, users);

    const referrer = referrerCode ? this.findUserByReferralCode(referrerCode) : null;

    if (referrer && referrer.id !== newUser.id) {
      const referrals = this.getReferrals();
      referrals.push({
        id: crypto.randomUUID(),
        referrerUserId: referrer.id,
        referrerCode: referrer.referralCode,
        referredUserId: newUser.id,
        status: "pending", // -> "rewarded" once referred user completes first paid consult
        createdAt: new Date().toISOString(),
        rewardedAt: null,
      });
      write(REFERRALS_KEY, referrals);
    }

    return newUser;
  },

  /**
   * Simulates the referred user completing their first paid consultation.
   * Credits both the referrer and the referred user's wallets, and flips
   * the referral status from "pending" to "rewarded".
   */
  completeFirstConsultation(userId, rewardAmount = 500) {
    const referrals = this.getReferrals();
    const referral = referrals.find(
      (r) => r.referredUserId === userId && r.status === "pending"
    );

    if (!referral) return { credited: false };

    const users = this.getUsers();
    const referrer = users.find((u) => u.id === referral.referrerUserId);
    const referred = users.find((u) => u.id === referral.referredUserId);

    if (referrer) referrer.walletBalance += rewardAmount;
    if (referred) referred.walletBalance += rewardAmount;

    referral.status = "rewarded";
    referral.rewardedAt = new Date().toISOString();
    referral.rewardAmount = rewardAmount;

    write(USERS_KEY, users);
    write(REFERRALS_KEY, referrals);

    return { credited: true, rewardAmount };
  },

  // --- session helpers (per-tab "who's logged in") ---
  getSessionUserId() {
    return sessionStorage.getItem(SESSION_KEY);
  },
  setSessionUserId(id) {
    sessionStorage.setItem(SESSION_KEY, id);
  },
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  // --- dangerous: full reset, used by the admin/debug view ---
  resetAll() {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(REFERRALS_KEY);
    write(USERS_KEY, []);
  },
};
