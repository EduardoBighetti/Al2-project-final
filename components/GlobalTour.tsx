import React, { useMemo } from "react";
import { Joyride } from "react-joyride";
import { useTour } from "../contexts/TourContext";
import { useNavigate } from "react-router-dom";

export const GlobalTour = () => {
  const { activeTour, stopTour } = useTour();
  const navigate = useNavigate();

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;
    const finishedStatuses = ["finished", "skipped"];

    if (finishedStatuses.includes(status)) {
      stopTour();
    }
  };

  const steps = useMemo(() => {
    if (activeTour === "global") {
      return [
        {
          target: "body",
          content:
            "Bem-vindo ao sistema AL2 IoT! Vamos fazer um tour rápido de navegação geral. Se quiser, você pode pular clicando abaixo.",
          placement: "center" as const,
          disableBeacon: true,
        },
        {
          target: ".tour-sidebar-dashboard",
          content:
            "Aqui é o Dashboard. Visão geral de todos os sensores e equipamentos, relatórios e estatísticas.",
          placement: "right" as const,
        },
        {
          target: ".tour-sidebar-monitoring",
          content:
            "No Monitoramento, você pode ver os dados em tempo real mais detalhados e gráficos individuais.",
          placement: "right" as const,
        },
        {
          target: ".tour-sidebar-devices",
          content:
            "Nesta aba você cadastra e gerencia seus dispositivos (ESP32) e sensores.",
          placement: "right" as const,
        },
        {
          target: ".tour-sidebar-arduino",
          content:
            "Aqui você tem uma interface para gravar código diretamente no seu Arduino/ESP32 via porta Serial web.",
          placement: "right" as const,
        },
        {
          target: ".tour-sidebar-tutorial",
          content:
            "O Tutorial agora possui opções para ver como cada tela funciona por dentro (Tours Internos). Não deixe de conferir!",
          placement: "right" as const,
        },
        {
          target: ".tour-header-profile",
          content:
            "E aqui no seu perfil (Configurações) você pode alterar seu idioma, tema e informações pessoais.",
          placement: "bottom" as const,
        },
      ];
    }

    if (activeTour === "dashboard") {
      return [
        {
          target: ".tour-dashboard-stats",
          content:
            "Aqui você tem um resumo rápido com as médias atuais dos sensores filtrados.",
          placement: "bottom" as const,
          disableBeacon: true,
        },
        {
          target: ".tour-dashboard-chart",
          content:
            "Este gráfico mostra o histórico e as tendências de temperatura e umidade ao longo do tempo.",
          placement: "top" as const,
        },
        {
          target: ".tour-dashboard-reports",
          content:
            "Nesta seção você pode gerar relatórios em PDF para auditoria (Diário, Semanal, Quinzenal ou em datas personalizadas).",
          placement: "top" as const,
        },
      ];
    }

    if (activeTour === "monitoring") {
      return [
        {
          target: ".tour-monitoring-select",
          content:
            "Selecione um equipamento neste campo para visualizar seus dados de telemetria.",
          placement: "bottom" as const,
          disableBeacon: true,
        },
        {
          target: ".tour-monitoring-cards",
          content:
            "Estes cards mostram os dados em tempo real da unidade selecionada. Eles são atualizados instantaneamente.",
          placement: "bottom" as const,
        },
        {
          target: ".tour-monitoring-history",
          content:
            "Aqui você visualiza os gráficos detalhados. Você pode alternar entre Tempo Real ou buscar o Histórico de dados de dias passados.",
          placement: "top" as const,
        },
        {
          target: ".tour-monitoring-map",
          content:
            "Nesta área você pode visualizar o status de conexão dos dispositivos e a localização deles na planta baixa da sua unidade.",
          placement: "top" as const,
        },
      ];
    }

    if (activeTour === "devices") {
      return [
        {
          target: ".tour-devices-add",
          content:
            "Clique aqui para cadastrar um novo equipamento (ex: um novo ESP32).",
          placement: "left" as const,
          disableBeacon: true,
        },
        {
          target: ".tour-devices-list",
          content:
            "Aqui ficarão listados todos os seus equipamentos ativos. Você pode editar, excluir ou adicionar sensores a eles.",
          placement: "top" as const,
        },
      ];
    }

    if (activeTour === "arduino") {
      return [
        {
          target: ".tour-arduino-serial",
          content:
            "Use este botão para gerenciar a conexão via Serial (USB) ao seu equipamento e interagir com ele em tempo real.",
          placement: "bottom" as const,
          disableBeacon: true,
        },
        {
          target: ".tour-arduino-editor",
          content:
            "Escreva e edite códigos ou acesse o Terminal Serial mudando as abas neste painel.",
          placement: "left" as const,
        },
      ];
    }

    return [];
  }, [activeTour]);

  const joyrideProps: any = {
    steps,
    run: !!activeTour,
    continuous: true,
    scrollToFirstStep: true,
    showProgress: true,
    showSkipButton: true,
    hideCloseButton: true,
    spotlightClicks: false,
    disableOverlayClose: true,
    callback: handleJoyrideCallback,
    styles: {
      options: {
        primaryColor: "#2563eb",
        zIndex: 10000,
        backgroundColor: "#1e293b",
        textColor: "#f8fafc",
        arrowColor: "#1e293b",
        overlayColor: "rgba(0, 0, 0, 0.75)",
      },
    },
    locale: {
      last: "Finalizar",
      skip: "Pular Tour",
      next: "Próximo",
      back: "Voltar",
    },
  };

  return <Joyride key={activeTour || "none"} {...joyrideProps} />;
};
