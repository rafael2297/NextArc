import { EyeOff, Search } from 'lucide-react'
import { motion } from 'framer-motion'

interface NoResultsProps {
    reason: 'nsfw-filtered' | 'no-match'
    searchTerm?: string
}

export default function NoResults({ reason, searchTerm }: NoResultsProps) {
    if (reason === 'nsfw-filtered') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4"
            >
                <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
                    <EyeOff size={40} className="text-rose-400" />
                </div>

                <h3 className="text-xl font-black text-white mb-2 uppercase">
                    Conteúdo Oculto
                </h3>

                <p className="text-zinc-400 text-center max-w-md mb-6">
                    Todos os resultados para{' '}
                    <span className="text-white font-bold">
                        &quot;{searchTerm}&quot;
                    </span>{' '}
                    foram classificados como conteúdo sensível e estão ocultos.
                </p>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md">
                    <p className="text-sm text-zinc-300 mb-4">
                        Para ver estes resultados, altere suas preferências de
                        conteúdo sensível no Perfil:
                    </p>

                    <ul className="space-y-2 text-xs text-zinc-500">
                        <li className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>
                                <strong className="text-zinc-300">
                                    Com blur:
                                </strong>{' '}
                                Mostra conteúdo censurado
                            </span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>
                                <strong className="text-zinc-300">
                                    Mostrar tudo:
                                </strong>{' '}
                                Exibe sem censura
                            </span>
                        </li>
                    </ul>
                </div>
            </motion.div>
        )
    }

    if (reason === 'no-match') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4"
            >
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
                    <Search size={40} className="text-zinc-500" />
                </div>

                <h3 className="text-xl font-black text-white mb-2 uppercase">
                    Nenhum Resultado
                </h3>

                <p className="text-zinc-400 text-center max-w-md">
                    Não encontramos resultados para{' '}
                    <span className="text-white font-bold">
                        &quot;{searchTerm}&quot;
                    </span>
                </p>

                <p className="text-sm text-zinc-500 mt-4">
                    Tente ajustar sua busca ou filtros
                </p>
            </motion.div>
        )
    }

    return null
}
