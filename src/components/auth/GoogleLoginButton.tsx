import { signInWithGoogle } from '../../services/googleAuth'

export function GoogleLoginButton() {
    async function handleLogin() {
        try {
            // Isso vai disparar o IPC no Electron ou o Popup na Web
            await signInWithGoogle()
        } catch (err) {
            console.error('Falha no fluxo de login:', err)
        }
    }

    return (
        <button
            onClick={handleLogin}
            className="
                group
                relative
                flex 
                items-center 
                justify-center 
                gap-4 
                w-full 
                min-w-[240px] 
                rounded-2xl 
                bg-white 
                px-10 
                py-4 
                text-zinc-900 
                font-bold 
                text-sm
                uppercase
                tracking-wider
                shadow-[0_0_20px_rgba(255,255,255,0.1)]
                transition-all 
                duration-300
                hover:bg-zinc-100
                hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]
                hover:-translate-y-0.5
                active:scale-[0.96]
            "
        >
            <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 transition-transform group-hover:scale-110"
            />

            <span>Entrar com Google</span>

            <div className="absolute inset-0 rounded-2xl border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    )
}