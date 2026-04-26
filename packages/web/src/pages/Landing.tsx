import { Link } from 'react-router-dom';
import { PawPrint, Sparkles, Search, Stethoscope, Shield, Heart, Globe } from 'lucide-react';

export function Landing() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                <PawPrint className="h-4 w-4" />
                UAE&apos;s Premier Pet Breeding Platform
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              Find the Perfect
              <span className="block text-amber-600">Match for Your Pet</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The UAE&apos;s first AI-powered pet breeding platform. Connect with verified breeders,
              get AI-driven compatibility analysis, and ensure the healthiest outcomes for your beloved companions.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-200 transition-all hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-0.5"
              >
                Get Started
                <Heart className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Powered by Advanced AI
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform leverages cutting-edge artificial intelligence to deliver the best breeding experience in the region.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Matching */}
            <FeatureCard
              icon={<Sparkles className="h-7 w-7" />}
              title="AI Compatibility Matching"
              description="Our Gemini-powered AI analyzes breed genetics, temperament, health history, and lineage to find the most compatible matches for your pet."
              gradient="from-amber-500 to-orange-500"
              bgGradient="from-amber-50 to-orange-50"
            />

            {/* Breed Detection */}
            <FeatureCard
              icon={<Search className="h-7 w-7" />}
              title="Intelligent Breed Detection"
              description="Upload a photo and our AI instantly identifies the breed, providing detailed information about characteristics, care needs, and breeding considerations."
              gradient="from-blue-500 to-indigo-500"
              bgGradient="from-blue-50 to-indigo-50"
            />

            {/* Vet Advisory */}
            <FeatureCard
              icon={<Stethoscope className="h-7 w-7" />}
              title="AI Vet Advisory"
              description="Get AI-powered health insights and breeding recommendations from our virtual veterinary advisor, tailored to UAE climate and conditions."
              gradient="from-emerald-500 to-teal-500"
              bgGradient="from-emerald-50 to-teal-50"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <TrustItem
              icon={<Shield className="h-8 w-8 text-amber-600" />}
              title="Verified Breeders"
              description="Every breeder on our platform is verified and compliant with UAE regulations."
            />
            <TrustItem
              icon={<Globe className="h-8 w-8 text-amber-600" />}
              title="All 7 Emirates"
              description="Connect with pet owners and breeders across all seven emirates of the UAE."
            />
            <TrustItem
              icon={<Heart className="h-8 w-8 text-amber-600" />}
              title="Health First"
              description="Our AI prioritizes genetic health and wellbeing in every match recommendation."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Find the Perfect Match?
          </h2>
          <p className="mt-4 text-lg text-amber-100">
            Join thousands of pet owners across the UAE who trust PetPawSphere for responsible breeding.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center mt-8 px-8 py-3.5 text-base font-semibold text-amber-600 bg-white hover:bg-amber-50 rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
          >
            Create Free Account
            <PawPrint className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <PawPrint className="h-6 w-6 text-amber-500" />
              PetPawSphere
            </div>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-amber-200 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="text-amber-200 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <a href="mailto:contact@petpawsphere.com" className="text-amber-200 hover:text-white text-sm transition-colors">contact@petpawsphere.com</a>
            </div>
          </div>
          <div className="mt-6 text-center sm:text-left">
            <p className="text-sm">&copy; {new Date().getFullYear()} PetPawSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  bgGradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  bgGradient: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${bgGradient} mb-6`}>
        <div className={`bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
