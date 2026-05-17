import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Menu, Search, Moon, Sun, Bell, LogOut, ChevronDown } from 'lucide-react'

export default function Header({ onMenuClick }) {
    const { user, role, logout } = useAuth()
    const [darkMode, setDarkMode] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const toggleDark = () => {
        document.documentElement.classList.toggle('dark')
        setDarkMode(!darkMode)
    }

    return (
        <header className="h-16 border-b border-sidebar-border bg-sidebar flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">

            {/* GAUCHE — hamburger mobile */}
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition">
                <Menu className="w-5 h-5 text-sidebar-foreground" />
            </button>

            {/* CENTRE — recherche */}
            <div className="flex-1 max-w-md mx-4 hidden md:flex items-center gap-2 bg-sidebar-accent rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-sidebar-foreground/60 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="bg-transparent text-sm outline-none w-full text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                />
                <span className="text-xs text-sidebar-foreground/40 border border-sidebar-border rounded-lg px-1.5 py-0.5 hidden lg:block">⌘K</span>
            </div>

            {/* DROITE — actions */}
            <div className="flex items-center gap-1">

                {/* Dark mode */}
                <button onClick={toggleDark} className="p-2 rounded-xl hover:bg-sidebar-accent transition">
                    {darkMode
                        ? <Sun className="w-5 h-5 text-sidebar-foreground" />
                        : <Moon className="w-5 h-5 text-sidebar-foreground" />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-sidebar-accent transition">
                    <Bell className="w-5 h-5 text-sidebar-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
                </button>

                {/* Séparateur */}
                <div className="w-px h-6 bg-sidebar-border mx-1" />

                {/* Avatar dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-sidebar-accent transition"
                    >
                        <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold">
                            {user?.email?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-sidebar-foreground leading-none">
                                {user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-sidebar-foreground/60 capitalize">{role ?? 'utilisateur'}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 hidden md:block" />
                    </button>

                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute right-0 top-12 z-40 bg-card border border-border rounded-xl shadow-xl w-52 p-1.5">
                                <div className="px-3 py-2.5 border-b border-border mb-1">
                                    <p className="text-sm font-bold text-foreground">{user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{role}</p>
                                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{user?.email}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Se déconnecter
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}