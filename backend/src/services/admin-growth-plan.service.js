function buildScenario({
  id,
  probability,
  title,
  monthlyMin,
  monthlyMax,
  yearlyMin,
  yearlyMax,
  servicePace,
  trainingPace,
  mix,
  notes,
}) {
  return {
    id,
    probability,
    title,
    monthly_min: monthlyMin,
    monthly_max: monthlyMax,
    yearly_min: yearlyMin,
    yearly_max: yearlyMax,
    service_pace: servicePace,
    training_pace: trainingPace,
    mix,
    notes,
  };
}

function buildMonthlyRoadmap() {
  return [
    {
      month: "M1",
      revenue_target: 2000,
      traffic_target: 500,
      leads_target: 4,
      calls_target: 2,
      quotes_target: 1,
      wins_target: "0 à 1",
      course_sales_target: 2,
      focus: "Installer une preuve claire, publier regulierement et obtenir les premiers appels.",
    },
    {
      month: "M2",
      revenue_target: 3000,
      traffic_target: 800,
      leads_target: 6,
      calls_target: 3,
      quotes_target: 2,
      wins_target: "1",
      course_sales_target: 3,
      focus: "Rendre l'offre plus lisible, activer le diagnostic et envoyer les premiers devis vite.",
    },
    {
      month: "M3",
      revenue_target: 4500,
      traffic_target: 1200,
      leads_target: 8,
      calls_target: 4,
      quotes_target: 3,
      wins_target: "1",
      course_sales_target: 4,
      focus: "Transformer les premiers retours clients en preuve, cas d'usage et contenus d'autorite.",
    },
    {
      month: "M4",
      revenue_target: 5500,
      traffic_target: 1600,
      leads_target: 10,
      calls_target: 5,
      quotes_target: 3,
      wins_target: "1",
      course_sales_target: 5,
      focus: "Mettre en rythme la production de contenu et la relance commerciale chaque semaine.",
    },
    {
      month: "M5",
      revenue_target: 7000,
      traffic_target: 2000,
      leads_target: 12,
      calls_target: 6,
      quotes_target: 4,
      wins_target: "1",
      course_sales_target: 6,
      focus: "Ameliorer le taux de closing avec une proposition plus nette et des offres mieux agencees.",
    },
    {
      month: "M6",
      revenue_target: 8500,
      traffic_target: 2500,
      leads_target: 14,
      calls_target: 7,
      quotes_target: 4,
      wins_target: "1 à 2",
      course_sales_target: 7,
      focus: "Stabiliser une machine simple : contenu, diagnostic, call, devis, relance, signature.",
    },
    {
      month: "M7",
      revenue_target: 10000,
      traffic_target: 3000,
      leads_target: 16,
      calls_target: 8,
      quotes_target: 5,
      wins_target: "2",
      course_sales_target: 8,
      focus: "Monter en panier moyen avec plus de direction, plus de preuve et plus de cas credibles.",
    },
    {
      month: "M8",
      revenue_target: 11500,
      traffic_target: 3500,
      leads_target: 18,
      calls_target: 9,
      quotes_target: 5,
      wins_target: "2",
      course_sales_target: 9,
      focus: "Utiliser les resultats obtenus pour mieux vendre services, production et accompagnement.",
    },
    {
      month: "M9",
      revenue_target: 12500,
      traffic_target: 4000,
      leads_target: 20,
      calls_target: 10,
      quotes_target: 6,
      wins_target: "2",
      course_sales_target: 10,
      focus: "Industrialiser les formats qui convertissent le mieux et arreter les contenus decoratifs.",
    },
    {
      month: "M10",
      revenue_target: 13500,
      traffic_target: 4500,
      leads_target: 22,
      calls_target: 11,
      quotes_target: 6,
      wins_target: "2",
      course_sales_target: 11,
      focus: "Renforcer l'offre premium, les partenariats et les points d'entree a forte valeur.",
    },
    {
      month: "M11",
      revenue_target: 14500,
      traffic_target: 5000,
      leads_target: 24,
      calls_target: 12,
      quotes_target: 7,
      wins_target: "2",
      course_sales_target: 12,
      focus: "Augmenter la repetition sans perdre le niveau premium : plus de preuves, meilleur tri des leads.",
    },
    {
      month: "M12",
      revenue_target: 15500,
      traffic_target: 6000,
      leads_target: 26,
      calls_target: 13,
      quotes_target: 8,
      wins_target: "2 à 3",
      course_sales_target: 14,
      focus: "Passer d'un studio qui vend a un studio qui opere un systeme commercial repetable.",
    },
  ];
}

