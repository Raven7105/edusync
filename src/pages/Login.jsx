import { useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import Logo from '@/assets/logo.svg'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">

                {/* Logo + titre */}
                <div className="flex flex-col items-center gap-3 mb-2">
                    <img src={Logo} alt="Edusync" className="h-10 w-auto" />
                    <p className="text-sm text-gray-500">Connectez-vous à votre espace</p>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="exemple@ecole.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
                    >
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">© 2026 Edusync — Gestion scolaire</p>
            </div>
        </div>
    )
}