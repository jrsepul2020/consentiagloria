import React, { useState, useEffect } from 'react';
import { supabase, getSession, signOut } from './lib/supabaseClient';
import { supabaseService } from './services/supabaseService';
import { NavTab, BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SignatureModal } from './components/SignatureModal';
import { NewTemplateModal } from './components/NewTemplateModal';
import { LoginPage } from './components/LoginPage';
import { HomeView } from './components/views/HomeView';
import { ClientsView } from './components/views/ClientsView';
import { DocumentsView } from './components/views/DocumentsView';
import { TemplatesView } from './components/views/TemplatesView';
import { SettingsView } from './components/views/SettingsView';
import { NewClientView } from './components/views/NewClientView';
import { NewConsentView } from './components/views/NewConsentView';
import { Consent, ClinicSettings, ConsentTemplate } from './types';
import { CheckCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type FormScreen = null | 'nuevo-cliente' | 'nuevo-consentimiento';

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

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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
  const [activities, setActivities] = useState(() => supabaseService.getActivities());

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [newClientDraftName, setNewClientDraftName] = useState('');
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<ConsentTemplate | null>(null);

  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | undefined>(undefined);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [activeConsentForSigning, setActiveConsentForSigning] = useState<Consent | null>(null);

  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const unsubscribe = supabaseService.subscribe(() => {
      setClinicSettings(supabaseService.getClinicSettings());
      setPatients(supabaseService.getPatients());
      setConsents(supabaseService.getConsents());
      setTemplates(supabaseService.getTemplates());
      setNotifications(supabaseService.getNotifications());
      setActivities(supabaseService.getActivities());
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (title: string, body: string) => {
    setToastMessage({ title, body });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const openNewClient = (draftName = '', fromConsent = false) => {
    setNewClientDraftName(draftName);
    setOpenClientFromConsent(fromConsent);
    if (!fromConsent) {
      setFormReturnTab(activeTab);
    }
    setFormScreen('nuevo-cliente');
  };

  const openNewConsent = (patientId?: string, templateId?: string) => {
    setPreselectedPatientId(patientId);
    setPreselectedTemplateId(templateId);
    setFormReturnTab(activeTab);
    setOpenClientFromConsent(false);
    setFormScreen('nuevo-consentimiento');
  };

  const closeFormScreen = () => {
    if (formScreen === 'nuevo-cliente' && openClientFromConsent) {
      setOpenClientFromConsent(false);
      setNewClientDraftName('');
      setFormScreen('nuevo-consentimiento');
      return;
    }
    setFormScreen(null);
    setOpenClientFromConsent(false);
    setNewClientDraftName('');
    setActiveTab(formReturnTab);
  };

  const handleChangeTab = (tab: NavTab) => {
    setFormScreen(null);
    setOpenClientFromConsent(false);
    setNewClientDraftName('');
    setActiveTab(tab);
  };

  const handleAddClient = (patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }) => {
    const newPatient = supabaseService.addPatient(patientData);
    triggerToast('✓ Cliente Registrado', `${newPatient.fullName} añadido al expediente.`);

    if (openClientFromConsent) {
      setPreselectedPatientId(newPatient.id);
      setOpenClientFromConsent(false);
      setNewClientDraftName('');
      setFormScreen('nuevo-consentimiento');
      return;
    }

    setFormScreen(null);
    setActiveTab('clientes');
  };

  const handleCreateConsent = (consentData: {
    patientId: string;
    patientNameSnapshot: string;
    patientDniSnapshot: string;
    templateId: string;
    title: string;
    category: string;
    templateVersion: number;
    contentSnapshot: string;
  }) => {
    const newConsent = supabaseService.createConsent(consentData);
    triggerToast(
      '⚡ Consentimiento Creado',
      `Enviado a ${newConsent.patientNameSnapshot} para firma.`
    );
    setFormScreen(null);
    setActiveTab('consentimientos');
  };

  const handleOpenSignatureModal = (consent: Consent) => {
    setActiveConsentForSigning(consent);
    setIsSignatureModalOpen(true);
  };

  const handleSignComplete = (consentId: string, signatureData: string) => {
    const signed = supabaseService.signConsent(consentId, signatureData);
    if (signed) {
      triggerToast(
        '🎉 ¡Firma Confirmada!',
        `${signed.patientNameSnapshot} firmó "${signed.title}". Generando PDF...`
      );
    }
  };

  const handleSimulatePush = () => {
    supabaseService.simulateIncomingPush();
    triggerToast('⚡ Supabase Realtime', 'Nueva firma biométrica procesada.');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      triggerToast('Error al salir', error.message);
      return;
    }
    setSession(null);
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
      triggerToast(
        '✓ Plantilla Actualizada',
        `Se ha guardado la versión v${data.version} de "${data.name}".`
      );
    } else {
      supabaseService.addTemplate({
        name: data.name,
        category: data.category,
        content: data.content,
        version: data.version,
      });
      triggerToast('✓ Plantilla Creada', `Plantilla "${data.name}" lista para ser utilizada.`);
    }
  };

  const handleToggleTemplateActive = (id: string, currentActive: boolean) => {
    supabaseService.toggleTemplateActive(id, !currentActive);
    triggerToast('Estado de Plantilla', `Plantilla ${!currentActive ? 'activada' : 'desactivada'}.`);
  };

  const handleUseTemplate = (template: ConsentTemplate) => {
    openNewConsent(undefined, template.id);
  };

  const pendingCount = consents.filter((c) => c.status === 'PENDIENTE').length;
  const signedCount = consents.filter((c) => c.status === 'FIRMADO').length;
  const unreadNotifCount = supabaseService.getUnreadNotificationsCount();

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

  const isFormScreen = formScreen !== null;

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

        <main className="flex-1 px-4 md:px-8 lg:px-10 py-4 lg:py-6 overflow-y-auto">
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

          {!isFormScreen && activeTab === 'inicio' && (
            <HomeView
              doctorName={clinicSettings.professionalName}
              pendingCount={pendingCount}
              totalConsentsCount={consents.length}
              signedCount={signedCount}
              activities={activities}
              recentConsents={consents.slice(0, 8)}
              onNewClient={() => openNewClient('')}
              onNewConsent={() => openNewConsent()}
              onOpenSignModal={handleOpenSignatureModal}
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
              onNewConsentForPatient={(patientId) => openNewConsent(patientId)}
            />
          )}

          {!isFormScreen && activeTab === 'consentimientos' && (
            <DocumentsView
              documents={consents}
              statusFilter={documentStatusFilter}
              onStatusFilterChange={(status) => setDocumentStatusFilter(status)}
              onNewConsent={() => openNewConsent()}
              onOpenSignModal={handleOpenSignatureModal}
            />
          )}

          {!isFormScreen && activeTab === 'plantillas' && (
            <TemplatesView
              templates={templates}
              onNewTemplate={() => {
                setTemplateToEdit(null);
                setIsNewTemplateModalOpen(true);
              }}
              onEditTemplate={(tmpl) => {
                setTemplateToEdit(tmpl);
                setIsNewTemplateModalOpen(true);
              }}
              onToggleActive={handleToggleTemplateActive}
              onUseTemplate={handleUseTemplate}
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

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => supabaseService.markNotificationAsRead(id)}
        onMarkAllRead={() => supabaseService.markAllNotificationsAsRead()}
        onSimulatePush={handleSimulatePush}
      />

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        document={activeConsentForSigning}
        onSignComplete={handleSignComplete}
      />

      <NewTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        templateToEdit={templateToEdit}
        onSaveTemplate={handleSaveTemplate}
      />
    </div>
  );
}
