export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-sm text-gray-500">Last updated: March 9, 2026</p>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
          <p>PetPawSphere ("we", "our") is committed to protecting your personal data in accordance with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and applicable regulations.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account data:</strong> Name, email, phone number, emirate (authentication via Firebase Auth — no passwords stored by PetPawSphere)</li>
            <li><strong>Pet data:</strong> Pet name, species, breed, age, weight, health records, photos</li>
            <li><strong>Usage data:</strong> Match requests, AI analysis results, chat messages</li>
            <li><strong>Diagnostic data:</strong> Pet health photos, vet documents (processed via AI)</li>
            <li><strong>Device data:</strong> IP address, browser type, device type (via Capacitor)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve the Platform's services</li>
            <li>Process AI-powered compatibility analyses and health assessments</li>
            <li>Facilitate communication between pet owners</li>
            <li>Comply with UAE legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">4. AI Processing</h2>
          <p>Your pet photos and health documents are processed by Google Gemini AI for breed detection, health diagnostics, and document extraction. This data is sent to Google's servers for processing. We do not use your data to train AI models.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Storage & Security</h2>
          <p>Data is stored securely with encryption at rest. Authentication is handled by Firebase Auth (no passwords stored by PetPawSphere). API communications use HTTPS/TLS. We implement rate limiting, CORS restrictions, and SSRF protection.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with: Google (AI processing), other users (as part of matching features, with your consent), and UAE authorities (when legally required).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Your Rights (UAE PDPL)</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to access your personal data</li>
            <li>Right to rectify inaccurate data</li>
            <li>Right to delete your data ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to automated decision-making</li>
          </ul>
          <p>To exercise these rights, email privacy@petpawsphere.com</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Anonymized analytics may be retained indefinitely.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Cross-Border Transfers</h2>
          <p>Your data may be processed on servers located outside the UAE:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Authentication:</strong> Firebase Auth (Google Cloud, United States)</li>
            <li><strong>Database:</strong> Supabase PostgreSQL (AWS, United States)</li>
            <li><strong>AI processing:</strong> Google Gemini (Google Cloud, various regions)</li>
            <li><strong>API processing:</strong> Firebase Functions (Google Cloud, Middle East — Qatar)</li>
          </ul>
          <p className="mt-2">We rely on Google&apos;s and AWS&apos;s standard Data Processing Agreements (DPAs), which include Standard Contractual Clauses, as the legal basis for these transfers under Article 22 of the UAE PDPL. By creating an account, you explicitly consent to this cross-border processing.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">10. Contact</h2>
          <p>Data Protection Officer: privacy@petpawsphere.com<br/>TAURUS AI Corp, Dubai, United Arab Emirates</p>
        </section>
      </div>
    </div>
  );
}
