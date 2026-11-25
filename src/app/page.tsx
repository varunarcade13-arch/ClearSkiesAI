"use client";

import React, { useState } from "react";
import { Header, NavigationTab } from "@/presentation/components/common/Header";
import { Footer } from "@/presentation/components/common/Footer";
import { AlertBanner } from "@/presentation/components/alerts/AlertBanner";
import { OverviewView } from "@/presentation/components/dashboard/OverviewView";
import { LiveAQIView } from "@/presentation/components/dashboard/LiveAQIView";
import { AIAssistantView } from "@/presentation/components/chat/AIAssistantView";
import { FamilyPlanView } from "@/presentation/components/family/FamilyPlanView";
import { RecommendationsView } from "@/presentation/components/recommendations/RecommendationsView";
import { IndoorAQView } from "@/presentation/components/indoor/IndoorAQView";
import { SustainableLivingView } from "@/presentation/components/sustainability/SustainableLivingView";
import { CommunityHubView } from "@/presentation/components/community/CommunityHubView";
import { SettingsView } from "@/presentation/components/settings/SettingsView";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");

  const renderActiveView = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewView onNavigate={(tab) => setActiveTab(tab)} />;
      case "live-aqi":
        return <LiveAQIView />;
      case "ai-assistant":
        return <AIAssistantView />;
      case "family-plan":
        return <FamilyPlanView />;
      case "recommendations":
        return <RecommendationsView />;
      case "indoor-aq":
        return <IndoorAQView />;
      case "sustainability":
        return <SustainableLivingView />;
      case "community":
        return <CommunityHubView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
        tabIndex={-1}
      >
        <h1 className="sr-only">ClearSkies AI: {activeTab.replaceAll("-", " ")}</h1>
        <AlertBanner />
        {renderActiveView()}
      </main>

      <Footer />
    </div>
  );
}
