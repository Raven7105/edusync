import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { supabase } from '@/api/supabaseClient'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/AuthContext'
import Login from './pages/Login'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/admin/Dashboard'
import Students from './pages/admin/Students'
import Teachers from './pages/admin/Teachers'
import Classes from './pages/admin/Classes'
import Grades from './pages/admin/Grades'
import Absences from './pages/admin/Absences'
import Payments from './pages/admin/Payments'

const queryClient = new QueryClient()

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  console.log('session:', session)

  if (loading) return <div>Chargement...</div>

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster />
          <Routes>
            {!session ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/eleves" element={<Students />} />
                <Route path="/enseignants" element={<Teachers />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/notes" element={<Grades />} />
                <Route path="/absences" element={<Absences />} />
                <Route path="/paiements" element={<Payments />} />
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