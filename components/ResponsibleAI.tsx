// Encart "IA responsable" — positionnement prudent et différenciant :
// AxiNafa n'accorde pas de crédit, ne décide pas à la place des humains, et
// garde les données du commerçant sous son contrôle. Rassure le jury et les
// institutions financières.

export function ResponsibleAI() {
  const points = [
    {
      icon: "🛡️",
      title: "Nous ne prêtons pas",
      text: "AxiNafa produit une preuve d'activité et un pré-score indicatif. La décision de financement reste à l'institution.",
    },
    {
      icon: "🧑‍⚖️",
      title: "L'humain décide",
      text: "Le score est explicable (régularité, ancienneté, volume) : aucune boîte noire, aucune décision automatique.",
    },
    {
      icon: "🔒",
      title: "Vos données restent à vous",
      text: "Dans cette démo, vos saisies sont stockées localement sur votre appareil — vous gardez le contrôle.",
    },
  ];

  return (
    <section className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-700">
        ✨ Une IA responsable
      </h3>
      <div className="mt-3 space-y-3">
        {points.map((p) => (
          <div key={p.title} className="flex gap-3">
            <span className="text-lg leading-none">{p.icon}</span>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">{p.title}</p>
              <p className="text-[12px] leading-snug text-gray-600">{p.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
