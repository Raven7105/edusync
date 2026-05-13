import { createContext } from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setRole(session?.user?.user_metadata?.role ?? null)
            setLoading(false)
        })

    
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setRole(session?.user?.user_metadata?.role ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const logout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ session, user, role, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

// Hook pour utiliser le contexte partout
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider')
    return context
}