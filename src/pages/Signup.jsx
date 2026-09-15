import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useData } from "../DataContext";

export default function Signup() {
  const { createUser, findUserByEmail, findUserByReferralCode, login } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const refCodeFromUrl = searchParams.get("ref") || "";
  const referrer = findUserByReferralCode(refCodeFromUrl);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Please fill in both name and email.");
      return;
    }

    if (findUserByEmail(email)) {
      setError("An account with this email already exists.");
      return;
    }

    // Self-referral guard: a returning visitor with their OWN code in the
    // URL (e.g. they shared their own link with themselves by mistake)
    // shouldn't be able to "refer" the account they're about to create.
    // Since the new account doesn't exist yet, self-referral in practice
    // means "the email being signed up already owns this exact code" —
    // we check that explicitly.
    if (referrer && referrer.email.toLowerCase() === email.toLowerCase()) {
      setError("You can't use your own referral code.");
      return;
    }

    const user = createUser({
      name: name.trim(),
      email: email.trim(),
      referrerCode: refCodeFromUrl,
    });

    login(user.id);
    navigate("/dashboard");
  }

  return (
    <div className="page">
      <h1>Create your account</h1>

      {refCodeFromUrl && referrer && (
        <div className="banner banner-success">
          You were invited by <strong>{referrer.referralCode}</strong> ({referrer.name})
        </div>
      )}

      {refCodeFromUrl && !referrer && (
        // Unknown code: silently ignored, no error shown to the user.
        <div className="banner banner-muted">Starting a fresh signup.</div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@example.com"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit">Sign up</button>
      </form>

      <p className="muted">
        Already have an account? <Link to="/dashboard">Go to dashboard</Link>
      </p>
    </div>
  );
}
