import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, getSession, signOut } from './lib/supabaseClient';
import { supabaseService } from './services/supabaseService';
import { NavTab, BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LoginPage } from './components/LoginPage';
import { TemplateEditorView } from './components/views/TemplateEditorView';
import { HomeView } from './components/views/HomeView';
import { ClientsView } from './components/views/ClientsView';
import { DocumentsView } from './components/views/DocumentsView';
import { TemplatesView } from './components/views/TemplatesView';
import { SettingsView } from './components/views/SettingsView';
import { NewClientView } from './components/views/NewClientView';
import { NewConsentView } from './components/views/NewConsentView';
import { ClientDetailView } from './components/views/ClientDetailView';
import { ConsentDetailView } from './components/views/ConsentDetailView';
import { StatsView } from './components/views/StatsView';
import { BatchSignModal } from './components/BatchSignModal';
import { Consent, ClinicSettings, ConsentTemplate, Patient } from './types';
import { CheckCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type FormScreen =
  | null
  | 'nuevo-cliente'
  | 'nuevo-consentimiento'
  | 'ficha-cliente'
  | 'detalle-consentimiento'
  | 'estadisticas'
  | 'editar-plantilla';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    getSession().then((s) => setSession(s));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Tras login: cargar datos con rol authenticated (RLS). Evita plantillas vacías.
  useEffect(() => {
    if (!session?.user?.id) return;
    void supabaseService.reloadFromServer();
  }, [session?.user?.id]);

  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [formScreen, setFormScreen] = useState<FormScreen>(null);
  const [formReturnTab, setFormReturnTab] = useState<NavTab>('inicio');
  const [openClientFromConsent, setOpenClientFromConsent] = useState(false);

  const [documentStatusFilter, setDocumentStatusFilter] = useState<
    'TODOS' | 'PENDIENTE' | 'FIRMADO' | 'BORRADOR' | 'RECHAZADO'
  >('TODOS');

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() =>
    supabaseService.getClinicSettings()
  );
  const [patients, setPatients] = useState(() => supabaseService.getPatients());
  const [consents, setConsents] = useState<Consent[]>(() => supabaseService.getConsents());
  const [templates, setTemplates] = useState<ConsentTemplate[]>(() =>
    supabaseService.getTemplates()
  );
  const [notifications, setNotifications] = useState(() => supabaseService.getNotifications());

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [newClientDraftName, setNewClientDraftName] = useState('');
  const [templateToEdit, setTemplateToEdit] = useState<ConsentTemplate | null>(null);

  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const [selectedConsentId, setSelectedConsentId] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);
  const [batchSignConsents, setBatchSignConsents] = useState<Consent[] | null>(null);

  useEffect(() => {
    const unsubscribe = supabaseService.subscribe(() => {
      setClinicSettings(supabaseService.getClinicSettings());
      setPatients(supabaseService.getPatients());
      setConsents(supabaseService.getConsents());
      setTemplates(supabaseService.getTemplates());
      setNotifications(supabaseService.getNotifications());
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (title: string, body: string) => {
    setToastMessage({ title, body });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  /** Evita que el detalle se desmonte si Realtime tarda en devolver el id recién guardado. */
  const stickyConsentRef = useRef<Consent | null>(null);
  const selectedConsent = useMemo(() => {
    const found = consents.find((c) => c.id === selectedConsentId) || null;
    if (found) {
      stickyConsentRef.current = found;
      return found;
    }
    if (
      selectedConsentId &&
      stickyConsentRef.current &&
      stickyConsentRef.current.id === selectedConsentId
    ) {
      return stickyConsentRef.current;
    }
    return null;
  }, [consents, selectedConsentId]);

  useEffect(() => {
    if (!selectedConsentId) stickyConsentRef.current = null;
  }, [selectedConsentId]);

  const signedTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return consents.filter((c) => {
      if (c.status !== 'FIRMADO' || !c.signedAt) return false;
      return new Date(c.signedAt) >= today;
    }).length;
  }, [consents]);

  const weekCount = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return consents.filter((c) => new Date(c.createdAt) >= start).length;
  }, [consents]);

  const openNewClient = (draftName = '', fromConsent = false) => {
    setNewClientDraftName(draftName);
    setOpenClientFromConsent(fromConsent);
    if (!fromConsent) setFormReturnTab(activeTab);
    setFormScreen('nuevo-cliente');
  };

  const openNewConsent = (patientId?: string, templateId?: string) => {
    setPreselectedPatientId(patientId);
    setPreselectedTemplateId(templateId);
    setFormReturnTab(activeTab);
    setOpenClientFromConsent(false);
    setFormScreen('nuevo-consentimiento');
  };

  const openClientDetail = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setFormReturnTab(activeTab);
    setFormScreen('ficha-cliente');
  };

  const openConsentDetail = (consent: Consent) => {
    setSelectedConsentId(consent.id);
    if (formScreen !== 'ficha-cliente') {
      setSelectedPatientId(undefined);
      setFormReturnTab(activeTab);
    }
    setFormScreen('detalle-consentimiento');
  };

  const openStats = () => {
    setFormReturnTab(activeTab);
    setFormScreen('estadisticas');
  };

  const closeFormScreen = () => {
    if (formScreen === 'nuevo-cliente' && openClientFromConsent) {
      setOpenClientFromConsent(false);
      setNewClientDraftName('');
      setFormScreen('nuevo-consentimiento');
      return;
    }
    if (formScreen === 'detalle-consentimiento' && selectedPatientId) {
      setFormScreen('ficha-cliente');
      setSelectedConsentId(undefined);
      return;
    }
    setFormScreen(null);
    setOpenClientFromConsent(false);
    setNewClientDraftName('');
    setSelectedPatientId(undefined);
    setSelectedConsentId(undefined);
    setActiveTab(formReturnTab);
  };

  const handleChangeTab = (tab: NavTab) => {
    setFormScreen(null);
    setOpenClientFromConsent(false);
    setNewClientDraftName('');
    setSelectedPatientId(undefined);
    setSelectedConsentId(undefined);
    setActiveTab(tab);
  };

  const handleAddClient = async (patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
    noteDate?: string;
    noteBody?: string;
  }) => {
    try {
      const { noteDate, noteBody, ...patientFields } = patientData;
      const newPatient = await supabaseService.addPatientAsync(patientFields);
      if (noteBody?.trim()) {
        try {
          await supabaseService.addPatientNote(newPatient.id, noteBody.trim(), noteDate);
        } catch (noteErr) {
          console.warn('Cliente creado pero la nota no se guardó:', noteErr);
        }
      }
      triggerToast('✓ Cliente Registrado', `${newPatient.fullName} añadido al expediente.`);

      if (openClientFromConsent) {
        setPreselectedPatientId(newPatient.id);
        setOpenClientFromConsent(false);
        setNewClientDraftName('');
        setFormScreen('nuevo-consentimiento');
        return;
      }

      setSelectedPatientId(newPatient.id);
      setFormScreen('ficha-cliente');
    } catch (err) {
      console.error(err);
      triggerToast('Error', 'No se pudo guardar el cliente. Inténtalo de nuevo.');
    }
  };

  const handleCreateConsent = async (consentData: {
    patientId: string;
    patientNameSnapshot: string;
    patientDniSnapshot: string;
    templateId: string;
    title: string;
    category: string;
    templateVersion: number;
    contentSnapshot: string;
  }) => {
    try {
      const newConsent = await supabaseService.createConsentAsync(consentData);
      triggerToast(
        '⚡ Consentimiento Creado',
        `Enviado a ${newConsent.patientNameSnapshot} para firma.`
      );
      setSelectedConsentId(newConsent.id);
      setFormScreen('detalle-consentimiento');
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' &&
              err !== null &&
              'message' in err &&
              typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'No se pudo crear el consentimiento.';
      triggerToast('Error', message);
    }
  };

  const handleSignComplete = (consentId: string, signatureData: string) => {
    if (consentId.startsWith('temp-')) {
      triggerToast('Error', 'El consentimiento aún se está guardando. Espera un segundo.');
      return;
    }
    const signed = supabaseService.signConsent(consentId, signatureData);
    if (signed) {
      triggerToast(
        '🎉 ¡Firma Confirmada!',
        `${signed.patientNameSnapshot} firmó "${signed.title}".`
      );
    } else {
      triggerToast('Error', 'No se pudo firmar. Vuelve a abrir el documento.');
    }
  };

  const handleBatchSignComplete = (signatureData: string) => {
    if (!batchSignConsents?.length) return;
    const ids = batchSignConsents.map((c) => c.id);
    const signed = supabaseService.signConsentsBatch(ids, signatureData);
    setBatchSignConsents(null);
    if (signed.length > 0) {
      triggerToast(
        '🎉 Firma de sesión',
        `${signed.length} consentimiento${signed.length === 1 ? '' : 's'} firmado${signed.length === 1 ? '' : 's'} con una sola firma.`
      );
    } else {
      triggerToast('Error', 'No se pudieron firmar los documentos seleccionados.');
    }
  };

  const handleSimulatePush = () => {
    supabaseService.simulateIncomingPush();
    triggerToast('⚡ Notificación', 'Nueva actividad de firma.');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      triggerToast('Error al salir', error.message);
      return;
    }
    setSession(null);
  };

  const openTemplateEditor = (tmpl: ConsentTemplate | null = null) => {
    setTemplateToEdit(tmpl);
    setFormReturnTab(activeTab === 'plantillas' ? 'plantillas' : activeTab);
    setFormScreen('editar-plantilla');
  };

  const handleSaveTemplate = (data: {
    id?: string;
    name: string;
    category: string;
    content: string;
    version: number;
  }) => {
    if (data.id) {
      supabaseService.updateTemplate(data.id, {
        name: data.name,
        category: data.category,
        content: data.content,
        version: data.version,
      });
      triggerToast('✓ Plantilla Actualizada', `"${data.name}" v${data.version}`);
    } else {
      supabaseService.addTemplate({
        name: data.name,
        category: data.category,
        content: data.content,
        version: data.version,
      });
      triggerToast('✓ Plantilla Creada', `"${data.name}" lista`);
    }
    setTemplateToEdit(null);
    setFormScreen(null);
    setActiveTab('plantillas');
  };

  const handleToggleTemplateActive = (id: string, currentActive: boolean) => {
    supabaseService.toggleTemplateActive(id, !currentActive);
    triggerToast('Estado de Plantilla', `Plantilla ${!currentActive ? 'activada' : 'desactivada'}.`);
  };

  const pendingCount = supabaseService.getPendingCount();
  const signedCount = supabaseService.getSignedCount();
  const unreadNotifCount = supabaseService.getUnreadNotificationsCount();
  const isFormScreen = formScreen !== null;

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session === null) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div
      className={`min-h-screen flex bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-[#E0E0E0] font-sans ${darkMode ? 'dark' : ''}`}
    >
      <Sidebar
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        pendingCount={pendingCount}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onSimulatePush={handleSimulatePush}
        userEmail={session.user.email}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {toastMessage && (
          <div className="fixed top-14 inset-x-4 max-w-sm mx-auto z-50 bg-[#bd003c] text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-rose-400">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-xs">{toastMessage.title}</h4>
              <p className="text-[11px] opacity-90 truncate">{toastMessage.body}</p>
            </div>
          </div>
        )}

        <Header
          showBack={isFormScreen || activeTab !== 'inicio'}
          onBack={() => {
            if (isFormScreen) {
              closeFormScreen();
              return;
            }
            setActiveTab('inicio');
          }}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadCount={unreadNotifCount}
        />

        <main
          className={`flex-1 overflow-y-auto py-4 lg:py-6 ${
            formScreen === 'nuevo-cliente' || formScreen === 'nuevo-consentimiento'
              ? 'px-2 sm:px-4 md:px-6 lg:px-10'
              : 'px-4 md:px-8 lg:px-10'
          }`}
        >
          {formScreen === 'nuevo-cliente' && (
            <NewClientView
              initialFullName={newClientDraftName}
              onCancel={closeFormScreen}
              onAddClient={handleAddClient}
            />
          )}

          {formScreen === 'nuevo-consentimiento' && (
            <NewConsentView
              patients={patients}
              templates={templates}
              preselectedPatientId={preselectedPatientId}
              preselectedTemplateId={preselectedTemplateId}
              onCancel={closeFormScreen}
              onRequestNewClient={(draftName) => openNewClient(draftName || '', true)}
              onCreateConsent={handleCreateConsent}
            />
          )}

          {formScreen === 'ficha-cliente' && selectedPatient && (
            <ClientDetailView
              patient={selectedPatient}
              consents={consents}
              onNewConsent={() => openNewConsent(selectedPatient.id)}
              onOpenConsent={openConsentDetail}
            />
          )}

          {formScreen === 'detalle-consentimiento' && selectedConsent && (
            <ConsentDetailView
              document={selectedConsent}
              onSignComplete={handleSignComplete}
              onClose={closeFormScreen}
            />
          )}

          {formScreen === 'estadisticas' && <StatsView consents={consents} />}

          {!isFormScreen && activeTab === 'inicio' && (
            <HomeView
              doctorName={clinicSettings.professionalName}
              pendingCount={pendingCount}
              totalConsentsCount={supabaseService.getTotalConsentsCount()}
              signedCount={signedCount}
              signedTodayCount={signedTodayCount}
              weekCount={weekCount}
              recentConsents={[...consents]
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
                )
                .slice(0, 8)}
              onNewClient={() => openNewClient('')}
              onNewConsent={() => openNewConsent()}
              onOpenConsent={openConsentDetail}
              onOpenStats={openStats}
              onNavigateTab={(tab, statusFilter) => {
                if (statusFilter) setDocumentStatusFilter(statusFilter);
                handleChangeTab(tab);
              }}
            />
          )}

          {!isFormScreen && activeTab === 'clientes' && (
            <ClientsView
              patients={patients}
              onNewClient={() => openNewClient('')}
              onOpenClient={openClientDetail}
            />
          )}

          {!isFormScreen && activeTab === 'consentimientos' && (
            <DocumentsView
              documents={consents}
              statusFilter={documentStatusFilter}
              onStatusFilterChange={(status) => setDocumentStatusFilter(status)}
              onNewConsent={() => openNewConsent()}
              onOpenConsent={openConsentDetail}
              onBatchSign={(docs) => setBatchSignConsents(docs)}
            />
          )}

          {formScreen === 'editar-plantilla' && (
            <TemplateEditorView
              templateToEdit={templateToEdit}
              onCancel={() => {
                setTemplateToEdit(null);
                closeFormScreen();
              }}
              onSave={handleSaveTemplate}
            />
          )}

          {!isFormScreen && activeTab === 'plantillas' && (
            <TemplatesView
              templates={templates}
              onNewTemplate={() => openTemplateEditor(null)}
              onEditTemplate={(tmpl) => openTemplateEditor(tmpl)}
              onToggleActive={handleToggleTemplateActive}
              onUseTemplate={(tmpl) => openNewConsent(undefined, tmpl.id)}
            />
          )}

          {!isFormScreen && activeTab === 'ajustes' && (
            <SettingsView
              clinicSettings={clinicSettings}
              darkMode={darkMode}
              userEmail={session.user.email}
              onUpdateClinicSettings={(updates) => supabaseService.updateClinicSettings(updates)}
              onToggleDarkMode={toggleDarkMode}
              onSimulatePush={handleSimulatePush}
              onSignOut={handleSignOut}
              onOpenTemplates={() => handleChangeTab('plantillas')}
            />
          )}
        </main>

        {!isFormScreen && (
          <BottomNav
            activeTab={activeTab}
            onChangeTab={handleChangeTab}
            pendingCount={pendingCount}
          />
        )}
      </div>

      {batchSignConsents && batchSignConsents.length > 0 && (
        <BatchSignModal
          consents={batchSignConsents}
          onCancel={() => setBatchSignConsents(null)}
          onConfirm={handleBatchSignComplete}
        />
      )}

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => supabaseService.markNotificationAsRead(id)}
        onMarkAllRead={() => supabaseService.markAllNotificationsAsRead()}
        onSimulatePush={handleSimulatePush}
      />

    </div>
  );
}
