import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono">
      <div className="w-full max-w-md border-[3px] border-white p-8">
        <div className="mb-10 text-center border-b-[3px] border-white pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter">IntelDrop AI</h1>
          <p className="mt-2 text-sm font-bold tracking-widest">RESTRICTED ACCESS TERMINAL</p>
        </div>
        <AuthForm />
      </div>
      
      <div className="mt-8 text-xs font-bold uppercase tracking-widest border-t-[3px] border-white pt-4 w-full max-w-md text-center">
        Unregistered queries will be traced and terminated.
      </div>
    </div>
  )
}
