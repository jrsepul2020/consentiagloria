import React, { useState, useEffect } from 'react';
import { supabase, getSession } from './lib/supabaseClient';
import { supabaseService } from './services/supabaseService';
import { NavTab, BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SignatureModal } from './components/SignatureModal';
import { NewClientModal } from './components/NewClientModal';
import { NewConsentModal } from './components/NewConsentModal';
import { NewTemplateModal } from './components/NewTemplateModal';
import { LoginPage } from './components/LoginPage';
import { HomeView } from './components/views/HomeView';
import { ClientsView } from './components/views/ClientsView';
import { DocumentsView } from './components/views/DocumentsView';
import { TemplatesView } from './components/views/TemplatesView';
import { SettingsView } from './components/views/SettingsView';
import { Consent, ClinicSettings, ConsentTemplate } from './types';
import { CheckCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    getSession().then((s) => setSession(s));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Dark Mode ─────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // ── App State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [documentStatusFilter, setDocumentStatusFilter] = useState<'TODOS' | 'PENDIENTE' | 'FIRMADO' | 'BORRADOR' | 'RECHAZADO'>('TODOS');

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => supabaseService.getClinicSettings());
  const [patients, setPatients] = useState(() => supabaseService.getPatients());
  const [consents, setConsents] = useState<Consent[]>(() => supabaseService.getConsents());
  const [templates, setTemplates] = useState<ConsentTemplate[]>(() => supabaseService.getTemplates());
  const [notifications, setNotifications] = useState(() => supabaseService.getNotifications());
  const [activities, setActivities] = useState(() => supabaseService.getActivities());

  // Modal states
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientDraftName, setNewClientDraftName] = useState('');
  const [isNewConsentModalOpen, setIsNewConsentModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<ConsentTemplate | null>(null);

  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | undefined>(undefined);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [activeConsentForSigning, setActiveConsentForSigning] = useState<Consent | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  // Subscribe to service updates
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

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAddClient = (patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }) => {
    const newPatient = supabaseService.addPatient(patientData);
    triggerToast('✓ Cliente Registrado', `${newPatient.fullName} añadido al expediente.`);
    // Si se creó desde "Nuevo consentimiento", dejarlo seleccionado en el flujo
    if (isNewConsentModalOpen) {
      setPreselectedPatientId(newPatient.id);
    }
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
    triggerToast('⚡ Consentimiento Creado', `Enviado a ${newConsent.patientNameSnapshot} para firma.`);
  };

  const handleOpenSignatureModal = (consent: Consent) => {
    setActiveConsentForSigning(consent);
    setIsSignatureModalOpen(true);
  };

  const handleSignComplete = (consentId: string, signatureData: string) => {
    const signed = supabaseService.signConsent(consentId, signatureData);
    if (signed) {
      triggerToast('🎉 ¡Firma Confirmada!', `${signed.patientNameSnapshot} firmó "${signed.title}". Generando PDF...`);
    }
  };

  const handleSimulatePush = () => {
    supabaseService.simulateIncomingPush();
    triggerToast('⚡ Supabase Realtime', 'Nueva firma biométrica procesada.');
  };

  const handleOpenNewConsentForPatient = (patientId: string) => {
    setPreselectedPatientId(patientId);
    setPreselectedTemplateId(undefined);
    setIsNewConsentModalOpen(true);
  };

  // Template Handlers
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
      triggerToast('✓ Plantilla Actualizada', `Se ha guardado la versión v${data.version} de "${data.name}".`);
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
    setPreselectedTemplateId(template.id);
    setPreselectedPatientId(undefined);
    setIsNewConsentModalOpen(true);
  };

  const pendingCount = consents.filter((c) => c.status === 'PENDIENTE').length;
  const signedCount = consents.filter((c) => c.status === 'FIRMADO').length;
  const unreadNotifCount = supabaseService.getUnreadNotificationsCount();

  // ── Auth Loading / Login ──────────────────────────────────────────────────────

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

  // ── Authenticated App ─────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-[#E0E0E0] font-sans transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar — desktop */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingCount={pendingCount}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onSimulatePush={handleSimulatePush}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="fixed top-14 inset-x-4 max-w-sm mx-auto z-50 bg-[#bd003c] text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-rose-400">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-xs">{toastMessage.title}</h4>
              <p className="text-[11px] opacity-90 truncate">{toastMessage.body}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <Header
          showBack={activeTab !== 'inicio'}
          onBack={() => setActiveTab('inicio')}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadCount={unreadNotifCount}
        />

        {/* Active View */}
        <main className="flex-1 px-4 md:px-8 lg:px-10 py-4 lg:py-6 overflow-y-auto">
          {activeTab === 'inicio' && (
            <HomeView
              doctorName={clinicSettings.professionalName}
              pendingCount={pendingCount}
              totalConsentsCount={consents.length}
              signedCount={signedCount}
              activities={activities}
              recentConsents={consents.slice(0, 8)}
              onNewClient={() => {
                setNewClientDraftName('');
                setIsNewClientModalOpen(true);
              }}
              onNewConsent={() => {
                setPreselectedPatientId(undefined);
                setPreselectedTemplateId(undefined);
                setIsNewConsentModalOpen(true);
              }}
              onOpenSignModal={handleOpenSignatureModal}
              onNavigateTab={(tab, statusFilter) => {
                if (statusFilter) setDocumentStatusFilter(statusFilter);
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientsView
              patients={patients}
              onNewClient={() => {
                setNewClientDraftName('');
                setIsNewClientModalOpen(true);
              }}
              onNewConsentForPatient={handleOpenNewConsentForPatient}
            />
          )}

          {activeTab === 'consentimientos' && (
            <DocumentsView
              documents={consents}
              statusFilter={documentStatusFilter}
              onStatusFilterChange={(status) => setDocumentStatusFilter(status)}
              onNewConsent={() => {
                setPreselectedPatientId(undefined);
                setPreselectedTemplateId(undefined);
                setIsNewConsentModalOpen(true);
              }}
              onOpenSignModal={handleOpenSignatureModal}
            />
          )}

          {activeTab === 'plantillas' && (
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

          {activeTab === 'ajustes' && (
            <SettingsView
              clinicSettings={clinicSettings}
              darkMode={darkMode}
              onUpdateClinicSettings={(updates) => supabaseService.updateClinicSettings(updates)}
              onToggleDarkMode={toggleDarkMode}
              onSimulatePush={handleSimulatePush}
            />
          )}
        </main>

        {/* Bottom Navigation — mobile */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          pendingCount={pendingCount}
        />
      </div>

      {/* Drawers and Modals */}
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

      <NewConsentModal
        isOpen={isNewConsentModalOpen}
        onClose={() => setIsNewConsentModalOpen(false)}
        patients={patients}
        templates={templates}
        preselectedPatientId={preselectedPatientId}
        preselectedTemplateId={preselectedTemplateId}
        onRequestNewClient={(draftName) => {
          setNewClientDraftName(draftName || '');
          setIsNewClientModalOpen(true);
        }}
        onCreateConsent={handleCreateConsent}
      />

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => {
          setIsNewClientModalOpen(false);
          setNewClientDraftName('');
        }}
        initialFullName={newClientDraftName}
        onAddClient={handleAddClient}
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