function getStageFromSnapshot(snapshot) {
  const metrics = snapshot?.metrics || {};

  if (!metrics.new_leads && !metrics.active_clients && !metrics.active_projects && !metrics.won_leads) {
    return {
      label: "Base a initialiser",
      summary:
        "Le systeme est encore au point zero. L'enjeu n'est pas d'optimiser, mais d'installer trafic, preuve et premiers signaux de demande.",
      next_focus:
        "Publier regulierement, activer le diagnostic, capter les premiers leads et envoyer les premiers devis vite.",
    };
  }

  if (!metrics.won_leads) {
    return {
      label: "Traction a prouver",
      summary:
        "Des signaux existent, mais la machine de conversion n'est pas encore repetable. Le travail porte sur le closing et la preuve.",
      next_focus:
        "Mieux qualifier les leads, accelerer le delai de reponse et mieux transformer les appels en propositions.",
    };
  }

  if (metrics.active_clients < 3) {
    return {
      label: "Repetition a installer",
      summary:
        "Le studio sait vendre, mais doit encore rendre le systeme plus stable pour ne pas dependre d'un seul client ou d'un seul contenu.",
      next_focus:
        "Renforcer la cadence commerciale, la preuve publique et la montee en gamme des offres.",
    };
  }

  return {
    label: "Acceleration a structurer",
    summary:
      "Le studio a deja une base commerciale. L'enjeu principal est maintenant l'industrialisation selective et la qualite du pipeline.",
    next_focus:
      "Concentrer les contenus et les offres sur les formats qui transforment vraiment visites, leads et signatures.",
  };
}

