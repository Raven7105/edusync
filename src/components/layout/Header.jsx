import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Menu, Search, Moon, Sun, Bell, LogOut, ChevronDown, User } from 'lucide-react'

export default function Header({ onMenuClick }) {
    const { user, role, logout } = useAuth()
    const [darkMode, setDarkMode] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const toggleDark = () => {
        document.documentElement.classList.toggle('dark')
        setDarkMode(!darkMode)
    }

    return (
        <header className="h-16 border-b border-border rounded-2xl bg-card flex items-center justify-between px-4 md:px-6 top-0 z-30">

            {/* GAUCHE — hamburger */}
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted transition">
                <Menu className="w-5 h-5 text-foreground" />
            </button> 

            {/* CENTRE — recherche */}
            <div className="flex-1 max-w-md mx-4 hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
                />
                {/*<span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden lg:block">⌘K</span>*/}
            </div>

            {/* DROITE — actions */}
            <div className="flex items-center gap-2">

                {/* Dark mode */}
                <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition">
                    {darkMode
                        ? <Sun className="w-5 h-5 text-foreground" />
                        : <Moon className="w-5 h-5 text-foreground" />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-muted transition">
                    <Bell className="w-5 h-5 text-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Avatar dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {user?.email?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-foreground leading-none">
                                {user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{role ?? 'utilisateur'}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute right-0 top-12 z-40 bg-card border border-border rounded-xl shadow-lg w-48 p-1">
                                <div className="px-3 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-semibold text-foreground">{user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{role}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
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