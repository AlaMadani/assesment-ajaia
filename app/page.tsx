'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Editor from '../components/Editor'
import { FileText, Plus, ArrowLeft, Share, Upload, User, LogOut } from 'lucide-react'
import { isValidFileType } from '@/utils/fileHelpers';

// --- Types ---
type Document = { id: string, title: string, content: string, owner_id: string }

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [docs, setDocs] = useState<Document[]>([])
  const [sharedDocs, setSharedDocs] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)

  // --- Auth & Session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // On ajoute || '' pour rassurer TypeScript
      if (session) fetchDocuments(session.user.id, session.user.email || '')
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dummyPassword = 'AjaiaPassword123!'
    // Tentative de login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: dummyPassword })
    if (error) {
      // Si l'utilisateur n'existe pas, on le crée instantanément
      const { data: signUpData } = await supabase.auth.signUp({ email, password: dummyPassword })
      setSession(signUpData.session)
      if (signUpData.session) fetchDocuments(signUpData.session.user.id, email)
    } else {
      setSession(data.session)
      fetchDocuments(data.session.user.id, email)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setActiveDoc(null)
  }

  // --- Database Fetching ---
  const fetchDocuments = async (userId: string, userEmail: string) => {
    // Mes documents
    const { data: myDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false })

    // Documents partagés avec moi
    const { data: shared } = await supabase
      .from('document_shares')
      .select('document_id, documents(*)')
      .eq('shared_with_email', userEmail)

    if (myDocs) setDocs(myDocs as Document[])
    if (shared) {
      // Supabase retourne un objet imbriqué pour la jointure
      const formattedShared = shared.map((s: any) => s.documents as Document)
      setSharedDocs(formattedShared)
    }
  }

  // --- Actions ---
  const createNewDoc = async () => {
    const { data } = await supabase
      .from('documents')
      .insert([{ title: 'Untitled Document', content: '<p>Start typing...</p>', owner_id: session.user.id }])
      .select()
      .single()
    if (data) {
      setDocs([data, ...docs])
      setActiveDoc(data)
    }
  }

  const saveDocument = async (id: string, newTitle: string, newContent: string) => {
    await supabase
      .from('documents')
      .update({ title: newTitle, content: newContent, updated_at: new Date() })
      .eq('id', id)
  }

  const shareDocument = async () => {
    const shareEmail = prompt("Enter the email of the person you want to share with:")
    if (shareEmail && shareEmail !== session.user.email) {
      const { error } = await supabase.from('document_shares').insert([{
        document_id: activeDoc!.id,
        shared_with_email: shareEmail
      }])
      if (error) alert("Failed to share or already shared.")
      else alert(`Document shared successfully with ${shareEmail}!`)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // NOUVELLE LOGIQUE VALIDÉE PAR NOTRE TEST :
    if (!isValidFileType(file.name)) {
      alert("Format non supporté. Veuillez utiliser .txt ou .md pour respecter le scope.");
      return;
    }
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      // Création d'un nouveau document basé sur le fichier uploadé
      const { data } = await supabase
        .from('documents')
        .insert([{
          title: file.name,
          content: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
          owner_id: session.user.id
        }])
        .select()
        .single()
      if (data) {
        setDocs([data, ...docs])
        setActiveDoc(data)
      }
    }
    reader.readAsText(file) // Supporte les .txt, .md, etc.
  }

  // --- UI Renders ---
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Ajaia Docs</h1>
          <p className="text-sm text-gray-500 mb-4 text-center">Enter any email to create an account or sign in.</p>
          <input
            type="email"
            placeholder="you@example.com"
            required
            className="w-full p-2 border rounded mb-4"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {loading ? 'Entering...' : 'Continue'}
          </button>
        </form>
      </div>
    )
  }

  if (activeDoc) {
    const isOwner = activeDoc.owner_id === session.user.id
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setActiveDoc(null); fetchDocuments(session.user.id, session.user.email) }} className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft size={20} />
            </button>
            <input
              type="text"
              value={activeDoc.title}
              onChange={(e) => {
                setActiveDoc({ ...activeDoc, title: e.target.value })
                saveDocument(activeDoc.id, e.target.value, activeDoc.content)
              }}
              className="text-xl font-bold border-none focus:outline-none focus:ring-0 bg-transparent"
              readOnly={!isOwner}
            />
            {!isOwner && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">View/Edit Shared</span>}
          </div>
          {isOwner && (
            <button onClick={shareDocument} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100">
              <Share size={18} /> Share
            </button>
          )}
        </header>
        <main className="p-8">
          <Editor
            initialContent={activeDoc.content}
            onChange={(content) => {
              setActiveDoc({ ...activeDoc, content })
              saveDocument(activeDoc.id, activeDoc.title, content)
            }}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Ajaia Docs
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 flex items-center gap-1"><User size={16} /> {session.user.email}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="flex gap-4 mb-8">
          <button onClick={createNewDoc} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">
            <Plus size={20} /> Blank Document
          </button>

          <label className="flex items-center gap-2 bg-white text-gray-700 border px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer transition">
            <Upload size={20} /> Import .txt / .md
            <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">My Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {docs.length === 0 && <p className="text-gray-400">No documents yet.</p>}
          {docs.map(doc => (
            <div key={doc.id} onClick={() => setActiveDoc(doc)} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md cursor-pointer transition">
              <h3 className="font-medium text-gray-800 truncate">{doc.title}</h3>
              <p className="text-xs text-gray-400 mt-2">Owner</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Shared with me</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sharedDocs.length === 0 && <p className="text-gray-400">No shared documents.</p>}
          {sharedDocs.map(doc => (
            <div key={doc.id} onClick={() => setActiveDoc(doc)} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md cursor-pointer transition">
              <h3 className="font-medium text-blue-800 truncate">{doc.title}</h3>
              <p className="text-xs text-blue-400 mt-2">Shared Document</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}