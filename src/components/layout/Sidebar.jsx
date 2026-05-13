import { useAuth } from "@/lib/AuthContext";
import { BarChart2, BookOpen, Calendar, CalendarX, ClipboardList, CreditCard, Eye, FileText, GraduationCap, LayoutDashboard, Menu, MessageSquare, School, Settings2, Users, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/api/supabaseClient";
import Logo from "@/assets/logo.svg";


const navItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, path: "/" },
    { label: 'Élèves', icon: Users, path: '/eleves' },
    { label: 'Enseignants', icon: GraduationCap, path: '/enseignants' },
    { label: 'Classes', icon: School, path: '/classes' },
    { label: 'Notes', icon: ClipboardList, path: '/notes' },
    { label: 'Absences', icon: CalendarX, path: '/absences' },
    { label: 'Emploi du temps', icon: Calendar, path: '/emploi-du-temps' },
    { label: 'Paiements', icon: CreditCard, path: '/paiements' },
    { label: 'Rapports', icon: BarChart2, path: '/rapports' },
    { label: 'Bulletins PDF', icon: FileText, path: '/bulletins' },
    { label: 'Messages', icon: MessageSquare, path: '/messages', badge: true },
    { label: 'Aperçu portails', icon: Eye, path: '/apercu' },
    { label: 'Paramètres école', icon: Settings2, path: '/parametres' },
];

export default function Sidebar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const fetchUnread = async () => {
            const { data } = await supabase
                .from('messages')
                .select('id')
                .eq('to_user_id', user.id)
                .eq('read', false);             // ← requête Supabase directe

            setUnreadCount(data?.length ?? 0);
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full w-64 bg-sidebar text-sidebar-foreground z-40 flex flex-col transition-transform duration-300",
                "lg:translate-x-0",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                    <div className="p-4 border-b border-sidebar-border">
                        <div className="flex items-center gap-3 mb-3">
                            <img src={Logo} alt="Edusync" className="h-8 w-auto brightness-0 invert" />
                        </div>
                        {/* <GlobalSearch /> */}
                    </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-sidebar-border">
                    <p className="text-xs text-sidebar-foreground/40 text-center">
                        © 2026 Edusync
                    </p>
                </div>
            </aside>
        </>
    );
}


