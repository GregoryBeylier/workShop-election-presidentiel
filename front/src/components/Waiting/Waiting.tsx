
import { useEffect, useState } from "react";
import {
  Lock,
  CheckCircle2,
  Users,
  Clock3,
  Info,
} from "lucide-react";

function Waiting() {
  const targetDate = new Date("2026-04-12T20:00:00");

  const calculateTimeLeft = () => {
    const difference =
      targetDate.getTime() - new Date().getTime();

    if (difference <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      hours: Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      ),

      minutes: Math.floor(
        (difference / (1000 * 60)) % 60
      ),

      seconds: Math.floor(
        (difference / 1000) % 60
      ),
    };
  };

  const [timeLeft, setTimeLeft] =
    useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Participation
  const totalVotes = 31;
  const totalVoters = 60;

  const participation =
    totalVoters > 0
      ? Math.round(
          (totalVotes / totalVoters) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 sm:px-6 sm:py-12">

      <div className="mx-auto max-w-4xl">

        {/* =========================
            HEADER
        ========================= */}
        <section className="mb-8 text-center sm:mb-10">

          <h1 className="text-3xl font-black text-[#3C3C3B] sm:text-5xl">
            Scrutin en cours
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Les urnes sont encore ouvertes.
          </p>

        </section>


        {/* =========================
            CARTE PRINCIPALE
        ========================= */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl">

          {/* Bandeau */}
          <div className="bg-[#3C3C3B] px-5 py-4 sm:px-8">

            <div className="flex items-center justify-center gap-2">

              <Lock className="h-5 w-5 text-[#2EC7D3]" />

              <p className="text-sm font-black uppercase tracking-[0.15em] text-white">
                Résultats verrouillés
              </p>

            </div>

          </div>


          {/* Contenu */}
          <div className="px-5 py-8 text-center sm:px-10 sm:py-10">

            {/* Icône horloge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2EC7D3]/10">

              <Clock3 className="h-8 w-8 text-[#2EC7D3]" />

            </div>


            {/* Titre */}
            <h2 className="mt-5 text-3xl font-black text-[#3C3C3B] sm:text-4xl">
              Patience, ça compte !
            </h2>


            {/* =========================
                CITATION
            ========================= */}
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-[#F5F5F5] px-5 py-4">

              <p className="text-sm italic font-semibold text-[#3C3C3B] sm:text-base">

                « Patience et longueur de temps font plus que
                force ni que sondage. »

              </p>

            </div>
            
             {/* Texte */}
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">

              Les résultats restent sous clé jusqu'à la fermeture
              des urnes. En attendant, on compte sur votre
              patience — et sur vos voix.

            </p>


            {/* =========================
                COMPTE À REBOURS
            ========================= */}
            <div className="mt-8">

              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                Avant la clôture du scrutin
              </p>


              {/* 3 BLOCS : HEURES / MINUTES / SECONDES */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">

                {/* HEURES */}
                <div className="rounded-2xl bg-[#3C3C3B] p-3 sm:p-5">

                  <p className="text-2xl font-black text-[#2EC7D3] sm:text-4xl">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase text-white/50 sm:text-xs">
                    Heures
                  </p>

                </div>


                {/* MINUTES */}
                <div className="rounded-2xl bg-[#3C3C3B] p-3 sm:p-5">

                  <p className="text-2xl font-black text-[#2EC7D3] sm:text-4xl">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase text-white/50 sm:text-xs">
                    Minutes
                  </p>

                </div>


                {/* SECONDES */}
                <div className="rounded-2xl bg-[#3C3C3B] p-3 sm:p-5">

                  <p className="text-2xl font-black text-[#2EC7D3] sm:text-4xl">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase text-white/50 sm:text-xs">
                    Secondes
                  </p>

                </div>

              </div>


              {/* DATE DE CLÔTURE */}
              <p className="mt-5 text-sm font-bold text-[#3C3C3B]">
                Avant la clôture du scrutin, le 12 avril à 20h00
              </p>

            </div>

          </div>

        </section>


        {/* =========================
            VOTE ENREGISTRÉ
        ========================= */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg sm:mt-8 sm:p-8">

          <div className="flex items-start gap-4">

            {/* Icône */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2EC7D3]/15">

              <CheckCircle2 className="h-6 w-6 text-[#2EC7D3]" />

            </div>


            {/* Texte */}
            <div>

              <h2 className="text-xl font-black text-[#3C3C3B]">
                Votre vote est enregistré
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Vos 6 duels ont bien été comptabilisés.
              </p>

            </div>

          </div>

        </section>


        {/* =========================
            PARTICIPATION
        ========================= */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg sm:mt-8 sm:p-8">

          {/* Titre */}
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3C3C3B]">

              <Users className="h-5 w-5 text-[#2EC7D3]" />

            </div>


            <div>

              <p className="text-sm font-bold uppercase tracking-widest text-[#2EC7D3]">
                Participation en cours
              </p>

              <h2 className="mt-1 text-xl font-black text-[#3C3C3B]">
                Les urnes se remplissent
              </h2>

            </div>

          </div>


          {/* Barre de participation */}
          <div className="mt-6">

            <div className="mb-2 flex items-center justify-between">

              <span className="text-sm font-bold text-[#3C3C3B]">
                Participation
              </span>

              <span className="text-sm font-black text-[#3C3C3B]">
                {participation}%
              </span>

            </div>


            <div className="h-4 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-[#2EC7D3] transition-all duration-700"
                style={{
                  width: `${participation}%`,
                }}
              />

            </div>


            {/* Nombre de votes */}
            <div className="mt-3 flex items-center justify-between text-sm">

              <span className="font-semibold text-gray-500">
                {totalVotes} votes
              </span>

              <span className="font-semibold text-gray-500">
                sur {totalVoters} électeurs inscrits
              </span>

            </div>

          </div>

        </section>


        {/* =========================
            MESSAGE D'INFORMATION
        ========================= */}
        <div className="mt-8 flex items-start justify-center gap-3 px-4">

          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2EC7D3]" />

          <p className="text-left text-sm leading-6 text-gray-500 sm:text-base">

            Aucun score n’est visible avant la clôture :
            cela évite d’influencer les derniers votants.

          </p>

        </div>

      </div>

    </main>
  );
}

export default Waiting;