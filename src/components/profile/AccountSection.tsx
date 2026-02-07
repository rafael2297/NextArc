import { useState } from 'react'
import { Pencil, Save, X, Camera, User2 } from 'lucide-react'
import { useProfileStore } from '../../store/useProfileStore'
import { useToast } from '../../components/toast/useToast'
import { motion, AnimatePresence } from 'framer-motion'

export function AccountSection() {
    const { profile, updateProfile } = useProfileStore()
    const { showToast } = useToast()

    const [isEditing, setIsEditing] = useState(false)
    const [draftName, setDraftName] = useState(profile.name)
    const [draftAvatar, setDraftAvatar] = useState(profile.avatar)

    function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => setDraftAvatar(reader.result as string)
        reader.readAsDataURL(file)
    }

    function save() {
        if (!draftName.trim()) {
            showToast('O nome não pode estar vazio')
            return
        }
        updateProfile({
            name: draftName,
            avatar: draftAvatar,
        })
        showToast('Perfil atualizado com sucesso')
        setIsEditing(false)
    }

    function cancel() {
        setDraftName(profile.name)
        setDraftAvatar(profile.avatar)
        setIsEditing(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <User2 size={16} className="text-indigo-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Dados da Conta
                    </h2>
                </div>

                <AnimatePresence mode="wait">
                    {!isEditing ? (
                        <motion.button
                            key="edit"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
                        >
                            <Pencil className="h-3 w-3" />
                            EDITAR
                        </motion.button>
                    ) : (
                        <motion.div
                            key="actions"
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            className="flex gap-4"
                        >
                            <button onClick={save} className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                <Save size={14} /> SALVAR
                            </button>
                            <button onClick={cancel} className="text-zinc-500 hover:text-rose-400 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                <X size={14} /> CANCELAR
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="space-y-4">
                {/* Campo de Nome */}
                <div className="relative">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-4 mb-1 block">
                        Nome de Usuário
                    </label>
                    <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Seu nome..."
                        className={`
                            w-full rounded-2xl bg-zinc-950/50 p-4 text-sm font-medium border transition-all
                            ${isEditing
                                ? 'border-indigo-500/50 text-white ring-4 ring-indigo-500/5'
                                : 'border-transparent text-zinc-400 cursor-not-allowed'}
                        `}
                    />
                </div>

                {/* Upload de Avatar (Só aparece se estiver editando) */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 cursor-pointer hover:bg-zinc-900/40 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    <Camera size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-tighter">Alterar foto de perfil</p>
                                    <p className="text-[10px] text-zinc-500 uppercase">JPG, PNG ou GIF</p>
                                </div>
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info de Acesso */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Método de Login</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-md">
                        {profile.provider}
                    </span>
                </div>
            </div>
        </div>
    )
}