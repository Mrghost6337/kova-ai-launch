import { LegalPage } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms that govern your use of KOVA AI and its services."
      path="/terms"
      updated="August 19, 2026"
    >
      <p>
        These Terms of Service ("Terms") govern your use of the KOVA AI website,
        iOS application, and related services ("KOVA"). By using KOVA, you agree
        to these Terms.
      </p>

      <h2>1. The service</h2>
      <p>
        KOVA is an adaptive AI strength-training coach for iPhone. It builds
        workouts, guides your sessions, and adjusts your plan based on your
        feedback and progress.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least 16 years old to use KOVA. You are responsible for
        keeping your account credentials secure and for all activity under your
        account.
      </p>

      <h2>3. Subscriptions and payments</h2>
      <ul>
        <li>KOVA offers monthly and annual subscription plans.</li>
        <li>Payments are processed securely by Stripe. We do not store your card details.</li>
        <li>Subscriptions renew automatically until you cancel them.</li>
      </ul>

      <h2>4. Cancellation and refunds</h2>
      <p>
        You can cancel your subscription at any time from your account settings
        or by emailing{" "}
        <a href="mailto:hello@kova.ai">hello@kova.ai</a>. Cancellation stops the
        next renewal; you keep access until the end of the current billing
        period. Refunds are handled case by case.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use KOVA for any unlawful purpose.</li>
        <li>Attempt to disrupt, reverse engineer, or gain unauthorized access to the service.</li>
        <li>Share, resell, or exploit KOVA content without our permission.</li>
      </ul>

      <h2>6. Health disclaimer</h2>
      <p>
        KOVA provides general training guidance and is not a medical device. The
        app is not a substitute for professional medical advice, diagnosis, or
        treatment. Always consult a qualified professional before starting a new
        exercise program, especially if you have an existing condition or
        injury.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The KOVA name, logo, design, and content are owned by KOVA and protected
        by intellectual property laws. You may not copy or use them without
        written permission.
      </p>

      <h2>8. Disclaimer of warranties</h2>
      <p>
        KOVA is provided "as is" and "as available" without warranties of any
        kind, express or implied, to the maximum extent permitted by law.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, KOVA will not be liable for any
        indirect, incidental, or consequential damages arising from your use of
        the service.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        communicated by posting the updated Terms on this page.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of Belgium, without regard to
        conflict-of-law principles.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href="mailto:hello@kova.ai">hello@kova.ai</a>.
      </p>
    </LegalPage>
  );
}
