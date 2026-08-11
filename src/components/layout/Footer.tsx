export function Footer() {
  const año = new Date().getFullYear()

  return (
    <footer className="w-full mt-auto pt-8 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto border-t border-slate-200/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p className="text-center sm:text-left">
          © {año} <strong className="font-semibold text-[#0F2C4C]">Cancionero IPUC</strong> — Iglesia Pentecostal Unida de Colombia
        </p>
        <p className="text-center sm:text-right">
          Desarrollado por <span className="font-semibold text-[#1B5FA8]">Anderson Devs</span>
        </p>
      </div>
    </footer>
  )
}