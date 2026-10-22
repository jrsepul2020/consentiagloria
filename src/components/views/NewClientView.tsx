import React, { useState, useEffect } from 'react';
import { UserPlus, Phone, Mail, Check } from 'lucide-react';

interface NewClientViewProps {
  initialFullName?: string;
  onCancel: () => void;
  onAddClient: (patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }) => void;
}

export const NewClientView: React.FC<NewClientViewProps> = ({
  initialFullName = '',
  onCancel,
  onAddClient,
}) => {
  const [fullName, setFullName] = useState(initialFullName.trim());
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setFullName(initialFullName.trim());
    setDni('');
    setPhone('');
    setEmail('');
  }, [initialFullName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !dni.trim()) return;
    onAddClient({ fullName: fullName.trim(), dni: dni.trim(), phone, email });
  };

  const fieldClass =
    'w-full text-base p-4 rounded-2xl border border-slate-200/90 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium';

  return (
    <div className="max-w-2xl mx-auto pb-28 lg:pb-8 -mx-3 sm:-mx-2 lg:mx-auto">
      <div className="rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-3 sm:p-5 lg:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 rounded-2xl text-[#bd003c] dark:text-rose-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Nuevo cliente</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ficha básica del paciente</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Sofía Alarcón Morales"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
            DNI / NIF *
          </label>
          <input
            type="text"
            required
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="12345678Z"
            className={fieldClass}
          />
        </div>

        {/* En móvil: uno debajo del otro; en escritorio: dos columnas */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600..."
                className={`${fieldClass} pl-11 pr-4`}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
                className={`${fieldClass} pl-11 pr-4`}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            className="w-full min-h-[3.5rem] py-4 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] text-white font-extrabold text-base flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Guardar cliente
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-white/70 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
