function softenInternalReferences(value) {
  return String(value || "")
    .replace(/Le manifeste rappelle que/gi, "Il faut garder en tete que")
    .replace(/Le manifeste montre que/gi, "On voit clairement que")
    .replace(/Le manifeste insiste sur un point souvent oublie :/gi, "Un point souvent oublie :")
    .replace(/Le manifeste insiste sur l'importance des/gi, "Il faut accorder une vraie attention aux")
    .replace(/Le manifeste insiste sur l'importance de/gi, "Il faut traiter avec serieux")
    .replace(/Le manifeste insiste sur la necessite de/gi, "Il faut absolument")
    .replace(/Le manifeste insiste sur le fait que/gi, "Il faut garder en tete que")
    .replace(/Le manifeste insiste sur /gi, "Un point central concerne ")
    .replace(/Le manifeste parle de/gi, "Il faut comprendre")
    .replace(/Le manifeste couvre/gi, "Le paysage actuel couvre")
    .replace(/Le manifeste est tres clair :/gi, "Le point est clair :")
    .replace(/Le manifeste le dit explicitement :/gi, "Il faut le lire sans ambiguite :")
    .replace(/Le manifeste est tres utile ici parce qu'il casse plusieurs fantasmes\./gi, "Il faut partir d'une lecture lucide ici, parce que plusieurs fantasmes brouillent encore le sujet.")
    .replace(/Le manifeste fournit beaucoup de metriques\./gi, "Vous avez beaucoup de metriques a disposition.")
    .replace(/Le manifeste fournit/gi, "La methode met en evidence")
    .replace(/Le manifeste/gi, "La realite du terrain")
    .replace(/ du manifeste/gi, " de reference")
    .replace(/ au manifeste/gi, " a cette base de travail")
    .replace(/ du travail de fond/gi, " de fond")
    .replace(/ au travail de fond/gi, " a ce travail de fond")
    .replace(/\bmanifeste\b/gi, "prise de position");
}

function buildLessonContent({
  objective,
  opening,
  strategicRead,
  sections = [],
  takeaways = [],
  mistakes = [],
  actionSteps = [],
  summary,
  sourceNote,
}) {
  const parts = [
    "## Objectif",
    objective,
    "",
    "## Pourquoi cette leçon compte",
    opening,
    "",
    "## Lecture strategique",
    strategicRead,
  ];

  sections.forEach((section) => {
    parts.push("", `### ${section.title}`, section.body);
  });

  if (takeaways.length) {
    parts.push("", "## Points d'appui", ...takeaways.map((item) => `- ${item}`));
  }

  if (mistakes.length) {
    parts.push("", "## Erreurs a eviter", ...mistakes.map((item) => `- ${item}`));
  }

  if (actionSteps.length) {
    parts.push("", "## Passage a l'action", ...actionSteps.map((item, index) => `${index + 1}. ${item}`));
  }

  parts.push("", "## Synthese", summary);

  return softenInternalReferences(parts.join("\n"));
}

const academyCurriculum = [
  {
    id: "course-orbite",
    slug: "astra-orbite",
    title: "ASTRA / ORBITE",
    subtitle: "Se lancer serieusement sur les reseaux en 2026",
    description:
      "Un programme de fondation pour clarifier son positionnement, choisir ses plateformes, structurer ses profils et lancer une presence lisible en 30 jours.",
    level: "debutant",
    price_cents: 11900,
    currency: "EUR",
    order_index: 1,
    presentation: {
      promise:
        "Construire une base de presence nette, credible et exploitable sans poster au hasard ni se disperser.",
      executive_summary:
        "Un programme de fondation pour clarifier le cap, nettoyer la presence existante et installer un plan de publication soutenable.",
      audience:
        "Debutants serieux, freelances, jeunes fondateurs et petites marques qui veulent partir proprement.",
      outcome:
        "A la fin du programme, l'eleve sait quoi dire, ou le dire, comment presenter son profil et comment lancer 30 jours de contenu avec une logique claire.",
      method:
        "Le parcours pose d'abord les regles de distribution, clarifie ensuite le positionnement, puis transforme cette base en systeme de lancement simple.",
      deliverable:
        "Une phrase de positionnement claire, un profil restructure, une stack de plateformes choisie avec logique et un plan de publication sur 30 jours.",
      cadence: "9 lecons • environ 4h10 de contenu • 3 modules",
      highlights: [
        "Comprendre les regles communes aux algorithmes avant de choisir ses plateformes.",
        "Construire une phrase de positionnement claire et des profils qui expliquent vite.",
        "Passer d'une presence confuse a un plan de publication pilote sur 30 jours.",
      ],
    },
    resources: [
      {
        id: "resource-orbite-audit",
        title: "Checklist d'audit de profil",
        resource_type: "guide",
        file_url: "",
        description:
          "Support integre aux lecons pour verifier bio, clarte du message, preuves visibles et coherence globale.",
      },
    ],
    modules: [
      {
        id: "module-orbite-ecosysteme",
        title: "Lire l'ecosysteme avant de publier",
        description:
          "Comprendre ce que les plateformes recompensent vraiment et pourquoi une presence serieuse commence par la lisibilite.",
        order_index: 1,
        lessons: [
          {
            id: "lesson-orbite-influence-business",
            title: "Pourquoi l'influence est devenue un actif business",
            lesson_type: "mixed",
            duration_minutes: 24,
            assignment_prompt:
              "Redigez en une page ce que votre presence doit produire pour votre activite : visibilite, preuve, leads, autorite ou vente. Puis indiquez ce qui manque aujourd'hui.",
            content_markdown: buildLessonContent({
              objective:
                "Comprendre pourquoi une presence sociale ne peut plus etre traitee comme un simple canal annexe.",
              opening:
                "Le manifeste rappelle que le marketing d'influence pese deja plusieurs dizaines de milliards et continue de progresser fortement. Cela change le niveau d'exigence : publier n'est plus un geste annexe, c'est une decision de marque.",
              strategicRead:
                "La plupart des debutants partent avec une mauvaise question : comment poster plus. La bonne question est : quelle place ma presence doit-elle prendre dans mon systeme de credibilite, de distribution et de conversion. Tant que cette fonction n'est pas claire, le contenu reste decoratif.",
              sections: [
                {
                  title: "Ce qui a change",
                  body:
                    "Les plateformes ne sont plus seulement des vitrines. Elles servent a faire decouvrir une marque, a construire de la confiance et a orienter vers une offre. Le manifeste insiste sur la professionnalisation du metier de createur : strategie, lecture des donnees, positionnement, qualite d'execution et diversification des revenus.",
                },
                {
                  title: "Le vrai risque du flou",
                  body:
                    "Une presence confuse donne une impression amateur. Le visiteur comprend mal ce que vous faites, ne sait pas pourquoi rester, et l'algorithme ne detecte pas de signaux solides d'interet. Le manque de clarte ne vous fait pas seulement perdre des vues ; il vous fait perdre de la confiance.",
                },
                {
                  title: "Votre presence comme actif",
                  body:
                    "Traitez votre presence comme un actif digital : elle doit pouvoir attirer, expliquer, rassurer et preparer l'action suivante. Cela implique une promesse lisible, une ligne editoriale stable et des preuves visibles. C'est ce cadre qui servira de base a tout le reste du programme.",
                },
              ],
              takeaways: [
                "Une presence utile sert la credibilite autant que la visibilite.",
                "La clarte strategique precede la production de contenu.",
                "Le contenu devient rentable quand il s'insere dans une architecture de marque.",
              ],
              mistakes: [
                "Poster sans savoir quel role la presence doit jouer dans le business.",
                "Confondre activite sociale et progression reelle.",
                "Chercher du volume avant de fixer une promesse claire.",
              ],
              actionSteps: [
                "Definir ce que votre presence doit produire a 90 jours.",
                "Lister les trois perceptions que vous voulez installer chez un visiteur.",
                "Noter les elements actuels qui brouillent votre positionnement.",
              ],
              summary:
                "Avant d'apprendre a publier, il faut savoir ce que votre presence doit soutenir. Cette clarte devient la base du programme.",
              sourceNote:
                "Lecon construite a partir de l'introduction du manifeste et de la section sur la professionnalisation du createur.",
            }),
          },
          {
            id: "lesson-orbite-algorithmes",
            title: "Comment pensent les algorithmes en 2026",
            lesson_type: "mixed",
            duration_minutes: 31,
            assignment_prompt:
              "Choisissez une plateforme principale et redigez une fiche simple : quels signaux d'interet y comptent le plus, et comment votre contenu peut mieux les declencher.",
            content_markdown: buildLessonContent({
              objective:
                "Lire les plateformes avec les bons criteres : attention, engagement, pertinence et satisfaction.",
              opening:
                "Le manifeste montre que les algorithmes ne recompensent pas d'abord la popularite brute. Ils arbitrent selon la probabilite qu'un utilisateur regarde, interagisse, revienne ou passe plus de temps sur la plateforme.",
              strategicRead:
                "Penser algorithme ne veut pas dire 'hacker'. Cela veut dire comprendre quels signaux vous devez envoyer au systeme. Ces signaux sont tres proches d'une bonne experience humaine : accrocher vite, tenir la promesse, retenir l'attention et provoquer une action utile.",
              sections: [
                {
                  title: "Les signaux universels",
                  body:
                    "Trois blocs reviennent partout : le temps de visionnage ou de retention, les interactions utiles comme les commentaires, partages ou saves, et la pertinence du sujet pour une audience donnee. Une video peut etre tres vue mais peu poussee si les gens partent trop vite.",
                },
                {
                  title: "Ce qui varie selon les surfaces",
                  body:
                    "Le manifeste insiste sur un point souvent oublie : chaque surface a sa logique. Sur Instagram, les Stories privilegient la proximite, alors que Reels et Explore privilegient la decouverte et la capacite a divertir. Sur YouTube, le CTR, le watch time et la satisfaction marchent ensemble. Sur TikTok, les premieres secondes et le taux de completion jouent un role central.",
                },
                {
                  title: "Ce que cela change pour vous",
                  body:
                    "Vous ne cherchez pas a faire du contenu 'pour l'algo' mais du contenu assez clair, assez fort et assez bien structure pour generer les bons comportements. La bonne execution creative est deja une bonne execution algorithmique.",
                },
              ],
              takeaways: [
                "Les algorithmes amplifient les contenus qui retiennent et satisfont.",
                "Les plateformes ont des logiques differentes selon leurs surfaces.",
                "Un bon contenu envoie des signaux humains et techniques en meme temps.",
              ],
              mistakes: [
                "Se focaliser sur les hashtags ou les astuces superficielles.",
                "Copier un format performant sans comprendre pourquoi il fonctionne.",
                "Mesurer la qualite uniquement par le nombre de vues.",
              ],
              actionSteps: [
                "Identifier les trois signaux les plus importants sur votre plateforme principale.",
                "Auditer un contenu passe qui a bien marche et un autre qui a echoue.",
                "Formuler une hypothese concrete sur ce qui a change entre les deux.",
              ],
              summary:
                "Quand vous comprenez les signaux fondamentaux, vous cessez de publier a l'aveugle. Vous commencez a construire des contenus qui ont une raison d'etre distribues.",
              sourceNote:
                "Lecon appuyee sur les parties du manifeste consacrées aux algorithmes, aux signaux de ranking et aux differences entre TikTok, Instagram, YouTube, X et Facebook.",
            }),
          },
          {
            id: "lesson-orbite-plateformes",
            title: "Choisir ses plateformes avec une logique de role",
            lesson_type: "text",
            duration_minutes: 23,
            assignment_prompt:
              "Construisez votre stack : une plateforme de decouverte, une plateforme de credibilite et, si besoin, une plateforme de conversion. Justifiez chaque choix en une phrase.",
            content_markdown: buildLessonContent({
              objective:
                "Arreter la dispersion et attribuer a chaque plateforme une mission claire.",
              opening:
                "Le manifeste couvre TikTok, Instagram, YouTube, Twitch, Snapchat, X et Facebook. Le piege serait de vouloir exister partout des le depart. Une presence forte commence presque toujours par une stack reduite mais bien pensee.",
              strategicRead:
                "Chaque plateforme peut jouer un role different : decouverte organique, credibilite, profondeur, relation ou conversion. Votre travail n'est pas d'etre partout. Votre travail est de choisir les canaux qui servent le mieux votre maturite actuelle et votre capacite d'execution.",
              sections: [
                {
                  title: "Plateforme de decouverte",
                  body:
                    "TikTok, Reels ou Shorts sont excellents pour capter de nouveaux regards. Ils sont utiles si vous savez produire des formats courts avec un hook fort et une promesse lisible.",
                },
                {
                  title: "Plateforme de credibilite",
                  body:
                    "YouTube, LinkedIn ou un Instagram bien structure servent a installer une perception plus solide. Ici, le visiteur cherche des preuves, une cohérence et un niveau d'exigence.",
                },
                {
                  title: "Plateforme de conversion",
                  body:
                    "Newsletter, DM, page site, call, formulaire ou offre de diagnostic : la conversion se joue rarement uniquement sur le reseau. Il faut un point d'atterrissage clair derriere la visibilite.",
                },
              ],
              takeaways: [
                "Une stack simple executee serieusement vaut mieux qu'une presence eparpillee.",
                "La meme plateforme peut jouer un role different selon le niveau de maturite.",
                "Le bon choix depend du temps, du format maitrise et de l'offre a soutenir.",
              ],
              mistakes: [
                "Dupliquer le meme contenu partout sans adapter sa fonction.",
                "Choisir une plateforme parce qu'elle est a la mode, pas parce qu'elle est utile.",
                "Oublier ou l'on veut envoyer l'attention capturee.",
              ],
              actionSteps: [
                "Supprimer les plateformes non prioritaires de votre plan 30 jours.",
                "Choisir une plateforme principale et une secondaire maximum.",
                "Definir la destination finale de l'attention capturee.",
              ],
              summary:
                "La stack ideale n'est pas la plus large. C'est celle que vous pouvez tenir avec niveau, regularite et clarté.",
              sourceNote:
                "Lecon alimentee par les chapitres plateforme par plateforme du manifeste et par les sections sur la distribution organique.",
            }),
          },
        ],
      },
      {
        id: "module-orbite-positionnement",
        title: "Clarifier la presence et le message",
        description:
          "Transformer une activite floue en positionnement lisible, puis en profils qui inspirent confiance.",
        order_index: 2,
        lessons: [
          {
            id: "lesson-orbite-angle",
            title: "Formuler un angle net et memorable",
            lesson_type: "mixed",
            duration_minutes: 28,
            assignment_prompt:
              "Redigez trois versions de votre phrase de positionnement. Gardez celle qui est la plus claire a l'oral et la plus facile a comprendre en moins de cinq secondes.",
            content_markdown: buildLessonContent({
              objective:
                "Transformer une activite ou une expertise floue en promesse claire et utilisable partout.",
              opening:
                "Beaucoup de comptes paraissent amateurs non pas parce qu'ils manquent de talent, mais parce qu'ils parlent de tout, pour tout le monde, sans angle assez ferme.",
              strategicRead:
                "Un bon angle ne cherche pas l'originalite absolue. Il cherche la lisibilite et la memorisation. Il dit qui vous aidez, sur quel terrain et avec quel type de resultat. Sans cela, le profil reste decoratif.",
              sections: [
                {
                  title: "La phrase de base",
                  body:
                    "Commencez par trois briques : qui vous etes, pour qui vous travaillez, et ce que vous aidez a obtenir. Ensuite, enlevez tout le superflu. Si la phrase n'est pas compréhensible a haute voix, elle n'est pas encore bonne.",
                },
                {
                  title: "L'angle qui vous distingue",
                  body:
                    "La difference ne vient pas toujours d'un sujet nouveau. Elle vient souvent d'une maniere de le lire. Une fondatrice peut parler de croissance, mais sous l'angle de la desirabilite. Un freelance peut parler de contenu, mais sous l'angle de la conversion.",
                },
                {
                  title: "De la phrase au territoire",
                  body:
                    "Votre angle oriente ensuite vos piliers editoriaux, vos preuves et vos formats. Il sert de filtre. Si un contenu n'alimente pas cet angle, il n'a probablement pas sa place dans votre plan de depart.",
                },
              ],
              takeaways: [
                "La clarte prime sur la sophistication.",
                "Un angle lisible facilite autant la conversion que la creation de contenu.",
                "Votre positionnement doit pouvoir s'entendre, se lire et se repeter facilement.",
              ],
              mistakes: [
                "Utiliser des mots vagues comme accompagnement, expertise ou strategie sans precision.",
                "Multiplier les cibles dans une meme promesse.",
                "Chercher a tout raconter dans la bio.",
              ],
              actionSteps: [
                "Rediger une phrase courte de positionnement.",
                "Rediger une version plus detaillee pour votre a propos ou vos presentations.",
                "Verifier que les deux versions racontent exactement la meme chose.",
              ],
              summary:
                "Quand votre angle devient net, le reste de la presence devient plus simple a construire : bio, contenus, CTA et offres.",
              sourceNote:
                "Le manifeste insiste sur la necessite d'une image forte, authentique et reflechie. Cette lecon traduit cette exigence en formule de positionnement.",
            }),
          },
          {
            id: "lesson-orbite-profil",
            title: "Construire un profil qui explique vite",
            lesson_type: "text",
            duration_minutes: 25,
            assignment_prompt:
              "Mettez a jour votre bio, votre nom de profil, votre lien principal et vos contenus epingles. Envoyez une capture avant/apres de l'ensemble.",
            content_markdown: buildLessonContent({
              objective:
                "Faire en sorte qu'un profil explique en quelques secondes ce que vous faites et pourquoi rester.",
              opening:
                "Le manifeste rappelle que la confiance se gagne par proximite, qualite et cohérence. Sur un profil, cette confiance se joue tres vite : nom, bio, preuves visibles, feed, highlights, lien.",
              strategicRead:
                "Votre profil est une page de vente miniature. Il doit dire ou l'on est, a quoi sert votre presence, et quelle action faire ensuite. Plus l'architecture est claire, plus chaque contenu publie pourra convertir l'attention en suite logique.",
              sections: [
                {
                  title: "Les zones a fort impact",
                  body:
                    "Travaillez en priorite le nom visible, la bio, l'avatar, les trois ou quatre preuves immediates, le lien principal et les posts epingles. C'est la zone ou la confusion coute le plus cher.",
                },
                {
                  title: "Les preuves visibles",
                  body:
                    "Un profil premium ne depend pas d'un grand nombre de publications. Il depend de la qualite des points d'entree : cas clients, resultats, avant/apres, manifeste, services, programme. Montrez ce qui rassure le plus vite.",
                },
                {
                  title: "La coherence minimale",
                  body:
                    "Le bon profil ne cherche pas la perfection graphique. Il cherche une impression nette : meme vocabulaire, meme niveau de langue, meme type de promesse et meme idee directrice d'un point d'entree a l'autre.",
                },
              ],
              takeaways: [
                "Le profil est la couche de conversion de votre presence.",
                "Les points d'entree visibles comptent plus que le volume de posts.",
                "Une bonne bio oriente ; elle n'essaie pas de tout raconter.",
              ],
              mistakes: [
                "Utiliser une bio trop abstraite ou trop auto-centree.",
                "Afficher des contenus epingles qui ne soutiennent pas l'offre actuelle.",
                "Laisser coexister plusieurs promesses contradictoires.",
              ],
              actionSteps: [
                "Simplifier la bio a une promesse et un benefice principal.",
                "Choisir trois contenus epingles qui servent la credibilite.",
                "Remplacer le lien principal s'il n'oriente pas vers une prochaine etape claire.",
              ],
              summary:
                "Un bon profil ne cherche pas a impressionner. Il cherche a clarifier, rassurer et orienter.",
              sourceNote:
                "Lecon inspiree par les passages du manifeste sur la confiance, l'engagement et la necessite de professionnaliser la presence du createur.",
            }),
          },
          {
            id: "lesson-orbite-piliers",
            title: "Definir des piliers editoriaux tenables",
            lesson_type: "text",
            duration_minutes: 21,
            assignment_prompt:
              "Construisez quatre piliers editoriaux avec, pour chacun, trois idees concretes de contenu a tourner ou ecrire dans les quinze prochains jours.",
            content_markdown: buildLessonContent({
              objective:
                "Sortir du contenu aleatoire en fixant des piliers qui servent le positionnement.",
              opening:
                "Une presence serieuse ne se construit pas sur une pluie d'idees isolees. Elle se construit sur des themes recurrents qui installent progressivement votre territoire.",
              strategicRead:
                "Les piliers servent a la fois la production et la perception. Ils vous aident a savoir quoi publier, mais aussi a etre reconnu pour quelque chose de precis. Un bon pilier est utile pour le public et coherent avec l'offre.",
              sections: [
                {
                  title: "Les quatre familles utiles",
                  body:
                    "Travaillez generalement autour de quatre familles : credibilite, preuve, personnalite et conversion douce. Ce melange permet de rester humain sans perdre la logique business.",
                },
                {
                  title: "De l'idee a la repetition",
                  body:
                    "Chaque pilier doit pouvoir produire plusieurs angles : erreur a eviter, demonstration, retour d'experience, point de vue, avant/apres, coulisses. Sinon il ne tiendra pas dans le temps.",
                },
                {
                  title: "Quand couper un pilier",
                  body:
                    "Si un pilier n'apporte ni clarte, ni engagement, ni lien avec votre offre, il surcharge la presence. Une bonne ligne editoriale est selective.",
                },
              ],
              takeaways: [
                "Les piliers simplifient la creation et renforcent la memorisation.",
                "La repetition bien pensee installe une perception de niveau.",
                "Chaque pilier doit pouvoir se traduire en plusieurs formats.",
              ],
              mistakes: [
                "Choisir des piliers trop larges comme motivation ou lifestyle sans angle.",
                "Produire des contenus utiles mais sans rapport avec l'offre.",
                "Changer de piliers toutes les semaines.",
              ],
              actionSteps: [
                "Lister quatre piliers maximum.",
                "Associer trois angles concrets a chaque pilier.",
                "Supprimer tout pilier qui ne renforce ni la clarte ni la desirabilite.",
              ],
              summary:
                "Les piliers editoriaux donnent une structure. Ils transforment une presence reactive en presence intentionnelle.",
              sourceNote:
                "Le manifeste relie contenu, analyse et monetisation. Cette lecon transforme cette logique en architecture editoriale de depart.",
            }),
          },
        ],
      },
      {
        id: "module-orbite-30jours",
        title: "Piloter les 30 premiers jours",
        description:
          "Apprendre quoi mesurer, quel rythme tenir et comment installer une premiere routine serieuse.",
        order_index: 3,
        lessons: [
          {
            id: "lesson-orbite-analytics",
            title: "Lire les analytics sans se tromper de signal",
            lesson_type: "text",
            duration_minutes: 26,
            assignment_prompt:
              "Creez votre grille de suivi hebdomadaire avec cinq indicateurs maximum et appliquez-la sur vos trois derniers contenus.",
            content_markdown: buildLessonContent({
              objective:
                "Faire la difference entre les indicateurs utiles, les vanity metrics et les vrais signaux d'interet.",
              opening:
                "Le manifeste est tres clair : la lecture des analytics ne sert pas a flatter l'ego. Elle sert a prendre de meilleures decisions. Une bonne formation de depart doit donc apprendre a regarder peu d'indicateurs, mais les bons.",
              strategicRead:
                "Un compte qui grandit sainement suit des signaux de decouverte, de retention, d'engagement et de passage a l'action. Les memes chiffres n'ont pas le meme sens selon la plateforme. Il faut donc lire les metrics en fonction du role du contenu.",
              sections: [
                {
                  title: "Les indicateurs a suivre au debut",
                  body:
                    "Commencez par la portee, le temps de visionnage ou la completion, les saves ou partages, le clic profil, et la conversion vers la prochaine etape. Cela suffit pour apprendre beaucoup sans se noyer.",
                },
                {
                  title: "Les signaux forts par plateforme",
                  body:
                    "Sur TikTok, regardez le pourcentage de trafic venant du Pour toi, le taux de completion et les partages. Sur Instagram, les saves et partages sont souvent plus revelateurs que le like seul. Sur YouTube, surveillez CTR et watch time ensemble. Sur X, l'engagement doit etre lu avec les clics profil et la qualite des reponses.",
                },
                {
                  title: "La bonne frequence d'analyse",
                  body:
                    "Une lecture hebdomadaire suffit pour un debut. Evitez l'analyse compulsive apres chaque post. Cherchez des tendances, pas des reactions instantanees.",
                },
              ],
              takeaways: [
                "Les analytics servent a arbitrer, pas a se rassurer.",
                "Chaque plateforme a ses signaux forts.",
                "Une routine d'analyse simple vaut mieux qu'un dashboard rempli mais peu lu.",
              ],
              mistakes: [
                "Comparer des contenus qui n'avaient pas le meme objectif.",
                "Surinterpreter les premieres heures sans contexte.",
                "Changer toute la ligne editoriale apres un seul contretemps.",
              ],
              actionSteps: [
                "Retenir cinq indicateurs maximum pour votre revue hebdomadaire.",
                "Associer chaque indicateur a une decision concrete.",
                "Documenter vos hypotheses avant de changer de format ou de sujet.",
              ],
              summary:
                "L'analyse n'est utile que si elle aboutit a une decision. Mieux vaut peu d'indicateurs, mais une vraie discipline de lecture.",
              sourceNote:
                "Lecon construite a partir du chapitre du manifeste sur l'analytique, la portee, le taux d'engagement, la retention et les sources de trafic.",
            }),
          },
          {
            id: "lesson-orbite-cadence",
            title: "Trouver une cadence tenable et credible",
            lesson_type: "text",
            duration_minutes: 19,
            assignment_prompt:
              "Fixez votre rythme de publication reel sur 30 jours, avec des jours precis et des formats associes. Pas de cadence fantasmee.",
            content_markdown: buildLessonContent({
              objective:
                "Choisir un rythme de production tenable qui conserve la qualite et nourrit l'apprentissage.",
              opening:
                "Le manifeste parle de discipline sur un an. Dans la realite, la constance ne nait pas de la motivation pure. Elle nait d'une cadence supportable, compatible avec votre vie et votre niveau d'execution.",
              strategicRead:
                "Votre rythme ideal est celui que vous pouvez tenir proprement sans detruire la qualite. Un programme premium ne pousse pas a publier a outrance ; il pousse a publier avec continuité et lisibilite.",
              sections: [
                {
                  title: "La cadence minimale utile",
                  body:
                    "Pour la plupart des profils qui lancent leur presence, deux a quatre contenus forts par semaine suffisent a installer un mouvement. Le reste peut etre consacre a l'analyse, aux reponses et a l'optimisation du profil.",
                },
                {
                  title: "Le bloc de production",
                  body:
                    "Regroupez vos efforts. Un bloc de script, un bloc de tournage, un bloc de montage ou de publication. Cela rend l'execution moins mentale et plus mecanique.",
                },
                {
                  title: "Le rythme credibilite versus le rythme agitation",
                  body:
                    "Un compte premium n'a pas besoin d'avoir l'air frenetique. Il a besoin d'avoir l'air vivant, coherent et present. La regularite inspire davantage confiance que l'hyperactivite brouillonne.",
                },
              ],
              takeaways: [
                "La bonne cadence est celle que vous pouvez tenir avec niveau.",
                "Le batching simplifie la production.",
                "La constance l'emporte souvent sur les coups d'acceleration disperses.",
              ],
              mistakes: [
                "Definir un rythme irreel parce qu'il parait ambitieux.",
                "Ne rien produire pendant deux semaines puis tout publier d'un coup.",
                "Confondre presence credible et agitation permanente.",
              ],
              actionSteps: [
                "Fixer votre rythme reel pour quatre semaines.",
                "Bloquer les sessions de production dans l'agenda.",
                "Associer un type de contenu a chaque jour de diffusion.",
              ],
              summary:
                "La constance n'est pas un trait de caractere. C'est un design de systeme.",
              sourceNote:
                "Le manifeste insiste sur la discipline et la regularite ; cette lecon traduit cette exigence en cadence praticable.",
            }),
          },
          {
            id: "lesson-orbite-plan-30-jours",
            title: "Construire un sprint 30 jours lisible",
            lesson_type: "mixed",
            duration_minutes: 33,
            assignment_prompt:
              "Deposez votre sprint 30 jours final : plateformes choisies, piliers, cadence, contenus epingles, indicateurs suivis et prochaine etape de conversion.",
            content_markdown: buildLessonContent({
              objective:
                "Assembler tout le programme en un plan de lancement simple, structuré et executable.",
              opening:
                "Les fondations prennent de la valeur quand elles deviennent un calendrier. Sans plan, le positionnement reste une intention. Avec un sprint, il devient execution.",
              strategicRead:
                "Le sprint 30 jours n'a pas pour but de faire 'beaucoup'. Il a pour but d'installer une trajectoire. Il organise la clarte, les points d'entree du profil, la production de contenus et la premiere boucle de review.",
              sections: [
                {
                  title: "La structure du sprint",
                  body:
                    "Semaine 1 : clarifier et mettre le profil a niveau. Semaine 2 : lancer les premiers contenus piliers. Semaine 3 : mesurer, ajuster, renforcer les meilleurs angles. Semaine 4 : fixer ce qui doit devenir recurrent.",
                },
                {
                  title: "Le bon niveau d'exigence",
                  body:
                    "Votre sprint doit rester assez ambitieux pour creer du mouvement, mais assez simple pour etre termine. Un sprint non fini ne produit ni confiance ni apprentissage.",
                },
                {
                  title: "Ce que vous devez avoir au bout de 30 jours",
                  body:
                    "Un profil plus clair, une premiere bibliotheque de contenus coherents, des hypotheses valides par les chiffres et une prochaine etape logique pour continuer le trimestre.",
                },
              ],
              takeaways: [
                "Le sprint transforme la theorie en cadence.",
                "La premiere victoire n'est pas la viralite ; c'est la coherence.",
                "Une trajectoire simple cree plus de confiance qu'une ambition mal executee.",
              ],
              mistakes: [
                "Faire un calendrier plein sans bloc d'analyse.",
                "Ajouter trop de formats des le premier mois.",
                "Changer de positionnement au milieu du sprint.",
              ],
              actionSteps: [
                "Formaliser votre calendrier de 30 jours.",
                "Programmer une revue a J+7, J+14, J+21 et J+30.",
                "Choisir ce que vous gardez, ce que vous coupez et ce que vous testerez ensuite.",
              ],
              summary:
                "Quand le sprint est pose, vous avez une presence qui peut enfin commencer a apprendre, progresser et convaincre.",
              sourceNote:
                "Lecon de synthese issue des fondamentaux du manifeste : algorithmes, analytics, discipline de publication et professionnalisation du createur.",
            }),
          },
        ],
      },
    ],
  },
  {
    id: "course-capture",
    slug: "astra-capture",
    title: "ASTRA / CAPTURE",
    subtitle: "Creer des contenus qui arretent le scroll",
    description:
      "La formation phare pour comprendre le hook, la retention, le rythme, les tests de formats et la lecture des signaux d'attention utiles.",
    level: "intermediaire",
    price_cents: 27900,
    currency: "EUR",
    order_index: 2,
    presentation: {
      promise:
        "Apprendre a concevoir des contenus qui captent, tiennent et orientent l'attention sans tomber dans les recettes cheap.",
      executive_summary:
        "Le programme central pour comprendre ce qui arrete vraiment le scroll, ce qui garde l'attention et ce qui transforme un bon sujet en contenu regarde.",
      audience:
        "Createurs, dirigeants, experts et marques qui publient deja un peu mais sentent que leurs contenus ne retiennent pas assez.",
      outcome:
        "A la fin du programme, l'eleve sait construire un hook, structurer une video courte, monter avec intention et iterer a partir des bons signaux.",
      method:
        "Le parcours relie hook, structure, retention, montage et lecture des analytics pour installer une boucle de progression concrete.",
      deliverable:
        "Une bibliotheque de hooks, plusieurs scripts prets a tourner, une grille de lecture de la retention et un protocole de test reutilisable.",
      cadence: "9 lecons • environ 4h35 de contenu • 3 modules",
      highlights: [
        "Comprendre les ressorts d'attention sans devenir artificiel.",
        "Maitriser la structure, le rythme et le payoff d'une video courte.",
        "Installer une boucle de test qui transforme les analytics en decisions creatives.",
      ],
    },
    resources: [
      {
        id: "resource-capture-grille",
        title: "Grille d'analyse hook et retention",
        resource_type: "guide",
        file_url: "",
        description:
          "Modele de review integre au programme pour analyser ouverture, retention, point de rupture et CTA.",
      },
    ],
    modules: [
      {
        id: "module-capture-attention",
        title: "Comprendre l'attention avant de filmer",
        description:
          "Les mecanismes de curiosite, de tension et de promesse qui arretent le scroll sans sacrifier la clarte.",
        order_index: 1,
        lessons: [
          {
            id: "lesson-capture-hook",
            title: "Construire un hook qui retient sans sonner faux",
            lesson_type: "mixed",
            duration_minutes: 30,
            assignment_prompt:
              "Ecrivez 12 hooks sur votre sujet principal. Selectionnez les 4 plus solides et expliquez pourquoi ils promettent quelque chose de clair.",
            content_markdown: buildLessonContent({
              objective:
                "Apprendre a ouvrir un contenu avec assez de tension pour retenir, sans tomber dans la caricature.",
              opening:
                "Le manifeste insiste sur l'importance des toutes premieres secondes sur TikTok, Reels et Shorts. Ce n'est pas une mode : c'est la zone ou l'algorithme commence a mesurer si votre contenu merite de continuer sa diffusion.",
              strategicRead:
                "Un bon hook ne consiste pas a crier plus fort. Il consiste a rendre visible l'enjeu d'une video des la premiere phrase ou le premier plan. La personne doit sentir ce qu'elle va gagner en restant.",
              sections: [
                {
                  title: "Les familles de hook utiles",
                  body:
                    "Question directe, contraste, consequence, erreur commune, transformation, insight inattendu : ces familles fonctionnent parce qu'elles ouvrent une boucle mentale. Le public veut savoir la suite.",
                },
                {
                  title: "Le hook doit etre coherent avec le payoff",
                  body:
                    "Le hook n'est pas un emballage mensonger. Si la suite ne delivre pas, la retention s'effondre. Or le manifeste rappelle que les plateformes penaliseront les contenus qui font cliquer puis fuir.",
                },
                {
                  title: "L'ouverture visuelle compte autant que la phrase",
                  body:
                    "Sur les formats courts, le premier plan, le mouvement, le cadrage ou le texte a l'ecran peuvent jouer le meme role que la phrase d'accroche. Pensez en systeme, pas seulement en script.",
                },
              ],
              takeaways: [
                "Le hook sert a expliciter l'enjeu, pas a surjouer.",
                "L'ouverture doit etre alignee avec la promesse reelle du contenu.",
                "La premiere seconde est un moment de tri algorithmique et humain.",
              ],
              mistakes: [
                "Commencer par une introduction sociale vide.",
                "Promettre trop et delivrer trop peu.",
                "Utiliser le meme hook sur tous les sujets sans nuance.",
              ],
              actionSteps: [
                "Creer une banque de hooks classes par famille.",
                "Associer chaque hook a un payoff precis.",
                "Tourner trois ouvertures differentes pour un meme sujet.",
              ],
              summary:
                "Un hook solide ne manipule pas. Il rend la valeur du contenu visible assez vite pour meriter l'attention.",
              sourceNote:
                "Lecon nourrie par les sections TikTok et YouTube du manifeste sur les premieres secondes, le taux de completion et la logique de recommandation.",
            }),
          },
          {
            id: "lesson-capture-tension",
            title: "Curiosite, tension et promesse claire",
            lesson_type: "text",
            duration_minutes: 25,
            assignment_prompt:
              "Reprenez trois contenus deja publies. Reformulez leur angle pour leur donner une promesse plus claire et une meilleure tension narrative.",
            content_markdown: buildLessonContent({
              objective:
                "Comprendre pourquoi certains sujets banals deviennent captivants quand l'angle est mieux cadre.",
              opening:
                "Le contenu performant n'est pas toujours fonde sur un sujet exceptionnel. Souvent, il est fonde sur une tension claire : un probleme, une contradiction, une erreur couteuse, un avant/apres, un benefice precis.",
              strategicRead:
                "L'attention nait moins du volume que de la tension. Vous pouvez parler du meme sujet que tout le monde, mais si vous l'ouvrez par la bonne consequence ou la bonne preuve, la perception change completement.",
              sections: [
                {
                  title: "La tension comme moteur",
                  body:
                    "La tension peut etre cognitive, emotionnelle ou business. Exemple : 'vous postez assez, mais vous envoyez les mauvais signaux a l'algorithme'. Le cerveau veut resoudre cet ecart entre ce qu'il pensait et ce que vous affirmez.",
                },
                {
                  title: "La promesse claire",
                  body:
                    "La promesse d'un contenu doit etre tangible. 'Parler de branding' est flou. 'Les trois signaux visuels qui font paraitre une marque plus chere' est plus net, donc plus diffusable.",
                },
                {
                  title: "Rester premium",
                  body:
                    "La tension n'oblige pas a devenir sensationnaliste. Une bonne promesse peut etre sobre, editoriale et exigeante. L'important est qu'elle soit claire et justifiee.",
                },
              ],
              takeaways: [
                "La tension donne une raison de rester.",
                "Une promesse nette aide autant la retention que la memorisation.",
                "La sophistication du ton ne doit jamais diluer l'enjeu.",
              ],
              mistakes: [
                "Confondre tension et exagération agressive.",
                "Parler de themes trop vastes sans angle concret.",
                "Oublier quel benefice le public attend de la suite.",
              ],
              actionSteps: [
                "Transformer cinq sujets vagues en cinq promesses precises.",
                "Associer a chaque promesse une tension identifiable.",
                "Verifier que cette tension peut etre resolue dans la duree du format choisi.",
              ],
              summary:
                "Quand la tension est claire, le contenu gagne en lisibilite, en desir et en performance.",
              sourceNote:
                "Lecon issue des passages du manifeste sur les contenus qui plaisent a l'utilisateur, les signaux d'engagement et les formats courts qui captent des les premieres secondes.",
            }),
          },
          {
            id: "lesson-capture-plateforme-ouverture",
            title: "Adapter l'ouverture a TikTok, Reels et Shorts",
            lesson_type: "text",
            duration_minutes: 22,
            assignment_prompt:
              "Prenez un meme sujet et ecrivez trois ouvertures : une pour TikTok, une pour Reels, une pour Shorts. Justifiez la difference de ton ou de structure.",
            content_markdown: buildLessonContent({
              objective:
                "Comprendre qu'un hook efficace depend aussi de la surface sur laquelle il vit.",
              opening:
                "Le manifeste rappelle que chaque surface a ses propres signaux. Il en va de meme pour les ouvertures : la bonne porte d'entree n'est pas exactement la meme selon la plateforme et l'intention de visionnage.",
              strategicRead:
                "TikTok privilegie l'immediatete et l'energie percue. Reels accepte davantage une couche desirabilite ou social proof. Shorts peut supporter une entree plus nette, plus pedagogique ou plus guidee si la promesse est forte.",
              sections: [
                {
                  title: "TikTok",
                  body:
                    "Entree directe, resultat visible vite, peu de preambule, forte lisibilite du sujet. Le format tolere bien les ouvertures tres operationnelles ou intrigantes.",
                },
                {
                  title: "Instagram Reels",
                  body:
                    "Ajoutez un peu plus de desirabilite, d'image ou de contexte de marque. Les saves, les partages et la perception de qualite comptent beaucoup ici.",
                },
                {
                  title: "YouTube Shorts",
                  body:
                    "La promesse peut etre legerement plus didactique. L'utilisateur tolere mieux un angle pedagogique si la valeur est claire et si le rythme ne s'effondre pas.",
                },
              ],
              takeaways: [
                "Une bonne ouverture depend du contexte de consommation.",
                "La plateforme influe sur le bon dosage entre vitesse, desirabilite et clarte.",
                "Le meme sujet peut vivre differemment selon la surface.",
              ],
              mistakes: [
                "Recycler exactement la meme ouverture partout.",
                "Ignorer les attentes de la plateforme d'accueil.",
                "Confondre adaptation et incoherence de marque.",
              ],
              actionSteps: [
                "Definir le role principal de chaque plateforme dans votre systeme.",
                "Reecrire vos ouvertures selon ce role.",
                "Comparer ensuite les signaux d'attention obtenus.",
              ],
              summary:
                "L'adaptation ne casse pas votre identite. Elle augmente vos chances d'etre compris et regarde selon le contexte.",
              sourceNote:
                "Lecon basee sur les parties du manifeste qui distinguent TikTok, Instagram et YouTube du point de vue algorithmique et comportemental.",
            }),
          },
        ],
      },
      {
        id: "module-capture-retention",
        title: "Structurer pour retenir jusqu'au payoff",
        description:
          "La charpente d'une video courte : developpement, relances, montage, cuts et sortie.",
        order_index: 2,
        lessons: [
          {
            id: "lesson-capture-structure",
            title: "La charpente d'une video courte qui se regarde",
            lesson_type: "mixed",
            duration_minutes: 33,
            assignment_prompt:
              "Ecrivez un script de 45 secondes avec ouverture, promesse, developpement, preuve et sortie. Tournez-en une premiere version.",
            content_markdown: buildLessonContent({
              objective:
                "Savoir construire une video courte avec une progression claire et un payoff qui justifie l'attention recue.",
              opening:
                "Une bonne video courte n'est pas une juxtaposition d'idees. C'est une progression. Le public doit sentir qu'il avance vers quelque chose.",
              strategicRead:
                "La retention augmente quand le contenu est structure en micro-etapes : ouverture, promesse, developpement, relance, preuve, sortie. Sans cette colonne vertebrale, le message se dilue et le rythme devient plat.",
              sections: [
                {
                  title: "Le developpement utile",
                  body:
                    "Coupez tout ce qui ne fait pas progresser le spectateur. Chaque phrase doit soit clarifier, soit prouver, soit relancer l'attention. Si une phrase ne fait rien de tout cela, elle alourdit la retention.",
                },
                {
                  title: "La relance",
                  body:
                    "A mi-parcours, relancez l'interet avec une preuve, un contraste, un changement de plan ou une reformulation plus concrete. Cela evite l'effet tunnel.",
                },
                {
                  title: "La sortie",
                  body:
                    "Un bon contenu finit proprement. Il conclut, synthétise ou oriente vers l'etape suivante. Un CTA n'a de valeur que s'il parait logique apres ce qui vient d'etre delivre.",
                },
              ],
              takeaways: [
                "Une video courte a besoin d'une structure, pas seulement d'une idee.",
                "La relance est un outil de retention essentiel.",
                "Le CTA vient apres la valeur, jamais a la place.",
              ],
              mistakes: [
                "Developper trop longtemps le contexte.",
                "Enchainer des infos sans progression.",
                "Finir brutalement ou sans resolution claire.",
              ],
              actionSteps: [
                "Ecrire une structure standard pour vos prochains scripts.",
                "Identifier l'endroit ou la relance doit intervenir.",
                "Revoir vos anciens contenus pour repérer ou la structure s'affaisse.",
              ],
              summary:
                "La structure transforme un sujet interessant en contenu regardable. Elle fait gagner autant en clarte qu'en performance.",
              sourceNote:
                "Lecon alignee avec les passages du manifeste sur le watch time, la satisfaction et la necessite de delivrer ce qui a ete promis.",
            }),
          },
          {
            id: "lesson-capture-montage",
            title: "Rythme, coupe et montage intentionnel",
            lesson_type: "mixed",
            duration_minutes: 34,
            assignment_prompt:
              "Montez une version brute et une version optimisee du meme contenu. Soumettez les deux et expliquez vos arbitrages de coupe.",
            content_markdown: buildLessonContent({
              objective:
                "Monter pour clarifier et retenir, pas simplement pour accelerer.",
              opening:
                "Le montage n'est pas un maquillage. C'est un outil de lecture. Il sert a enlever les temps morts, renforcer la promesse et guider l'attention.",
              strategicRead:
                "Le manifeste rappelle que la retention et le temps de visionnage sont des indicateurs centraux. Un montage intentionnel travaille directement cette variable : il garde ce qui sert, coupe ce qui ralentit et relance au bon moment.",
              sections: [
                {
                  title: "Couper l'inutile",
                  body:
                    "Respirations trop longues, reformulations redondantes, plans qui n'ajoutent rien, silences non intentionnels : tout cela dilue la force du contenu. Couper n'est pas mutiler. Couper, c'est rendre le message plus net.",
                },
                {
                  title: "Le rythme visuel",
                  body:
                    "Les changements de cadre, les inserts, le texte a l'ecran ou les preuves visuelles servent a re-accrocher. Mais ils doivent accompagner le fond, pas le remplacer.",
                },
                {
                  title: "Sous-titres et lisibilite",
                  body:
                    "Des sous-titres propres aident la comprehension, retiennent en contexte sonore difficile et ajoutent un fil de lecture. Encore faut-il qu'ils soient sobres, bien hierarchises et sans pollution graphique.",
                },
              ],
              takeaways: [
                "Le montage clarifie autant qu'il dynamise.",
                "La coupe doit suivre le sens, pas seulement l'energie.",
                "La lisibilite visuelle est une part de la retention.",
              ],
              mistakes: [
                "Monter trop vite sans laisser le cerveau comprendre.",
                "Multiplier les effets pour masquer un fond faible.",
                "Laisser des plans parasites faute d'arbitrage.",
              ],
              actionSteps: [
                "Revoir votre prochain montage sans le son pour tester sa lisibilite visuelle.",
                "Supprimer trois elements qui n'apportent ni preuve ni rythme.",
                "Poser un systeme de sous-titres coherent pour vos formats recurrents.",
              ],
              summary:
                "Le bon montage ne cherche pas l'agitation. Il cherche une lecture plus nette, plus utile et plus retenue.",
              sourceNote:
                "Lecon derivee des sections du manifeste sur la retention, le temps de visionnage, les loops et les formats qui gardent l'utilisateur plus longtemps.",
            }),
          },
          {
            id: "lesson-capture-payoff",
            title: "Delivrer le payoff et provoquer l'action utile",
            lesson_type: "text",
            duration_minutes: 20,
            assignment_prompt:
              "Ajoutez un payoff plus fort et un CTA logique a deux scripts deja ecrits. Expliquez en quoi la fin est maintenant plus satisfaisante.",
            content_markdown: buildLessonContent({
              objective:
                "Savoir conclure un contenu en renforcant la memorisation et la prochaine etape.",
              opening:
                "Un contenu peut tres bien commencer et pourtant laisser une impression faible s'il termine mal. La fin decide souvent si l'on se souvient, si l'on enregistre ou si l'on agit.",
              strategicRead:
                "Le payoff peut prendre plusieurs formes : une synthese claire, une demonstration finale, une reformulation plus percutante, un resultat visible, ou une ouverture vers une suite logique. Il clot la boucle ouverte par le hook.",
              sections: [
                {
                  title: "Les bonnes sorties",
                  body:
                    "Un bon payoff donne une sensation de completion. Le spectateur sent qu'il n'a pas perdu son temps. Cette satisfaction nourrit la memorisation et, indirectement, les signaux de plateforme.",
                },
                {
                  title: "Le CTA utile",
                  body:
                    "L'action proposee doit etre proportionnee a la valeur delivree. Demander un commentaire, un enregistrement, une visite profil ou un diagnostic peut etre pertinent si la suite est naturelle.",
                },
                {
                  title: "La conversion douce",
                  body:
                    "Sur les formats premium, le CTA n'est pas un cri. C'est une orientation. Vous signalez le chemin suivant avec clarte et retenue.",
                },
              ],
              takeaways: [
                "Le payoff ferme la boucle ouverte au debut.",
                "Une bonne fin renforce la satisfaction percue.",
                "Le CTA doit paraitre logique, pas force.",
              ],
              mistakes: [
                "Terminer sans conclusion.",
                "Ajouter un CTA agressif deconnecte du contenu.",
                "Repeter la meme fin sur tous les formats sans nuance.",
              ],
              actionSteps: [
                "Lister trois types de payoff adaptes a votre univers.",
                "Associer un CTA different selon l'objectif du contenu.",
                "Revoir vos fins de videos les plus faibles et les reecrire.",
              ],
              summary:
                "Une belle fin augmente la valeur percue du contenu. Elle transforme une video correcte en format memorisable.",
              sourceNote:
                "Lecon reliee a la logique de satisfaction utilisateur presente dans les chapitres algorithmes et analytics du manifeste.",
            }),
          },
        ],
      },
      {
        id: "module-capture-iteration",
        title: "Iterer, apprendre et stabiliser des formats",
        description:
          "Transformer les analytics en decisions creatives et construire une bibliotheque de formats repetables.",
        order_index: 3,
        lessons: [
          {
            id: "lesson-capture-analytics",
            title: "Lire la retention et les signaux d'attention reelle",
            lesson_type: "text",
            duration_minutes: 26,
            assignment_prompt:
              "Analysez trois contenus avec cette grille : hook, point de rupture, moment de relance, signal de satisfaction, action finale. Tirez-en deux hypotheses d'amelioration.",
            content_markdown: buildLessonContent({
              objective:
                "Lire les bons signaux pour comprendre ce qui est vraiment retenu, partage ou oublie.",
              opening:
                "Le manifeste insiste sur la difference entre simple visibilite et vraie satisfaction. Une vue seule ne suffit pas pour comprendre la qualite d'un contenu.",
              strategicRead:
                "L'attention utile se lit a travers plusieurs indices : retention, completion, rewatch, saves, partages, clic profil, commentaires qualites. Le bon diagnostic consiste a relier ces signaux au contenu lui-meme.",
              sections: [
                {
                  title: "Observer le point de rupture",
                  body:
                    "Sur YouTube, la courbe de retention est explicite. Sur TikTok ou Reels, il faut parfois inferer avec le temps moyen de visionnage, le taux de completion et la structure du contenu. L'important est de repérer quand et pourquoi l'interet tombe.",
                },
                {
                  title: "Signaux faibles versus signaux forts",
                  body:
                    "Un like est utile mais leger. Un save, un partage, un commentaire detaille ou un clic profil montrent un niveau d'interet plus profond. Or ce sont souvent ces signaux qui distinguent un contenu joli d'un contenu utile.",
                },
                {
                  title: "Passer de l'observation a la decision",
                  body:
                    "Chaque analyse doit aboutir a une action : reecrire le hook, raccourcir l'intro, ajouter une preuve plus vite, changer la duree, clarifier le CTA ou renforcer la lisibilite du cadrage.",
                },
              ],
              takeaways: [
                "La vue brute ne dit pas tout.",
                "Les signaux les plus utiles sont ceux qui montrent une attention plus profonde.",
                "L'analyse n'a de valeur que si elle produit un arbitrage creatif.",
              ],
              mistakes: [
                "Conclure qu'un contenu est bon simplement parce qu'il a plus de vues.",
                "Regarder les chiffres sans les relier a la structure du contenu.",
                "Trop changer d'un coup, ce qui empeche d'apprendre proprement.",
              ],
              actionSteps: [
                "Choisir un indicateur principal et deux secondaires par format.",
                "Comparer vos contenus par categorie, pas tous melanges.",
                "Noter une seule hypothese de test par iteration.",
              ],
              summary:
                "Mieux lire les signaux permet de mieux creer. C'est la passerelle entre le talent intuitif et la progression reproductible.",
              sourceNote:
                "Lecon fondee sur le chapitre analytique du manifeste : portee, engagement, temps de visionnage, saves, sources de trafic et satisfaction.",
            }),
          },
          {
            id: "lesson-capture-formats",
            title: "Construire une bibliotheque de formats repetables",
            lesson_type: "text",
            duration_minutes: 24,
            assignment_prompt:
              "Choisissez quatre formats signatures pour les 30 prochains jours, avec pour chacun : hook type, structure, preuve, CTA et duree cible.",
            content_markdown: buildLessonContent({
              objective:
                "Passer de videos isolees a un systeme de formats que vous pouvez reproduire et ameliorer.",
              opening:
                "Les createurs qui progressent vite n'inventent pas tout a chaque fois. Ils stabilisent des formats, puis les declinent. Cela augmente la qualite percue et simplifie la production.",
              strategicRead:
                "Un format est un cadre. Il combine une promesse, une structure, un rythme et une fonction. Quand vous avez une bibliotheque de formats, vous gagnez en regularite sans perdre en creativite.",
              sections: [
                {
                  title: "Les formats qui construisent",
                  body:
                    "Format demonstration, format erreur a eviter, format preuve, format storytelling, format reaction structuree, format face camera editoriale : choisissez ceux qui soutiennent votre positionnement, pas seulement ceux qui font du bruit.",
                },
                {
                  title: "Standardiser l'essentiel",
                  body:
                    "Pour chaque format, figez ce qui peut l'etre : duree cible, type de hook, type de preuve, structure de sortie. Vous gardez ensuite la liberte sur les sujets et les angles.",
                },
                {
                  title: "Le format comme signature",
                  body:
                    "Repeter un format fort n'appauvrit pas la marque. Au contraire, cela installe une signature recognizable et donc memorisable.",
                },
              ],
              takeaways: [
                "Les formats reduisent la friction creative.",
                "La repetition bien pensee peut devenir une signature de marque.",
                "Un format n'est interessant que s'il sert le positionnement et la performance.",
              ],
              mistakes: [
                "Imiter un format viral qui ne correspond pas a votre univers.",
                "Multiplier les formats et ne rien stabiliser.",
                "Confondre standardisation et automatisme sans niveau.",
              ],
              actionSteps: [
                "Selectionner quatre formats utiles a votre positionnement.",
                "Definir pour chacun une fiche simple d'execution.",
                "Publier au moins deux occurrences de chaque format avant de juger.",
              ],
              summary:
                "Les formats sont des briques de systeme. Ils rendent la progression plus mesurable et la production plus tenable.",
              sourceNote:
                "Lecon alimentee par la logique du manifeste : apprendre des patterns qui fonctionnent plutot que courir apres des coups isoles.",
            }),
          },
          {
            id: "lesson-capture-sprint-14j",
            title: "Installer un sprint creatif de 14 jours",
            lesson_type: "mixed",
            duration_minutes: 21,
            assignment_prompt:
              "Livrez votre sprint de 14 jours : formats choisis, hypotheses de tests, cadence, criteres d'analyse et decisions prevues au jour 7 et au jour 14.",
            content_markdown: buildLessonContent({
              objective:
                "Mettre en place un cycle court de creation, mesure et optimisation.",
              opening:
                "L'apprentissage du contenu se fait vite quand on travaille en sprint. Deux semaines suffisent pour observer des patterns, a condition d'avoir des hypotheses et une cadence nettes.",
              strategicRead:
                "Un sprint creatif n'est pas une course au volume. C'est une periode courte pendant laquelle vous testez intentionnellement quelques variables : ouverture, format, duree, rythme, sujet ou preuve.",
              sections: [
                {
                  title: "Ce que vous testez",
                  body:
                    "Testez peu de choses a la fois. Par exemple : un meme sujet, deux hooks ; ou un meme format, deux durees. Si vous modifiez tout, vous n'apprenez rien de fiable.",
                },
                {
                  title: "Ce que vous mesurez",
                  body:
                    "Choisissez une metrique principale par test. Exemple : completion pour un format court, saves pour un carrousel, clic profil pour un contenu de consideration.",
                },
                {
                  title: "Ce que vous gardez",
                  body:
                    "Le sprint se termine par une decision : garder, ajuster ou supprimer. Sans cette etape, vous accumulez du contenu mais pas de methode.",
                },
              ],
              takeaways: [
                "Les cycles courts accelerent l'apprentissage.",
                "Une hypothese claire vaut mieux qu'un test flou.",
                "Le sprint transforme les contenus en methode.",
              ],
              mistakes: [
                "Changer trop de variables dans une meme sequence.",
                "Publier sans criteres d'evaluation prealables.",
                "Terminer le sprint sans conclusion exploitable.",
              ],
              actionSteps: [
                "Definir votre sprint de 14 jours.",
                "Planifier vos points de review au jour 7 et au jour 14.",
                "Ecrire les decisions qui doivent en sortir avant meme de commencer.",
              ],
              summary:
                "Le sprint creatif rend l'amelioration visible. Il remplace l'intuition flottante par une progression pilotee.",
              sourceNote:
                "Lecon de synthese qui traduit en methode les principes de test et de lecture des analytics du manifeste.",
            }),
          },
        ],
      },
    ],
  },
  {
    id: "course-signature",
    slug: "astra-signature",
    title: "ASTRA / SIGNATURE",
    subtitle: "Construire une image premium et coherente",
    description:
      "Le programme pour augmenter la perception de valeur, nettoyer les signaux amateurs et aligner image, discours, preuves et desirabilite.",
    level: "intermediaire",
    price_cents: 34900,
    currency: "EUR",
    order_index: 3,
    presentation: {
      promise:
        "Transformer une presence visuelle ou editoriale confuse en systeme de perception plus net, plus coherent et plus premium.",
      executive_summary:
        "Un programme pour faire monter la perception de valeur sans surjouer le luxe, en travaillant la clarte, les codes et la preuve.",
      audience:
        "Freelances, createurs, fondateurs et marques qui ont du fond mais dont l'image affaiblit encore la valeur percue.",
      outcome:
        "A la fin du programme, l'eleve sait definir son territoire de perception, poser des codes visuels et editoriaux cohérents, puis montrer ses preuves avec plus de niveau.",
      method:
        "Le parcours part de la perception, traduit cette lecture en codes visuels et editoriaux, puis l'applique aux preuves, aux offres et a la desirabilite.",
      deliverable:
        "Un territoire de perception plus net, une mini-charte d'expression, des formats signatures et une base de presentation plus credibles.",
      cadence: "9 lecons • environ 4h18 de contenu • 3 modules",
      highlights: [
        "Faire de la perception un levier business, pas un simple exercice esthetique.",
        "Poser des codes premium sans tomber dans le faux luxe ni le design froid.",
        "Comprendre ce que les marques et prospects lisent vraiment dans un profil.",
      ],
    },
    resources: [
      {
        id: "resource-signature-audit",
        title: "Audit anti-signaux amateurs",
        resource_type: "guide",
        file_url: "",
        description:
          "Cadre de revue integre dans les lecons pour detecter surcharge, confusion, agressivite commerciale et incoherence visuelle.",
      },
    ],
    modules: [
      {
        id: "module-signature-perception",
        title: "Faire de la perception un levier business",
        description:
          "Comprendre pourquoi l'image, le ton et la coherence influencent la confiance, la valeur percue et l'appetit des marques.",
        order_index: 1,
        lessons: [
          {
            id: "lesson-signature-perception-business",
            title: "Pourquoi la perception est une variable business",
            lesson_type: "text",
            duration_minutes: 26,
            assignment_prompt:
              "Listez trois choses que votre presence fait bien comprendre aujourd'hui et trois choses qui restent floues ou affaiblissent votre niveau percu.",
            content_markdown: buildLessonContent({
              objective:
                "Comprendre que l'image n'est pas cosmétique : elle influence directement la confiance et la desirabilite.",
              opening:
                "Le manifeste insiste des les premieres pages sur l'importance d'une image forte, authentique et reflechie. Ce n'est pas une formulation inspirante : c'est un constat business. Sans perception claire, la valeur reste sous-lue.",
              strategicRead:
                "Un prospect, un client ou une marque n'achetent pas seulement un resultat. Ils achetent aussi une impression de serieux, de coherence et de maitrise. Votre presence doit donc faire gagner du niveau percu, pas en perdre.",
              sections: [
                {
                  title: "La perception avant l'explication",
                  body:
                    "Bien avant qu'une personne lise votre offre ou vous parle, elle lit vos signaux : ton, visuel, structure, ordre des informations, cohérence des promesses, qualite des preuves. La perception arrive avant l'argumentaire.",
                },
                {
                  title: "La confiance comme resultat visuel et editorial",
                  body:
                    "Un univers stable, des mots justes, des preuves visibles et une ligne claire reduisent l'effort cognitif du visiteur. Moins il doit deviner, plus il vous croit.",
                },
                {
                  title: "Premium ne veut pas dire froid",
                  body:
                    "Une presence premium peut rester chaleureuse, accessible et humaine. Le niveau vient de la clarte et de la maitrise, pas de l'arrogance ni de la distance artificielle.",
                },
              ],
              takeaways: [
                "La perception influence la conversion avant meme le discours detaille.",
                "Le premium se lit dans la maitrise, pas dans la surcharge.",
                "La confiance se construit par la coherence des signaux.",
              ],
              mistakes: [
                "Traiter l'image comme un simple exercice decoratif.",
                "Chercher a paraitre cher sans clarifier la valeur.",
                "Confondre sophistication et froideur.",
              ],
              actionSteps: [
                "Identifier les signaux qui renforcent votre niveau percu.",
                "Identifier ceux qui l'affaiblissent ou le brouillent.",
                "Definir trois mots de perception que vous voulez installer.",
              ],
              summary:
                "La perception n'est pas un bonus. C'est une couche business qui conditionne la confiance et donc la valeur de tout le reste.",
              sourceNote:
                "Lecon nourrie par l'introduction du manifeste et par les passages sur la confiance accordee aux createurs et aux recommandations.",
            }),
          },
          {
            id: "lesson-signature-territoire",
            title: "Definir son territoire de perception",
            lesson_type: "text",
            duration_minutes: 29,
            assignment_prompt:
              "Creez votre fiche territoire : mots a associer a votre marque, mots a eviter, impression a laisser, preuves a rendre visibles et angle de desirabilite.",
            content_markdown: buildLessonContent({
              objective:
                "Mettre des mots precis sur l'impression que votre marque ou votre profil doit laisser.",
              opening:
                "Beaucoup de presences semblent belles sans etre memorables parce qu'elles n'ont pas de territoire defini. Elles flottent entre plusieurs codes sans en assumer un clairement.",
              strategicRead:
                "Le territoire de perception sert a aligner votre visuel, votre ton, vos formats et vos preuves. Il vous aide a rester reconnaissable et coherent, y compris quand vous changez de sujet ou de campagne.",
              sections: [
                {
                  title: "Les mots qui comptent",
                  body:
                    "Choisissez quatre a six mots qui doivent spontanement venir a l'esprit quand on pense a vous : net, premium, accessible, editoriale, precis, desire, etc. Puis choisissez aussi ce que vous refusez de degager.",
                },
                {
                  title: "Le territoire n'est pas une moodboard abstraite",
                  body:
                    "Il doit produire des consequences concretes : types de cadrages, rythme de parole, niveau de langage, structure des posts, maniere de montrer vos preuves, nature de vos CTA.",
                },
                {
                  title: "Du territoire a la ligne editoriale",
                  body:
                    "Un territoire bien defini simplifie les choix. Vous savez plus vite ce qui ressemble a votre marque et ce qui la fragilise.",
                },
              ],
              takeaways: [
                "Un territoire de perception aligne le fond et la forme.",
                "Les mots de perception doivent avoir des consequences concretes.",
                "Savoir ce que l'on refuse est aussi utile que savoir ce que l'on vise.",
              ],
              mistakes: [
                "Choisir des mots tres beaux mais impossibles a traduire en execution.",
                "Adopter des codes premium qui ne correspondent pas a l'offre.",
                "Faire evoluer le ton et le visuel sans boussole.",
              ],
              actionSteps: [
                "Definir vos mots de perception.",
                "Les traduire en decisions visuelles et editoriales.",
                "Verifier que votre profil actuel les raconte vraiment.",
              ],
              summary:
                "Le territoire de perception permet de transformer un 'style' en systeme coherent.",
              sourceNote:
                "Lecon inspiree des parties du manifeste sur l'image forte, l'authenticite, la relation aux audiences et la lecture que font les marques des createurs.",
            }),
          },
          {
            id: "lesson-signature-fit",
            title: "Aligner image, audience et promesse",
            lesson_type: "text",
            duration_minutes: 22,
            assignment_prompt:
              "Rédigez une note courte expliquant a qui votre presence doit parler, quel niveau de desirabilite elle doit installer, et comment cela se traduit dans votre ton et vos visuels.",
            content_markdown: buildLessonContent({
              objective:
                "S'assurer que la perception visee correspond bien a la cible et au type d'offre soutenu.",
              opening:
                "Une presence peut etre elegante et pourtant inefficace si elle parle mal a sa cible. L'image premium ne consiste pas a faire 'beau'. Elle consiste a devenir plus lisible pour les bonnes personnes.",
              strategicRead:
                "Votre niveau de sophistication, votre vocabulaire, votre mise en scene et vos preuves doivent etre assez eleves pour rassurer, mais assez clairs pour rester accessibles. L'ajustement est decisif.",
              sections: [
                {
                  title: "La cible ne lit pas tout de la meme facon",
                  body:
                    "Une jeune marque emergente cherche une sensation de cap et de gout. Une PME lit davantage la structure, la fiabilite et la clarte des process. Votre presence doit pouvoir accueillir ces deux lectures sans se contredire.",
                },
                {
                  title: "Le bon niveau de desirabilite",
                  body:
                    "La desirabilite n'est pas reservee au luxe. C'est la capacite a donner envie d'entrer dans votre univers parce qu'il parait plus net, plus coherent et plus serieux que la moyenne.",
                },
                {
                  title: "L'offre doit se sentir",
                  body:
                    "La perception ideale ne flotte pas au-dessus du business. Elle prepare deja a la lecture de votre offre, de vos prix, de vos formats de collaboration ou de vos programmes.",
                },
              ],
              takeaways: [
                "La bonne perception est celle qui parle aux bonnes personnes.",
                "Le premium se regle selon la cible et la nature de l'offre.",
                "L'image doit faciliter la lecture business, pas l'eclipser.",
              ],
              mistakes: [
                "Adopter des codes visuels impressionnants mais peu adaptes a sa cible.",
                "Viser le haut de gamme sans clarifier l'offre ou la preuve.",
                "Parler a tout le monde et donc ne rassurer personne.",
              ],
              actionSteps: [
                "Relire votre presence comme le ferait votre client ideal.",
                "Identifier ce qui le rassure et ce qui l'eloigne.",
                "Ajuster votre niveau de langage, de visuel et de preuve en consequence.",
              ],
              summary:
                "Une image forte vaut quand elle parle juste. Le niveau vient autant de l'ajustement que de l'esthetique.",
              sourceNote:
                "Lecon appuyee sur les passages du manifeste qui montrent ce que les marques et les audiences regardent vraiment chez un createur.",
            }),
          },
        ],
      },
      {
        id: "module-signature-systeme",
        title: "Poser un systeme visuel et editorial coherant",
        description:
          "Stabiliser les codes premium utiles et nettoyer ce qui fait encore amateur, surcharge ou bricolage.",
        order_index: 2,
        lessons: [
          {
            id: "lesson-signature-visuel",
            title: "Poser des codes premium sans tomber dans le luxe fake",
            lesson_type: "text",
            duration_minutes: 27,
            assignment_prompt:
              "Constituez une mini-charte avec palette, contraste, typographie, references de cadrage et principe de couverture. Ajoutez trois captures qui montrent l'avant/apres vise.",
            content_markdown: buildLessonContent({
              objective:
                "Choisir des codes visuels coherents qui augmentent la valeur percue sans surjeu esthetique.",
              opening:
                "Les codes premium ne sont pas une liste d'effets. Ce sont des choix de hiérarchie, de rythme, de matiere visuelle, de contraste et de retenue.",
              strategicRead:
                "Une presence premium ne cherche pas a 'faire cher'. Elle cherche a paraitre maitrisee, nette, desiree et credible. Cela passe souvent par moins d'elements, plus de tension, plus de coherence et une meilleure gestion de l'espace.",
              sections: [
                {
                  title: "La simplicite maitrisée",
                  body:
                    "Quand tout crie en meme temps, rien n'est premium. Les codes les plus efficaces sont souvent ceux qui savent creer de la valeur percue avec peu de couleurs, peu d'effets et beaucoup de precision.",
                },
                {
                  title: "Typographie, cadre et image",
                  body:
                    "Choisissez des familles typographiques qui traduisent votre niveau de langage. Travaillez aussi la qualité des cadres, la lumiere, les fonds, la regularite des compositions et la maniere de laisser respirer le contenu.",
                },
                {
                  title: "La desirabilite par le detail",
                  body:
                    "Le premium se lit dans les details : alignements, gestion du blanc, qualite des crops, construction des miniatures, sobriete des captions, cohérence des touches graphiques.",
                },
              ],
              takeaways: [
                "Le premium vient de la maitrise, pas de l'accumulation.",
                "Une charte simple et juste vaut mieux qu'un univers riche mais instable.",
                "La desirabilite se joue dans les details repetes avec constance.",
              ],
              mistakes: [
                "Multiplier les effets pour compenser un manque de fond.",
                "Copier des codes luxe sans rapport avec son offre.",
                "Changer sans cesse de palette, de cadrage ou de ton visuel.",
              ],
              actionSteps: [
                "Limiter votre systeme a quelques choix forts.",
                "Documenter ces choix dans une mini-charte utilisable.",
                "Appliquer la meme logique sur trois supports differents pour tester la coherence.",
              ],
              summary:
                "Le bon niveau visuel ne se remarque pas parce qu'il crie. Il se remarque parce qu'il tient.",
              sourceNote:
                "Lecon de traduction editoriale du manifeste : image forte, professionnalisation et adaptation a ce que les audiences et les marques lisent dans un createur.",
            }),
          },
          {
            id: "lesson-signature-editorial",
            title: "Harmoniser le ton, les preuves et la ligne editoriale",
            lesson_type: "text",
            duration_minutes: 24,
            assignment_prompt:
              "Reecrivez trois contenus existants dans un ton coherent avec votre territoire de perception. Ajoutez ensuite une preuve ou un angle plus concret dans chacun.",
            content_markdown: buildLessonContent({
              objective:
                "Aligner le langage, les formats et les preuves avec la perception que vous cherchez a installer.",
              opening:
                "Un univers visuel propre ne suffit pas si le ton reste flou, brouillon ou incoherent. La signature se lit aussi dans les phrases, les structures de posts et la maniere de montrer son niveau.",
              strategicRead:
                "Le ton editorial permet de faire tenir ensemble la desirabilite et la clarte. Il transforme une presence simplement 'belle' en presence credible, habitee et reconnaissable.",
              sections: [
                {
                  title: "Le niveau de langue",
                  body:
                    "Definissez un registre. Pas besoin d'un ton rigide, mais il faut une constance. Des contenus tres editoriaux suivis d'appels a l'action cheap cassent immediatement la perception.",
                },
                {
                  title: "La preuve bien montree",
                  body:
                    "Un bon contenu premium ne se vante pas. Il montre. Cas clients, exemples, captures, resultats, lectures de marque, analyses, portfolios : la preuve rassure quand elle est structuree proprement.",
                },
                {
                  title: "La repetition du ton",
                  body:
                    "Le ton ne devient signature que s'il revient partout : captions, page de vente, messages d'accueil, CTA, descriptions de service, scripts videos, pages de formation.",
                },
              ],
              takeaways: [
                "Le ton editorial est une couche de marque, pas un detail de style.",
                "Les preuves doivent etre montrees avec retenue et clarte.",
                "La coherence se gagne dans la repetition, pas dans un coup d'eclat.",
              ],
              mistakes: [
                "Alterner un ton premium et un ton opportuniste.",
                "Parler d'expertise sans preuve visible.",
                "Laisser le visuel et le texte raconter deux choses differentes.",
              ],
              actionSteps: [
                "Fixer trois regles editoriales non negociables.",
                "Lister les preuves a rendre plus visibles.",
                "Reecrire vos CTA pour qu'ils soient alignes avec le reste.",
              ],
              summary:
                "La coherence editoriale transforme la qualite percue en confiance durable.",
              sourceNote:
                "Lecon connectee aux parties du manifeste sur la confiance, les attentes des marques et la qualite percue des createurs.",
            }),
          },
          {
            id: "lesson-signature-amateur",
            title: "Nettoyer les signaux qui font encore amateur",
            lesson_type: "text",
            duration_minutes: 21,
            assignment_prompt:
              "Realisez votre audit anti-amateur et classez les corrections par ordre de priorite : profil, contenus, design, ton, CTA, preuves.",
            content_markdown: buildLessonContent({
              objective:
                "Identifier et supprimer les details qui reduisent immediatement le niveau percu.",
              opening:
                "Beaucoup de presences semblent faibles non parce qu'elles manquent de talent, mais parce qu'elles accumulent des details qui diminuent la confiance : surcharge, formulations agressives, absence de hierarchie, design approximatif, promesses floues.",
              strategicRead:
                "Le travail de montee en gamme ne consiste pas seulement a ajouter. Il consiste aussi a enlever. Ce qui fait amateur est souvent banal, mais repetitif. Le visiteur ne le verbalise pas toujours ; il le ressent.",
              sections: [
                {
                  title: "Surcharge",
                  body:
                    "Trop de couleurs, trop d'informations, trop de formats differents, trop de promesses dans une meme zone. La surcharge fatigue et donne une impression de manque de maitrise.",
                },
                {
                  title: "Mauvaise hierarchie",
                  body:
                    "Un visiteur doit savoir quoi regarder d'abord, puis ensuite. Si tout est au meme niveau, rien n'emerge. La hierarchie typographique, visuelle et informationnelle change radicalement la perception.",
                },
                {
                  title: "Commercial trop visible",
                  body:
                    "Les CTA agressifs, les formulations pseudo-gourou ou les promesses trop grosses abiment plus qu'ils ne convertissent. Sur une presence premium, la vente doit rester claire mais tenue.",
                },
              ],
              takeaways: [
                "Monter en gamme passe souvent par des suppressions.",
                "La hierarchie visuelle et editoriale est un signal de niveau.",
                "Le commercial mal dose fait chuter la credibilite.",
              ],
              mistakes: [
                "Rajouter du design au lieu de nettoyer les frictions.",
                "Laisser coexister plusieurs niveaux de langue.",
                "Masquer l'absence de preuve par du style.",
              ],
              actionSteps: [
                "Lister tout ce qui fatigue le regard ou brouille la lecture.",
                "Supprimer d'abord ce qui n'apporte rien.",
                "Recomposer ensuite avec une meilleure hierarchie.",
              ],
              summary:
                "La perception premium se construit autant par retrait intelligent que par ajout de details bien choisis.",
              sourceNote:
                "Lecon de synthese inspiree de l'ensemble du manifeste : professionnalisation, confiance, qualite et lecture de marque.",
            }),
          },
        ],
      },
      {
        id: "module-signature-marques",
        title: "Devenir plus lisible pour les marques et les bons clients",
        description:
          "Comprendre comment on vous evalue, mieux presenter vos preuves et installer une autorite durable.",
        order_index: 3,
        lessons: [
          {
            id: "lesson-signature-marques-regard",
            title: "Ce que les marques regardent vraiment",
            lesson_type: "text",
            duration_minutes: 28,
            assignment_prompt:
              "Construisez une fiche 'vue marque' avec : audience visee, qualite du contenu, preuves d'engagement, tonalite de marque et trois elements a renforcer avant une prise de contact.",
            content_markdown: buildLessonContent({
              objective:
                "Lire votre presence a travers les criteres d'evaluation d'une marque ou d'un client plus exigeant.",
              opening:
                "Le manifeste le dit explicitement : les marques ne regardent pas seulement les abonnes. Elles lisent le taux d'engagement, la demographie, la credibilite de la communaute, la qualite du contenu et la coherence de l'image.",
              strategicRead:
                "Pour une marque, collaborer avec vous est un risque d'image. Elle cherche donc des signaux de fiabilite, de fit et de professionnalisme. Votre presence doit reduire ce risque des la premiere lecture.",
              sections: [
                {
                  title: "Audience et qualite",
                  body:
                    "Une audience plus petite mais engagee peut etre plus attractive qu'une base gonflee et passive. Les marques regardent la qualite du lien, pas seulement la masse.",
                },
                {
                  title: "Fit de marque",
                  body:
                    "La question n'est pas seulement 'combien de personnes vous suivent' mais 'est-ce que votre univers peut accueillir une marque sans paraitre force'. Vos contenus precedents donnent deja la reponse.",
                },
                {
                  title: "Fiabilite",
                  body:
                    "Clarte du profil, regularite, niveau d'execution, professionnalisme des presentations, transparence des chiffres et qualite des integrations passees sont autant de signaux rassurants.",
                },
              ],
              takeaways: [
                "Les marques lisent le risque autant que l'opportunite.",
                "L'engagement qualifie compte davantage que l'audience brute.",
                "La coherence de l'univers est un signal commercial fort.",
              ],
              mistakes: [
                "Penser qu'un nombre d'abonnes suffit a rassurer.",
                "Ignorer la qualite percue de ses integrations precedentes.",
                "Se presenter de facon peu structuree a une marque exigeante.",
              ],
              actionSteps: [
                "Auditer votre presence avec les yeux d'une marque.",
                "Lister vos preuves de fiabilite deja visibles.",
                "Renforcer trois signaux de professionnalisme avant toute prospection.",
              ],
              summary:
                "Quand vous comprenez la lecture des marques, vous savez mieux quoi montrer, quoi taire et quoi renforcer.",
              sourceNote:
                "Lecon directement basee sur le chapitre du manifeste consacre aux attentes des marques et aux collaborations durables.",
            }),
          },
          {
            id: "lesson-signature-preuves",
            title: "Presenter ses preuves sans arrogance",
            lesson_type: "text",
            duration_minutes: 23,
            assignment_prompt:
              "Concevez une page ou un post de preuve avec cette structure : contexte, mission, action, resultat, enseignement. Ajoutez un visuel ou une capture utile.",
            content_markdown: buildLessonContent({
              objective:
                "Montrer son niveau de maniere claire, editoriale et rassurante.",
              opening:
                "Les preuves mal presentees peuvent donner une impression de vanite. Les preuves bien presentees donnent une impression de methode, de serieux et de recul.",
              strategicRead:
                "Une preuve forte raconte une situation, une lecture, une action et un effet. Elle ne se contente pas d'afficher un resultat brut. C'est ce qui la rend credible et utile pour un prospect.",
              sections: [
                {
                  title: "La structure recommandee",
                  body:
                    "Contexte, enjeu, intervention, resultat, apprentissage. Cette structure permet de montrer votre lecture et pas seulement votre execution. Elle est plus convaincante qu'un chiffre sorti de son contexte.",
                },
                {
                  title: "Le bon niveau de details",
                  body:
                    "Montrez assez pour etre credibile, sans vous perdre dans un dossier trop lourd. Le but est de faciliter la comprehension, pas de noyer le visiteur sous la data.",
                },
                {
                  title: "La preuve comme filtre commercial",
                  body:
                    "Des preuves bien presentees attirent naturellement de meilleurs interlocuteurs. Elles installent une image de niveau avant meme le premier contact.",
                },
              ],
              takeaways: [
                "Une preuve editoriale montre votre lecture autant que votre resultat.",
                "Le contexte donne du poids au chiffre.",
                "La preuve peut rester sobre tout en etant convaincante.",
              ],
              mistakes: [
                "Afficher seulement un chiffre sans raconter ce qu'il signifie.",
                "Saturer la page de cas sans hierarchie.",
                "Utiliser un ton trop auto-congratulateur.",
              ],
              actionSteps: [
                "Choisir un cas ou un exemple reel.",
                "Le structurer dans le format contexte-mission-action-resultat-enseignement.",
                "Verifier que la preuve aide vraiment un prospect a se projeter.",
              ],
              summary:
                "La bonne preuve ne fait pas seulement monter la desirabilite. Elle construit la confiance et la comprehension.",
              sourceNote:
                "Lecon reliee aux passages du manifeste sur les attentes des marques, la qualite percue et la professionnalisation de la presence du createur.",
            }),
          },
          {
            id: "lesson-signature-autorite",
            title: "Installer une autorite durable et collaborative",
            lesson_type: "mixed",
            duration_minutes: 28,
            assignment_prompt:
              "Definissez votre plan d'autorite 90 jours : preuves a publier, contenus piliers, espaces a renforcer et type de partenaires ou clients vises.",
            content_markdown: buildLessonContent({
              objective:
                "Passer d'une presence simplement jolie a une autorite lisible, durable et commercialement utile.",
              opening:
                "L'autorite ne se decrète pas. Elle se construit par repetition de signaux coherents : clarte, niveau, preuves, tenue editoriale et stabilite dans le temps.",
              strategicRead:
                "Une presence forte doit pouvoir survivre a une baisse de vues ou a une plateforme moins favorable. C'est pour cela que la perception, les preuves et la coherence comptent autant : elles creent un capital de marque qui depasse la performance immediate.",
              sections: [
                {
                  title: "Autorite versus notoriete",
                  body:
                    "La notoriete attire l'attention. L'autorite attire la confiance. Vous pouvez etre vu sans etre pris au serieux ; le travail de Signature consiste justement a refermer cet ecart.",
                },
                {
                  title: "Les piliers d'autorite",
                  body:
                    "Point de vue fort, lecture strategique, preuves visibles, regularite, langage coherent, collaborations bien choisies et qualite d'execution repetee.",
                },
                {
                  title: "Collaborations et signaux de marche",
                  body:
                    "Chaque bonne collaboration, chaque dossier propre, chaque page programme bien construite renforce votre autorite. Votre presence devient alors un ecosystème qui se tient.",
                },
              ],
              takeaways: [
                "L'autorite repose sur la repetition de signaux coherents.",
                "La perception de niveau aide a traverser les fluctuations de performance.",
                "Une presence bien construite prepare naturellement de meilleures collaborations.",
              ],
              mistakes: [
                "Courir apres la notoriete sans construire de fond de marque.",
                "Changer trop souvent de ton ou d'univers.",
                "Ne pas capitaliser sur ses preuves et ses collaborations.",
              ],
              actionSteps: [
                "Definir vos trois piliers d'autorite pour les 90 prochains jours.",
                "Choisir les preuves a rendre plus visibles.",
                "Programmer la prochaine mise a niveau de votre univers.",
              ],
              summary:
                "Une autorite durable est un systeme. Elle se construit par accumulation de clarte, de preuve et de coherence.",
              sourceNote:
                "Lecon de cloture inspiree des chapitres du manifeste sur les marques, la monetisation indirecte et la professionnalisation du createur.",
            }),
          },
        ],
      },
    ],
  },
  {
    id: "course-social-os",
    slug: "astra-social-os",
    title: "ASTRA / SOCIAL OS",
    subtitle: "Transformer sa presence en systeme business",
    description:
      "Un programme avance pour relier contenu, distribution, monetisation, offres et pilotage sur 90 jours avec une logique d'actif digital.",
    level: "avance",
    price_cents: 89000,
    currency: "EUR",
    order_index: 4,
    presentation: {
      promise:
        "Passer d'une presence intuitive a un systeme de contenu, de distribution et de conversion qui fonctionne comme un actif.",
      executive_summary:
        "Le programme avance pour structurer la presence comme un systeme business : contenus, plateformes, offres, signaux et pilotage.",
      audience:
        "Entrepreneurs, createurs monétises, consultants et marques qui veulent structurer leur operation sociale et mieux convertir l'attention.",
      outcome:
        "A la fin du programme, l'eleve sait cartographier son modele, donner un role a chaque plateforme, relier contenu et offre, puis piloter un sprint 90 jours avec de vrais KPI.",
      method:
        "Le parcours assemble architecture de plateforme, logique de monetisation, repartition des formats et tableau de bord decisionnel en un seul systeme.",
      deliverable:
        "Une carte business-social, une architecture multi-plateforme, un cadre de KPI utile et un sprint 90 jours pilotable.",
      cadence: "9 lecons • environ 5h00 de contenu • 3 modules",
      highlights: [
        "Comprendre les vraies couches de monetisation de l'economie createur.",
        "Relier contenus, offres, distribution et conversion dans un seul systeme.",
        "Construire une cadence 90 jours pilotable et suffisamment robuste pour evoluer.",
      ],
    },
    resources: [
      {
        id: "resource-social-os-dashboard",
        title: "Dashboard KPI de reference",
        resource_type: "guide",
        file_url: "",
        description:
          "Modele de suivi integre aux lecons pour piloter decouverte, retention, engagement qualifie et conversion.",
      },
    ],
    modules: [
      {
        id: "module-socialos-architecture",
        title: "Cartographier le systeme business-social",
        description:
          "Passer d'un compte a un actif en reliant offre, audience, contenu et destination de conversion.",
        order_index: 1,
        lessons: [
          {
            id: "lesson-socialos-actif",
            title: "Passer d'un compte a un actif digital",
            lesson_type: "text",
            duration_minutes: 32,
            assignment_prompt:
              "Redigez la carte actuelle de votre presence : contenus publies, points d'entree, destination de conversion, offre soutenue et points de rupture visibles.",
            content_markdown: buildLessonContent({
              objective:
                "Faire la difference entre une presence qui occupe le terrain et une presence qui produit un effet business.",
              opening:
                "Le manifeste montre que la professionnalisation d'un createur passe par la strategie, les analytics, la monetisation et la diversification. Cette vision implique un changement de niveau : vous ne gerez plus un compte, vous operez un actif.",
              strategicRead:
                "Un actif digital attire, qualifie, rassure, convertit et capitalise dans le temps. Il ne depend pas uniquement d'un pic de vues. Il repose sur une architecture claire entre contenu, plateforme, offre et systeme de preuve.",
              sections: [
                {
                  title: "Les couches de l'actif",
                  body:
                    "Couche 1 : decouverte. Couche 2 : perception et preuve. Couche 3 : conversion. Couche 4 : retention ou remonetisation. Quand une couche manque, la presence fuit de la valeur.",
                },
                {
                  title: "La logique de capitalisation",
                  body:
                    "Tous les contenus ne valent pas pareil. Certains generent de la portee ponctuelle. D'autres construisent une bibliotheque utile, referencable, reshoppable et monetisable dans le temps.",
                },
                {
                  title: "Diagnostiquer les fuites",
                  body:
                    "Beaucoup de presences attirent mais n'expliquent pas. D'autres expliquent mais ne convertissent pas. D'autres encore convertissent un peu mais sans systeme de repetition. Il faut savoir ou se situe la fuite principale.",
                },
              ],
              takeaways: [
                "Un compte devient actif quand il relie attention, preuve et conversion.",
                "Chaque couche du systeme doit avoir un role clair.",
                "La capitalisation compte autant que la diffusion ponctuelle.",
              ],
              mistakes: [
                "Produire du contenu sans destination business claire.",
                "Chercher a convertir sans couche suffisante de preuve.",
                "Mesurer uniquement la visibilite et ignorer la fuite de valeur.",
              ],
              actionSteps: [
                "Cartographier vos couches actuelles.",
                "Identifier la fuite principale.",
                "Choisir la couche a renforcer prioritairement ce trimestre.",
              ],
              summary:
                "Un actif digital n'est pas plus complique qu'un compte. Il est simplement pense avec plus d'intention et de continuite.",
              sourceNote:
                "Lecon construite a partir de l'ensemble du manifeste : professionnalisation, monetisation, analytics et vision 360 du metier de createur.",
            }),
          },
          {
            id: "lesson-socialos-mapping",
            title: "Mapper offre, audience, objections et contenus",
            lesson_type: "text",
            duration_minutes: 36,
            assignment_prompt:
              "Construisez votre matrice offre / audience / objections / contenus avec au moins une idee de format par objection principale.",
            content_markdown: buildLessonContent({
              objective:
                "Aligner ce que vous vendez, a qui vous le vendez et ce que vos contenus doivent lever comme friction.",
              opening:
                "Un contenu qui attire beaucoup mais qui n'est relie a aucune offre ou objection utile ne construit pas un systeme. Il construit au mieux de la notoriete.",
              strategicRead:
                "Chaque offre repose sur une cible, une maturite, des objections et un niveau de preuve. Le contenu doit donc etre mappe en fonction de ce parcours. Sinon, il reste decorrelé du business.",
              sections: [
                {
                  title: "Penser en parcours",
                  body:
                    "Quelqu'un peut vous decouvrir, puis vous observer, puis vous croire, puis envisager de travailler avec vous. Ces etapes ne demandent pas les memes contenus ni les memes CTA.",
                },
                {
                  title: "L'objection comme matière editoriale",
                  body:
                    "Les objections ne servent pas seulement en vente. Elles servent aussi en contenu : 'je n'ai pas le temps', 'je ne sais pas quoi poster', 'je veux du niveau mais pas une usine a gaz'. Ce sont des points de friction a traiter publiquement.",
                },
                {
                  title: "Le bon niveau de preuve",
                  body:
                    "Toutes les offres n'ont pas besoin du meme niveau de preuve. Une formation d'entree de gamme peut se vendre avec une promesse claire et quelques preuves. Un accompagnement premium a besoin d'un niveau de dossier plus eleve.",
                },
              ],
              takeaways: [
                "Le contenu devient plus rentable quand il traite un parcours et des objections reelles.",
                "Une bonne matrice evite de produire du contenu deconnecte de l'offre.",
                "Le niveau de preuve varie selon le niveau d'offre.",
              ],
              mistakes: [
                "Parler d'un sujet interessant sans lien avec l'offre.",
                "Publier du contenu trop avance pour une audience encore froide.",
                "Ignorer les objections reelles de la cible.",
              ],
              actionSteps: [
                "Lister vos offres ou votre prochaine offre.",
                "Associer a chacune trois objections majeures.",
                "Ecrire des contenus qui repondent a ces objections a chaque etape du parcours.",
              ],
              summary:
                "Quand l'offre et le contenu se repondent, la presence devient plus intelligente, plus utile et plus monétisable.",
              sourceNote:
                "Lecon articulee a partir des chapitres du manifeste sur les attentes des marques, les modes de monetisation et la lecture des signaux de qualite.",
            }),
          },
          {
            id: "lesson-socialos-roles",
            title: "Donner un role a chaque plateforme",
            lesson_type: "text",
            duration_minutes: 27,
            assignment_prompt:
              "Attribuez a chaque canal un role unique : decouverte, credibilite, profondeur, relation, conversion ou reactivation. Supprimez tout doublon inutile.",
            content_markdown: buildLessonContent({
              objective:
                "Eviter la duplication sterile et construire une architecture multi-plateforme plus lisible.",
              opening:
                "Le manifeste montre que chaque plateforme a sa culture, sa logique de distribution et ses opportunites de monetisation. Cette diversite est une force si elle est architecturee, pas si elle est empilee.",
              strategicRead:
                "Une bonne architecture multi-plateforme ne republie pas le meme message partout. Elle distribue les roles : attirer ici, approfondir la, convertir ailleurs. Cela rend le systeme plus robuste et moins dependent d'un seul canal.",
              sections: [
                {
                  title: "La plateforme de decouverte",
                  body:
                    "TikTok, Reels, Shorts ou X peuvent capter de nouveaux regards. Leur objectif n'est pas toujours de convertir tout de suite, mais d'ouvrir la porte.",
                },
                {
                  title: "La plateforme de profondeur",
                  body:
                    "YouTube, newsletter, site ou programme servent a approfondir la relation. C'est la que l'on explique mieux, que l'on montre plus de preuve et que l'on filtre les profils serieux.",
                },
                {
                  title: "La plateforme de conversion",
                  body:
                    "DM, formulaire, page de vente, call, diagnostic ou checkout. La conversion n'arrive bien que si l'on prepare clairement ce passage en amont.",
                },
              ],
              takeaways: [
                "Le multi-plateforme n'a de sens que si chaque canal a un role.",
                "La robustesse vient de l'architecture, pas de la duplication.",
                "Le bon systeme reduit la dependance a un seul algorithme.",
              ],
              mistakes: [
                "Publier partout sans adaptation ni objectif distinct.",
                "Mettre la conversion sur des plateformes qui servent surtout la decouverte.",
                "Oublier la profondeur entre visibilite et vente.",
              ],
              actionSteps: [
                "Attribuer un role unique a chaque plateforme.",
                "Revoir la destination de chaque contenu majeur.",
                "Supprimer ou reduire les canaux qui n'ont pas de role clair.",
              ],
              summary:
                "Une architecture bien distribuee rend votre systeme plus lisible pour vous et plus convaincant pour le public.",
              sourceNote:
                "Lecon construite a partir de la lecture comparative du manifeste sur TikTok, Instagram, YouTube, X, Twitch, Snapchat et Facebook.",
            }),
          },
        ],
      },
      {
        id: "module-socialos-monetisation",
        title: "Lire la monetisation avec maturite",
        description:
          "Comprendre les flux de revenus des createurs et organiser une monetisation plus saine que la seule obsession des vues.",
        order_index: 2,
        lessons: [
          {
            id: "lesson-socialos-revenus-plateformes",
            title: "Ce que les plateformes paient vraiment",
            lesson_type: "text",
            duration_minutes: 34,
            assignment_prompt:
              "Choisissez vos deux flux de revenus les plus pertinents a court terme et expliquez pourquoi ils sont plus realistes que de compter uniquement sur les paiements plateforme.",
            content_markdown: buildLessonContent({
              objective:
                "Avoir une vision lucide des revenus adshare, programmes createurs et limites structurelles de chaque plateforme.",
              opening:
                "Le manifeste est tres utile ici parce qu'il casse plusieurs fantasmes. Toutes les plateformes ne remunerent pas de la meme facon, et les revenus integres sont souvent moins puissants qu'on l'imagine, surtout au debut.",
              strategicRead:
                "YouTube offre un modele plus mature de partage de revenus. TikTok paie, mais souvent peu par rapport a l'effort si l'on ne couple pas avec d'autres flux. Instagram remunere encore surtout indirectement via marques et fans. Twitch, X ou Snapchat ont leurs propres logiques, plus selectives ou plus modestes.",
              sections: [
                {
                  title: "Pourquoi la vue seule ne paie pas assez",
                  body:
                    "Le manifeste donne plusieurs ordres de grandeur : les CPM et revenus reels varient selon la niche, la geographie, la duree et la nature du format. Une grosse audience sans structure de monetisation reste fragile.",
                },
                {
                  title: "Les differents niveaux de maturite",
                  body:
                    "Au debut, les revenus directs plateforme sont rarement le coeur du modele. Ils peuvent devenir une couche complementaire, mais rarement une base unique si vous ne disposez pas deja d'un volume ou d'une bibliotheque solides.",
                },
                {
                  title: "Ce que cela change dans votre strategie",
                  body:
                    "Ne construisez pas votre presence sur la seule esperance de l'ad revenue. Construisez-la pour soutenir plusieurs flux : partenaires, produits, services, diagnostics, formation, consulting, affiliation ou communaute payante.",
                },
              ],
              takeaways: [
                "Les revenus plateformes sont utiles mais rarement suffisants seuls.",
                "La monétisation saine repose sur plusieurs flux complementaires.",
                "La niche, le format et la geographie influencent fortement les revenus reels.",
              ],
              mistakes: [
                "Surestimer la capacite des plateformes a payer des le depart.",
                "Baser tout le systeme sur une seule source de revenus.",
                "Construire une presence spectaculaire mais peu monétisable.",
              ],
              actionSteps: [
                "Identifier les flux de revenus realistes a 90 jours et a 12 mois.",
                "Relier chaque flux a un type de contenu et a une preuve.",
                "Refuser les modeles trop dependants d'un seul levier.",
              ],
              summary:
                "La maturite business commence souvent par une lecture plus sobre des revenus plateforme et une meilleure diversification.",
              sourceNote:
                "Lecon directement issue du chapitre du manifeste sur les revenus publicitaires, les programmes createurs et les ordres de grandeur par plateforme.",
            }),
          },
          {
            id: "lesson-socialos-sponsors",
            title: "Sponsors, partenariats et collaborations durables",
            lesson_type: "text",
            duration_minutes: 31,
            assignment_prompt:
              "Construisez une fiche collaboration type : type de marque visee, format de collaboration propose, preuves a montrer et conditions pour rester coherent avec votre univers.",
            content_markdown: buildLessonContent({
              objective:
                "Comprendre comment rendre sa presence plus interessante pour des partenaires sans abimer sa marque.",
              opening:
                "Le manifeste montre que les marques recherchent moins des one-shot spectaculaires que des createurs fiables, cohérents et capables d'installer une relation de qualite avec leur audience.",
              strategicRead:
                "Un bon partenariat ne se gagne pas seulement avec des chiffres. Il se gagne avec un fit de marque, une qualite de contenu et une crédibilite suffisante pour integrer une recommandation sans casser la confiance.",
              sections: [
                {
                  title: "Ce que les marques evaluent",
                  body:
                    "Engagement, demographie, adequation de l'audience, qualite du contenu, fiabilite, professionnalisme et capacite a integrer une offre sans paraitre artificiel. Votre presence publique doit deja repondre a ces questions.",
                },
                {
                  title: "Le partenariat comme continuité",
                  body:
                    "Les meilleures collaborations prolongent votre univers au lieu de le perturber. Elles paraissent naturelles parce qu'elles s'appuient sur un territoire deja clair.",
                },
                {
                  title: "Monter en gamme dans les deals",
                  body:
                    "Plus votre image et vos preuves sont structurées, plus vous pouvez viser des collaborations mieux remunerees, plus longues, ou plus stratégiques qu'un simple post sponsor ponctuel.",
                },
              ],
              takeaways: [
                "Les chiffres seuls ne suffisent pas a rassurer une marque.",
                "La coherence d'univers augmente la valeur d'une collaboration.",
                "Les meilleurs deals viennent souvent d'une presence deja professionnalisee.",
              ],
              mistakes: [
                "Accepter des partenariats qui cassent l'univers.",
                "Prospecter sans dossier ni preuve claire.",
                "Survendre son audience tout en ne montrant pas la qualite du lien.",
              ],
              actionSteps: [
                "Definir votre liste de marques ou categories pertinentes.",
                "Clarifier les formats de collaboration coherents avec votre univers.",
                "Mettre a niveau votre presence avant toute prospection active.",
              ],
              summary:
                "Une bonne collaboration se prepare avant la prise de contact. Elle se lit deja dans la qualite de votre presence.",
              sourceNote:
                "Lecon basee sur les parties du manifeste consacrées aux attentes des marques et aux collaborations createur-marque.",
            }),
          },
          {
            id: "lesson-socialos-diversification",
            title: "Produits, services, consulting : diversifier sans se disperser",
            lesson_type: "text",
            duration_minutes: 28,
            assignment_prompt:
              "Choisissez votre flux de monetisation proprietaire le plus logique et redigez sa place dans votre systeme de contenu et de conversion.",
            content_markdown: buildLessonContent({
              objective:
                "Construire une diversification qui augmente la solidite du modele sans eclater l'offre.",
              opening:
                "Le manifeste rappelle qu'un createur ou une marque peut monétiser autrement que via les pubs et les sponsors : produits, services, consulting, offre premium, communaute, affiliation, formation.",
              strategicRead:
                "La diversification n'a d'interet que si elle reste coherente. Ajouter des flux de revenus sans architecture degrade la lisibilite. Le bon mouvement consiste a choisir ce qui prolonge naturellement votre expertise et votre audience.",
              sections: [
                {
                  title: "Flux proprietaires versus flux dependants",
                  body:
                    "Les produits, services et offres proprietaires augmentent votre autonomie. Ils vous rendent moins dependants des variations d'algorithme ou des programmes createurs.",
                },
                {
                  title: "Le critere de legitimite",
                  body:
                    "Un bon nouveau flux de revenus est credibile pour votre audience actuelle. Il parait comme une suite logique de ce que vous montrez deja publiquement.",
                },
                {
                  title: "La priorisation",
                  body:
                    "Ne lancez pas trois choses en meme temps. Choisissez le flux le plus logique selon votre niveau : consulting, produit, programme, service done-for-you, offre hybride. Puis structurez le contenu pour y conduire progressivement.",
                },
              ],
              takeaways: [
                "La diversification doit renforcer la lisibilite, pas la casser.",
                "Les flux proprietaires augmentent la resilience du modele.",
                "Le meilleur nouveau flux est celui qui prolonge naturellement votre expertise.",
              ],
              mistakes: [
                "Lancer trop d'offres simultanees.",
                "Choisir un flux de revenus sans preuve de legitimite publique.",
                "Ne pas relier le contenu a la prochaine etape business.",
              ],
              actionSteps: [
                "Choisir un flux proprietaire prioritaire.",
                "Verifier son alignement avec votre audience et vos contenus.",
                "Definir les contenus qui doivent preparer cette transition.",
              ],
              summary:
                "La diversification la plus saine est souvent la plus lisible. Elle prolonge votre presence au lieu de la disperser.",
              sourceNote:
                "Lecon construite a partir du chapitre du manifeste sur les produits propres, le consulting, les abonnements, l'affiliation et la diversification des revenus.",
            }),
          },
        ],
      },
      {
        id: "module-socialos-execution",
        title: "Installer l'OS editorial sur 90 jours",
        description:
          "Pipeline de production, repurposing, dashboard KPI et rituels de review pour piloter la progression.",
        order_index: 3,
        lessons: [
          {
            id: "lesson-socialos-pipeline",
            title: "Construire un pipeline de production tenable",
            lesson_type: "text",
            duration_minutes: 30,
            assignment_prompt:
              "Dessinez votre pipeline hebdomadaire complet : collecte d'idees, priorisation, script, tournage, montage, publication, redistribution, analyse.",
            content_markdown: buildLessonContent({
              objective:
                "Transformer l'execution en systeme et non plus en succession d'urgences.",
              opening:
                "Une presence qui depend de l'humeur ou de l'inspiration du jour reste fragile. Le pipeline sert a rendre la production plus calme, plus visible et plus soutenable.",
              strategicRead:
                "Votre OS editorial doit rendre l'execution plus simple, pas plus lourde. Il faut donc documenter les etapes, les responsabilités, les cadences et les endroits ou vous perdez du temps.",
              sections: [
                {
                  title: "Les etapes du pipeline",
                  body:
                    "Collecte des idees, choix des priorites, ecriture, production, montage, publication, redistribution, archivage, revue. Chaque etape doit avoir un propriétaire et un livrable clair, meme si vous travaillez seul.",
                },
                {
                  title: "Batching et standardisation",
                  body:
                    "Ce qui peut etre standardise doit l'etre : templates, structures de script, nomenclature, checklist de tournage, dossier d'assets, grille de review. Vous gardez l'energie creatrice pour ce qui merite vraiment votre cerveau.",
                },
                {
                  title: "Les points de rupture habituels",
                  body:
                    "Surproduction d'idees, scripts trop tardifs, montage trop long, absence d'archivage, manque de boucle de review. Ce sont souvent ces points qui fatiguent le systeme.",
                },
              ],
              takeaways: [
                "Le pipeline sert a fluidifier, pas a bureaucratiser.",
                "Les checklists et templates reduisent la friction.",
                "Documenter son systeme augmente la regularite et la qualite.",
              ],
              mistakes: [
                "Construire un pipeline trop lourd pour sa realite actuelle.",
                "Ne pas distinguer creation, production et analyse.",
                "Laisser les assets et les idees sans organisation.",
              ],
              actionSteps: [
                "Documenter votre pipeline reel.",
                "Identifier la phase la plus fragile.",
                "Standardiser une premiere couche de travail cette semaine.",
              ],
              summary:
                "L'OS editorial n'est pas un gadget productivite. C'est un outil de continuite et de niveau.",
              sourceNote:
                "Lecon de traduction operationnelle du manifeste : discipline, professionnalisation et logique multi-plateforme.",
            }),
          },
          {
            id: "lesson-socialos-kpi",
            title: "Piloter avec un dashboard utile",
            lesson_type: "text",
            duration_minutes: 29,
            assignment_prompt:
              "Construisez votre dashboard 90 jours avec 6 KPI maximum, classes en quatre blocs : decouverte, attention, preuve d'interet, conversion.",
            content_markdown: buildLessonContent({
              objective:
                "Construire un tableau de bord qui aide a prendre des decisions au lieu d'ajouter du bruit.",
              opening:
                "Le manifeste fournit beaucoup de metriques. Le travail de Social OS consiste a faire un tri. Un bon dashboard ne multiplie pas les chiffres ; il les rend decisifs.",
              strategicRead:
                "Pilotez votre systeme avec quelques KPI alignes sur votre objectif. Une presence orientee autorite ne lira pas exactement les memes signaux qu'une presence orientee leads ou ventes.",
              sections: [
                {
                  title: "Les quatre blocs KPI",
                  body:
                    "Decouverte : reach, sources de trafic, nouveaux visiteurs. Attention : watch time, completion, saves, partages. Preuve d'interet : clic profil, DM, reponses, demandes. Conversion : leads, calls, ventes, inscriptions.",
                },
                {
                  title: "Les KPI secondaires",
                  body:
                    "Conservez quelques notes qualitatives : quels contenus attirent les meilleurs commentaires, quelles objections remontent, quels sujets accelerent la prise de contact. Les indicateurs textuels completent bien les chiffres.",
                },
                {
                  title: "Le rythme de review",
                  body:
                    "Hebdomadaire pour l'ajustement tactique, mensuel pour les decisions plus structurelles. Ce tempo suffit souvent pour un systeme premium en croissance.",
                },
              ],
              takeaways: [
                "Un bon dashboard relie chiffres et decisions.",
                "Les KPI doivent suivre l'objectif du systeme.",
                "Le qualitatif complete utilement le quantitatif.",
              ],
              mistakes: [
                "Remplir un dashboard que personne ne relit vraiment.",
                "Suivre des chiffres qui n'orientent aucune action.",
                "Comparer des plateformes sans tenir compte de leur role.",
              ],
              actionSteps: [
                "Choisir vos 6 KPI maximum.",
                "Associer une decision possible a chacun.",
                "Planifier votre revue hebdomadaire et mensuelle.",
              ],
              summary:
                "Le bon pilotage transforme les analytics en arbitrages. Sans cela, le dashboard reste decoratif.",
              sourceNote:
                "Lecon synthese appuyee sur les parties analytics du manifeste et sur les differences de signal selon les plateformes.",
            }),
          },
          {
            id: "lesson-socialos-sprint90",
            title: "Orchestrer un sprint 90 jours",
            lesson_type: "mixed",
            duration_minutes: 39,
            assignment_prompt:
              "Livrez votre sprint 90 jours final : objectifs, plateforme de decouverte, contenus piliers, pipeline, KPI, rythme de review et prochaine offre ou conversion cible.",
            content_markdown: buildLessonContent({
              objective:
                "Assembler l'ensemble du programme en une execution trimestrielle serieuse, pilotable et coherente.",
              opening:
                "Le sprint 90 jours est le moment ou le systeme se materialise. C'est ici que les choix de plateformes, d'offres, de contenus et de KPI deviennent un cap operable.",
              strategicRead:
                "Un bon sprint 90 jours ne cherche pas a tout faire. Il cherche a faire progresser clairement un actif : plus de decouverte qualifiee, plus de preuve, plus de conversion, plus de regularite. Les priorites sont selectives.",
              sections: [
                {
                  title: "Structure recommandee",
                  body:
                    "Mois 1 : clarifier et installer. Mois 2 : repeter et stabiliser. Mois 3 : amplifier, corriger, capitaliser. Cette structure aide a ne pas tout exiger du systeme des la semaine 1.",
                },
                {
                  title: "Les rituels a proteger",
                  body:
                    "Revue hebdomadaire, revue mensuelle, session idees, batching production, point pipeline, point offres. Sans rituels, le sprint se degrade en serie d'urgences.",
                },
                {
                  title: "La sortie du sprint",
                  body:
                    "A 90 jours, vous devez pouvoir dire ce qui a fonctionne, ce qui doit etre renforce, quel canal a cree le plus de valeur et quelle offre ou conversion est maintenant la plus prometteuse.",
                },
              ],
              takeaways: [
                "Le sprint 90 jours transforme les intentions en systeme.",
                "La progression reelle vient de la selectivite et de la repetition.",
                "Les rituels protegent la qualite quand l'activite accelere.",
              ],
              mistakes: [
                "Confondre feuille de route et liste de souhaits.",
                "Changer d'objectif a chaque semaine.",
                "Ne pas formaliser les rituels de pilotage.",
              ],
              actionSteps: [
                "Definir l'objectif dominant du trimestre.",
                "Fixer les contenus, KPI et rituels qui le servent.",
                "Planifier la revue finale des 90 jours avant de commencer.",
              ],
              summary:
                "Le sprint 90 jours est la preuve que votre presence n'est plus une activite diffuse. Elle devient un systeme business plus lisible, plus utile et plus resilient.",
              sourceNote:
                "Lecon de cloture basee sur la logique globale du manifeste : algorithmes, analytics, monétisation, diversification et professionnalisation du createur.",
            }),
          },
        ],
      },
    ],
  },
];

function getCoursePresentation(courseIdOrSlug) {
  return (
    academyCurriculum.find((course) => course.id === courseIdOrSlug || course.slug === courseIdOrSlug)
      ?.presentation || null
  );
}

module.exports = {
  academyCurriculum,
  getCoursePresentation,
};
