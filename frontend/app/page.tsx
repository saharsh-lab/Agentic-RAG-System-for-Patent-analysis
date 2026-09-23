'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { NavView } from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardView from '@/components/views/DashboardView';
import PatentSearchView from '@/components/views/PatentSearchView';
import PatentDetailModal from '@/components/views/PatentDetailModal';
import DocumentVaultView from '@/components/views/DocumentVaultView';
import PatentOverviewView from '@/components/views/PatentOverviewView';
import ClaimAnalysisView from '@/components/views/ClaimAnalysisView';
import PatentSimilarityView from '@/components/views/PatentSimilarityView';
import PatentComparisonView from '@/components/views/PatentComparisonView';
import ReportView from '@/components/views/ReportView';
import EvaluationView from '@/components/views/EvaluationView';
import SettingsView from '@/components/views/SettingsView';
import HallucinationDashboard from '@/components/HallucinationDashboard';
import AuthModal from '@/components/AuthModal';

import UploadBox from '@/components/UploadBox';
import DocumentList from '@/components/DocumentList';
import ConversationSidebar from '@/components/ConversationSidebar';
import ChatInterface from '@/components/ChatInterface';
import AnswerCard from '@/components/AnswerCard';
import SourcesPanel from '@/components/SourcesPanel';
import ClaimVerification from '@/components/ClaimVerification';
import LoadingState from '@/components/LoadingState';

import {
  DocumentItem, ChatQueryResponse, UserProfile, ConversationSummary, HallucinationAnalytics, PatentItem
} from '@/lib/types';
import {
  fetchDocumentList, checkBackendHealth, getCurrentUser, removeAuthToken,
  fetchConversations, createConversation, fetchConversationDetail, deleteConversation,
  fetchHallucinationAnalytics, searchPatents
} from '@/lib/api';

export default function Home() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);

  const [queryResponse, setQueryResponse] = useState<ChatQueryResponse | null>(null);
  const [pastMessages, setPastMessages] = useState<ChatQueryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<HallucinationAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);

  const [selectedPatentDetail, setSelectedPatentDetail] = useState<PatentItem | null>(null);
  const [comparisonPatents, setComparisonPatents] = useState<PatentItem[]>([]);

  const [dbStatus, setDbStatus] = useState<string>('checking');

  useEffect(() => {
    checkHealth();
    loadUser();
    loadDocuments();
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentView === 'analytics') {
      loadAnalytics();
    }
  }, [currentView]);

  const checkHealth = async () => {
    const res = await checkBackendHealth();
    setDbStatus(res.database);
  };

  const loadUser = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  const loadDocuments = async () => {
    try {
      const list = await fetchDocumentList();
      setDocuments(list);
      if (list.length > 0 && !selectedDocId) {
        setSelectedDocId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await fetchHallucinationAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const detail = await fetchConversationDetail(convId);
      if (detail && detail.messages) {
        setPastMessages(detail.messages.map((m) => m.response));
      }
    } catch (err) {
      console.error('Failed to load conversation details', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation('New Research Thread', selectedDocId);
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setPastMessages([]);
    } catch (err) {
      console.error('Failed to create new conversation', err);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations(conversations.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(undefined);
        setPastMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleQueryResult = (result: ChatQueryResponse) => {
    setQueryResponse(result);
    setPastMessages((prev) => [result, ...prev]);
    loadConversations();
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
  };

  const handleAddComparison = (patent: PatentItem) => {
    if (!comparisonPatents.some((p) => p.publication_number === patent.publication_number)) {
      setComparisonPatents([...comparisonPatents, patent]);
    }
  };

  const handleRemoveComparison = (pubNum: string) => {
    setComparisonPatents(comparisonPatents.filter((p) => p.publication_number !== pubNum));
  };

  const handleQuickSearch = (query: string) => {
    setCurrentView('patent_search');
  };

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentView={currentView}
          dbStatus={dbStatus}
          user={user}
          onRefresh={() => { loadDocuments(); loadConversations(); checkHealth(); }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onQuickSearch={handleQuickSearch}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              documents={documents}
              conversations={conversations}
              recentPatents={[]}
              onNavigate={setCurrentView}
              onSelectDoc={setSelectedDocId}
              onSelectConversation={handleSelectConversation}
            />
          )}

          {currentView === 'documents' && (
            <DocumentVaultView
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onUploadSuccess={(doc) => { setDocuments([doc, ...documents]); setSelectedDocId(doc.id); }}
              onDocumentDeleted={(id) => setDocuments(documents.filter((d) => d.id !== id))}
            />
          )}

          {currentView === 'patent_overview' && (
            <PatentOverviewView
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Documents & Threads */}
              <div className="lg:col-span-4 space-y-6">
                <UploadBox onUploadSuccess={(doc) => { setDocuments([doc, ...documents]); setSelectedDocId(doc.id); }} />
                <DocumentList
                  documents={documents}
                  selectedDocId={selectedDocId}
                  onSelectDoc={setSelectedDocId}
                  onDocumentDeleted={(id) => setDocuments(documents.filter((d) => d.id !== id))}
                />
                <ConversationSidebar
                  conversations={conversations}
                  activeConversationId={activeConvId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
              </div>

              {/* Right Column: Chat & Evidence */}
              <div className="lg:col-span-8 space-y-6">
                <ChatInterface
                  selectedDocId={selectedDocId}
                  documents={documents}
                  activeConversationId={activeConvId}
                  onQueryResult={handleQueryResult}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />

                {isLoading && <LoadingState />}

                {!isLoading && pastMessages.length > 0 && (
                  <div className="space-y-6">
                    {pastMessages.map((msg, idx) => (
                      <div key={msg.query_id || idx} className="space-y-4 pt-4 border-t border-slate-200">
                        <AnswerCard response={msg} />
                        <ClaimVerification verifications={msg.claim_verifications} />
                        <SourcesPanel citations={msg.citations} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'claim_analysis' && (
            <ClaimAnalysisView
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'patent_similarity' && (
            <PatentSimilarityView
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onNavigate={setCurrentView}
              onCompareWith={handleAddComparison}
            />
          )}

          {currentView === 'comparison' && (
            <PatentComparisonView
              comparisonList={comparisonPatents}
              onRemove={handleRemoveComparison}
              baseDoc={activeDoc}
            />
          )}

          {currentView === 'patent_search' && (
            <PatentSearchView
              onSelectPatentForDetail={setSelectedPatentDetail}
              onAddPatentToComparison={handleAddComparison}
            />
          )}

          {currentView === 'report' && (
            <ReportView
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
            />
          )}

          {currentView === 'evaluation' && <EvaluationView />}

          {currentView === 'analytics' && (
            <HallucinationDashboard
              analytics={analytics}
              isLoading={isAnalyticsLoading}
              onRefresh={loadAnalytics}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              user={user}
              dbStatus={dbStatus}
            />
          )}
        </main>
      </div>

      {/* Detail Modal for Patents */}
      <PatentDetailModal
        patent={selectedPatentDetail}
        onClose={() => setSelectedPatentDetail(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          loadDocuments();
          loadConversations();
        }}
      />
    </div>
  );
}