function getAdminGrowthPlan(snapshot) {
  const stage = getStageFromSnapshot(snapshot);
  const roadmap = buildMonthlyRoadmap();
  const yearlyTarget = roadmap.reduce((total, month) => total + month.revenue_target, 0);

  return {
    generated_at: new Date().toISOString(),
    baseline: {
      stage: stage.label,
      summary: stage.summary,
      next_focus: stage.next_focus,
      current_pipeline_estimate: Number(snapshot?.metrics?.pipeline_estimate || 0),
      current_active_clients: Number(snapshot?.metrics?.active_clients || 0),
      current_active_projects: Number(snapshot?.metrics?.active_projects || 0),
      current_won_leads: Number(snapshot?.metrics?.won_leads || 0),
    },
    forecast_note:
      "Projection de chiffre d'affaires, pas de benefice net. Les montants dependent de l'execution, du closing, du contenu publie et des couts reels.",
    scenarios: [
      buildScenario({
        id: "base-probable",
        probability: 80,
        title: "Scenario 80 % • Base probable",
        monthlyMin: 3000,
        monthlyMax: 5000,
        yearlyMin: 36000,
        yearlyMax: 60000,
        servicePace: "1 mission tous les 45 a 60 jours",
        trainingPace: "4 a 8 ventes de formation par mois",
        mix: "Le service reste le moteur principal. Les formations commencent a tourner de facon reguliere mais encore modeste.",
        notes:
          "C'est le scenario prudent si l'execution est serieuse mais encore en phase d'installation.",
      }),
      buildScenario({
        id: "traction-solide",
        probability: 50,
        title: "Scenario 50 % • Traction solide",
        monthlyMin: 8000,
        monthlyMax: 14000,
        yearlyMin: 96000,
        yearlyMax: 168000,
        servicePace: "1 client service signe par mois",
        trainingPace: "10 a 18 ventes de formation par mois",
        mix: "Le site commence a convertir, le contenu cree une vraie demande et la preuve augmente le panier moyen.",
        notes:
          "C'est la trajectoire de travail a viser si le marketing reseaux est execute avec constance et bon niveau.",
      }),
      buildScenario({
        id: "percee-haute",
        probability: 20,
        title: "Scenario 20 % • Percee haute",
        monthlyMin: 18000,
        monthlyMax: 30000,
        yearlyMin: 216000,
        yearlyMax: 360000,
        servicePace: "2 signatures service ou activation premium par mois",
        trainingPace: "25 a 40 ventes de formation par mois",
        mix: "Le contenu perce, les cas d'usage deviennent referentiels et les offres premium montent en valeur percue.",
        notes:
          "Scenario haut qui demande tres bonne execution, bouche-a-oreille, repetition et quelques contenus qui accelerent fort.",
      }),
    ],
    north_star: {
      target_year_one_revenue: yearlyTarget,
      target_month_twelve_revenue: roadmap[roadmap.length - 1].revenue_target,
      working_goal:
        "Construire une trajectoire centrale autour de 100k a 120k EUR de chiffre d'affaires sur 12 mois, avec un moteur mixte services + formations.",
    },
    monthly_roadmap: roadmap,
    weekly_cadence: [
      {
        title: "Production de contenu",
        target: "4 contenus courts + 1 contenu preuve / semaine",
        items: [
          "2 contenus angle expertise ou lecture de marque",
          "1 contenu preuve : resultats, cas, analyse ou avant / apres",
          "1 contenu conversion avec point d'entree vers contact, diagnostic ou formation",
          "1 variation simple pour tester hook, format ou promesse",
        ],
      },
      {
        title: "Distribution & relances",
        target: "10 prises de contact qualifiees + 5 relances / semaine",
        items: [
          "Recontacter les leads ouverts sous 24 heures ouvrées",
          "Relancer les devis en attente a J+3 puis J+10",
          "Envoyer un message utile, jamais une relance vide",
          "Noter chaque mouvement dans le pipeline pour garder une memoire claire",
        ],
      },
      {
        title: "Preuve & conversion",
        target: "1 preuve forte / semaine",
        items: [
          "Publier un mini case study, un resultat, une lecture client ou un avant / apres",
          "Transformer chaque mission terminee en actif de vente",
          "Faire remonter vers la home, les resultats et les realisations les preuves les plus fortes",
          "Rappeler qu'Astra sait produire, structurer et faire performer",
        ],
      },
      {
        title: "Offre & pilotage",
        target: "1 revue business / semaine",
        items: [
          "Verifier visites, leads, appels, devis, signatures et ventes de formation",
          "Couper les actions qui prennent du temps sans nourrir la conversion",
          "Ajuster CTA, pages et contenu selon les signaux reels",
          "Garder une offre courte, lisible et vendable",
        ],
      },
    ],
    send_sequence: [
      {
        step: "Reponse au lead",
        timing: "moins de 4 h ouvrables",
        deliverable:
          "Message court, net, avec recap du besoin, une premiere lecture et une proposition de call ou de suite.",
      },
      {
        step: "Apres l'appel",
        timing: "moins de 24 h",
        deliverable:
          "E-mail recap avec besoin, angle recommande, perimetre possible, budget cadrant et prochaine etape.",
      },
      {
        step: "Proposition / devis",
        timing: "moins de 48 h",
        deliverable:
          "Offre lisible, perimetre clair, livrables, calendrier, investissement et conditions de validation.",
      },
      {
        step: "Relance commerciale",
        timing: "J+3 puis J+10",
        deliverable:
          "Relance utile avec clarification, ajustement ou exemple. Jamais un simple 'je me permets de revenir vers vous'.",
      },
      {
        step: "Onboarding client gagne",
        timing: "le jour de la validation",
        deliverable:
          "Message de bienvenue, planning, documents a renvoyer, brief, acces, acompte et premiers jalons.",
      },
    ],
    scorecard: [
      { label: "Visites qualifiees", target: "croissance reguliere semaine apres semaine" },
      { label: "Leads entrants", target: "8 a 12 / mois au plus tard a M4" },
      { label: "Appels qualifies", target: "4 a 6 / mois au plus tard a M4" },
      { label: "Devis envoyes", target: "3 a 4 / mois au plus tard a M5" },
      { label: "Signatures service", target: "1 / mois au plus tard a M4" },
      { label: "Ventes formation", target: "4 a 8 / mois au plus tard a M4" },
      { label: "Delai de reponse lead", target: "moins de 24 h, idealement moins de 4 h ouvrables" },
    ],
    watchouts: [
      "Aligner les prix publics des formations et les prix reels du LMS avant d'envoyer du trafic payant ou massif.",
      "Ne pas remplir les reseaux de contenus esthetiques sans point d'entree business clair.",
      "Ne pas laisser un devis sans relance documentee.",
      "Ne pas compter uniquement sur la vente de formation au debut : le service doit financer la montee en puissance.",
    ],
  };
}

module.exports = {
  getAdminGrowthPlan,
};
