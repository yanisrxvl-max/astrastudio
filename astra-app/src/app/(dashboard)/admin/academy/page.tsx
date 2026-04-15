import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function AdminAcademyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Cockpit
      </Link>
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-astra-gold" />
        <h1 className="text-2xl font-semibold text-white">Formations</h1>
      </div>
      <Card>
        <CardContent className="space-y-3 py-8 text-sm text-astra-text-secondary">
          <p>
            Le pilotage avancé des programmes, élèves et devoirs est prévu pour
            une itération dédiée (connexion au backend Academy existant hors
            cette app si besoin).
          </p>
          <p className="text-astra-text-muted">
            Structure prête : onglet dans la navigation, page d&apos;accueil
            métier. Prochaine étape : API et tables formation dans ce dépôt ou
            lien vers l&apos;outil existant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
