import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {type MouseEvent, useCallback } from 'react';

import { Sparkles } from 'lucide-react';

interface TcgCardProps {
    card: any;
    isOwned: boolean;
    getRarityClass: (rarity: string) => string;
}

export function TcgCard({ card, isOwned, getRarityClass }: TcgCardProps) {
    // Valores para o efeito de inclinação (Tilt)
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Suavização do movimento
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    // Transformação de rotação (ajuste os graus conforme preferir)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    // Efeito de brilho (move o gradiente conforme o mouse)
    const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const sheenOpacity = useTransform(mouseXSpring, [-0.5, 0.5], [0, 0.6]);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    }, [x, y]);

    const handleMouseLeave = useCallback(() => {
        x.set(0);
        y.set(0);
    }, [x, y]);

    const isLegendary = card?.rarity === 'legendary';

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={`relative aspect-[3/4] rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-zinc-900 group ${isOwned ? getRarityClass(card.rarity) : 'border-dashed border-zinc-800 opacity-40 grayscale'
                }`}
        >
            {isOwned ? (
                <div className="w-full h-full relative">
                    {/* Imagem da Carta */}
                    <img src={card.image} className="w-full h-full object-cover" alt={card.name} />

                    {/* Overlay de gradiente base */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-3 flex flex-col justify-end">
                        <h4 className="text-[10px] font-black uppercase italic truncate">{card.name}</h4>
                        <span className="text-[8px] font-bold text-indigo-400 uppercase">{card.rarity}</span>
                    </div>

                    {/* EFEITO HOLOGRÁFICO (Apenas para Legendary) */}
                    {isLegendary && (
                        <motion.div
                            style={{
                                background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 55%, transparent 80%)",
                                backgroundSize: '200% 200%',
                                left: sheenX,
                                opacity: sheenOpacity,
                            }}
                            className="absolute inset-0 pointer-events-none mix-blend-overlay"
                        />
                    )}

                    {/* Brilhos extras animados */}
                    {isLegendary && (
                        <div className="absolute top-2 right-2 animate-pulse">
                            <Sparkles size={12} className="text-yellow-400" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-[8px] font-black uppercase text-zinc-700 leading-tight">
                        Bloqueado
                    </span>
                </div>
            )}
        </motion.div>
    );
}