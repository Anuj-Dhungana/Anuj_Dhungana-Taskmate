import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  CheckCircle, Users, FolderKanban, MessageSquare, Zap, Shield, 
  ArrowRight, Play, Star, ChevronRight, Layers, Target, Clock,
  BarChart3, Calendar, Bell, Menu, X
} from 'lucide-react';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Slack/ClickUp Style */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-gray-900">TaskMate</span>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#solutions" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Solutions</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
            <a href="#features" className="block text-gray-600 hover:text-gray-900">Features</a>
            <a href="#solutions" className="block text-gray-600 hover:text-gray-900">Solutions</a>
            <a href="#pricing" className="block text-gray-600 hover:text-gray-900">Pricing</a>
            <Link to="/login" className="block text-gray-600">Sign in</Link>
            <Link to="/register" className="block bg-violet-600 text-white text-center py-2 rounded-lg">
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section - ClickUp/Slack Inspired */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4 mr-2 fill-violet-500 text-violet-500" />
                #1 Project Management Tool for Teams
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                One app to replace
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> them all</span>
              </h1>
              
              <p className="mt-6 text-lg text-gray-600 max-w-xl">
                TaskMate brings your tasks, docs, goals, and teams together. Manage everything in one place — 
                so you can focus on what matters most.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="group bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 flex items-center justify-center"
                >
                  Get Started — It's Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right - App Preview */}
            <div className="relative">
              {/* Main App Window */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Window Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                
                {/* App Content Preview */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-16 bg-slate-800 py-4 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl"></div>
                    <div className="w-10 h-10 bg-slate-700 rounded-xl"></div>
                    <div className="w-10 h-10 bg-slate-700 rounded-xl"></div>
                  </div>
                  
                  {/* Secondary Sidebar */}
                  <div className="w-48 bg-slate-700 py-4 px-3">
                    <div className="text-white text-sm font-semibold mb-4">Marketing Team</div>
                    <div className="space-y-2">
                      <div className="bg-slate-600/50 text-slate-300 text-xs px-3 py-2 rounded-lg"># general</div>
                      <div className="bg-violet-600/30 text-violet-300 text-xs px-3 py-2 rounded-lg border border-violet-500/30"># campaigns</div>
                      <div className="bg-slate-600/50 text-slate-300 text-xs px-3 py-2 rounded-lg"># design</div>
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-4 bg-gray-50 min-h-[300px]">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Task Cards */}
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">To Do</div>
                        <div className="space-y-2">
                          <div className="bg-violet-50 p-2 rounded text-xs">Design mockups</div>
                          <div className="bg-blue-50 p-2 rounded text-xs">Review PRD</div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">In Progress</div>
                        <div className="space-y-2">
                          <div className="bg-yellow-50 p-2 rounded text-xs">User research</div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">Done</div>
                        <div className="space-y-2">
                          <div className="bg-green-50 p-2 rounded text-xs">Setup project</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tasks Completed</div>
                  <div className="text-lg font-bold text-gray-900">2,847</div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Team Members</div>
                  <div className="text-lg font-bold text-gray-900">24</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - ClickUp Style */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything your team needs
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to manage projects, collaborate with your team, and achieve your goals faster.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FolderKanban,
                title: 'Multiple Views',
                description: 'See your work your way with Kanban boards, lists, calendars, Gantt charts, and more.',
                color: 'violet'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Work together seamlessly with real-time editing, comments, and @mentions.',
                color: 'blue'
              },
              {
                icon: Target,
                title: 'Goals & OKRs',
                description: 'Set measurable goals and track progress with built-in OKR tracking.',
                color: 'green'
              },
              {
                icon: Clock,
                title: 'Time Tracking',
                description: 'Track time spent on tasks and projects. Generate detailed reports.',
                color: 'orange'
              },
              {
                icon: BarChart3,
                title: 'Dashboards',
                description: 'Build custom dashboards to visualize your team\'s progress and performance.',
                color: 'pink'
              },
              {
                icon: Bell,
                title: 'Smart Notifications',
                description: 'Stay informed with intelligent notifications that don\'t overwhelm.',
                color: 'indigo'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <a href="#" className="inline-flex items-center text-violet-600 font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Big Feature Highlight - Slack Style */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-600 to-indigo-700 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Move faster with real-time collaboration
              </h2>
              <p className="text-xl text-violet-100 mb-8">
                Work together like you're in the same room. See changes instantly, discuss in context, 
                and keep everyone aligned — no matter where they are.
              </p>
              <ul className="space-y-4">
                {[
                  'Real-time document editing',
                  'Instant messaging and channels',
                  'Video calls and screen sharing',
                  'Activity feeds and updates'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-violet-700 px-8 py-4 rounded-xl text-lg font-semibold mt-10 hover:bg-gray-100 transition-colors"
              >
                Start for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">Sarah Chen</div>
                      <div className="text-xs text-gray-500">Typing...</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm max-w-[80%]">
                      Just finished the new designs! 🎨
                    </div>
                    <div className="bg-violet-600 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[80%] ml-auto">
                      Amazing work! Let's review in 10 mins?
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notification popup */}
              <div className="absolute -top-4 right-4 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Task completed</div>
                  <div className="text-xs text-gray-500">Homepage redesign</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join over 10,000 teams using TaskMate to work smarter. Free forever for teams getting started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No credit card required · Free plan available · Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer - Modern Style */}
      <footer className="bg-gray-900 text-gray-400 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-gray-800">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TaskMate</span>
              </div>
              <p className="text-sm max-w-xs">
                The all-in-one project management platform for modern teams. Work smarter, not harder.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 TaskMate. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
