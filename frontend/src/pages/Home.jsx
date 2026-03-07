import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  FolderKanban,
  Menu,
  MessageSquare,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import logo from '../assets/logo.png';

const featureCards = [
  {
    icon: FolderKanban,
    title: 'Smart Task Boards',
    description: 'Organize work with drag-and-drop Kanban boards.',
  },
  {
    icon: MessageSquare,
    title: 'Integrated Team Chat',
    description: 'Collaborate instantly within each workspace.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track velocity, workload, and bottlenecks.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Security',
    description: 'Owner, Admin, and Member permissions.',
  },
  {
    icon: CalendarCheck2,
    title: 'Calendar & Deadlines',
    description: 'Stay aligned with project timelines.',
  },
  {
    icon: Phone,
    title: 'Built-in Video Calls',
    description: 'Start meetings without leaving your workspace.',
  },
];

const socialProof = [
  { title: '100+ Tasks Managed' },
  { title: 'Real-time Collaboration' },
  { title: 'Secure Role-Based Access' },
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('');
  const [dashboardImageError, setDashboardImageError] = useState(false);
  const [analyticsImageError, setAnalyticsImageError] = useState(false);
  const dashboardPreviewSrc = '/Dashboard.png';
  const analyticsPreviewSrc = '/Landing-analytics.png';

  useEffect(() => {
    const syncActiveFromHash = () => {
      const hash = String(window.location.hash || '').replace('#', '');
      if (['features', 'analytics', 'pricing'].includes(hash)) {
        setActiveNav(hash);
      } else {
        setActiveNav('');
      }
    };

    syncActiveFromHash();
    window.addEventListener('hashchange', syncActiveFromHash);
    return () => window.removeEventListener('hashchange', syncActiveFromHash);
  }, []);

  useEffect(() => {
    const sectionIds = ['features', 'analytics', 'pricing'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveNav(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-35% 0px -45% 0px',
        threshold: [0.2, 0.4, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-lg font-semibold tracking-tight">TaskMate</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a
              href="#features"
              onClick={() => setActiveNav('features')}
              className={`transition-colors ${
                activeNav === 'features'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Features
            </a>
            <a
              href="#analytics"
              onClick={() => setActiveNav('analytics')}
              className={`transition-colors ${
                activeNav === 'analytics'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Analytics
            </a>
            <a
              href="#pricing"
              onClick={() => setActiveNav('pricing')}
              className={`transition-colors ${
                activeNav === 'pricing'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4">
            <div className="space-y-3 text-sm text-slate-700">
              <a
                href="#features"
                className={`block ${activeNav === 'features' ? 'text-blue-700 font-semibold' : ''}`}
                onClick={() => {
                  setActiveNav('features');
                  setMobileMenuOpen(false);
                }}
              >
                Features
              </a>
              <a
                href="#analytics"
                className={`block ${activeNav === 'analytics' ? 'text-blue-700 font-semibold' : ''}`}
                onClick={() => {
                  setActiveNav('analytics');
                  setMobileMenuOpen(false);
                }}
              >
                Analytics
              </a>
              <a
                href="#pricing"
                className={`block ${activeNav === 'pricing' ? 'text-blue-700 font-semibold' : ''}`}
                onClick={() => {
                  setActiveNav('pricing');
                  setMobileMenuOpen(false);
                }}
              >
                Pricing
              </a>
              <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link
                to="/register"
                className="mt-2 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-white font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-20">
        <section className="pt-12 pb-20 md:pt-14 md:pb-24 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-slate-900">
                All Your Team&apos;s Work.
                <br />
                One Clean Workspace.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
                TaskMate combines task management, real-time collaboration, and intelligent analytics into one powerful platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                </Link>
                <a
                  href="#features"
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm sm:text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Explore Features
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 lg:scale-[1.12] lg:origin-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70">
                {!dashboardImageError ? (
                  <img
                    src={dashboardPreviewSrc}
                    alt="TaskMate dashboard preview"
                    className="w-full h-auto rounded-xl border border-slate-200"
                    onError={() => setDashboardImageError(true)}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Add your image at <span className="font-semibold">frontend/public/Dashboard.png</span> to show the real dashboard preview.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-24 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-sm font-medium text-slate-500 mb-5">Built for modern teams.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {socialProof.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
                  <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-24 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Everything You Need to Stay Productive
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="analytics" className="py-20 md:py-24 px-5 sm:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Turn Insights into Action
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                See task velocity, workload distribution, and project health in real-time.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/70">
              {!analyticsImageError ? (
                <img
                  src={analyticsPreviewSrc}
                  alt="TaskMate analytics preview"
                  className="w-full h-auto rounded-xl border border-slate-200"
                  onError={() => setAnalyticsImageError(true)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Add your image at <span className="font-semibold">frontend/public/Landing-analytics.png</span> to show the real analytics preview.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 md:py-24 px-5 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Simple Pricing</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <article className="rounded-2xl border border-slate-200 p-7 bg-white">
                <h3 className="text-xl font-semibold text-slate-900">Free</h3>
                <ul className="mt-5 space-y-3 text-slate-600 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Up to 5 members</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Up to 5 projects</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Analytics locked</li>
                </ul>
                <Link
                  to="/register"
                  className="mt-7 inline-flex rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Start Free
                </Link>
              </article>

              <article className="rounded-2xl border-2 border-slate-800 p-7 bg-white">
                <h3 className="text-xl font-semibold text-slate-900">Pro</h3>
                <ul className="mt-5 space-y-3 text-slate-600 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Unlimited projects</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Unlimited members</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Analytics enabled</li>
                </ul>
                <button
                  type="button"
                  className="mt-7 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro with Khalti
                </button>
              </article>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24 px-5 sm:px-8 bg-slate-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Ready to simplify your team&apos;s workflow?
            </h2>
            <Link
              to="/register"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-7 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-10 px-5 sm:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Product</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="mailto:support@taskmate.com" className="hover:text-slate-900">Contact</a>
          </div>
          <p className="text-sm text-slate-500">© 2026 TaskMate</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
