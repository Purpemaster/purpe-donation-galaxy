async function updateTracker() {
  try {
    const tokenList = await fetchTokenList();
    const solBalance = await fetchSolBalance();
    const solPrice = await fetchTokenPrice(SOL_MINT);

    let totalUSD = solBalance * solPrice;
    let breakdown = `SOL: $${(totalUSD).toFixed(2)}<br>`;

    for (const token of tokenList) {
      // Prüfen ob alle notwendigen Felder existieren
      if (!token.tokenAmount || !token.tokenAddress) continue;

      const mint = token.tokenAddress;
      const amount = parseFloat(token.tokenAmount.amount);
      const decimals = token.tokenAmount.decimals;

      if (mint === PURPE_MINT || mint === PYUSD_MINT) {
        const realAmount = amount / Math.pow(10, decimals);
        const price = await fetchTokenPrice(mint);
        const usdValue = realAmount * price;

        totalUSD += usdValue;
        const name = mint === PURPE_MINT ? "PURPE" : "PYUSD";
        breakdown += `${name}: $${usdValue.toFixed(2)}<br>`;
      }
    }

    // Ausgabe auf der Seite aktualisieren
    document.getElementById("current-amount").textContent = `$${totalUSD.toFixed(2)}`;
    document.getElementById("progress-fill").style.width = `${Math.min((totalUSD / goalUSD) * 100, 100)}%`;
    document.getElementById("breakdown").innerHTML = breakdown;

    const now = new Date();
    document.getElementById("last-updated").textContent = "Letztes Update: " + now.toLocaleTimeString();

  } catch (err) {
    document.getElementById("last-updated").textContent = "Fehler beim Update: " + err.message;
    console.error("Update Fehler:", err);
  }
}
