import { Mail, Camera, Phone, Code2 } from 'lucide-react'

export function DeveloperInfoPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{"Acerca del Desarrollador"}</h1>
        <p className="text-slate-500 mt-1">{"Información de contacto y soporte técnico"}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 mb-6">
            <Code2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{"Nizana Studio MX"}</h2>
          <p className="text-slate-500 font-medium mt-2">{"Desarrollo de Software y Soluciones Digitales"}</p>
        </div>

        <div className="p-8 space-y-6">
          <a 
            href="mailto:nizana.studio.mx@gmail.com"
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500">{"Correo Electrónico"}</p>
              <p className="text-slate-900 font-medium">nizana.studio.mx@gmail.com</p>
            </div>
          </a>

          <a 
            href="https://www.instagram.com/nizana.studio.mx?igsh=MWo3cnpsbTBpMm9pZg%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-pink-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500">{"Instagram"}</p>
              <p className="text-slate-900 font-medium">@nizana.studio.mx</p>
            </div>
          </a>

          <a 
            href="https://wa.me/522205756236"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500">{"Teléfono / WhatsApp"}</p>
              <p className="text-slate-900 font-medium">+52 220 575 6236</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
