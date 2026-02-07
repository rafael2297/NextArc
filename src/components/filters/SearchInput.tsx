import { Search, X } from 'lucide-react'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

interface Props {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function SearchInput({
    value,
    onChange,
    placeholder = 'Buscar...',
}: Props) {
    const theme = useProfileStore((state) => state.profile.theme)

    const textColor = getContrastColor(theme.background)
    const subTextColor = hexToRgba(textColor, 0.4)
    const borderColor = getBorderColor(theme.background)

    return (
        <div className="relative group">
            <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: value ? theme.primary : subTextColor }}
            />

            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-[1.2rem] border pl-11 pr-12 py-4 text-sm font-medium transition-all focus:outline-none"
                style={{
                    backgroundColor: hexToRgba(theme.background, 0.5),
                    borderColor: borderColor,
                    color: textColor,
                }}
            />

            {/* O erro estava aqui: fechei o parêntese do && corretamente agora */}
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-all hover:scale-110 p-1"
                    style={{ color: subTextColor }}
                >
                    <X size={18} strokeWidth={3} />
                </button>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                input:focus {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 0 0 4px ${hexToRgba(theme.primary, 0.15)};
                    background-color: ${hexToRgba(theme.background, 0.8)} !important;
                }
                input::placeholder {
                    color: ${subTextColor};
                    opacity: 0.7;
                }
            `}} />
        </div>
    )
}