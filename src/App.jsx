import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { supabase } from '@/api/supabaseClient'

// Pages
//import Students from './pages/Students'
//import Teachers from './pages/Teachers'
import Login from './pages/Login'
import { AuthProvider } from './lib/AuthContext'
//import AppLayout from './components/layout/AppLayout'

const queryClient = new QueryClient()

function App() {
  {/* Gestion de l'authentification */ }
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Écouter les changements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <AuthProvider>

      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Si pas connecté → Login */}
            {!session ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              /* Si connecté → App */
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/eleves" element={<Students />} />
                <Route path="/enseignants" element={<Teachers />} />
                {/* ... autres routes */}
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            )}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>

    </AuthProvider>
  )
}

export default App
