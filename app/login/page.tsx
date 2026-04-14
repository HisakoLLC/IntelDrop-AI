import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center p-6 selection:bg-notion-blue selection:text-white">
      <div className="w-full max-w-md bg-white border border-whisper p-10 rounded-[12px] shadow-notion-deep">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-black rounded-[8px] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">I</div>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-notion-black">IntelDrop AI</h1>
          <p className="mt-2 text-[15px] font-medium text-warm-gray-500">Secure Investigator Portal</p>
        </div>
        
        <AuthForm />
      </div>
      
      <div className="mt-12 text-[13px] font-medium text-warm-gray-300 max-w-md text-center">
        This is a private investigative workstation. Unauthorized access attempts are logged and reported.
      </div>
    </div>
  )
}
