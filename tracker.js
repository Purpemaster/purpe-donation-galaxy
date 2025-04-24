const walletAddress = "9uo3TB4a8synap9VMNpby6nzmnMs9xJWmgo2YKJHZWVn";
const goalUSD = 20000;

const PURPE_MINT = "HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL";
const PYUSD_MINT = "5KdM72GCe2TqcczLs1BdKx4445tXrRBv9oa8s8T6pump";
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function fetchTokenList() {
  try {
    const res = await fetch(`https://public-api.solscan.io/v2/account/tokens?account=${walletAddress}`);
    const data = await res.json();
    return data?.data || [];
  } catch (err) {
    console.error("Fehler beim Token-Fetch:", err);
    return [];
  }
}

async function fetchTokenPrice(mint) {
  try {
    const res = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
    const data = await res.json();
    return data?.data?.[mint]?.price || 0;
  } catch (err) {
    console.error(`Fehler beim Preis-Fetch für ${mint}:`, err);
    return 0;
  }
}

async function updateTracker() {
  try {
    const tokens = await fetchTokenList();
    let totalUSD = 0;
    let breakdown = "";

    for (const token of tokens) {
      const tokenAmount = token.tokenAmount;
      const mint = token.tokenAddress?.address || token.tokenAddress;
      if (!tokenAmount || !mint) continue;

      const amount = parseFloat(tokenAmount.amount);
      const decimals = tokenAmount.decimals;
      const realAmount = amount / Math.pow(10, decimals);

      if ([PURPE_MINT, PYUSD_MINT, SOL_MINT].includes(mint)) {
        const price = await fetchTokenPrice(mint);
        const usdValue = realAmount * price;
        totalUSD += usdValue;

        const name = mint === SOL_MINT ? "SOL"
                    : mint === PURPE_MINT ? "PURPE"
                    : "PYUSD";
        breakdown += `${name}: $${usdValue.toFixed(2)}<br>`;
      }
    }

    const percent = Math.min((totalUSD / goalUSD) * 100, 100);
    document.getElementById("current-amount").textContent = `$${totalUSD.toFixed(2)}`;
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("breakdown").innerHTML = breakdown;

    const now = new Date();
    document.getElementById("last-updated").textContent = "Letztes Update: " + now.toLocaleTimeString();

  } catch (err) {
    document.getElementById("last-updated").textContent = "Fehler beim Update: " + err.message;
    console.error("UpdateTracker Fehler:", err);
  }
}

updateTracker();
setInterval(updateTracker, 15000);
