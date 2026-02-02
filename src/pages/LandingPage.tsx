import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Wand2, LayoutGrid, CheckCircle2, ArrowRight, Zap, Image as ImageIcon, Stamp } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0E1117] text-white selection:bg-[#00FFAA] selection:text-[#0E1117] font-inter">
            {/* Navbar */}
            <nav className="fixed w-full z-50 backdrop-blur-lg bg-[#0E1117]/80 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#00FFAA] flex items-center justify-center">
                            <Camera size={18} className="text-[#0E1117]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">ImobStudio <span className="text-[#00FFAA]">Pro</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Entrar</Link>
                        <Link to="/login" className="bg-[#00FFAA] hover:bg-[#00e699] text-[#0E1117] px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_30px_rgba(0,255,170,0.5)]">
                            Começar Grátis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#00FFAA]/20 blur-[120px] rounded-full pointer-events-none opacity-30" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#00FFAA] text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={12} />
                        <span>IA Potencializada v2.0</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Fotos Imobiliárias <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFAA] to-[#00E6FF]">Perfeitas em Segundos.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Padronize, edite e adicione sua marca em lotes de fotos instantaneamente.
                        A ferramenta definitiva para corretores e imobiliárias modernas.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Link to="/login" className="w-full md:w-auto bg-[#00FFAA] hover:bg-[#00e699] text-[#0E1117] px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 group">
                            Acessar Studio
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                            Ver Recursos
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-[#0E1117]/50 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Wand2, title: "Edição Automática", desc: "Melhoria de brilho, contraste e nitidez com um clique." },
                            { icon: Stamp, title: "Marca d'Água Pro", desc: "Aplique seu logo e textos em lote com posicionamento preciso." },
                            { icon: LayoutGrid, title: "Padronização", desc: "Alinhamento e cortes pré-definidos para portais (OLX, Zap, etc)." },
                            { icon: CheckCircle2, title: "Exportação em Massa", desc: "Baixe todas as fotos editadas e renomeadas em um único ZIP." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-[#00FFAA]/30 transition-all group hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-[#00FFAA]/10 flex items-center justify-center text-[#00FFAA] mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Showcase / Preview */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0E1117] via-[#00FFAA]/5 to-[#0E1117]" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-black mb-16 tracking-tight">Fluxo de Trabalho Otimizado</h2>

                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#161B22]/80 backdrop-blur-sm p-4">
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/50 flex items-center justify-center relative group">
                            {/* Mockup UI representation */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-4xl opacity-50 blur-[1px] group-hover:blur-0 group-hover:opacity-100 transition-all duration-700">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="aspect-video bg-white/5 rounded-lg border border-white/10" />
                                    ))}
                                </div>
                            </div>
                            <div className="z-10 bg-[#0E1117] border border-white/10 px-8 py-4 rounded-full flex items-center gap-4 shadow-2xl">
                                <ImageIcon className="text-[#00FFAA]" />
                                <span className="font-bold text-sm">Arraste, Solte, Edite, Baixe.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center px-6">
                <p className="text-slate-500 text-sm font-medium">© 2025 ImobStudio Pro. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
