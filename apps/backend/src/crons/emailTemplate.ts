export function generateEmailTemplate(
  wydarzenia: Record<
    string,
    { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]
  >
) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #000000;">📅 Wydarzenia dla Twoich koni</h2>
      ${Object.entries(wydarzenia)
        .map(
          ([rodzajZdarzenia, konie]) => `
          <h3 style="color: #d9534f;">📌 ${rodzajZdarzenia}</h3>
          ${Object.entries(groupByRodzajKonia(konie))
            .map(
              ([rodzajKonia, listaKoni]) => `
              <h4 style="color: #5a5a5a;">🐴 ${rodzajKonia}</h4>
              <ul>
                ${listaKoni
                  .map(({ nazwaKonia, dataWaznosci }) => {
                    const daysLeft = Math.ceil(
                      (new Date(dataWaznosci).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    if (daysLeft < 0) {
                      const _daysLeft = Math.abs(daysLeft);
                      return `<li><strong>${nazwaKonia}</strong>: ważne do - ${dataWaznosci}: ${_daysLeft} dni po terminie</li>`;
                    } else {
                      return `<li><strong>${nazwaKonia}</strong>: ważne do - ${dataWaznosci}: masz jeszcze ${daysLeft} dni</li>`;
                    }
                  })
                  .join("")}
              </ul>
            `
            )
            .join("")}
        `
        )
        .join("")}
      <p style="margin-top: 20px; color: #555; font-size: 14px;">Dziękujemy za korzystanie z naszej aplikacji!</p>
    </div>
  `;
}

/**
 * Grupuje konie według ich rodzaju
 */
function groupByRodzajKonia(
  konie: { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]
) {
  const uniqueHorses = new Map<
    string,
    { nazwaKonia: string; dataWaznosci: string }
  >();

  konie.forEach(({ nazwaKonia, rodzajKonia, dataWaznosci }) => {
    const key = `${rodzajKonia}-${nazwaKonia}`;

    if (
      !uniqueHorses.has(key) ||
      uniqueHorses.get(key)!.dataWaznosci < dataWaznosci
    ) {
      uniqueHorses.set(key, { nazwaKonia, dataWaznosci });
    }
  });

  return Array.from(uniqueHorses.entries()).reduce<
    Record<string, { nazwaKonia: string; dataWaznosci: string }[]>
  >((acc, [key, horse]) => {
    const rodzajKonia = key.split("-")[0];
    if (!acc[rodzajKonia]) {
      acc[rodzajKonia] = [];
    }
    acc[rodzajKonia].push(horse);
    return acc;
  }, {});
}
