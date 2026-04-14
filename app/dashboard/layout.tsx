import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import { createClient } from '@/lib/supabase-server'
import { Metadata } from 'next'

// Dynamically generate the Next.js Document Title (Rebranding browser tab automatically)
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_settings').select('client_name').single()
  
  return {
    title: data?.client_name ? `${data.client_name} - Secure Analyst Portal` : 'IntelDrop Dashboard',
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Single DB trip at the layout boundaries preventing child component spam
  const { data: settings } = await supabase
    .from('client_settings')
    .select('client_name, client_logo_url')
    .single()

  return (
    <div className="flex h-screen bg-white overflow-hidden text-notion-black selection:bg-notion-blue selection:text-white">
      <Sidebar clientName={settings?.client_name} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar clientName={settings?.client_name} clientLogoUrl={settings?.client_logo_url} />
        <main className="flex-1 overflow-y-auto p-8 bg-warm-white">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
