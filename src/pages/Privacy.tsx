import { LegalPage } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How KOVA AI collects, uses, and protects your personal data."
      path="/privacy"
      updated="August 19, 2026"
    >
      <p>
        KOVA AI ("KOVA", "we", "us") operates the website kova.ai and the KOVA
        AI iOS application. This Privacy Policy explains what information we
        collect, why we collect it, and how you can control it.
      </p>

      <h2>1. Information we collect</h2>
      <p>We collect the information you provide to us directly:</p>
      <ul>
        <li><strong>Account data</strong> — your name and email address when you create an account or join the waitlist.</li>
        <li><strong>Purchase data</strong> — subscription details and payment status when you buy a plan. Payment card details are handled by Stripe and are never stored on our servers.</li>
        <li><strong>Training data</strong> — workouts, feedback, and progress information you record in the app, so KOVA can adapt your training.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide and personalize the KOVA coaching experience.</li>
        <li>To manage your account and subscription.</li>
        <li>To send service and waitlist updates you have requested.</li>
        <li>To improve the product and fix issues.</li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        We process your data on the basis of your consent, the performance of a
        contract (your subscription), and our legitimate interest in improving
        the service. Where required by law, such as the GDPR, you may withdraw
        consent at any time.
      </p>

      <h2>4. Service providers</h2>
      <p>
        We share data only with providers that help us run KOVA, including:
      </p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
        <li><strong>Convex</strong> — our database and backend infrastructure.</li>
        <li><strong>Email providers</strong> — to deliver waitlist and account emails.</li>
      </ul>

      <h2>5. Data retention</h2>
      <p>
        We keep your data for as long as your account is active or as needed to
        provide the service. You may request deletion at any time by emailing{" "}
        <a href="mailto:hello@kova.ai">hello@kova.ai</a>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use only the cookies and local storage necessary for the site to
        function and to keep you signed in. We do not use advertising cookies.
      </p>

      <h2>7. Your rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your data.</li>
        <li>Request a copy of your data (data portability).</li>
        <li>Object to or restrict certain processing.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:hello@kova.ai">hello@kova.ai</a>.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the
        updated version on this page and update the "Last updated" date above.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Email us at{" "}
        <a href="mailto:hello@kova.ai">hello@kova.ai</a>.
      </p>
    </LegalPage>
  );
}
